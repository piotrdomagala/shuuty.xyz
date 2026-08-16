import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { basename, extname, isAbsolute, relative, resolve, sep, posix } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const defaultRoot = new URL('../', import.meta.url);
const placementFieldToSlot = {
  voiceInput: 'voice-input',
  assignee: 'assignee',
  delegatedTask: 'delegated-task',
  groups: 'groups',
  groupGallery: 'group-offer-gallery',
  modules: 'modules',
  bookings: 'bookings',
  nearby: 'nearby',
};
const semanticSlotPositions = new Map(
  Object.values(placementFieldToSlot).map((slot, index) => [slot, index + 1]),
);
const semanticSlotToAltKey = new Map(
  Object.entries(placementFieldToSlot).map(([altKey, slot]) => [slot, altKey]),
);
const placementLocales = { en: 'en-US', pl: 'pl-PL' };
const importedPlatforms = new Set(['ios', 'android']);
const importedDevices = new Set(['iphone-6.9', 'ipad-13', 'android-phone']);
const importedThemes = new Set(['light', 'dark']);

function isContainedPath(parent, candidate) {
  const relativePath = relative(parent, candidate);
  return (
    relativePath === '' ||
    (!relativePath.startsWith(`..${sep}`) && relativePath !== '..' && !isAbsolute(relativePath))
  );
}

function isSafePublicImagePath(value) {
  if (typeof value !== 'string' || !value.startsWith('/images/')) return false;
  if (!/^\/images\/[A-Za-z0-9._/-]+$/u.test(value) || value.includes('\\')) return false;

  const segments = value.split('/').slice(1);
  return !segments.some((segment) => !segment || segment === '.' || segment === '..');
}

function isSafeArchiveEntry(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0')) {
    return false;
  }
  if (value.startsWith('/') || /^[A-Za-z]:/u.test(value)) return false;

  const normalized = posix.normalize(value);
  const forbiddenSegments = new Set(['candidate', 'candidates', 'draft', 'drafts', 'temp', 'temporary', 'tmp']);
  return (
    normalized === value &&
    normalized !== '.' &&
    !normalized.startsWith('../') &&
    !value.split('/').some(
      (segment) =>
        !segment ||
        segment === '.' ||
        segment === '..' ||
        forbiddenSegments.has(segment.toLowerCase()),
    )
  );
}

function readJpegSize(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame = [
      0xc0,
      0xc1,
      0xc2,
      0xc3,
      0xc5,
      0xc6,
      0xc7,
      0xc9,
      0xca,
      0xcb,
      0xcd,
      0xce,
      0xcf,
    ].includes(marker);

    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    if (segmentLength < 2) return null;
    offset += segmentLength + 2;
  }

  return null;
}

function readPngSize(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function validateAssetMetadata(asset, failures, ids, paths, altKeys) {
  if (typeof asset.id !== 'string' || !asset.id) {
    failures.push('Every product media asset needs a non-empty id.');
  } else if (ids.has(asset.id)) {
    failures.push(`Duplicate product media id: ${asset.id}`);
  }
  ids.add(asset.id);

  if (typeof asset.altKey !== 'string' || !altKeys.has(asset.altKey)) {
    failures.push(`${asset.id || 'Unknown asset'} must reference a localized product-image alt key.`);
  }

  if (!isSafePublicImagePath(asset.path)) {
    failures.push(
      `${asset.id || 'Unknown asset'} must use a canonical path below /images/ without traversal.`,
    );
  } else if (paths.has(asset.path)) {
    failures.push(`Duplicate product media path: ${asset.path}`);
  }
  paths.add(asset.path);

  if (asset.path?.includes('exports/final')) {
    failures.push(`${asset.id} must not reference a working exports/final directory.`);
  }
  const expectedExtension = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
  }[asset.mediaType];
  if (!expectedExtension || extname(asset.path || '') !== expectedExtension) {
    failures.push(`${asset.id} must use an extension matching its declared media type.`);
  }
  if (!Number.isInteger(asset.width) || !Number.isInteger(asset.height)) {
    failures.push(`${asset.id} must declare integer dimensions.`);
  }
  if (!/^[a-f0-9]{64}$/u.test(asset.sha256 || '')) {
    failures.push(`${asset.id} must declare a lowercase SHA-256 digest.`);
  }
  if (!Array.isArray(asset.locales) || asset.locales.length === 0) {
    failures.push(`${asset.id} must declare its actual locale coverage.`);
  }
}

