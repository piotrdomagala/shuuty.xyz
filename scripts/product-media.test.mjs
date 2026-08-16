import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { validateProductMedia } from './validate-product-media.mjs';

const root = new URL('../', import.meta.url);
const placementFields = [
  ['voiceInput', 'voice-input'],
  ['assignee', 'assignee'],
  ['delegatedTask', 'delegated-task'],
  ['groups', 'groups'],
  ['groupGallery', 'group-offer-gallery'],
  ['modules', 'modules'],
  ['bookings', 'bookings'],
  ['nearby', 'nearby'],
];

const webParameters = {
  scale: 0.5,
  fit: 'fill',
  kernel: 'lanczos3',
  colourspace: 'srgb',
  stripMetadata: true,
  quality: 88,
  effort: 6,
  smartSubsample: true,
};

function runtimeProjection(manifest) {
  return {
    schemaVersion: manifest.schemaVersion,
    assets: manifest.assets.map(({ id, altKey, web }) => ({
      id,
      altKey,
      path: web?.path,
      width: web?.width,
      height: web?.height,
    })),
    placementSets: manifest.placementSets,
    placementSelection: manifest.placementSelection,
  };
}

async function createBoundFixture() {
  const fixturePath = await mkdtemp(join(tmpdir(), 'shuuty-product-media-'));
  const fixtureRoot = pathToFileURL(`${fixturePath}/`);
  const sourceBuffer = await readFile(new URL('public/images/app/create-menu.jpg', root));
  const sha256 = createHash('sha256').update(sourceBuffer).digest('hex');
  const webWidth = 236;
  const webHeight = 512;
  const webBuffer = await sharp(sourceBuffer)
    .resize(webWidth, webHeight, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .toColourspace('srgb')
    .webp({
      quality: webParameters.quality,
      effort: webParameters.effort,
      smartSubsample: webParameters.smartSubsample,
    })
    .toBuffer();
  const webSha256 = createHash('sha256').update(webBuffer).digest('hex');
  const homeContent = JSON.parse(
    await readFile(new URL('app/homeContent.json', root), 'utf8'),
  );
  const headSha = 'a'.repeat(40);
  const assets = [];
  const placementSets = { en: {}, pl: {} };
  const platforms = ['ios', 'android', 'ios', 'ios', 'ios', 'ios', 'android', 'android'];

  for (const [language, locale] of [['en', 'en-US'], ['pl', 'pl-PL']]) {
    for (const [index, [field, semanticSlot]] of placementFields.entries()) {
      const position = index + 1;
      const id = `${language}-${semanticSlot}`;
      const platform = platforms[index];
      const device = platform === 'ios' ? 'iphone-6.9' : 'android-phone';
      const theme = position <= 5 ? 'dark' : 'light';
      const assetPath = `/images/product/${locale}/${position}.jpg`;
      const webPath = `/images/product/${locale}/${position}.webp`;
      const sourceArtifactEntry = platform === 'ios'
        ? `assets/source/ios/${device}/${locale}/screen-${theme}-${language}-${position}.png`
        : `assets/source/android/${locale}/screen-${theme}-${language}-${position}.png`;
      assets.push({
        id,
        altKey: field,
        path: assetPath,
        mediaType: 'image/jpeg',
        width: 471,
        height: 1024,
        sha256,
        locales: [locale],
        theme,
        semanticSlot,
        sourceArtifactEntry,
        sourceSha256: sha256,
        platform,
        device,
        storePosition: position,
        web: {
          path: webPath,
          mediaType: 'image/webp',
          width: webWidth,
          height: webHeight,
          byteLength: webBuffer.length,
          sha256: webSha256,
          sourceSha256: sha256,
          encoder: 'sharp@0.35.3',
          libvips: '8.18.3',
          parameters: webParameters,
        },
      });
      placementSets[language][field] = id;

      const publicFile = join(fixturePath, 'public', ...assetPath.split('/').filter(Boolean));
      await mkdir(join(publicFile, '..'), { recursive: true });
      await writeFile(publicFile, sourceBuffer);
      await writeFile(
        join(fixturePath, 'public', ...webPath.split('/').filter(Boolean)),
        webBuffer,
      );
    }
  }

  const manifest = {
    schemaVersion: 2,
    source: { status: 'approved-no-publish-package' },
    artifactBinding: {
      artifactRunId: '123456789',
      artifactHeadSha: headSha,
      sourceArtifactName: `shuuty-store-listing-package-${headSha}.zip`,
      packageSha256: 'b'.repeat(64),
      ledgerSha256: 'c'.repeat(64),
      qaSha256: 'd'.repeat(64),
    },
    assets,
    placementSets,
    placementSelection: { en: 'en', pl: 'pl' },
    finalArtifactContract: {
      status: 'approved-no-publish-imported',
      requiredImageCount: 50,
      requiredLocales: ['pl-PL', 'en-US'],
      semanticSlots: placementFields.map(([, slot]) => slot),
    },
  };

  await Promise.all([
    mkdir(join(fixturePath, 'content'), { recursive: true }),
    mkdir(join(fixturePath, 'app'), { recursive: true }),
  ]);
  await writeFile(join(fixturePath, 'app', 'homeContent.json'), JSON.stringify(homeContent));

  async function validate(candidateManifest, candidateRuntime = runtimeProjection(candidateManifest)) {
    await Promise.all([
      writeFile(
        join(fixturePath, 'content', 'product-media.json'),
        JSON.stringify(candidateManifest),
      ),
      writeFile(
        join(fixturePath, 'content', 'product-media.runtime.json'),
        JSON.stringify(candidateRuntime),
      ),
    ]);
    return validateProductMedia(fixtureRoot);
  }

  return { fixturePath, manifest, validate };
}

function convertToPreviewManifest(candidate) {
  const manifest = structuredClone(candidate);
  manifest.source = {
    repository: 'piotrdomagala/S-',
    commit: '20a14889e2397514b7c7bcd73269508f24c8004f',
    status: 'owner-attested-canonical-source-preview',
    note: 'Owner-attested source preview, deliberately unbound from the final package.',
  };
  manifest.artifactBinding = null;
  manifest.finalArtifactContract.status = 'awaiting-approved-no-publish-package';
  manifest.placementSets = {
    'canonical-source-en': manifest.placementSets.en,
    'canonical-source-pl': manifest.placementSets.pl,
  };
  manifest.placementSelection = {
    en: 'canonical-source-en',
    pl: 'canonical-source-pl',
  };
  for (const asset of manifest.assets) {
    asset.sourceArtifactEntry = `store-listing/${asset.sourceArtifactEntry}`;
  }
  return manifest;
}

test('checked-in product media matches its manifest', async () => {
  assert.deepEqual(await validateProductMedia(root), []);
});

test('the task-flow relay is the exact owner-attested Golden Relay asset', async () => {
  const relay = await readFile(
    new URL('public/images/brand/golden-relay-flow.png', root),
  );

  assert.equal(relay.readUInt32BE(16), 2048);
  assert.equal(relay.readUInt32BE(20), 256);
  assert.equal(
    createHash('sha256').update(relay).digest('hex'),
    '4e49a0b5b2f07f5cb934321d573173463e5ab10d986c29acf64593548956ce15',
  );
});

test('the owner-attested canonical source preview stays explicit and unbound', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('content/product-media.json', root), 'utf8'),
  );

  assert.equal(manifest.artifactBinding, null);
  assert.equal(manifest.source.status, 'owner-attested-canonical-source-preview');
  assert.match(manifest.source.commit, /^[a-f0-9]{40}$/u);
  assert.equal(manifest.assets.length, 16);
  assert.equal(manifest.finalArtifactContract.status, 'awaiting-approved-no-publish-package');
  assert.equal(manifest.finalArtifactContract.requiredImageCount, 50);
  assert.deepEqual(manifest.finalArtifactContract.requiredLocales, ['pl-PL', 'en-US']);
  assert.equal(manifest.finalArtifactContract.semanticSlots.length, 8);
  assert.equal(new Set(manifest.finalArtifactContract.semanticSlots).size, 8);
  assert.notEqual(manifest.placementSelection.en, manifest.placementSelection.pl);

  for (const [language, locale] of [['en', 'en-US'], ['pl', 'pl-PL']]) {
    const placementSet = manifest.placementSets[manifest.placementSelection[language]];
    const themes = new Set();
    const platforms = new Set();

    assert.deepEqual(
      Object.keys(placementSet).sort(),
      ['assignee', 'bookings', 'delegatedTask', 'groupGallery', 'groups', 'modules', 'nearby', 'voiceInput'],
    );

    for (const [field, semanticSlot] of placementFields) {
      const asset = manifest.assets.find((candidate) => candidate.id === placementSet[field]);
      assert.ok(asset, `${language}.${field} must resolve to a checked-in asset.`);
      assert.equal(asset.altKey, field);
      assert.equal(asset.semanticSlot, semanticSlot);
      assert.deepEqual(asset.locales, [locale]);
      assert.equal(asset.sourceSha256, asset.sha256);
      assert.match(asset.path, /^\/images\/product\/canonical-flow-2026\//u);
      assert.match(asset.sourceArtifactEntry, /^store-listing\/assets\/source\//u);
      assert.equal(asset.web.mediaType, 'image/webp');
      assert.match(asset.web.path, /^\/images\/product\/canonical-flow-2026\/.*\.webp$/u);
      assert.equal(asset.web.width, Math.round(asset.width / 2));
      assert.equal(asset.web.height, Math.round(asset.height / 2));
      assert.match(asset.web.sha256, /^[a-f0-9]{64}$/u);
      assert.notEqual(asset.web.sha256, asset.sourceSha256);
      assert.equal(asset.web.sourceSha256, asset.sha256);
      assert.ok(asset.web.byteLength > 0);
      assert.ok(asset.web.byteLength <= 200 * 1024);
      assert.equal(asset.web.encoder, 'sharp@0.35.3');
      assert.equal(asset.web.libvips, '8.18.3');
      assert.deepEqual(asset.web.parameters, webParameters);
      themes.add(asset.theme);
      platforms.add(asset.platform);
    }

    assert.deepEqual(themes, new Set(['dark', 'light']));
    assert.deepEqual(platforms, new Set(['ios', 'android']));
  }
});

