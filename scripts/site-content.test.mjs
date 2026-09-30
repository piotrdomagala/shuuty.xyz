import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { languageSwitchPath, localizedSitePath } from '../lib/sitePaths.mjs';

const root = new URL('../', import.meta.url);

test('language paths keep Norwegian to the landing, support and facts pages', () => {
  assert.equal(localizedSitePath('nb', '/'), '/nb/');
  assert.equal(localizedSitePath('nb', '/support/'), '/nb/support/');
  assert.equal(localizedSitePath('nb', '/facts/'), '/nb/facts/');
  assert.equal(languageSwitchPath('/pl/facts/', 'nb'), '/nb/facts/');
  assert.equal(languageSwitchPath('/nb/facts/', 'en'), '/facts/');
  assert.equal(localizedSitePath('nb', '/privacy/'), '/privacy/');
  assert.equal(localizedSitePath('nb', '/account-deletion/'), '/account-deletion/');
  assert.equal(localizedSitePath('pl', '/terms/'), '/pl/terms/');
  assert.equal(localizedSitePath('en', '/child-safety/'), '/child-safety/');
});

test('the language switcher resolves legacy aliases to canonical pages', () => {
  // Choosing NB on an old support address must open the real Norwegian page,
  // not keep the alias and change the language only in memory.
  assert.equal(languageSwitchPath('/documents/support/', 'nb'), '/nb/support/');
  assert.equal(languageSwitchPath('/pl/documents/support/', 'nb'), '/nb/support/');
  assert.equal(languageSwitchPath('/documents/support/', 'pl'), '/pl/support/');
  assert.equal(languageSwitchPath('/pl/documents/support/', 'en'), '/support/');
  assert.equal(languageSwitchPath('/documents/privacy/', 'pl'), '/pl/privacy/');
  assert.equal(languageSwitchPath('/pl/documents/terms/', 'en'), '/terms/');
  assert.equal(languageSwitchPath('/nb/support/', 'en'), '/support/');
  assert.equal(languageSwitchPath('/nb/', 'pl'), '/pl/');
  assert.equal(languageSwitchPath('/nb/', 'nb'), '/nb/');
  assert.equal(languageSwitchPath('/pl', 'nb'), '/nb/');
});

function contentShape(value) {
  if (Array.isArray(value)) return value.map(contentShape);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, contentShape(value[key])]),
    );
  }
  return typeof value;
}

test('English and Polish landing content have the same structure', async () => {
  const content = JSON.parse(
    await readFile(new URL('app/homeContent.json', root), 'utf8'),
  );

  assert.deepEqual(contentShape(content.en), contentShape(content.pl));
});

test('facts content has the same structure, sections and ten questions in every language', async () => {
  const facts = JSON.parse(await readFile(new URL('content/facts.json', root), 'utf8'));
  const languages = Object.keys(facts.pages);

  assert.deepEqual(languages, ['en', 'pl', 'nb']);
  for (const language of languages) {
    const page = facts.pages[language];
    // Platform labels exist only on some items, so compare section ids and counts
    // instead of the full key shape.
    assert.deepEqual(
      page.sections.map((section) => [section.id, section.items.length]),
      facts.pages.en.sections.map((section) => [section.id, section.items.length]),
      `${language} sections differ from English`,
    );
    assert.equal(page.faq.length, 10, `${language} should have 10 FAQ entries`);
    assert.equal(page.path, language === 'en' ? '/facts/' : `/${language}/facts/`);
    for (const entry of page.faq) {
      assert.ok(entry.question.length > 0 && entry.answer.length > 0);
    }
  }
  // Source tags stay in the verification folder; the site ships text only.
  assert.equal(JSON.stringify(facts).includes('"source"'), false);
});

test('Norwegian landing content has the same structure and story', async () => {
  const content = JSON.parse(
    await readFile(new URL('app/homeContent.json', root), 'utf8'),
  );

  assert.deepEqual(contentShape(content.en), contentShape(content.nb));
  assert.equal(content.nb.hero.title, 'En oppgaveapp -');
  assert.equal(content.nb.how.steps.length, 4);
  assert.equal(content.nb.uses.items.length, 5);
  assert.equal(content.nb.faq.items.length, 5);
});