async function validateAssetFile(asset, root, failures) {
  if (!isSafePublicImagePath(asset.path)) return;

  const repositoryRoot = fileURLToPath(root);
  const publicRoot = resolve(repositoryRoot, 'public');
  const imagesRoot = resolve(publicRoot, 'images');
  const filePath = resolve(publicRoot, `.${asset.path}`);
  if (!isContainedPath(imagesRoot, filePath)) {
    failures.push(`${asset.id} resolves outside public/images.`);
    return;
  }

  let buffer;
  try {
    const pathSegments = relative(publicRoot, filePath).split(sep);
    let currentPath = publicRoot;
    for (const segment of pathSegments) {
      currentPath = resolve(currentPath, segment);
      const currentStat = await lstat(currentPath);
      if (currentStat.isSymbolicLink()) {
        failures.push(`${asset.id} must not resolve through a symbolic link.`);
        return;
      }
    }

    const [realImagesRoot, realFilePath, fileStat] = await Promise.all([
      realpath(imagesRoot),
      realpath(filePath),
      lstat(filePath),
    ]);
    if (!isContainedPath(realImagesRoot, realFilePath)) {
      failures.push(`${asset.id} resolves outside the real public/images directory.`);
      return;
    }
    if (!fileStat.isFile()) {
      failures.push(`${asset.id} must resolve to a regular file.`);
      return;
    }

    buffer = await readFile(realFilePath);
  } catch {
    failures.push(`${asset.id} is missing at public${asset.path}.`);
    return;
  }

  const digest = createHash('sha256').update(buffer).digest('hex');
  if (digest !== asset.sha256) {
    failures.push(`${asset.id} SHA-256 is ${digest}; expected ${asset.sha256}.`);
  }

  const size =
    asset.mediaType === 'image/png' ? readPngSize(buffer) : readJpegSize(buffer);
  if (!size) {
    failures.push(`${asset.id} magic bytes do not match ${asset.mediaType}.`);
  } else if (size.width !== asset.width || size.height !== asset.height) {
    failures.push(
      `${asset.id} is ${size.width}x${size.height}; expected ${asset.width}x${asset.height}.`,
    );
  }
}

function getLocalizedAltKeys(homeContent) {
  const englishAltKeys = new Set(Object.keys(homeContent.en?.images ?? {}));
  const polishAltKeys = new Set(Object.keys(homeContent.pl?.images ?? {}));
  return new Set([...englishAltKeys].filter((key) => polishAltKeys.has(key)));
}

function validateRuntimeManifest(manifest, runtimeManifest, assets, failures) {
  const expectedRuntimeManifest = {
    schemaVersion: manifest.schemaVersion,
    assets: assets.map(({ id, altKey, path, width, height }) => ({
      id,
      altKey,
      path,
      width,
      height,
    })),
    placementSets: manifest.placementSets,
    placementSelection: manifest.placementSelection,
  };
  if (!isDeepStrictEqual(runtimeManifest, expectedRuntimeManifest)) {
    failures.push(
      'The runtime media manifest must exactly match the public rendering projection and contain no provenance fields.',
    );
  }
}

async function validateAssets(assets, root, failures, altKeys) {
  const ids = new Set();
  const paths = new Set();
  for (const asset of assets) {
    validateAssetMetadata(asset, failures, ids, paths, altKeys);
    await validateAssetFile(asset, root, failures);
  }
  return ids;
}

function validatePlacementReferences(manifest, assets, ids, failures) {
  const placementSets = manifest.placementSets ?? {};
  for (const [setId, placementSet] of Object.entries(placementSets)) {
    for (const field of Object.keys(placementFieldToSlot)) {
      const id = placementSet?.[field];
      if (typeof id !== 'string' || !id) {
        failures.push(`Product media placement set ${setId} is missing ${field}.`);
      } else if (!ids.has(id)) {
        failures.push(`Product media placement set ${setId}.${field} references unknown id: ${id}`);
      }
    }
  }

  for (const language of Object.keys(placementLocales)) {
    const selectedSetId = manifest.placementSelection?.[language];
    if (typeof selectedSetId !== 'string' || !placementSets[selectedSetId]) {
      failures.push(`Product media placementSelection.${language} must reference a known set.`);
    }
  }

  return {
    assetsById: new Map(assets.map((asset) => [asset.id, asset])),
    placementSets,
  };
}

function validateFinalArtifactContract(manifest, failures) {
  const contract = manifest.finalArtifactContract ?? {};
  if (contract.requiredImageCount !== 50) {
    failures.push('The final artifact contract must require the complete 50-image package.');
  }
  if (JSON.stringify(contract.requiredLocales) !== JSON.stringify(['pl-PL', 'en-US'])) {
    failures.push('The final artifact contract must require PL and EN in that explicit order.');
  }
  if (!isDeepStrictEqual(contract.semanticSlots, [...semanticSlotPositions.keys()])) {
    failures.push('The final artifact contract semantic slots must exactly match the ordered website flow.');
  }
  return contract;
}