test('an approved bound package passes every media provenance invariant', async () => {
  const fixture = await createBoundFixture();
  try {
    assert.deepEqual(await fixture.validate(fixture.manifest), []);
  } finally {
    await rm(fixture.fixturePath, { recursive: true, force: true });
  }
});

test('the bound package gate rejects provenance, locale, flow and runtime drift', async () => {
  const fixture = await createBoundFixture();
  try {
    const cases = [
      {
        expected: 'Approved product media must use locale-specific EN and PL placement sets.',
        mutate(manifest) {
          manifest.placementSelection.pl = 'en';
        },
      },
      {
        expected: 'en.voiceInput must use exactly locale en-US.',
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-voice-input').locales = ['pl-PL'];
        },
      },
      {
        expected: 'en must deliberately represent both Light and Dark product UI.',
        mutate(manifest) {
          for (const asset of manifest.assets.filter((candidate) => candidate.id.startsWith('en-'))) {
            asset.theme = 'dark';
          }
        },
      },
      {
        expected: 'en must deliberately represent both iOS and Android product UI.',
        mutate(manifest) {
          for (const asset of manifest.assets.filter((candidate) => candidate.id.startsWith('en-'))) {
            asset.platform = 'ios';
            asset.device = 'iphone-6.9';
          }
        },
      },
      {
        expected: 'en-assignee.sourceArtifactEntry must be a canonical relative archive entry.',
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-assignee').sourceArtifactEntry = '../draft/02.png';
        },
      },
      {
        expected: 'en-assignee.sourceArtifactEntry must be unique across imported product media.',
        mutate(manifest) {
          const voiceInput = manifest.assets.find((asset) => asset.id === 'en-voice-input');
          manifest.assets.find((asset) => asset.id === 'en-assignee').sourceArtifactEntry = voiceInput.sourceArtifactEntry;
        },
      },
      {
        expected: 'en-assignee.sourceArtifactEntry must contain locale en-US.',
        mutate(manifest) {
          const asset = manifest.assets.find((candidate) => candidate.id === 'en-assignee');
          asset.sourceArtifactEntry = asset.sourceArtifactEntry.replace('/en-US/', '/pl-PL/');
        },
      },
      {
        expected: 'en-voice-input.sourceSha256 must equal sha256 for a byte-for-byte approved import.',
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-voice-input').sourceSha256 = 'e'.repeat(64);
        },
      },
      {
        expected: 'en-voice-input.altKey must be voiceInput for voice-input.',
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-voice-input').altKey = 'groups';
        },
      },
      {
        expected: 'en.voiceInput must use a phone capture; only groupGallery supports iPad.',
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-voice-input').device = 'ipad-13';
        },
      },
      {
        expected: 'en-groups.storePosition must be 4 for groups.',
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-groups').storePosition = 5;
        },
      },
      {
        expected: 'artifactBinding.artifactRunId must be a numeric workflow run ID.',
        mutate(manifest) {
          manifest.artifactBinding.artifactRunId = 'draft-run';
        },
      },
      {
        expected: 'A bound manifest source.status must be approved-no-publish-package.',
        mutate(manifest) {
          manifest.source.status = 'owner-attested-canonical-source-preview';
        },
      },
      {
        expected: `artifactBinding.sourceArtifactName must be shuuty-store-listing-package-${'a'.repeat(40)}.zip, never a draft or local path.`,
        mutate(manifest) {
          manifest.artifactBinding.sourceArtifactName = 'draft.zip';
        },
      },
      {
        expected: 'The final artifact contract semantic slots must exactly match the ordered website flow.',
        mutate(manifest) {
          manifest.finalArtifactContract.semanticSlots.reverse();
        },
      },
      {
        expected: 'en-voice-input must use a canonical path below /images/ without traversal.',
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-voice-input').path = '/images/../secret.jpg';
        },
      },
      {
        expected: 'en-voice-input.web.encoder must be sharp@0.35.3.',
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-voice-input').web.encoder = 'sharp@latest';
        },
      },
      {
        expected: 'en-voice-input.web.path must be a canonical path below /images/ without traversal.',
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-voice-input').web.path = '/images/../draft.webp';
        },
      },
      {
        expected: 'en-voice-input.web.path must preserve the source locale and filename stem.',
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-voice-input').web.path =
            '/images/product/en-US/voice-renamed.webp';
        },
      },
      {
        expected: 'en-voice-input.web.sourceSha256 must match the canonical source SHA-256.',
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-voice-input').web.sourceSha256 =
            'e'.repeat(64);
        },
      },
      {
        expected: `en-voice-input.web exceeds the ${200 * 1024}-byte asset budget.`,
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-voice-input').web.byteLength =
            200 * 1024 + 1;
        },
      },
      {
        expected: `en-US web derivatives exceed the ${600 * 1024}-byte locale budget.`,
        mutate(manifest) {
          for (const asset of manifest.assets.filter(
            (candidate) => candidate.locales[0] === 'en-US',
          )) {
            asset.web.byteLength = 80 * 1024;
          }
        },
      },
      {
        expected: 'en-voice-input.web must declare the deterministic website derivative.',
        mutate(manifest) {
          delete manifest.assets.find((asset) => asset.id === 'en-voice-input').web;
        },
      },
    ];

    for (const { expected, mutate } of cases) {
      const manifest = structuredClone(fixture.manifest);
      mutate(manifest);
      const failures = await fixture.validate(manifest);
      assert.ok(failures.includes(expected), `${expected}\nReceived:\n${failures.join('\n')}`);
    }

    const runtime = runtimeProjection(fixture.manifest);
    runtime.assets[0].path = '/images/unapproved.jpg';
    assert.ok(
      (await fixture.validate(fixture.manifest, runtime)).includes(
        'The runtime media manifest must exactly match the public rendering projection and contain no provenance fields.',
      ),
    );
  } finally {
    await rm(fixture.fixturePath, { recursive: true, force: true });
  }
});

