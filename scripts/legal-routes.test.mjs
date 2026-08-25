import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

const compatibilityFiles = [
  ['privacy.html', '/privacy/'],
  ['terms.html', '/terms/'],
  ['support.html', '/support/'],
];

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

test('legacy .html compatibility pages expose canonical links without client-side refresh', async () => {
  for (const [name, canonicalPath] of compatibilityFiles) {
    const source = await readFile(new URL(`public/documents/${name}`, root), 'utf8');
    assert.doesNotMatch(source, /http-equiv=["']refresh["']/i);
    assert.match(source, new RegExp(`href=["']${escapeRegex(canonicalPath)}["']`));
    assert.match(
      source,
      new RegExp(`rel="canonical" href="https://shuuty\\.com${escapeRegex(canonicalPath)}"`),
    );
    assert.match(source, /name="robots" content="noindex, follow"/);
  }
});

test('legacy aliases stay out of the sitemap', async () => {
  const source = await readFile(new URL('app/sitemap.ts', root), 'utf8');
  assert.doesNotMatch(source, /\/documents\//);
});
