import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const aliasRoutes = [
  ['app/documents/privacy/page.tsx', '/privacy/', '/pl/privacy/'],
  ['app/pl/documents/privacy/page.tsx', '/privacy/', '/pl/privacy/'],
  ['app/documents/terms/page.tsx', '/terms/', '/pl/terms/'],
  ['app/pl/documents/terms/page.tsx', '/terms/', '/pl/terms/'],
  ['app/documents/support/page.tsx', '/support/', '/pl/support/'],
  ['app/pl/documents/support/page.tsx', '/support/', '/pl/support/'],
];

const pagesShadowingHtmlStubs = ['privacy.html', 'terms.html', 'support.html'];

test('legacy document aliases use real Next.js routes with canonical language alternates', async () => {
  for (const [path, englishCanonicalPath, polishCanonicalPath] of aliasRoutes) {
    const source = await readFile(new URL(path, root), 'utf8');
    assert.match(source, /createLegacyAliasMetadata/);
    assert.match(
      source,
      new RegExp(`englishCanonicalPath:\\s*["']${escapeRegex(englishCanonicalPath)}["']`),
    );
    assert.match(
      source,
      new RegExp(`polishCanonicalPath:\\s*["']${escapeRegex(polishCanonicalPath)}["']`),
    );
  }
});

test('legacy .html stubs must not sit beside Next aliases (GitHub Pages would shadow them)', async () => {
  for (const name of pagesShadowingHtmlStubs) {
    const route = name.replace(/\.html$/, '');
    await assert.rejects(
      () => access(new URL(`public/documents/${name}`, root)),
      { code: 'ENOENT' },
      `${name} shadows /documents/${route} on GitHub Pages`,
    );
  }
});

test('legacy aliases stay out of the sitemap', async () => {
  const source = await readFile(new URL('app/sitemap.ts', root), 'utf8');
  assert.doesNotMatch(source, /\/documents\//);
});
