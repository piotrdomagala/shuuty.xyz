import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readdir, readFile } from 'node:fs/promises';
import {
  guideAlternates,
  guideArticleProblems,
  guidePath,
  guideRegistryProblems,
  guideStoreCampaign,
  guideSwitchPaths,
  textSegments,
} from '../lib/guides.mjs';
import {
  GUIDE_INDEX_PATHS,
  guideSectionLanguage,
  languageSwitchPath,
  localizedSitePath,
} from '../lib/sitePaths.mjs';

const root = new URL('../', import.meta.url);
const registry = JSON.parse(await readFile(new URL('content/guides.json', root), 'utf8'));

const clubPl = {
  topic: 'sports-club',
  language: 'pl',
  slug: 'aplikacja-dla-klubu-sportowego',
  title: 'Aplikacja dla klubu sportowego - grupa, kort i treningi',
  description: 'Jedna grupa dla klubu: informacje dla członków, grafik kortu i treningi z czatem.',
  heading: 'Aplikacja dla klubu sportowego',
  updatedOn: '2026-09-27',
  updatedLabel: 'Zaktualizowano 27 września 2026',
};
const clubEn = {
  ...clubPl,
  language: 'en',
  slug: 'sports-club-app',
  title: 'A sports club app - one group, court bookings and training',
  description: 'One group for a club: news for members, a court schedule and weekly training with chat.',
  heading: 'A sports club app',
  updatedLabel: 'Updated 27 September 2026',
};
const salonPl = { ...clubPl, topic: 'salon', slug: 'rezerwacje-w-salonie' };
const validArticle = {
  body: [
    { type: 'p', text: 'Klub żyje z **trzech rzeczy**.' },
    { type: 'h2', text: 'Czego klub potrzebuje' },
    { type: 'ul', items: ['miejsca na ogłoszenia;', 'grafiku kortu.'] },
    { type: 'h3', text: 'Jedna grupa' },
    { type: 'ol', items: ['Zainstaluj Shuuty.', 'Utwórz grupę.'] },
  ],
  faq: [{ question: 'Czy członkowie muszą mieć aplikację?', answer: 'Tak.' }],
};

test('guide sections have translated names and the switcher moves between them', () => {
  assert.equal(localizedSitePath('en', '/guides/'), '/guides/');
  assert.equal(localizedSitePath('pl', '/guides/'), '/pl/poradniki/');
  assert.equal(localizedSitePath('nb', '/guides/'), '/nb/guider/');
  assert.equal(languageSwitchPath('/pl/poradniki/', 'nb'), '/nb/guider/');
  assert.equal(languageSwitchPath('/nb/guider/', 'en'), '/guides/');
  assert.equal(languageSwitchPath('/guides/', 'pl'), '/pl/poradniki/');
  // Articles have no generic counterpart; the pages pass their translations.
  assert.equal(languageSwitchPath('/pl/poradniki/aplikacja-dla-klubu-sportowego/', 'en'), '/guides/');
  assert.equal(guideSectionLanguage('/nb/guider/some-guide/'), 'nb');
  assert.equal(guideSectionLanguage('/pl/poradniki'), 'pl');
  assert.equal(guideSectionLanguage('/pl/facts/'), null);
  // The facts and support rules stay as they were.
  assert.equal(languageSwitchPath('/pl/facts/', 'nb'), '/nb/facts/');
  assert.equal(localizedSitePath('pl', '/support/'), '/pl/support/');
});

test('a guide links its translations and falls back to the other index', () => {
  const guides = [clubPl, clubEn, salonPl];

  assert.equal(guidePath(clubPl), '/pl/poradniki/aplikacja-dla-klubu-sportowego/');
  assert.deepEqual(guideAlternates(guides, clubPl), {
    pl: '/pl/poradniki/aplikacja-dla-klubu-sportowego/',
    en: '/guides/sports-club-app/',
  });
  assert.deepEqual(guideAlternates(guides, salonPl), { pl: '/pl/poradniki/rezerwacje-w-salonie/' });
  assert.deepEqual(guideSwitchPaths(guides, clubEn), {
    en: '/guides/sports-club-app/',
    pl: '/pl/poradniki/aplikacja-dla-klubu-sportowego/',
    nb: GUIDE_INDEX_PATHS.nb,
  });
  assert.deepEqual(guideSwitchPaths(guides, salonPl), {
    en: GUIDE_INDEX_PATHS.en,
    pl: '/pl/poradniki/rezerwacje-w-salonie/',
    nb: GUIDE_INDEX_PATHS.nb,
  });
});