function validateArtifactBindingMetadata(binding, failures) {
  for (const field of ['artifactRunId', 'artifactHeadSha', 'sourceArtifactName']) {
    if (typeof binding[field] !== 'string' || !binding[field]) {
      failures.push(`artifactBinding.${field} is required.`);
    }
  }
  if (!/^[a-f0-9]{40}$/u.test(binding.artifactHeadSha || '')) {
    failures.push('artifactBinding.artifactHeadSha must be a lowercase 40-character commit SHA.');
  }
  if (!/^\d+$/u.test(binding.artifactRunId || '')) {
    failures.push('artifactBinding.artifactRunId must be a numeric workflow run ID.');
  }

  if (typeof binding.sourceArtifactName === 'string') {
    const expectedArtifactName = `shuuty-store-listing-package-${binding.artifactHeadSha}.zip`;
    const hasExpectedName =
      basename(binding.sourceArtifactName) === binding.sourceArtifactName &&
      extname(binding.sourceArtifactName).toLowerCase() === '.zip' &&
      binding.sourceArtifactName === expectedArtifactName;
    if (!hasExpectedName) {
      failures.push(
        `artifactBinding.sourceArtifactName must be ${expectedArtifactName}, never a draft or local path.`,
      );
    }
  }

  for (const field of ['packageSha256', 'ledgerSha256', 'qaSha256']) {
    if (!/^[a-f0-9]{64}$/u.test(binding[field] || '')) {
      failures.push(`artifactBinding.${field} must be a lowercase SHA-256 digest.`);
    }
  }
}

function validateImportedSlotCoverage(assets, contract, failures) {
  for (const semanticSlot of contract.semanticSlots ?? []) {
    for (const locale of contract.requiredLocales ?? []) {
      const matches = assets.filter(
        (asset) => asset.semanticSlot === semanticSlot && asset.locales?.includes(locale),
      );
      if (matches.length !== 1) {
        failures.push(
          `Imported media must contain exactly one ${semanticSlot} asset for ${locale}.`,
        );
      }
    }
  }
}

function validateImportedAssetSourceEntry(asset, sourceArtifactEntries, failures) {
  for (const field of ['sourceArtifactEntry', 'platform', 'device', 'theme']) {
    if (typeof asset[field] !== 'string' || !asset[field]) {
      failures.push(`${asset.id}.${field} is required for imported product media.`);
    }
  }

  if (!isSafeArchiveEntry(asset.sourceArtifactEntry)) {
    failures.push(`${asset.id}.sourceArtifactEntry must be a canonical relative archive entry.`);
  } else if (sourceArtifactEntries.has(asset.sourceArtifactEntry)) {
    failures.push(`${asset.id}.sourceArtifactEntry must be unique across imported product media.`);
  } else {
    sourceArtifactEntries.add(asset.sourceArtifactEntry);
  }
}

function validateImportedAssetSourceHash(asset, failures) {
  if (!/^[a-f0-9]{64}$/u.test(asset.sourceSha256 || '')) {
    failures.push(`${asset.id}.sourceSha256 must be a lowercase SHA-256 digest.`);
  } else if (asset.sourceSha256 !== asset.sha256) {
    failures.push(
      `${asset.id}.sourceSha256 must equal sha256 for a byte-for-byte approved import.`,
    );
  }
}

function validateImportedAssetPlatform(asset, failures) {
  if (!importedPlatforms.has(asset.platform)) {
    failures.push(`${asset.id}.platform must be ios or android.`);
  }
  if (!importedDevices.has(asset.device)) {
    failures.push(`${asset.id}.device must be iphone-6.9, ipad-13 or android-phone.`);
  }
  const incompatibleDevice =
    (asset.platform === 'ios' && asset.device === 'android-phone') ||
    (asset.platform === 'android' && asset.device !== 'android-phone');
  if (incompatibleDevice) {
    failures.push(`${asset.id}.device is incompatible with platform ${asset.platform}.`);
  }
}

function validateImportedAssetPlacement(asset, failures) {
  if (!Number.isInteger(asset.storePosition) || asset.storePosition < 1 || asset.storePosition > 8) {
    failures.push(`${asset.id}.storePosition must be an integer from 1 through 8.`);
  }
  const expectedStorePosition = semanticSlotPositions.get(asset.semanticSlot);
  if (expectedStorePosition && asset.storePosition !== expectedStorePosition) {
    failures.push(
      `${asset.id}.storePosition must be ${expectedStorePosition} for ${asset.semanticSlot}.`,
    );
  }
  if (!importedThemes.has(asset.theme)) {
    failures.push(`${asset.id}.theme must be light or dark.`);
  }
}

