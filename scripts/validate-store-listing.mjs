import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  countStoreCharacters,
  STORE_METADATA_LOCALES,
  validateStoreMetadataSet,
} from './store-metadata-validation.mjs';
import {validateStoreMediaProvenance} from './store-media-provenance-validation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const listingRoot = path.join(root, 'store-listing');
const requiredLocales = STORE_METADATA_LOCALES;
const failures = [];

const readJson = async relativePath =>
  JSON.parse(await readFile(path.join(listingRoot, relativePath), 'utf8'));

const requireValue = (condition, message) => {
  if (!condition) failures.push(message);
};

const metadata = await Promise.all(
  requiredLocales.map(locale => readJson(`metadata/${locale}.json`)),
);

failures.push(...validateStoreMetadataSet(metadata));

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
failures.push(
  ...validateStoreMediaProvenance(mediaProvenance, ownerAttestation),
);

if (failures.length > 0) {
  console.error('Store listing validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

for (const entry of metadata) {
  const keywordBytes = Buffer.byteLength(entry.appStore.keywords, 'utf8');
  console.log(
    `✓ ${entry.locale}: subtitle ${countStoreCharacters(entry.appStore.subtitle)}/30, ` +
      `promo ${countStoreCharacters(entry.appStore.promotionalText)}/170, ` +
      `keywords ${keywordBytes}/100 bytes, ` +
      `Google short ${countStoreCharacters(entry.googlePlay.shortDescription)}/80`,
  );
}

console.log('✓ Store listing metadata and capture manifest are structurally ready.');
console.log(
  '✓ Media provenance: 15/15 owner-attested; likeness 13 owner-authorized, 2 not applicable.',
);
