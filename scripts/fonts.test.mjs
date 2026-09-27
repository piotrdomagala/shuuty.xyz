import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('content/fonts.json', root), 'utf8'));
const fontsCss = await readFile(new URL('app/fonts.css', root), 'utf8');
const layout = await readFile(new URL('app/layout.tsx', root), 'utf8');

const fontFaces = [...fontsCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((match) => {
  const read = (property) => match[1].match(new RegExp(`${property}:\\s*([^;]+);`))?.[1].trim();
  return {
    family: read('font-family')?.replaceAll("'", ''),
    weight: Number(read('font-weight')),
    display: read('font-display'),
    file: read('src')?.match(/url\('\/fonts\/([^']+)'\)/)?.[1],
    unicodeRange: read('unicode-range'),
  };
});

test('every self-hosted font file matches the manifest byte for byte', async () => {
  const listed = new Set(manifest.files.map((entry) => entry.file));
  const onDisk = (await readdir(new URL('public/fonts/', root))).filter((name) => name.endsWith('.woff2'));
  assert.deepEqual(new Set(onDisk), listed, 'public/fonts has exactly the woff2 files of content/fonts.json');

  for (const entry of manifest.files) {
    const bytes = await readFile(new URL(`public/fonts/${entry.file}`, root));
    assert.equal(bytes.length, entry.bytes, `${entry.file} size`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, `${entry.file} sha256`);
  }
});

test('the license of each font ships next to the files', async () => {
  for (const [family, path] of Object.entries(manifest.licenses)) {
    const license = await readFile(new URL(path, root), 'utf8');
    assert.match(license, /SIL Open Font License, Version 1\.1/, `${family} license text`);
    assert.ok(license.includes(`The ${family} Project Authors`), `${family} copyright line`);
  }
});

test('fonts.css covers every weight in latin and latin-ext with swap', () => {
  assert.ok(fontFaces.length > 0);
  const files = new Map(manifest.files.map((entry) => [entry.file, entry]));
  for (const face of fontFaces) {
    const entry = files.get(face.file);
    assert.ok(entry, `${face.file} is listed in content/fonts.json`);
    assert.equal(face.family, entry.family, `${face.file} family`);
    assert.equal(face.display, 'swap', `${face.file} display`);
    assert.ok(face.unicodeRange, `${face.file} has a unicode-range`);
  }
  for (const [family, weights] of Object.entries(manifest.weights)) {
    for (const weight of weights) {
      for (const subset of ['latin', 'latin-ext']) {
        assert.ok(
          fontFaces.some(
            (face) => face.family === family && face.weight === weight && files.get(face.file)?.subset === subset,
          ),
          `${family} ${weight} ${subset}`,
        );
      }
    }
  }
});

test('Polish and Norwegian letters fall in the self-hosted ranges', () => {
  // Parses "U+0000-00FF, U+131, ..." into [start, end] pairs.
  const ranges = (value) =>
    value.split(',').map((part) => {
      const [start, end = start] = part.trim().replace('U+', '').split('-');
      return [Number.parseInt(start, 16), Number.parseInt(end, 16)];
    });
  for (const family of Object.keys(manifest.weights)) {
    const covered = fontFaces
      .filter((face) => face.family === family && face.weight === 400)
      .flatMap((face) => ranges(face.unicodeRange));
    for (const letter of 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻæøåÆØÅ') {
      const code = letter.codePointAt(0);
      assert.ok(covered.some(([start, end]) => code >= start && code <= end), `${family} covers ${letter}`);
    }
  }
});

test('the layout loads no font from Google and preloads latin and latin-ext files', () => {
  assert.doesNotMatch(layout, /from 'next\/font\/google'|fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(layout, /import '\.\/fonts\.css';/);
  const preloaded = [...layout.matchAll(/'\/fonts\/([^']+\.woff2)'/g)].map((match) => match[1]);
  const expected = manifest.files
    .filter((entry) => entry.subset === 'latin' || entry.subset === 'latin-ext')
    .map((entry) => entry.file);
  assert.deepEqual(new Set(preloaded), new Set(expected));
});
