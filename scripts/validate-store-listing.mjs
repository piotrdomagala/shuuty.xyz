import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const listingRoot = path.join(root, 'store-listing');
const requiredLocales = ['pl-PL', 'en-US'];
const requiredMediaFiles = [
  'avatar-alex.webp',
  'avatar-maja.webp',
  'avatar-mia.webp',
  'avatar-nina.webp',
  'avatar-noah.webp',
  'avatar-olek.webp',
  'cover-brand-portraits.webp',
  'cover-ceramics.webp',
  'cover-studio.webp',
  'cover-walk-london.webp',
  'cover-walk.webp',
  'gallery-brand-portrait.webp',
  'gallery-brand-studio.webp',
  'gallery-ceramics-collection.webp',
  'gallery-ceramics-glazing.webp',
];
const failures = [];

const readJson = async relativePath =>
  JSON.parse(await readFile(path.join(listingRoot, relativePath), 'utf8'));

const countCharacters = value => Array.from(value).length;

const requireValue = (condition, message) => {
  if (!condition) failures.push(message);
};

const requireMaximum = (value, maximum, field) => {
  const length = countCharacters(value);
  requireValue(length <= maximum, `${field} is ${length}/${maximum} characters`);
};

const metadata = await Promise.all(
  requiredLocales.map(locale => readJson(`metadata/${locale}.json`)),
);

for (const entry of metadata) {
  const { locale, appStore, googlePlay } = entry;
  requireValue(requiredLocales.includes(locale), `Unexpected locale ${locale}`);
  requireMaximum(appStore.name, 30, `${locale} App Store name`);
  requireMaximum(appStore.subtitle, 30, `${locale} App Store subtitle`);
  requireMaximum(
    appStore.promotionalText,
    170,
    `${locale} App Store promotional text`,
  );
  requireValue(
    Buffer.byteLength(appStore.keywords, 'utf8') <= 100,
    `${locale} App Store keywords exceed 100 UTF-8 bytes`,
  );
  requireMaximum(appStore.description, 4000, `${locale} App Store description`);
  requireMaximum(appStore.whatsNew, 4000, `${locale} App Store What's New`);

  for (const [field, expected] of Object.entries({
    marketingUrl: 'https://shuuty.com/',
    supportUrl: 'https://shuuty.com/support/',
    privacyPolicyUrl: 'https://shuuty.com/privacy/',
    termsOfUseUrl: 'https://shuuty.com/terms/',
  })) {
    requireValue(
      appStore[field] === expected,
      `${locale} App Store ${field} must be ${expected}`,
    );
  }

  requireMaximum(googlePlay.appName, 30, `${locale} Google Play app name`);
  requireMaximum(
    googlePlay.shortDescription,
    80,
    `${locale} Google Play short description`,
  );
  requireMaximum(
    googlePlay.fullDescription,
    4000,
    `${locale} Google Play full description`,
  );
  requireMaximum(
    googlePlay.releaseNotes,
    500,
    `${locale} Google Play release notes`,
  );
}

const captureManifest = await readJson('capture-manifest.json');
requireValue(
  JSON.stringify(captureManifest.locales) === JSON.stringify(requiredLocales),
  'Capture manifest locales must be pl-PL and en-US',
);
requireValue(
  captureManifest.screenshots.length === 8,
  'The phone narrative must contain exactly eight screenshots',
);

const expectedSets = {
  appStoreIphone69: [1320, 2868, 8],
  googlePlayPhone: [1080, 1920, 8],
};

requireValue(
  JSON.stringify(Object.keys(captureManifest.deviceSets).sort()) ===
    JSON.stringify(Object.keys(expectedSets).sort()),
  'Capture manifest must declare only the supported phone delivery sets',
);

for (const [name, [width, height, count]] of Object.entries(expectedSets)) {
  const set = captureManifest.deviceSets[name];
  requireValue(Boolean(set), `Missing ${name} device set`);
  if (!set) continue;
  requireValue(
    set.width === width && set.height === height,
    `${name} must be ${width}x${height}`,
  );
  requireValue(
    set.requiredCaptures === count,
    `${name} must request ${count} captures`,
  );
}

for (const screenshot of captureManifest.screenshots) {
  for (const locale of requiredLocales) {
    requireValue(
      Boolean(screenshot.headline?.[locale]),
      `${screenshot.id} is missing a ${locale} headline`,
    );
  }
}

const mediaProvenance = await readJson('provenance/media-assets.json');
const ownerAttestation = await readFile(
  path.join(listingRoot, 'provenance/owner-attestation.md'),
  'utf8',
);
const mediaAssets = mediaProvenance.assets ?? [];
const attestationId = 'shuuty-media-owner-attestation-2026-08-05';
const expectedScopes = [
  'apple-app-store',
  'google-play',
  'shuuty.xyz',
  'shuuty.com',
  'shuuty-promotional-materials',
];