test('checked-in WebP files reproduce byte-for-byte with the pinned pipeline', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('content/product-media.json', root), 'utf8'),
  );

  assert.equal(sharp.versions.sharp, '0.35.3');
  assert.equal(sharp.versions.vips, '8.18.3');
  sharp.cache(false);

  for (const asset of manifest.assets) {
    const source = await readFile(new URL(`public${asset.path}`, root));
    const output = await sharp(source, { failOn: 'error' })
      .resize(asset.web.width, asset.web.height, {
        fit: webParameters.fit,
        kernel: sharp.kernel.lanczos3,
      })
      .toColourspace(webParameters.colourspace)
      .webp({
        quality: webParameters.quality,
        effort: webParameters.effort,
        smartSubsample: webParameters.smartSubsample,
      })
      .toBuffer();

    assert.equal(output.length, asset.web.byteLength, asset.id);
    assert.equal(createHash('sha256').update(output).digest('hex'), asset.web.sha256, asset.id);
  }
});

test('the unbound preview gate rejects source-entry and placement drift', async () => {
  const fixture = await createBoundFixture();
  try {
    const baseline = convertToPreviewManifest(fixture.manifest);
    assert.deepEqual(await fixture.validate(baseline), []);

    const cases = [
      {
        expected: 'en-assignee.sourceArtifactEntry must be unique across imported product media.',
        mutate(manifest) {
          const voice = manifest.assets.find((asset) => asset.id === 'en-voice-input');
          manifest.assets.find((asset) => asset.id === 'en-assignee').sourceArtifactEntry =
            voice.sourceArtifactEntry;
        },
      },
      {
        expected: 'en-assignee.sourceArtifactEntry must be a canonical relative archive entry.',
        mutate(manifest) {
          manifest.assets.find((asset) => asset.id === 'en-assignee').sourceArtifactEntry =
            '../store-listing/assets/source/ios/en-US/02.png';
        },
      },
      {
        expected: 'canonical-source-en.groups must use semantic slot groups; received assignee.',
        mutate(manifest) {
          manifest.placementSets['canonical-source-en'].groups =
            manifest.placementSets['canonical-source-en'].assignee;
        },
      },
      {
        expected: 'Preview source.commit must be 20a14889e2397514b7c7bcd73269508f24c8004f.',
        mutate(manifest) {
          manifest.source.commit = 'f'.repeat(40);
        },
      },
      {
        expected: 'Preview media must expose exactly one canonical placement set per locale.',
        mutate(manifest) {
          manifest.placementSets.extra = structuredClone(
            manifest.placementSets['canonical-source-en'],
          );
        },
      },
    ];

    for (const { expected, mutate } of cases) {
      const manifest = structuredClone(baseline);
      mutate(manifest);
      const failures = await fixture.validate(manifest);
      assert.ok(failures.includes(expected), `${expected}\nReceived:\n${failures.join('\n')}`);
    }
  } finally {
    await rm(fixture.fixturePath, { recursive: true, force: true });
  }
});
