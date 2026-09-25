import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
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
  assert.equal(content.nb.hero.relay, 'Si det. Deleger det. Få det gjort.');
  assert.equal(content.nb.tasks.mechanism.length, 3);
  assert.equal(content.nb.groups.modes.length, 4);
  assert.equal(content.nb.groups.modules.length, 10);
  assert.equal(content.nb.faq.items.length, 4);
});

test('the Golden Relay and flexible group story stay explicit in both languages', async () => {
  const content = JSON.parse(
    await readFile(new URL('app/homeContent.json', root), 'utf8'),
  );

  assert.equal(content.en.hero.relay, 'Say it. Delegate it. Get it done.');
  assert.equal(content.pl.hero.relay, 'Powiedz. Deleguj. Działajcie.');
  assert.equal(content.en.groups.modes.length, 4);
  assert.equal(content.pl.groups.modes.length, 4);
  assert.equal(content.en.groups.modules.length, 10);
  assert.equal(content.pl.groups.modules.length, 10);
  assert.equal(content.en.tasks.mechanism.length, 3);
  assert.equal(content.pl.tasks.mechanism.length, 3);
  assert.equal(content.en.tasks.mechanismLabel, 'From thought to task - three steps.');
  assert.equal(content.pl.tasks.mechanismLabel, 'Od myśli do zadania - trzy kroki.');
  assert.equal(content.en.tasks.mechanism[2].title, 'Delegate now. The task is ready.');
  assert.equal(content.pl.tasks.mechanism[2].title, 'Deleguj teraz. Zadanie jest gotowe.');
  assert.equal(content.en.faq.items.length, 4);
  assert.equal(content.pl.faq.items.length, 4);

  for (const required of [
    'A place to work',
    'A community',
    'A service offer',
    'A sales showcase',
  ]) {
    assert.ok(content.en.groups.modes.some((mode) => mode.title === required));
  }
  for (const required of [
    'Miejsce pracy',
    'Społeczność',
    'Oferta usługowa',
    'Oferta sprzedażowa',
  ]) {
    assert.ok(content.pl.groups.modes.some((mode) => mode.title === required));
  }
});

test('the landing does not recreate product UI or disclose implementation providers', async () => {
  const files = await Promise.all(
    [
      'app/homeContent.json',
      'components/HomePageClient.tsx',
      'components/TaskSpatialHandoff.tsx',
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

test('reduced motion explicitly removes task-flow transform transitions', async () => {
  const css = await readFile(new URL('app/page.module.css', root), 'utf8');
  const mediaStart = css.indexOf('@media (prefers-reduced-motion: reduce)');
  const mediaEnd = css.indexOf('@media (max-width: 1120px)', mediaStart);

  assert.notEqual(mediaStart, -1, 'Reduced-motion media query is missing');
  assert.notEqual(mediaEnd, -1, 'Reduced-motion media query is incomplete');

  const reducedMotionRules = css.slice(mediaStart, mediaEnd);
  for (const selector of ['.taskFlowList', '.taskScreenPlane', '.taskStepCopy']) {
    assert.ok(
      reducedMotionRules.includes(selector),
      `${selector} is missing reduced-motion handling`,
    );
  }
  assert.match(reducedMotionRules, /transition:\s*none\s*!important/);
});