requireValue(
  mediaProvenance.schemaVersion === 1,
  'Media provenance schemaVersion must be 1',
);
requireValue(
  mediaProvenance.status === 'owner-attested',
  'Media provenance must retain owner-attested status',
);
requireValue(
  mediaProvenance.statementDate === '2026-08-05',
  'Media provenance statement date must be 2026-08-05',
);
requireValue(
  mediaProvenance.attestation?.recordId === attestationId,
  `Media provenance must reference ${attestationId}`,
);
requireValue(
  mediaProvenance.attestation?.copyrightStatus === 'owner-attested',
  'Media copyright status must be owner-attested',
);
requireValue(
  mediaProvenance.attestation?.underlyingAcquisitionDocumentation ===
    'not-recorded',
  'Media provenance must keep underlying acquisition documentation neutral',
);
requireValue(
  JSON.stringify(mediaProvenance.attestation?.authorizedScopes) ===
    JSON.stringify(expectedScopes),
  'Media provenance must include the approved store, website, and promotional scopes',
);
requireValue(
  mediaProvenance.source?.assetCount === 15 && mediaAssets.length === 15,
  'Media provenance must contain exactly 15 source assets',
);

const assetIds = new Set();
const fileNames = new Set();
for (const asset of mediaAssets) {
  requireValue(
    typeof asset.id === 'string' && !assetIds.has(asset.id),
    `Media asset has a missing or duplicate id: ${asset.id ?? 'missing'}`,
  );
  assetIds.add(asset.id);
  requireValue(
    typeof asset.fileName === 'string' && !fileNames.has(asset.fileName),
    `Media asset has a missing or duplicate fileName: ${asset.fileName ?? 'missing'}`,
  );
  fileNames.add(asset.fileName);
  requireValue(
    asset.relativePath === `backend/scripts/assets/store-demo/${asset.fileName}`,
    `${asset.id} has an unexpected source path`,
  );
  requireValue(asset.format === 'webp', `${asset.id} must be recorded as WebP`);
  requireValue(
    Number.isInteger(asset.width) &&
      asset.width > 0 &&
      Number.isInteger(asset.height) && asset.height > 0,
    `${asset.id} must record positive integer dimensions`,
  );
  requireValue(
    Number.isInteger(asset.bytes) && asset.bytes > 0,
    `${asset.id} must record a positive byte length`,
  );
  requireValue(
    /^[a-f0-9]{64}$/.test(asset.sha256),
    `${asset.id} must record a lowercase SHA-256 digest`,
  );
  requireValue(
    asset.rightsRecordId === attestationId &&
      asset.copyrightStatus === 'owner-attested',
    `${asset.id} must reference the owner attestation`,
  );
  requireValue(
    Array.isArray(asset.locales) &&
      asset.locales.length > 0 &&
      asset.locales.every(locale => requiredLocales.includes(locale)),
    `${asset.id} has unsupported locale coverage`,
  );
  const likeness = asset.likeness ?? {};
  if (likeness.personPresence === 'none') {
    requireValue(
      likeness.recognizableFace === false &&
        likeness.releaseStatus === 'not-applicable',
      `${asset.id} must use not-applicable when no person is visible`,
    );
  } else if (likeness.personPresence === 'visible') {
    requireValue(
      typeof likeness.recognizableFace === 'boolean' &&
        likeness.releaseStatus === 'to-be-confirmed',
      `${asset.id} must keep likeness status to-be-confirmed until documented otherwise`,
    );
  } else {
    requireValue(false, `${asset.id} has an unsupported person-presence status`);
  }
}

requireValue(
  JSON.stringify([...fileNames].sort()) ===
    JSON.stringify([...requiredMediaFiles].sort()),
  'Media provenance filenames must match the complete 15-file store-demo set',
);
requireValue(
  mediaAssets.filter(
    asset => asset.likeness.releaseStatus === 'to-be-confirmed',
  ).length === 13,
  'Exactly 13 media assets must retain to-be-confirmed likeness status',
);
requireValue(
  mediaAssets.filter(
    asset => asset.likeness.releaseStatus === 'not-applicable',
  ).length === 2,
  'Exactly two media assets must use not-applicable likeness status',
);
for (const requiredText of [
  attestationId,
  '2026-08-05',
  'Apple App Store',
  'Google Play',
  'shuuty.xyz',
  'shuuty.com',
  'to-be-confirmed',
]) {
  requireValue(
    ownerAttestation.includes(requiredText),
    `Owner attestation is missing required text: ${requiredText}`,
  );
}

if (failures.length > 0) {
  console.error('Store listing validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

for (const entry of metadata) {
  const keywordBytes = Buffer.byteLength(entry.appStore.keywords, 'utf8');
  console.log(
    `✓ ${entry.locale}: subtitle ${countCharacters(entry.appStore.subtitle)}/30, ` +
      `promo ${countCharacters(entry.appStore.promotionalText)}/170, ` +
      `keywords ${keywordBytes}/100 bytes, ` +
      `Google short ${countCharacters(entry.googlePlay.shortDescription)}/80`,
  );
}

console.log('✓ Store listing metadata and capture manifest are structurally ready.');
console.log(
  '✓ Media provenance: 15/15 owner-attested; likeness 13 pending, 2 not applicable.',
);
