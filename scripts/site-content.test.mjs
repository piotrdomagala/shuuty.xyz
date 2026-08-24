import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

function contentShape(value) {
  if (Array.isArray(value)) return value.map(contentShape);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
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
    'app/layout.tsx',
    'app/pl/page.tsx',
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
