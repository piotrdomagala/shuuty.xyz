import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const listingRoot = path.join(root, 'store-listing');
const requiredLocales = ['pl-PL', 'en-US'];
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
  appStoreIpad13: [2064, 2752, 4],
  googlePlayPhone: [1080, 1920, 8],
  googlePlayTablet: [1920, 1080, 4],
};

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
