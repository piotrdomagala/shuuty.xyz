import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { basename, extname, isAbsolute, relative, resolve, sep, posix } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import sharp from 'sharp';
import {
  DERIVATIVE_ENCODER,
  DERIVATIVE_LIBVIPS,
  WEB_DERIVATIVES,
  derivativePath,
  derivativeSize,
  runtimeAsset,
} from './product-media-derivatives.mjs';

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
const previewSource = {
  repository: 'piotrdomagala/S-',
  commit: '20a14889e2397514b7c7bcd73269508f24c8004f',
  status: 'owner-attested-canonical-source-preview',
};
const previewPlacementSelection = {
  en: 'canonical-source-en',
  pl: 'canonical-source-pl',
};

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
  if (
    typeof value !== 'string' ||
    !value ||
    value.includes('\\') ||
    value.includes('\0') ||
    value.includes('://') ||
    value.includes('exports/final')
  ) {
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

function expectedDerivativePath(spec, sourcePath) {
  try {
    return derivativePath(spec, sourcePath || '');
  } catch {
    return null;
  }
}

function validateDerivativeMetadata(asset, spec, failures, paths) {
  const field = `${asset.id}.${spec.key}`;
  const web = asset[spec.key];
  if (!web || typeof web !== 'object' || Array.isArray(web)) {
    failures.push(`${field} must declare the deterministic website derivative.`);
    return;
  }

  if (!isSafePublicImagePath(web.path)) {
    failures.push(`${field}.path must be a canonical path below /images/ without traversal.`);
  } else if (paths.has(web.path)) {
    failures.push(`Duplicate product media path: ${web.path}`);
  }
  paths.add(web.path);

  if (web.path?.includes('exports/final')) {
    failures.push(`${field}.path must not reference a working exports/final directory.`);
  }
  if (web.mediaType !== 'image/webp' || extname(web.path || '') !== '.webp') {
    failures.push(`${field} must use image/webp with a .webp extension.`);
  }

  const expectedPath = extname(asset.path || '') ? expectedDerivativePath(spec, asset.path) : null;
  if (web.path !== expectedPath || web.path === asset.path) {
    failures.push(`${field}.path must preserve the source locale and filename stem.`);
  }

  const expected = derivativeSize(spec, asset.width, asset.height);
  if (web.width !== expected.width || web.height !== expected.height) {
    failures.push(
      `${field} must be the deterministic ${spec.sizeLabel} ${expected.width}x${expected.height} derivative.`,
    );
  }
  if (!/^[a-f0-9]{64}$/u.test(web.sha256 || '')) {
    failures.push(`${field}.sha256 must be a lowercase SHA-256 digest.`);
  }
  if (web.sourceSha256 !== asset.sha256) {
    failures.push(`${field}.sourceSha256 must match the canonical source SHA-256.`);
  }
  if (!Number.isInteger(web.byteLength) || web.byteLength < 1) {
    failures.push(`${field}.byteLength must be a positive integer.`);
  } else if (web.byteLength > spec.maxAssetBytes) {
    failures.push(`${field} exceeds the ${spec.maxAssetBytes}-byte asset budget.`);
  }
  if (web.encoder !== DERIVATIVE_ENCODER) {
    failures.push(`${field}.encoder must be ${DERIVATIVE_ENCODER}.`);
  }
  if (web.libvips !== DERIVATIVE_LIBVIPS) {
    failures.push(`${field}.libvips must be ${DERIVATIVE_LIBVIPS}.`);
  }
  if (!isDeepStrictEqual(web.parameters, { ...spec.parameters })) {
    failures.push(`${field}.parameters must match the deterministic encoder contract.`);
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

async function validateDerivativeFile(asset, spec, root, failures) {
  const field = `${asset.id}.${spec.key}`;
  const web = asset[spec.key];
  if (!web || !isSafePublicImagePath(web.path)) return;

  const repositoryRoot = fileURLToPath(root);
  const publicRoot = resolve(repositoryRoot, 'public');
  const imagesRoot = resolve(publicRoot, 'images');
  const filePath = resolve(publicRoot, `.${web.path}`);
  if (!isContainedPath(imagesRoot, filePath)) {
    failures.push(`${field} resolves outside public/images.`);
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
        failures.push(`${field} must not resolve through a symbolic link.`);
        return;
      }
    }

    const [realImagesRoot, realFilePath, fileStat] = await Promise.all([
      realpath(imagesRoot),
      realpath(filePath),
      lstat(filePath),
    ]);
    if (!isContainedPath(realImagesRoot, realFilePath)) {
      failures.push(`${field} resolves outside the real public/images directory.`);
      return;
    }
    if (!fileStat.isFile()) {
      failures.push(`${field} must resolve to a regular file.`);
      return;
    }
    buffer = await readFile(realFilePath);
  } catch {
    failures.push(`${field} is missing at public${web.path}.`);
    return;
  }

  const digest = createHash('sha256').update(buffer).digest('hex');
  if (digest !== web.sha256) {
    failures.push(`${field} SHA-256 is ${digest}; expected ${web.sha256}.`);
  }
  if (buffer.length !== web.byteLength) {
    failures.push(`${field} is ${buffer.length} bytes; expected ${web.byteLength}.`);
  }

  try {
    const metadata = await sharp(buffer, { failOn: 'error' }).metadata();
    if (metadata.format !== 'webp') {
      failures.push(`${field} magic bytes do not match image/webp.`);
    } else if (metadata.width !== web.width || metadata.height !== web.height) {
      failures.push(
        `${field} is ${metadata.width}x${metadata.height}; expected ${web.width}x${web.height}.`,
      );
    }
  } catch {
    failures.push(`${field} magic bytes do not match image/webp.`);
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
    assets: assets.map(runtimeAsset),
    placementSets: manifest.placementSets,
    placementSelection: manifest.placementSelection,
  };
  if (!isDeepStrictEqual(runtimeManifest, expectedRuntimeManifest)) {
    failures.push(
      'The runtime media manifest must exactly match the public rendering projection and contain no provenance fields.',
    );
  }
}

function validateLocaleBudget(assets, spec, failures) {
  const localeBytes = new Map();
  for (const asset of assets) {
    const locale = asset.locales?.[0];
    const byteLength = asset[spec.key]?.byteLength;
    if (locale && Number.isInteger(byteLength)) {
      localeBytes.set(locale, (localeBytes.get(locale) ?? 0) + byteLength);
    }
  }
  for (const [locale, byteLength] of localeBytes) {
    if (byteLength > spec.maxLocaleBytes) {
      failures.push(
        `${locale} ${spec.key} derivatives exceed the ${spec.maxLocaleBytes}-byte locale budget.`,
      );
    }
  }
}

async function validateAssets(assets, root, failures, altKeys) {
  const ids = new Set();
  const paths = new Set();
  for (const asset of assets) {
    validateAssetMetadata(asset, failures, ids, paths, altKeys);
    for (const spec of WEB_DERIVATIVES) {
      validateDerivativeMetadata(asset, spec, failures, paths);
    }
    await validateAssetFile(asset, root, failures);
    for (const spec of WEB_DERIVATIVES) {
      await validateDerivativeFile(asset, spec, root, failures);
    }
  }
  for (const spec of WEB_DERIVATIVES) {
    validateLocaleBudget(assets, spec, failures);
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

function validateImportedAssetEntryMetadata(asset, failures) {
  if (!isSafeArchiveEntry(asset.sourceArtifactEntry)) return;

  const locale = asset.locales?.[0];
  const entry = `/${asset.sourceArtifactEntry}`;
  if (locale && !entry.includes(`/${locale}/`)) {
    failures.push(`${asset.id}.sourceArtifactEntry must contain locale ${locale}.`);
  }
  if (asset.platform === 'ios') {
    if (!entry.includes(`/ios/${asset.device}/${locale}/`)) {
      failures.push(
        `${asset.id}.sourceArtifactEntry must match iOS device ${asset.device} and locale ${locale}.`,
      );
    }
  } else if (asset.platform === 'android' && !entry.includes(`/android/${locale}/`)) {
    failures.push(`${asset.id}.sourceArtifactEntry must match Android locale ${locale}.`);
  }
  if (asset.theme && !basename(asset.sourceArtifactEntry).includes(`-${asset.theme}-`)) {
    failures.push(`${asset.id}.sourceArtifactEntry must encode theme ${asset.theme}.`);
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
  } else if (!Object.values(placementLocales).includes(asset.locales[0])) {
    failures.push(`${asset.id} must use a supported website locale.`);
  } else if (!asset.path.includes(`/${asset.locales[0]}/`)) {
    failures.push(`${asset.id}.path must stay inside its ${asset.locales[0]} locale directory.`);
  }
}

function validateImportedAssets(assets, failures) {
  const sourceArtifactEntries = new Set();
  for (const asset of assets.filter((candidate) => candidate.semanticSlot)) {
    validateImportedAssetSourceEntry(asset, sourceArtifactEntries, failures);
    validateImportedAssetPlatform(asset, failures);
    validateImportedAssetEntryMetadata(asset, failures);
    validateImportedAssetPlacement(asset, failures);
    validateImportedAssetSourceHash(asset, failures);
    validateImportedAssetLocalization(asset, failures);
  }
}

function validateSelectedPlacementSet(setId, placementSet, locale, assetsById, failures) {
  const expectedFields = Object.keys(placementFieldToSlot).sort((left, right) =>
    left.localeCompare(right),
  );
  if (!isDeepStrictEqual(
    Object.keys(placementSet ?? {}).sort((left, right) => left.localeCompare(right)),
    expectedFields,
  )) {
    failures.push(`${setId} must contain exactly the eight ordered website placement fields.`);
  }
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
    if (asset.device === 'ipad-13' && field !== 'groupGallery') {
      failures.push(`${setId}.${field} must use a phone capture; only groupGallery supports iPad.`);
    }
  }
  if (!selectedThemes.has('light') || !selectedThemes.has('dark')) {
    failures.push(`${setId} must deliberately represent both Light and Dark product UI.`);
  }
  if (!selectedPlatforms.has('ios') || !selectedPlatforms.has('android')) {
    failures.push(`${setId} must deliberately represent both iOS and Android product UI.`);
  }
}

function validatePreviewSource(manifest, failures) {
  for (const [field, expected] of Object.entries(previewSource)) {
    if (manifest.source?.[field] !== expected) {
      failures.push(`Preview source.${field} must be ${expected}.`);
    }
  }
  if (typeof manifest.source?.note !== 'string' || !manifest.source.note) {
    failures.push('Preview source.note must explain the owner-attested, unbound boundary.');
  }
}

function validatePreviewAssetEntries(assets, failures) {
  for (const asset of assets) {
    if (!asset.sourceArtifactEntry?.startsWith('store-listing/assets/source/')) {
      failures.push(
        `${asset.id}.sourceArtifactEntry must stay below store-listing/assets/source/ for preview media.`,
      );
    }
    if (asset.sourceArtifactEntry?.includes('exports/final')) {
      failures.push(`${asset.id}.sourceArtifactEntry must not reference exports/final.`);
    }
  }
}

function validatePreviewPlacementSets(manifest, placementSets, failures) {
  if (!isDeepStrictEqual(manifest.placementSelection, previewPlacementSelection)) {
    failures.push('Preview placementSelection must use the explicit canonical EN and PL sets.');
  }
  if (!isDeepStrictEqual(
    Object.keys(placementSets).sort((left, right) => left.localeCompare(right)),
    Object.values(previewPlacementSelection).sort((left, right) => left.localeCompare(right)),
  )) {
    failures.push('Preview media must expose exactly one canonical placement set per locale.');
  }
}

function validatePreviewManifest(
  manifest,
  assets,
  contract,
  placementSets,
  assetsById,
  failures,
) {
  if (contract.status !== 'awaiting-approved-no-publish-package') {
    failures.push('An unbound manifest must await the approved no-publish package.');
  }
  if (assets.length !== Object.keys(placementLocales).length * semanticSlotPositions.size) {
    failures.push('Preview media must contain exactly 16 localized website assets.');
  }
  validatePreviewSource(manifest, failures);
  validateImportedSlotCoverage(assets, contract, failures);
  validateImportedAssets(assets, failures);
  validatePreviewAssetEntries(assets, failures);
  validatePreviewPlacementSets(manifest, placementSets, failures);
  validateBoundPlacementSelections(manifest, placementSets, assetsById, failures);
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
  if (manifest.source?.status !== 'approved-no-publish-package') {
    failures.push('A bound manifest source.status must be approved-no-publish-package.');
  }
  if (assets.length !== Object.keys(placementLocales).length * semanticSlotPositions.size) {
    failures.push('Bound website media must contain exactly 16 localized selections.');
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
  if (manifest.schemaVersion !== 2) {
    failures.push('Product media manifest schemaVersion must be 2.');
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
    validatePreviewManifest(
      manifest,
      assets,
      contract,
      placementSets,
      assetsById,
      failures,
    );
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
