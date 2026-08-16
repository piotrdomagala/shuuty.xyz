import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
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

function runtimeProjection(manifest) {
  return {
    schemaVersion: manifest.schemaVersion,
    assets: manifest.assets.map(({ id, altKey, path, width, height }) => ({
      id,
      altKey,
      path,
      width,
      height,
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
      const assetPath = `/images/product/${locale}/${position}.jpg`;
      assets.push({
        id,
        altKey: field,
        path: assetPath,
        mediaType: 'image/jpeg',
        width: 471,
        height: 1024,
        sha256,
        locales: [locale],
        theme: position <= 5 ? 'dark' : 'light',
        semanticSlot,
        sourceArtifactEntry: `assets/source/${platform}/${locale}/${position}.png`,
        sourceSha256: sha256,
        platform,
        device: platform === 'ios' ? 'iphone-6.9' : 'android-phone',
        storePosition: position,
      });
      placementSets[language][field] = id;

      const publicFile = join(fixturePath, 'public', ...assetPath.split('/').filter(Boolean));
      await mkdir(join(publicFile, '..'), { recursive: true });
      await writeFile(publicFile, sourceBuffer);
    }
  }

  const manifest = {
    schemaVersion: 1,
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

test('checked-in product media matches its manifest', async () => {
  assert.deepEqual(await validateProductMedia(root), []);
});

test('the pending final package contract is explicit and complete', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('content/product-media.json', root), 'utf8'),
  );

  assert.equal(manifest.artifactBinding, null);
  assert.equal(manifest.finalArtifactContract.requiredImageCount, 50);
  assert.deepEqual(manifest.finalArtifactContract.requiredLocales, ['pl-PL', 'en-US']);
  assert.equal(manifest.finalArtifactContract.semanticSlots.length, 8);
  assert.equal(new Set(manifest.finalArtifactContract.semanticSlots).size, 8);
  assert.ok(manifest.assets.every((asset) => typeof asset.altKey === 'string'));
  assert.equal(manifest.placementSelection.en, 'baseline');
  assert.equal(manifest.placementSelection.pl, 'baseline');
  assert.deepEqual(
    Object.keys(manifest.placementSets.baseline).sort(),
    ['assignee', 'bookings', 'delegatedTask', 'groupGallery', 'groups', 'modules', 'nearby', 'voiceInput'],
  );
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
        expected: 'en.voiceInput must use a phone capture that fits the website phone slots.',
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