test('the landing tells one four-step story in every language', async () => {
  const content = JSON.parse(
    await readFile(new URL('app/homeContent.json', root), 'utf8'),
  );
  const guides = JSON.parse(await readFile(new URL('content/guides.json', root), 'utf8'));
  const media = JSON.parse(
    await readFile(new URL('content/product-media.runtime.json', root), 'utf8'),
  );
  const captureIds = new Set(media.guideCaptures.map((capture) => capture.id));

  // No-break spaces keep "i w grupach" together, so the line never ends on a lone "i".
  assert.equal(
    `${content.pl.hero.title} ${content.pl.hero.accent}`,
    'Aplikacja do zadań - Twoich, ze znajomymi i w grupach',
  );
  assert.equal(
    `${content.en.hero.title} ${content.en.hero.accent}`,
    'A task app - for you, your friends and your groups',
  );
  assert.equal(content.pl.how.heading, 'Jedna aplikacja, cztery kroki');
  assert.equal(content.en.how.heading, 'One app, four steps');
  assert.equal(content.pl.uses.heading, 'Do czego ludzie używają Shuuty');
  assert.equal(content.en.uses.heading, 'What people use Shuuty for');
  assert.equal(content.pl.how.loop.heading, 'Jedna aplikacja, wiele możliwości');
  assert.equal(content.en.how.loop.heading, 'One app, many possibilities');
  assert.equal(content.nb.how.loop.heading, 'Én app, mange muligheter');

  for (const language of ['en', 'pl', 'nb']) {
    const page = content[language];
    assert.deepEqual(
      page.how.steps.map((step) => step.id),
      ['step-tasks', 'step-friends', 'step-discover', 'step-groups'],
    );
    assert.equal(page.how.loop.chain.length, 4);
    for (const item of page.how.loop.chain) {
      assert.ok(item.title.length > 0 && item.text.length > 0);
    }
    assert.equal(page.uses.items.length, 5);
    assert.equal(page.faq.items.length, 5);

    // Every screen is a registered home capture in the locale the page shows.
    const captureLanguage = language === 'pl' ? 'pl' : 'en';
    const screens = [
      ...page.hero.screens,
      ...page.how.steps.flatMap((step) => step.screens),
      page.how.loop.screen,
    ];
    for (const screen of screens) {
      assert.ok(
        captureIds.has(`${captureLanguage}-${screen.media}`),
        `${language} shows an unregistered capture: ${screen.media}`,
      );
      assert.ok(screen.alt.length > 0);
    }

    // Guide links name existing topics and carry a label.
    const topics = [
      ...page.how.steps.flatMap((step) => step.guides),
      ...page.uses.items.flatMap((item) => item.guides),
    ];
    for (const topic of topics) {
      assert.ok(guides.guides.some((guide) => guide.topic === topic), `Unknown guide topic: ${topic}`);
      assert.ok(page.guideLabels[topic], `${language} has no label for ${topic}`);
    }
  }

  // Polish and English link every step with a guide and every use case.
  for (const language of ['en', 'pl']) {
    for (const item of content[language].uses.items) {
      assert.ok(
        item.guides.some((topic) =>
          guides.guides.some((guide) => guide.topic === topic && guide.language === language)),
        `${language} use case without a guide: ${item.title}`,
      );
    }
  }
});

test('the landing does not recreate product UI or disclose implementation providers', async () => {
  const files = await Promise.all(
    [
      'app/homeContent.json',
      'components/HomePageClient.tsx',
      'app/page.module.css',
    ].map(async (path) => [path, await readFile(new URL(path, root), 'utf8')]),
  );

  const combined = files.map(([, content]) => content).join('\n');
  for (const forbidden of [
    'voiceDemo',
    'parsedTask',
    'phoneHighlight',
    'orbitBadge',
    '>AI<',
    'OpenAI',
    'Anthropic',
    'Gemini',
    'exports/final',
    'generated_images',
    'exec-e3c8a91f-f42f-40e5-bcbd-c2b3a1246ffb',
  ]) {
    assert.equal(combined.includes(forbidden), false, `Landing contains forbidden marker: ${forbidden}`);
  }
});