test('store campaigns stay within the tagged-link limit', () => {
  const longestTopic = { ...clubPl, topic: 'a'.repeat(17) };
  assert.equal(guideStoreCampaign(clubPl), 'web-guide-sports-club-pl');
  assert.match(guideStoreCampaign(longestTopic), /^[a-z0-9-]{1,30}$/);
  assert.deepEqual(guideRegistryProblems({ ...registry, guides: [longestTopic] }), []);
  assert.match(
    guideRegistryProblems({ ...registry, guides: [{ ...clubPl, topic: 'a'.repeat(18) }] }).join('\n'),
    /topic must be/,
  );
});

test('bold markers split into segments and must be paired', () => {
  assert.deepEqual(textSegments('Nie **pobiera składek** ani opłat.'), [
    { text: 'Nie ', strong: false },
    { text: 'pobiera składek', strong: true },
    { text: ' ani opłat.', strong: false },
  ]);
  assert.deepEqual(textSegments('**Tak.**'), [{ text: 'Tak.', strong: true }]);
  assert.throws(() => textSegments('Nie **pobiera składek.'), /Unmatched \*\*/);
});

test('the registry is valid and every guide has its body and page files', async () => {
  assert.deepEqual(guideRegistryProblems(registry), []);

  for (const guide of registry.guides) {
    const body = JSON.parse(
      await readFile(new URL(`content/guides/${guide.language}/${guide.slug}.json`, root), 'utf8'),
    );
    assert.deepEqual(guideArticleProblems(guide.slug, body), []);
    await access(new URL(`app${guidePath(guide)}page.tsx`, root));
  }

  // No article folder without a registry entry.
  for (const [language, indexPath] of Object.entries(GUIDE_INDEX_PATHS)) {
    const entries = await readdir(new URL(`app${indexPath}`, root), { withFileTypes: true });
    for (const entry of entries.filter((item) => item.isDirectory())) {
      assert.ok(
        registry.guides.some((guide) => guide.language === language && guide.slug === entry.name),
        `app${indexPath}${entry.name}/ is not listed in content/guides.json`,
      );
    }
  }
});

test('registry problems are reported in plain words', () => {
  const problems = guideRegistryProblems({
    ...registry,
    guides: [
      clubPl,
      { ...clubPl, topic: 'other' },
      { ...clubEn, title: 'x'.repeat(61) },
      { ...salonPl, description: 'Za krótko.' },
      { ...clubEn, topic: 'home', slug: 'home', updatedOn: '2026-02-30' },
      { ...clubEn, topic: 'team', slug: 'team', updatedLabel: 'Updated 28 September 2026' },
      { ...clubEn, topic: 'dash', slug: 'dash', heading: 'Groups \u2014 and meetings' },
    ],
  }).join('\n');

  assert.match(problems, /duplicate slug in pl/);
  assert.match(problems, /title must have 1-60 characters/);
  assert.match(problems, /description must have 50-160 characters/);
  assert.match(problems, /updatedOn must be a YYYY-MM-DD date/);
  assert.match(problems, /updatedLabel must show the day and year of 2026-09-27/);
  assert.match(problems, /short hyphen instead of a long dash/);

  const { nb, ...indexWithoutNorwegian } = registry.index;
  assert.ok(nb);
  assert.match(
    guideRegistryProblems({ ...registry, index: indexWithoutNorwegian }).join('\n'),
    /guides index\.nb\.title is missing/,
  );
});

test('article bodies open with a paragraph and use only known blocks', () => {
  assert.deepEqual(guideArticleProblems('valid', validArticle), []);
  assert.deepEqual(guideArticleProblems('no FAQ', { body: validArticle.body }), []);

  const problems = guideArticleProblems('broken', {
    body: [
      { type: 'h2', text: 'Start' },
      { type: 'h1', text: 'Second title' },
      { type: 'ul', items: [] },
      { type: 'p', text: 'Nie **pobiera.' },
    ],
    faq: [{ question: 'Pytanie?', answer: '' }],
  }).join('\n');

  assert.match(problems, /body must open with a paragraph/);
  assert.match(problems, /block 1 has unknown type h1/);
  assert.match(problems, /list block 2 needs non-empty items/);
  assert.match(problems, /Unmatched \*\*/);
  assert.match(problems, /FAQ entry 0 is incomplete/);
  assert.match(guideArticleProblems('empty', { body: [] }).join('\n'), /body is empty/);
  assert.match(
    guideArticleProblems('flat', { body: [{ type: 'p', text: 'Only text.' }] }).join('\n'),
    /at least one h2 section/,
  );
});
