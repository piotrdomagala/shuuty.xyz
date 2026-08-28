import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

const routes = [
  {
    path: 'app/child-safety/page.tsx',
    canonical: '/child-safety/',
    alternate: '/pl/child-safety/',
    language: 'en',
  },
  {
    path: 'app/pl/child-safety/page.tsx',
    canonical: '/pl/child-safety/',
    alternate: '/child-safety/',
    language: 'pl',
  },
];

test('child-safety routes expose canonical PL/EN metadata and real documents', async () => {
  for (const route of routes) {
    const source = await readFile(new URL(route.path, root), 'utf8');
    assert.match(source, /createPublicPageMetadata/);
    assert.ok(source.includes(`path: '${route.canonical}'`));
    assert.ok(source.includes(route.alternate));
    if (route.language === 'pl') {
      assert.match(source, /initialLanguage="pl"/);
    }
  }
});

test('public standards cover Google child-safety requirements in both languages', async () => {
  const [english, polish] = await Promise.all([
    readFile(new URL('public/documents/child_safety_en.md', root), 'utf8'),
    readFile(new URL('public/documents/child_safety.md', root), 'utf8'),
  ]);

  for (const document of [english, polish]) {
    assert.match(document, /CSAE/u);
    assert.match(document, /CSAM/u);
    assert.match(document, /NCMEC/u);
    assert.match(document, /shuuty\.app@gmail\.com/u);
    assert.doesNotMatch(document, /support@shuuty\.pl/u);
  }
  assert.match(english, /zero tolerance/u);
  assert.match(english, /under 18/u);
  assert.match(polish, /zerowej tolerancji/u);
  assert.match(polish, /poniżej 18\. roku życia/u);
});

test('child-safety pages are discoverable from the landing and document footers and sitemap', async () => {
  const [documentFooter, landingFooter, homeContent, sitemap] = await Promise.all([
    readFile(new URL('components/DocumentChrome.tsx', root), 'utf8'),
    readFile(new URL('components/HomePageClient.tsx', root), 'utf8'),
    readFile(new URL('app/homeContent.json', root), 'utf8').then(JSON.parse),
    readFile(new URL('app/sitemap.ts', root), 'utf8'),
  ]);
  assert.match(documentFooter, /localizedPath\(language, '\/child-safety\/'\)/u);
  assert.match(landingFooter, /localizedPath\(lang, '\/child-safety\/'\)/u);
  assert.equal(homeContent.en.footer.childSafety, 'Child safety');
  assert.equal(homeContent.pl.footer.childSafety, 'Bezpieczeństwo dzieci');
  assert.match(sitemap, /english: '\/child-safety\/'/u);
  assert.match(sitemap, /polish: '\/pl\/child-safety\/'/u);
});