test('new marketing prose follows the short-hyphen convention', async () => {
  const paths = [
    'app/homeContent.json',
    'components/HomePageClient.tsx',
    'lib/site.ts',
    'app/layout.tsx',
    'app/pl/page.tsx',
    'app/nb/page.tsx',
    'app/nb/support/page.tsx',
    'components/documentLocale.ts',
    'components/SupportPageClient.tsx',
    'components/FactsPageClient.tsx',
    'content/facts.json',
    'app/nb/facts/page.tsx',
    'content/guides.json',
    'components/GuidesIndexClient.tsx',
    'components/GuidePageClient.tsx',
    'public/llms.txt',
    'public/llms-full.txt',
  ];
  const combined = (
    await Promise.all(paths.map((path) => readFile(new URL(path, root), 'utf8')))
  ).join('\n');

  assert.equal(/[—–]/u.test(combined), false);
});

test('the hidden mobile dock stays reachable through sequential keyboard navigation', async () => {
  const css = await readFile(new URL('app/page.module.css', root), 'utf8');
  const component = await readFile(new URL('components/HomePageClient.tsx', root), 'utf8');
  const ruleStart = css.lastIndexOf('  .mobileNav {');
  const ruleEnd = css.indexOf('\n  }', ruleStart);

  assert.notEqual(ruleStart, -1, 'Mobile dock rule is missing');
  assert.notEqual(ruleEnd, -1, 'Mobile dock rule is incomplete');

  const hiddenDockRule = css.slice(ruleStart, ruleEnd);
  assert.doesNotMatch(hiddenDockRule, /visibility:\s*hidden/);
  assert.match(hiddenDockRule, /pointer-events:\s*none/);
  assert.match(css, /\.mobileNav:focus-within\s*\{/);
  assert.match(component, /onFocusCapture=/);
});

test('reduced motion explicitly removes phone transform transitions', async () => {
  const css = await readFile(new URL('app/page.module.css', root), 'utf8');
  const mediaStart = css.indexOf('@media (prefers-reduced-motion: reduce)');
  const mediaEnd = css.indexOf('@media (max-width: 1120px)', mediaStart);

  assert.notEqual(mediaStart, -1, 'Reduced-motion media query is missing');
  assert.notEqual(mediaEnd, -1, 'Reduced-motion media query is incomplete');

  const reducedMotionRules = css.slice(mediaStart, mediaEnd);
  for (const selector of ['.heroVisual > .phone', '.stagePhone']) {
    assert.ok(
      reducedMotionRules.includes(selector),
      `${selector} is missing reduced-motion handling`,
    );
  }
  assert.match(reducedMotionRules, /transition:\s*none\s*!important/);

  // The loop ring turns only for visitors who have not asked for less motion.
  const motionBlock = css.indexOf('@media (prefers-reduced-motion: no-preference) {\n  .orbitSpin');
  assert.notEqual(motionBlock, -1, 'The ring animation must sit under prefers-reduced-motion: no-preference');
  assert.equal((css.match(/animation:\s*orbit/g) ?? []).length, 2);
});

test('public copy does not promise local offers on the map or show the old support inbox', async () => {
  // Offers as a map or classifieds section are not released; a group can still
  // be its own offer. Support mail goes to support@shuuty.com.
  const unreleased = /local\s+offers?|lokaln\p{L}*\s+ofert|ofert\p{L}*\s+lokaln|lokal[et]?\s+tilbud/iu;
  const retiredInbox = ['shuuty.app', 'gmail.com'].join('@');
  const guideBodies = (await readdir(new URL('content/guides/', root), { recursive: true }))
    .filter((name) => name.endsWith('.json'))
    .map((name) => `content/guides/${name.replaceAll('\\', '/')}`);
  const files = [
    'app/homeContent.json',
    'content/facts.json',
    'content/guides.json',
    ...guideBodies,
    'public/llms.txt',
    'public/llms-full.txt',
    'components/HomePageClient.tsx',
    'components/SupportPageClient.tsx',
  ];
  for (const file of files) {
    const text = await readFile(new URL(file, root), 'utf8');
    assert.doesNotMatch(text, unreleased, `${file} describes local offers`);
    assert.ok(!text.includes(retiredInbox), `${file} still shows ${retiredInbox}`);
  }
});