function validateImportedAssetLocalization(asset, failures) {
  const expectedAltKey = semanticSlotToAltKey.get(asset.semanticSlot);
  if (expectedAltKey && asset.altKey !== expectedAltKey) {
    failures.push(`${asset.id}.altKey must be ${expectedAltKey} for ${asset.semanticSlot}.`);
  }
  if (asset.locales?.length !== 1) {
    failures.push(`${asset.id} must bind to exactly one locale after final import.`);
  }
}

function validateImportedAssets(assets, failures) {
  const sourceArtifactEntries = new Set();
  for (const asset of assets.filter((candidate) => candidate.semanticSlot)) {
    validateImportedAssetSourceEntry(asset, sourceArtifactEntries, failures);
    validateImportedAssetPlatform(asset, failures);
    validateImportedAssetPlacement(asset, failures);
    validateImportedAssetSourceHash(asset, failures);
    validateImportedAssetLocalization(asset, failures);
  }
}

function validateSelectedPlacementSet(setId, placementSet, locale, assetsById, failures) {
  const selectedThemes = new Set();
  const selectedPlatforms = new Set();
  for (const [field, semanticSlot] of Object.entries(placementFieldToSlot)) {
    const asset = assetsById.get(placementSet[field]);
    if (!asset) continue;
    selectedThemes.add(asset.theme);
    selectedPlatforms.add(asset.platform);
    if (asset.semanticSlot !== semanticSlot) {
      failures.push(
        `${setId}.${field} must use semantic slot ${semanticSlot}; received ${asset.semanticSlot || 'none'}.`,
      );
    }
    if (asset.locales?.length !== 1 || asset.locales[0] !== locale) {
      failures.push(`${setId}.${field} must use exactly locale ${locale}.`);
    }
    if (asset.device === 'ipad-13') {
      failures.push(`${setId}.${field} must use a phone capture that fits the website phone slots.`);
    }
  }
  if (!selectedThemes.has('light') || !selectedThemes.has('dark')) {
    failures.push(`${setId} must deliberately represent both Light and Dark product UI.`);
  }
  if (!selectedPlatforms.has('ios') || !selectedPlatforms.has('android')) {
    failures.push(`${setId} must deliberately represent both iOS and Android product UI.`);
  }
}

function validateBoundPlacementSelections(
  manifest,
  placementSets,
  assetsById,
  failures,
) {
  if (manifest.placementSelection?.en === manifest.placementSelection?.pl) {
    failures.push('Approved product media must use locale-specific EN and PL placement sets.');
  }
  for (const [language, locale] of Object.entries(placementLocales)) {
    const setId = manifest.placementSelection?.[language];
    const placementSet = placementSets[setId];
    if (placementSet) {
      validateSelectedPlacementSet(setId, placementSet, locale, assetsById, failures);
    }
  }
}

function validateBoundManifest(
  manifest,
  assets,
  contract,
  placementSets,
  assetsById,
  failures,
) {
  if (contract.status !== 'approved-no-publish-imported') {
    failures.push('A bound manifest must use approved-no-publish-imported status.');
  }
  validateArtifactBindingMetadata(manifest.artifactBinding ?? {}, failures);
  validateImportedSlotCoverage(assets, contract, failures);
  validateImportedAssets(assets, failures);
  validateBoundPlacementSelections(manifest, placementSets, assetsById, failures);
}

export async function validateProductMedia(root = defaultRoot) {
  const [manifest, runtimeManifest, homeContent] = await Promise.all([
    readFile(new URL('content/product-media.json', root), 'utf8').then(JSON.parse),
    readFile(new URL('content/product-media.runtime.json', root), 'utf8').then(JSON.parse),
    readFile(new URL('app/homeContent.json', root), 'utf8').then(JSON.parse),
  ]);
  const failures = [];
  if (manifest.schemaVersion !== 1) {
    failures.push('Product media manifest schemaVersion must be 1.');
  }

  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  validateRuntimeManifest(manifest, runtimeManifest, assets, failures);
  const ids = await validateAssets(assets, root, failures, getLocalizedAltKeys(homeContent));
  const { assetsById, placementSets } = validatePlacementReferences(
    manifest,
    assets,
    ids,
    failures,
  );
  const contract = validateFinalArtifactContract(manifest, failures);

  if (manifest.artifactBinding === null) {
    if (contract.status !== 'awaiting-approved-no-publish-package') {
      failures.push('An unbound manifest must await the approved no-publish package.');
    }
  } else {
    validateBoundManifest(
      manifest,
      assets,
      contract,
      placementSets,
      assetsById,
      failures,
    );
  }
  return failures;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const failures = await validateProductMedia();
  if (failures.length > 0) {
    console.error(`Product media validation failed:\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
  } else {
    console.log('Product media manifest, hashes, formats and artifact boundary passed.');
  }
}
