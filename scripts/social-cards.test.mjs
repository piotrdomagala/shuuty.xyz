import assert from 'node:assert/strict';
import test from 'node:test';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertLayout } from './generate-social-cards.mjs';
import { validateSocialCards } from './validate-social-cards.mjs';

const root = new URL('../', import.meta.url);

async function createFixture() {
  const fixturePath = await mkdtemp(join(tmpdir(), 'shuuty-social-cards-'));
  await Promise.all([
    mkdir(join(fixturePath, 'content'), { recursive: true }),
    mkdir(join(fixturePath, 'app'), { recursive: true }),
  ]);
  await Promise.all([
    cp(fileURLToPath(new URL('content/product-media.json', root)), join(fixturePath, 'content', 'product-media.json')),
    cp(fileURLToPath(new URL('app/homeContent.json', root)), join(fixturePath, 'app', 'homeContent.json')),
    cp(fileURLToPath(new URL('public/images/social/', root)), join(fixturePath, 'public', 'images', 'social'), {
      recursive: true,
    }),
  ]);
  const config = JSON.parse(await readFile(new URL('content/social-cards.json', root), 'utf8'));

  async function validate(candidate) {
    await writeFile(join(fixturePath, 'content', 'social-cards.json'), JSON.stringify(candidate));
    return validateSocialCards(pathToFileURL(`${fixturePath}/`));
  }

  return { fixturePath, config, validate };
}

test('checked-in social cards match their captures and copy rules', async () => {
  assert.deepEqual(await validateSocialCards(root), []);
});

test('every site language has a card rendered from its own captures', async () => {
  const config = JSON.parse(await readFile(new URL('content/social-cards.json', root), 'utf8'));
  assert.deepEqual(Object.keys(config.cards), ['en', 'pl', 'nb']);
  assert.ok(config.cards.pl.screens.every((id) => id.startsWith('pl-')));
  assert.ok(config.cards.en.screens.every((id) => id.startsWith('en-')));
  for (const card of Object.values(config.cards)) {
    assert.ok(card.image.byteLength <= 250 * 1024);
  }
});

test('the card generator refuses a layout that would clip or overlap', () => {
  const size = { width: 1200, height: 630 };
  const layout = (overrides = {}) => ({
    textRight: 580,
    domainTop: 500,
    textLayers: [
      { name: 'headline line 1', left: 64, top: 190, width: 500, height: 70 },
      { name: 'tagline', left: 64, top: 300, width: 460, height: 36 },
    ],
    phoneLayers: [{ name: 'capture 1', left: 620, top: 50, width: 300, height: 530 }],
    ...overrides,
  });

  assert.doesNotThrow(() => assertLayout(size, layout()));
  const cases = [
    [{ textLayers: [{ name: 'headline line 1', left: -6, top: 190, width: 500, height: 70 }, layout().textLayers[1]] },
      /headline line 1 leaves the 1200x630 card/],
    [{ textLayers: [{ name: 'headline line 1', left: 64, top: 190, width: 540, height: 70 }, layout().textLayers[1]] },
      /headline line 1 runs past the text column into the captures/],
    [{ phoneLayers: [{ name: 'capture 1', left: 1000, top: 50, width: 300, height: 530 }] },
      /capture 1 leaves the 1200x630 card/],
    [{ phoneLayers: [{ name: 'capture 1', left: 560, top: 50, width: 300, height: 530 }] },
      /a capture overlaps the text column/],
    [{ domainTop: 320 }, /the tagline overlaps the domain line/],
  ];
  for (const [overrides, expected] of cases) {
    assert.throws(() => assertLayout(size, layout(overrides)), expected);
  }
});

test('the social card gate rejects stale, oversized and off-brand cards', async () => {
  const fixture = await createFixture();
  try {
    const cases = [
      {
        expected: 'cards.pl was rendered from an older pl-groups; regenerate the social cards.',
        mutate(config) {
          config.cards.pl.sources['pl-groups'] = 'e'.repeat(64);
        },
      },
      {
        expected: 'cards.pl.screens must use pl-PL captures; en-groups is not.',
        mutate(config) {
          config.cards.pl.screens[2] = 'en-groups';
          config.cards.pl.sources = Object.fromEntries(
            config.cards.pl.screens.map((id) => [id, config.cards.en.sources[id] ?? config.cards.pl.sources[id]]),
          );
        },
      },
      {
        expected: 'cards.en.headline must read exactly like the en hero relay.',
        mutate(config) {
          config.cards.en.headline = ['Say it. Delegate it.', 'Done.'];
        },
      },
      {
        expected: 'cards.nb.tagline must use the short hyphen, not a long dash.',
        mutate(config) {
          config.cards.nb.tagline = `Huskeliste ${String.fromCharCode(0x2014)} grupper`;
        },
      },
      {
        expected: 'cards.en.footer contains characters the card font cannot render.',
        mutate(config) {
          config.cards.en.footer = `Available on iOS and Android ${String.fromCodePoint(0x1f680)}`;
        },
      },
      {
        expected: `cards.en.image must stay within the ${250 * 1024}-byte preview budget.`,
        mutate(config) {
          config.cards.en.image.byteLength = 250 * 1024 + 1;
        },
      },
      {
        expected: `cards.en.image SHA-256 is ${fixture.config.cards.en.image.sha256}; expected ${'e'.repeat(64)}.`,
        mutate(config) {
          config.cards.en.image.sha256 = 'e'.repeat(64);
        },
      },
      {
        expected: 'Social cards must cover exactly en, pl, nb.',
        mutate(config) {
          delete config.cards.nb;
        },
      },
      {
        expected: 'productHuntGallery[1].screens must use en-US captures; pl-voice-input is not.',
        mutate(config) {
          config.productHuntGallery[1].screens[0] = 'pl-voice-input';
        },
      },
    ];

    for (const { expected, mutate } of cases) {
      const config = structuredClone(fixture.config);
      mutate(config);
      const failures = await fixture.validate(config);
      assert.ok(failures.includes(expected), `${expected}\nReceived:\n${failures.join('\n')}`);
    }

    await writeFile(join(fixture.fixturePath, 'public', 'images', 'social', 'draft.png'), 'x');
    assert.ok(
      (await fixture.validate(fixture.config)).includes(
        'public/images/social/draft.png is not a recorded social card.',
      ),
    );
  } finally {
    await rm(fixture.fixturePath, { recursive: true, force: true });
  }
});
