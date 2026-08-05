import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import pngjs from "pngjs";
import {
  STORE_METADATA_LOCALES,
  validateStoreMetadataSet,
} from "./store-metadata-validation.mjs";

const { PNG } = pngjs;

const REQUIRED_LOCALES = [...STORE_METADATA_LOCALES].sort(compareText);
const PACKAGE_MANIFEST_ENTRY = "PACKAGE-MANIFEST.json";
const DEFAULT_ARCHIVE =
  "store-listing/exports/Shuuty-Store-Listing-2026-final-candidates.zip";
const FIXED_DOS_TIME = 0;
const FIXED_DOS_DATE = 33; // 1980-01-01 - the earliest date supported by ZIP.
const ZIP_UTF8_FLAG = 0x0800;
const ZIP_STORE_METHOD = 0;
const FRESHNESS_TOLERANCE_MS = 2_000;
const MAX_STORE_PNG_PIXELS = 10_000_000;

const WORKSPACE_PATHS = {
  captureManifest: "store-listing/capture-manifest.json",
  renderManifest: "store-listing/studio/render-manifest.json",
  deliveryLedger: "store-listing/delivery-ledger.json",
  googlePlayArtifactEvidence: "store-listing/provenance/google-play-artifact-evidence.md",
  mediaProvenance: "store-listing/provenance/media-assets.json",
  ownerAttestation: "store-listing/provenance/owner-attestation.md",
  finalRoot: "store-listing/exports/final",
  metadataRoot: "store-listing/metadata",
  consoleChangeSetTemplate: "store-listing/console-change-set-template.md",
  uploadChecklist: "store-listing/upload-checklist.md",
  template: "store-listing/studio/template.mjs",
  stylesheet: "store-listing/studio/studio.css",
};

const ICON_TARGETS = {
  appStoreIcon: "store-listing/exports/final/app-store/icon",
  googlePlayIcon: "store-listing/exports/final/google-play/icon",
};

const EMBEDDED_RENDER_INPUTS = new Map([
  [WORKSPACE_PATHS.captureManifest, "provenance/capture-manifest.json"],
  [WORKSPACE_PATHS.renderManifest, "provenance/render-manifest.json"],
]);

const REQUIRED_PHONE_SETS = [
  {
    captureKey: "appStoreIphone69",
    platform: "app-store",
    deviceSlot: "iphone-6.9",
  },
  {
    captureKey: "googlePlayPhone",
    platform: "google-play",
    deviceSlot: "phone",
  },
];

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let value = 0; value < table.length; value += 1) {
    let crc = value;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) === 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[value] = crc >>> 0;
  }
  return table;
})();

function fail(message) {
  throw new Error(message);
}

function assertValidStoreMetadata(entries) {
  const failures = validateStoreMetadataSet(entries);
  if (failures.length > 0) {
    fail(`Store metadata validation failed:\n- ${failures.join("\n- ")}`);
  }
}

function assertMetadataLocale(metadata, expectedLocale, label) {
  const declaredLocale = metadata?.locale;
  if (declaredLocale !== expectedLocale) {
    fail(
      `${label} declares locale ${typeof declaredLocale === "string" ? declaredLocale : "<missing>"}; expected ${expectedLocale}.`,
    );
  }
}

function slash(value) {
  return value.replaceAll("\\", "/");
}

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function assertSafeRelativePath(value, label = "path") {
  if (typeof value !== "string" || value.length === 0) {
    fail(`${label} must be a non-empty relative path.`);
  }
  const normalized = slash(value);
  if (
    path.posix.isAbsolute(normalized) ||
    normalized.startsWith("../") ||
    normalized.includes("/../") ||
    normalized === ".." ||
    normalized.includes("\0")
  ) {
    fail(`${label} is unsafe: ${value}`);
  }
  return normalized;
}

function resolveRepoPath(rootDir, relativePath, label = "path") {
  const safePath = assertSafeRelativePath(relativePath, label);
  return path.join(rootDir, ...safePath.split("/"));
}

function assertArchiveOutsideManagedFinalRoot(rootDir, archivePath) {
  const finalRoot = resolveRepoPath(rootDir, WORKSPACE_PATHS.finalRoot, "final export root");
  const relative = path.relative(finalRoot, path.resolve(archivePath));
  const isInsideFinalRoot =
    relative === "" ||
    (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
  if (isInsideFinalRoot) {
    fail(
      `Store package archive must be written outside the managed final export directory: ${archivePath}.`,
    );
  }
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function readRequiredFile(rootDir, relativePath, label = relativePath) {
  const absolutePath = resolveRepoPath(rootDir, relativePath, label);
  const info = await lstat(absolutePath).catch(() => null);
  if (!info?.isFile()) {
    fail(`Missing required ${label}: ${slash(relativePath)}`);
  }
  if (info.isSymbolicLink()) {
    fail(`${label} must not be a symbolic link: ${slash(relativePath)}`);
  }
  return {
    absolutePath,
    data: await readFile(absolutePath),
    info,
  };
}

async function readRequiredJson(rootDir, relativePath, label = relativePath) {
  const file = await readRequiredFile(rootDir, relativePath, label);
  try {
    return {
      ...file,
      value: JSON.parse(file.data.toString("utf8")),
    };
  } catch (error) {
    fail(`Invalid JSON in ${label}: ${error.message}`);
  }
}

function assertExactLocales(locales, label) {
  if (!Array.isArray(locales)) {
    fail(`${label} must declare the PL and EN locales.`);
  }
  const actual = [...new Set(locales)].sort(compareText);
  const expected = [...REQUIRED_LOCALES].sort(compareText);
  if (
    actual.length !== expected.length ||
    actual.some((locale, index) => locale !== expected[index])
  ) {
    fail(`${label} must contain exactly en-US and pl-PL.`);
  }
}

function inspectPng(data, label) {
  const signature = "89504e470d0a1a0a";
  if (data.length < 29 || data.subarray(0, 8).toString("hex") !== signature) {
    fail(`${label} is not a valid PNG header.`);
  }
  if (data.readUInt32BE(8) !== 13 || data.subarray(12, 16).toString("ascii") !== "IHDR") {
    fail(`${label} has no valid PNG IHDR chunk.`);
  }
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    bitDepth: data[24],
    colorType: data[25],
  };
}

function assertPngGeometry(data, expected, label) {
  const png = inspectPng(data, label);
  const expectedWidth = expected.width ?? expected.expectedWidth;
  const expectedHeight = expected.height ?? expected.expectedHeight;
  if (
    !Number.isInteger(expectedWidth) ||
    !Number.isInteger(expectedHeight) ||
    expectedWidth <= 0 ||
    expectedHeight <= 0 ||
    expectedWidth * expectedHeight > MAX_STORE_PNG_PIXELS ||
    png.width !== expectedWidth ||
    png.height !== expectedHeight
  ) {
    fail(
      `${label} has ${png.width}x${png.height}; expected ${expectedWidth}x${expectedHeight}.`,
    );
  }
  return png;
}

function assertPngContract(data, expected, label) {
  const png = assertPngGeometry(data, expected, label);
  if (expected.bitDepth !== 8) {
    fail(`${label} must declare an 8-bit PNG contract.`);
  }
  if (png.bitDepth !== expected.bitDepth) {
    fail(
      `${label} has PNG bit depth ${png.bitDepth}; expected ${expected.bitDepth}.`,
    );
  }
  if (typeof expected.alpha !== "boolean") {
    fail(`${label} must declare a boolean alpha contract.`);
  }
  const expectedColorType = expected.alpha ? 6 : 2;
  if (png.colorType !== expectedColorType) {
    fail(
      `${label} has PNG color type ${png.colorType}; expected color type ${expectedColorType} for alpha: ${expected.alpha}.`,
    );
  }
  if (expected.alpha === true && expected.opaque !== true) {
    fail(`${label} with an alpha channel must declare opaque: true.`);
  }
  if (expected.opaque === true) {
    let decoded;
    try {
      decoded = PNG.sync.read(data, { checkCRC: true });
    } catch (error) {
      fail(`${label} could not be decoded for opacity validation: ${error.message}`);
    }
    for (let offset = 3; offset < decoded.data.length; offset += 4) {
      if (decoded.data[offset] !== 255) {
        const pixel = (offset - 3) / 4;
        fail(
          `${label} is not fully opaque at pixel ${pixel % decoded.width},${Math.floor(pixel / decoded.width)}.`,
        );
      }
    }
  }
  return png;
}

function assertOpaqueRgbPng(data, expected, label) {
  const png = assertPngGeometry(data, expected, label);
  if (png.bitDepth !== 8) {
    fail(`${label} has PNG bit depth ${png.bitDepth}; expected 8.`);
  }
  if (png.colorType !== 2) {
    fail(
      `${label} has PNG color type ${png.colorType}; expected RGB color type 2 with no alpha.`,
    );
  }
  return png;
}

function assertDecodedPng(data, png, label) {
  let decoded;
  try {
    decoded = PNG.sync.read(data, { checkCRC: true });
  } catch (error) {
    fail(`${label} could not be decoded as a complete PNG: ${error.message}`);
  }
  if (decoded.width !== png.width || decoded.height !== png.height) {
    fail(`${label} decoded geometry does not match its PNG header.`);
  }
  return png;
}

function assertDecodedOpaqueRgbPng(data, expected, label) {
  const png = assertOpaqueRgbPng(data, expected, label);
  return assertDecodedPng(data, png, label);
}

function expectedAssetSources(asset) {
  if (asset.source?.path) {
    return [asset.source];
  }
  if (Array.isArray(asset.sources) && asset.sources.length > 0) {
    return asset.sources;
  }
  fail(`Final asset ${asset.id} has no declared source.`);
}

function validateFinalAsset(asset, ids, outputs) {
  if (!asset.id || ids.has(asset.id)) {
    fail(`Final render asset id is missing or duplicated: ${asset.id ?? "missing"}.`);
  }
  ids.add(asset.id);
  if (!["phone", "feature"].includes(asset.kind)) {
    fail(`Final asset ${asset.id} has unsupported kind ${asset.kind ?? "missing"}.`);
  }
  if (!["app-store", "google-play"].includes(asset.platform)) {
    fail(`Final asset ${asset.id} has unsupported platform ${asset.platform ?? "missing"}.`);
  }
  if (
    asset.kind === "phone" &&
    !REQUIRED_PHONE_SETS.some(
      (phoneSet) =>
        phoneSet.platform === asset.platform && phoneSet.deviceSlot === asset.deviceSlot,
    )
  ) {
    fail(
      `Final phone asset ${asset.id} has unsupported platform/device slot ${asset.platform}/${asset.deviceSlot ?? "missing"}.`,
    );
  }
  if (!REQUIRED_LOCALES.includes(asset.locale)) {
    fail(`Final asset ${asset.id} has unsupported locale ${asset.locale ?? "missing"}.`);
  }
  if (!asset.finalOutput) {
    fail(`Final asset ${asset.id} has no finalOutput.`);
  }
  const output = assertSafeRelativePath(asset.finalOutput, `${asset.id} finalOutput`);
  if (
    !output.startsWith(`${WORKSPACE_PATHS.finalRoot}/`) ||
    !output.toLowerCase().endsWith(".png") ||
    /draft/i.test(output)
  ) {
    fail(`Final asset ${asset.id} has an unsafe final output: ${output}`);
  }
  if (outputs.has(output)) {
    fail(`Final output is duplicated in the render manifest: ${output}`);
  }
  outputs.add(output);
  if (!Number.isInteger(asset.width) || !Number.isInteger(asset.height)) {
    fail(`Final asset ${asset.id} must declare integer width and height.`);
  }
  expectedAssetSources(asset);
}

function validatePhoneNarrativeAsset(asset, index, narrative, requiredCaptures) {
  const expectedIndex = index + 1;
  if (
    asset.stage?.index !== expectedIndex ||
    asset.stage?.total !== requiredCaptures ||
    asset.screenshotId !== narrative[index]
  ) {
    fail(
      `${asset.id} does not match narrative slot ${expectedIndex} (${narrative[index]}).`,
    );
  }
}

function validateLocalizedPhoneSet(finalAssets, phoneSet, locale, device, narrative) {
  const assets = finalAssets
    .filter(
      (asset) =>
        asset.kind === "phone" &&
        asset.platform === phoneSet.platform &&
        asset.deviceSlot === phoneSet.deviceSlot &&
        asset.locale === locale,
    )
    .sort((left, right) => left.stage?.index - right.stage?.index);
  if (assets.length !== device.requiredCaptures) {
    fail(
      `${phoneSet.platform}/${locale}/${phoneSet.deviceSlot} requires ${device.requiredCaptures} final screenshots; found ${assets.length}.`,
    );
  }
  assets.forEach((asset, index) => {
    if (asset.width !== device.width || asset.height !== device.height) {
      fail(
        `${asset.id} canvas is ${asset.width}x${asset.height}; ${phoneSet.captureKey} requires ${device.width}x${device.height}.`,
      );
    }
    validatePhoneNarrativeAsset(asset, index, narrative, device.requiredCaptures);
  });
}

function validateRequiredPhoneSet(captureManifest, finalAssets, narrative, phoneSet) {
  const device = captureManifest.deviceSets?.[phoneSet.captureKey];
  if (!device || !Number.isInteger(device.requiredCaptures)) {
    fail(`Capture manifest is missing device set ${phoneSet.captureKey}.`);
  }
  if (
    !Number.isInteger(device.width) ||
    !Number.isInteger(device.height) ||
    device.width <= 0 ||
    device.height <= 0 ||
    device.width * device.height > MAX_STORE_PNG_PIXELS
  ) {
    fail(`Capture manifest device set ${phoneSet.captureKey} has unsafe dimensions.`);
  }
  if (device.requiredCaptures !== narrative.length) {
    fail(
      `${phoneSet.captureKey} requires ${device.requiredCaptures} captures, but the narrative has ${narrative.length}.`,
    );
  }
  assertExactLocales(device.locales, `${phoneSet.captureKey} locales`);
  for (const locale of REQUIRED_LOCALES) {
    validateLocalizedPhoneSet(finalAssets, phoneSet, locale, device, narrative);
  }
}

function validateLocalizedFeature(features, locale, featureOutputs, featureContract) {
  const matches = features.filter((asset) => asset.locale === locale);
  if (matches.length !== 1) {
    fail(`Google Play requires exactly one ${locale} final feature graphic.`);
  }
  if (matches[0].finalOutput !== featureOutputs[locale]) {
    fail(
      `Google Play ${locale} feature output disagrees between capture and render manifests.`,
    );
  }
  if (
    matches[0].width !== featureContract.width ||
    matches[0].height !== featureContract.height
  ) {
    fail(`Google Play ${locale} feature geometry disagrees with the capture manifest.`);
  }
}

function validateFeatureAssets(captureManifest, finalAssets) {
  const unsupportedFeatures = finalAssets.filter(
    (asset) => asset.kind === "feature" && asset.platform !== "google-play",
  );
  if (unsupportedFeatures.length > 0) {
    fail(
      `Final feature assets contain unsupported store surfaces: ${unsupportedFeatures
        .map((asset) => `${asset.platform}/${asset.id}`)
        .join(", ")}.`,
    );
  }
  const features = finalAssets.filter(
    (asset) => asset.kind === "feature" && asset.platform === "google-play",
  );
  if (features.length !== REQUIRED_LOCALES.length) {
    fail(`Google Play requires two localized final feature graphics; found ${features.length}.`);
  }
  const featureContract = captureManifest.storeAssets?.googlePlayFeatureGraphic;
  const featureOutputs = featureContract?.outputs;
  if (featureContract?.localization !== "per-locale" || !featureOutputs) {
    fail("Google Play feature graphic must be configured as per-locale.");
  }
  for (const locale of REQUIRED_LOCALES) {
    validateLocalizedFeature(features, locale, featureOutputs, featureContract);
  }
}

function validateRenderAssets(captureManifest, renderManifest) {
  if (!Array.isArray(renderManifest.assets)) {
    fail("Render manifest must contain an assets array.");
  }
  if (renderManifest.status !== "final-ready") {
    fail(`Render manifest status must be final-ready, found ${renderManifest.status ?? "missing"}.`);
  }
  if (renderManifest.copySource !== WORKSPACE_PATHS.captureManifest) {
    fail(
      `Render manifest copySource must be ${WORKSPACE_PATHS.captureManifest}; found ${renderManifest.copySource ?? "missing"}.`,
    );
  }

  const finalAssets = renderManifest.assets.filter((asset) => asset.status === "final-ready");
  const ids = new Set();
  const outputs = new Set();
  for (const asset of finalAssets) {
    validateFinalAsset(asset, ids, outputs);
  }

  const narrative = captureManifest.coveragePlan?.primaryPhoneNarrative;
  if (!Array.isArray(narrative) || narrative.length === 0) {
    fail("Capture manifest is missing the primary phone narrative.");
  }
  for (const phoneSet of REQUIRED_PHONE_SETS) {
    validateRequiredPhoneSet(captureManifest, finalAssets, narrative, phoneSet);
  }
  validateFeatureAssets(captureManifest, finalAssets);
  return finalAssets;
}

async function listFilesRecursively(rootDir, relativeDirectory) {
  const absoluteDirectory = resolveRepoPath(rootDir, relativeDirectory, "directory");
  const directoryInfo = await lstat(absoluteDirectory).catch(() => null);
  if (!directoryInfo?.isDirectory()) {
    fail(`Missing required directory: ${relativeDirectory}`);
  }
  const files = [];
  async function walk(absolutePath, relativePath) {
    const entries = await readdir(absolutePath, { withFileTypes: true });
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const childAbsolute = path.join(absolutePath, entry.name);
      const childRelative = slash(path.posix.join(relativePath, entry.name));
      if (entry.isSymbolicLink()) {
        fail(`Symbolic links are not allowed in final store exports: ${childRelative}`);
      }
      if (entry.isDirectory()) {
        await walk(childAbsolute, childRelative);
      } else if (entry.isFile()) {
        files.push(childRelative);
      } else {
        fail(`Unsupported filesystem entry in final store exports: ${childRelative}`);
      }
    }
  }
  await walk(absoluteDirectory, assertSafeRelativePath(relativeDirectory));
  return files.sort(compareText);
}

function iconOutputPath(key, icon) {
  const targetDirectory = ICON_TARGETS[key];
  if (!targetDirectory) {
    fail(`No final export target is configured for ${key}.`);
  }
  return slash(path.posix.join(targetDirectory, path.posix.basename(slash(icon.source))));
}

async function validateIcons(rootDir, captureManifest) {
  const results = [];
  for (const key of Object.keys(ICON_TARGETS)) {
    const icon = captureManifest.storeAssets?.[key];
    if (!icon?.source || icon.status !== "final-ready") {
      fail(`${key} must declare a final-ready source.`);
    }
    const source = await readRequiredFile(rootDir, icon.source, `${key} source`);
    assertPngContract(source.data, icon, `${key} source`);
    if (icon.maxBytes && source.data.length > icon.maxBytes) {
      fail(`${key} exceeds its ${icon.maxBytes}-byte limit.`);
    }

    const output = iconOutputPath(key, icon);
    const exported = await readRequiredFile(rootDir, output, `${key} final export`);
    assertPngContract(exported.data, icon, `${key} final export`);
    if (!source.data.equals(exported.data)) {
      fail(`${key} final export does not exactly match its approved source.`);
    }
    results.push({ key, output, data: exported.data });
  }
  return results;
}

function compareSets(actualValues, expectedValues, label) {
  const actual = [...new Set(actualValues)].sort(compareText);
  const expected = [...new Set(expectedValues)].sort(compareText);
  const missing = expected.filter((value) => !actual.includes(value));
  const unexpected = actual.filter((value) => !expected.includes(value));
  if (missing.length > 0 || unexpected.length > 0) {
    const details = [
      missing.length > 0 ? `missing: ${missing.join(", ")}` : null,
      unexpected.length > 0 ? `unexpected: ${unexpected.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("; ");
    fail(`${label} does not match the release manifest (${details}).`);
  }
}

function validateLedgerHeader(ledger, renderManifest) {
  if (ledger.latestRenderMode !== "final") {
    fail("Delivery ledger latestRenderMode must be final.");
  }
  if (ledger.campaign !== renderManifest.campaign) {
    fail("Delivery ledger campaign does not match the render manifest.");
  }
  if (ledger.manifest !== WORKSPACE_PATHS.renderManifest) {
    fail("Delivery ledger points at an unexpected render manifest.");
  }
  if (!Array.isArray(ledger.assets)) {
    fail("Delivery ledger must contain an assets array.");
  }
  if (ledger.status !== "final-candidates-require-publication-approval") {
    fail("Delivery ledger status must contain final candidates only.");
  }

  const nonFinalEntries = ledger.assets.filter(
    (entry) => entry.renderMode !== "final" || entry.status !== "final-candidate",
  );
  if (nonFinalEntries.length > 0) {
    fail(
      `Delivery ledger contains non-final entries: ${nonFinalEntries
        .map((entry) => `${String(entry.id)} (${String(entry.renderMode ?? "draft")})`)
        .join(", ")}.`,
    );
  }
}

async function validateLedgerAsset(rootDir, asset, finalEntries, outputByPath) {
  const entry = finalEntries.find((candidate) => candidate.id === asset.id);
  const output = outputByPath.get(asset.finalOutput);
  if (!entry || !output) {
    fail(`Delivery ledger is incomplete for ${asset.id}.`);
  }
  if (entry.pngColorType !== 2 || entry.alpha !== false) {
    fail(
      `Delivery ledger PNG contract mismatch for ${asset.id}; expected pngColorType 2 and alpha false.`,
    );
  }
  if (
    entry.status !== "final-candidate" ||
    entry.sourceGap ||
    entry.output !== asset.finalOutput ||
    entry.sha256 !== sha256(output.data) ||
    entry.bytes !== output.data.length ||
    entry.width !== asset.width ||
    entry.height !== asset.height
  ) {
    fail(`Delivery ledger hash or metadata mismatch for ${asset.id}.`);
  }

  const expectedSources = expectedAssetSources(asset);
  const ledgerSources = Array.isArray(entry.sources) ? entry.sources : [];
  compareSets(
    ledgerSources.map((source) => source.path),
    expectedSources.map((source) => source.path),
    `${asset.id} ledger sources`,
  );
  for (const source of expectedSources) {
    const sourceFile = await readRequiredFile(rootDir, source.path, `${asset.id} source`);
    assertPngGeometry(sourceFile.data, source, `${asset.id} source`);
    const ledgerSource = ledgerSources.find((candidate) => candidate.path === source.path);
    if (ledgerSource?.sha256 !== sha256(sourceFile.data)) {
      fail(`Delivery ledger source hash mismatch for ${asset.id}: ${source.path}.`);
    }
  }
}

async function validateLedger(rootDir, renderManifest, finalAssets, outputFiles) {
  const ledgerFile = await readRequiredJson(
    rootDir,
    WORKSPACE_PATHS.deliveryLedger,
    "delivery ledger",
  );
  const ledger = ledgerFile.value;
  validateLedgerHeader(ledger, renderManifest);

  const manifestIds = new Set(renderManifest.assets.map((asset) => asset.id));
  const unknownLedgerIds = [...new Set(ledger.assets.map((entry) => entry.id))].filter(
    (id) => !manifestIds.has(id),
  );
  if (unknownLedgerIds.length > 0) {
    fail(`Delivery ledger contains unexpected asset ids: ${unknownLedgerIds.join(", ")}.`);
  }

  const finalEntries = ledger.assets.filter((entry) => entry.renderMode === "final");
  compareSets(
    finalEntries.map((entry) => entry.id),
    finalAssets.map((asset) => asset.id),
    "Final delivery ledger entries",
  );
  if (new Set(finalEntries.map((entry) => entry.id)).size !== finalEntries.length) {
    fail("Delivery ledger contains duplicate final asset entries.");
  }

  const outputByPath = new Map(outputFiles.map((file) => [file.path, file]));
  for (const asset of finalAssets) {
    await validateLedgerAsset(rootDir, asset, finalEntries, outputByPath);
  }

  return ledgerFile;
}

async function validateFreshness(rootDir, captureFile, renderFile, ledgerFile, finalAssets) {
  const generatedAtMs = Date.parse(ledgerFile.value.generatedAt);
  if (!Number.isFinite(generatedAtMs)) {
    fail("Delivery ledger generatedAt is missing or invalid.");
  }

  const globalInputs = [
    WORKSPACE_PATHS.captureManifest,
    WORKSPACE_PATHS.renderManifest,
    WORKSPACE_PATHS.template,
    WORKSPACE_PATHS.stylesheet,
    renderFile.value.brandMark?.path,
    ...(renderFile.value.fonts ?? []).map((font) => font.path),
  ].filter(Boolean);

  for (const asset of finalAssets) {
    const inputPaths = [
      ...globalInputs,
      ...expectedAssetSources(asset).map((source) => source.path),
      asset.relayArtwork?.path,
    ].filter(Boolean);
    let newestInput = { path: null, mtimeMs: 0 };
    for (const inputPath of new Set(inputPaths)) {
      const input = await readRequiredFile(rootDir, inputPath, `${asset.id} render input`);
      if (input.info.mtimeMs > newestInput.mtimeMs) {
        newestInput = { path: inputPath, mtimeMs: input.info.mtimeMs };
      }
    }
    const outputInfo = await stat(resolveRepoPath(rootDir, asset.finalOutput));
    if (outputInfo.mtimeMs + FRESHNESS_TOLERANCE_MS < newestInput.mtimeMs) {
      fail(
        `Stale final asset ${asset.id}: ${asset.finalOutput} is older than ${newestInput.path}. Re-render final assets.`,
      );
    }
    if (generatedAtMs + FRESHNESS_TOLERANCE_MS < newestInput.mtimeMs) {
      fail(
        `Stale delivery ledger for ${asset.id}: it predates ${newestInput.path}. Re-render final assets.`,
      );
    }
  }

  // Keep these references live so callers cannot accidentally validate different parsed files.
  if (!captureFile.value || !renderFile.value) {
    fail("Freshness validation requires parsed capture and render manifests.");
  }
}

function assetRole(asset) {
  if (asset.kind === "feature") return "feature-graphic";
  if (asset.kind === "phone") return "screenshot";
  return "store-asset";
}

function archiveAssetPath(repoPath) {
  const prefix = `${WORKSPACE_PATHS.finalRoot}/`;
  if (!repoPath.startsWith(prefix)) {
    fail(`Final asset is outside the expected export root: ${repoPath}`);
  }
  return `assets/${repoPath.slice(prefix.length)}`;
}

async function payloadFromRepoFile(rootDir, repoPath, archivePath, role) {
  const file = await readRequiredFile(rootDir, repoPath, role);
  return {
    archivePath: assertSafeRelativePath(archivePath, "archive path"),
    repoPath: assertSafeRelativePath(repoPath, "repository path"),
    role,
    data: file.data,
    sha256: sha256(file.data),
    bytes: file.data.length,
  };
}

function collectRenderInputPaths(captureManifest, renderManifest, finalAssets) {
  return [
    WORKSPACE_PATHS.captureManifest,
    WORKSPACE_PATHS.renderManifest,
    WORKSPACE_PATHS.template,
    WORKSPACE_PATHS.stylesheet,
    renderManifest.brandMark?.path,
    ...(renderManifest.fonts ?? []).map((font) => font.path),
    ...Object.keys(ICON_TARGETS).map((key) => captureManifest.storeAssets?.[key]?.source),
    ...finalAssets.flatMap((asset) => [
      ...expectedAssetSources(asset).map((source) => source.path),
      asset.relayArtwork?.path,
    ]),
  ].filter(Boolean);
}

async function collectRenderInputHashes(rootDir, captureManifest, renderManifest, finalAssets) {
  const paths = collectRenderInputPaths(captureManifest, renderManifest, finalAssets);
  const hashes = [];
  for (const repoPath of [...new Set(paths)].sort(compareText)) {
    const file = await readRequiredFile(rootDir, repoPath, "render input");
    hashes.push({ path: repoPath, sha256: sha256(file.data), bytes: file.data.length });
  }
  return hashes;
}

export async function collectPackageInputs({
  rootDir = process.cwd(),
  checkFreshness = true,
} = {}) {
  const absoluteRoot = path.resolve(rootDir);
  const captureFile = await readRequiredJson(
    absoluteRoot,
    WORKSPACE_PATHS.captureManifest,
    "capture manifest",
  );
  const renderFile = await readRequiredJson(
    absoluteRoot,
    WORKSPACE_PATHS.renderManifest,
    "render manifest",
  );
  const captureManifest = captureFile.value;
  const renderManifest = renderFile.value;
  assertExactLocales(captureManifest.locales, "Capture manifest locales");

  const finalAssets = validateRenderAssets(captureManifest, renderManifest);
  const outputFiles = [];
  for (const asset of finalAssets) {
    const output = await readRequiredFile(absoluteRoot, asset.finalOutput, `${asset.id} final output`);
    assertOpaqueRgbPng(output.data, asset, `${asset.id} final output`);
    outputFiles.push({ path: asset.finalOutput, data: output.data, asset });
  }

  const icons = await validateIcons(absoluteRoot, captureManifest);
  const expectedFinalPaths = [
    ...outputFiles.map((file) => file.path),
    ...icons.map((icon) => icon.output),
  ];
  const actualFinalPaths = await listFilesRecursively(absoluteRoot, WORKSPACE_PATHS.finalRoot);
  compareSets(actualFinalPaths, expectedFinalPaths, "Final export directory");

  const ledgerFile = await validateLedger(
    absoluteRoot,
    renderManifest,
    finalAssets,
    outputFiles,
  );
  if (checkFreshness) {
    await validateFreshness(
      absoluteRoot,
      captureFile,
      renderFile,
      ledgerFile,
      finalAssets,
    );
  }

  const payloads = [];
  for (const file of outputFiles) {
    payloads.push({
      archivePath: archiveAssetPath(file.path),
      repoPath: file.path,
      role: assetRole(file.asset),
      data: file.data,
      sha256: sha256(file.data),
      bytes: file.data.length,
    });
  }
  for (const icon of icons) {
    payloads.push({
      archivePath: archiveAssetPath(icon.output),
      repoPath: icon.output,
      role: "icon",
      data: icon.data,
      sha256: sha256(icon.data),
      bytes: icon.data.length,
    });
  }
  const metadataEntries = [];
  for (const locale of REQUIRED_LOCALES) {
    const repoPath = `${WORKSPACE_PATHS.metadataRoot}/${locale}.json`;
    const metadata = await readRequiredJson(absoluteRoot, repoPath, `${locale} metadata`);
    assertMetadataLocale(metadata.value, locale, `${locale} metadata`);
    metadataEntries.push(metadata.value);
    payloads.push({
      archivePath: `metadata/${locale}.json`,
      repoPath,
      role: "metadata",
      data: metadata.data,
      sha256: sha256(metadata.data),
      bytes: metadata.data.length,
    });
  }
  assertValidStoreMetadata(metadataEntries);
  payloads.push(
    await payloadFromRepoFile(
      absoluteRoot,
      WORKSPACE_PATHS.consoleChangeSetTemplate,
      "release/console-change-set-template.md",
      "console-change-set-template",
    ),
    await payloadFromRepoFile(
      absoluteRoot,
      WORKSPACE_PATHS.uploadChecklist,
      "release/upload-checklist.md",
      "upload-checklist",
    ),
    await payloadFromRepoFile(
      absoluteRoot,
      WORKSPACE_PATHS.captureManifest,
      "provenance/capture-manifest.json",
      "capture-manifest",
    ),
    await payloadFromRepoFile(
      absoluteRoot,
      WORKSPACE_PATHS.renderManifest,
      "provenance/render-manifest.json",
      "render-manifest",
    ),
    await payloadFromRepoFile(
      absoluteRoot,
      WORKSPACE_PATHS.deliveryLedger,
      "provenance/delivery-ledger.json",
      "delivery-ledger",
    ),
    await payloadFromRepoFile(
      absoluteRoot,
      WORKSPACE_PATHS.googlePlayArtifactEvidence,
      "provenance/google-play-artifact-evidence.md",
      "google-play-artifact-evidence",
    ),
    await payloadFromRepoFile(
      absoluteRoot,
      WORKSPACE_PATHS.mediaProvenance,
      "provenance/media-assets.json",
      "media-provenance",
    ),
    await payloadFromRepoFile(
      absoluteRoot,
      WORKSPACE_PATHS.ownerAttestation,
      "provenance/owner-attestation.md",
      "owner-attestation",
    ),
  );

  payloads.sort((left, right) => compareText(left.archivePath, right.archivePath));
  compareSets(
    payloads.map((payload) => payload.archivePath),
    [...new Set(payloads.map((payload) => payload.archivePath))],
    "Archive payload paths",
  );
  if (new Set(payloads.map((payload) => payload.archivePath)).size !== payloads.length) {
    fail("Archive payload contains duplicate paths.");
  }

  const packageManifest = {
    schemaVersion: 1,
    package: "Shuuty Store Listing 2026",
    campaign: captureManifest.campaign,
    renderCampaign: renderManifest.campaign,
    locales: [...REQUIRED_LOCALES],
    archive: {
      format: "ZIP",
      compression: "store",
      timestamp: "1980-01-01T00:00:00Z",
    },
    files: payloads.map(({ archivePath, role, sha256: digest, bytes }) => ({
      path: archivePath,
      role,
      sha256: digest,
      bytes,
    })),
    renderInputs: await collectRenderInputHashes(
      absoluteRoot,
      captureManifest,
      renderManifest,
      finalAssets,
    ),
  };
  const packageManifestData = Buffer.from(`${JSON.stringify(packageManifest, null, 2)}\n`, "utf8");

  return {
    rootDir: absoluteRoot,
    payloads,
    packageManifest,
    packageManifestData,
  };
}

function assertZipSize(value, label) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    fail(`${label} exceeds the ZIP32 limit.`);
  }
}

export function createDeterministicZip(entries) {
  const sortedEntries = [...entries]
    .map((entry) => ({
      path: assertSafeRelativePath(entry.path, "ZIP entry path"),
      data: Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data),
    }))
    .sort((left, right) => compareText(left.path, right.path));
  if (new Set(sortedEntries.map((entry) => entry.path)).size !== sortedEntries.length) {
    fail("ZIP entry paths must be unique.");
  }
  if (sortedEntries.length > 0xffff) {
    fail("ZIP archive contains too many entries for ZIP32.");
  }

  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of sortedEntries) {
    const name = Buffer.from(entry.path, "utf8");
    const size = entry.data.length;
    const checksum = crc32(entry.data);
    assertZipSize(size, `${entry.path} size`);
    assertZipSize(offset, `${entry.path} offset`);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(ZIP_UTF8_FLAG, 6);
    localHeader.writeUInt16LE(ZIP_STORE_METHOD, 8);
    localHeader.writeUInt16LE(FIXED_DOS_TIME, 10);
    localHeader.writeUInt16LE(FIXED_DOS_DATE, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(size, 18);
    localHeader.writeUInt32LE(size, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, entry.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(0x0314, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(ZIP_UTF8_FLAG, 8);
    centralHeader.writeUInt16LE(ZIP_STORE_METHOD, 10);
    centralHeader.writeUInt16LE(FIXED_DOS_TIME, 12);
    centralHeader.writeUInt16LE(FIXED_DOS_DATE, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(size, 20);
    centralHeader.writeUInt32LE(size, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + entry.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  assertZipSize(offset, "central directory offset");
  assertZipSize(centralDirectory.length, "central directory size");
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(sortedEntries.length, 8);
  end.writeUInt16LE(sortedEntries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

function findEndOfCentralDirectory(archive) {
  const minimumOffset = Math.max(0, archive.length - 65_557);
  for (let offset = archive.length - 22; offset >= minimumOffset; offset -= 1) {
    if (archive.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  fail("ZIP end-of-central-directory record is missing.");
}

function readZipLayout(data) {
  if (data.length < 22) fail("ZIP archive is truncated.");
  const endOffset = findEndOfCentralDirectory(data);
  const diskNumber = data.readUInt16LE(endOffset + 4);
  const centralDisk = data.readUInt16LE(endOffset + 6);
  const entriesOnDisk = data.readUInt16LE(endOffset + 8);
  const entryCount = data.readUInt16LE(endOffset + 10);
  const centralSize = data.readUInt32LE(endOffset + 12);
  const centralOffset = data.readUInt32LE(endOffset + 16);
  const commentLength = data.readUInt16LE(endOffset + 20);
  if (
    diskNumber !== 0 ||
    centralDisk !== 0 ||
    entriesOnDisk !== entryCount ||
    commentLength !== 0 ||
    endOffset + 22 !== data.length ||
    centralOffset + centralSize !== endOffset
  ) {
    fail("ZIP archive does not use the deterministic single-disk layout.");
  }
  return { centralOffset, endOffset, entryCount };
}

function readCentralDirectoryEntry(data, centralCursor, endOffset, expectedLocalOffset) {
  if (centralCursor + 46 > endOffset || data.readUInt32LE(centralCursor) !== 0x02014b50) {
    fail("ZIP central directory is corrupt.");
  }
  const flags = data.readUInt16LE(centralCursor + 8);
  const method = data.readUInt16LE(centralCursor + 10);
  const time = data.readUInt16LE(centralCursor + 12);
  const date = data.readUInt16LE(centralCursor + 14);
  const checksum = data.readUInt32LE(centralCursor + 16);
  const compressedSize = data.readUInt32LE(centralCursor + 20);
  const uncompressedSize = data.readUInt32LE(centralCursor + 24);
  const nameLength = data.readUInt16LE(centralCursor + 28);
  const extraLength = data.readUInt16LE(centralCursor + 30);
  const fileCommentLength = data.readUInt16LE(centralCursor + 32);
  const localOffset = data.readUInt32LE(centralCursor + 42);
  const nameStart = centralCursor + 46;
  const nameEnd = nameStart + nameLength;
  if (nameEnd + extraLength + fileCommentLength > endOffset) {
    fail("ZIP central directory entry is truncated.");
  }
  const entryPath = assertSafeRelativePath(
    data.subarray(nameStart, nameEnd).toString("utf8"),
    "ZIP entry path",
  );
  if (
    flags !== ZIP_UTF8_FLAG ||
    method !== ZIP_STORE_METHOD ||
    time !== FIXED_DOS_TIME ||
    date !== FIXED_DOS_DATE ||
    compressedSize !== uncompressedSize ||
    extraLength !== 0 ||
    fileCommentLength !== 0 ||
    localOffset !== expectedLocalOffset
  ) {
    fail(`ZIP entry ${entryPath} is not encoded deterministically.`);
  }
  return {
    checksum,
    compressedSize,
    date,
    entryPath,
    flags,
    localOffset,
    method,
    nextCentralCursor: nameEnd + extraLength + fileCommentLength,
    time,
    uncompressedSize,
  };
}

function readLocalZipEntry(data, centralEntry, centralOffset) {
  const {
    checksum,
    compressedSize,
    date,
    entryPath,
    flags,
    localOffset,
    method,
    time,
    uncompressedSize,
  } = centralEntry;
  if (data.readUInt32LE(localOffset) !== 0x04034b50) {
    fail(`ZIP local header is missing for ${entryPath}.`);
  }
  const localFlags = data.readUInt16LE(localOffset + 6);
  const localMethod = data.readUInt16LE(localOffset + 8);
  const localTime = data.readUInt16LE(localOffset + 10);
  const localDate = data.readUInt16LE(localOffset + 12);
  const localChecksum = data.readUInt32LE(localOffset + 14);
  const localCompressedSize = data.readUInt32LE(localOffset + 18);
  const localUncompressedSize = data.readUInt32LE(localOffset + 22);
  const localNameLength = data.readUInt16LE(localOffset + 26);
  const localExtraLength = data.readUInt16LE(localOffset + 28);
  const localNameStart = localOffset + 30;
  const localNameEnd = localNameStart + localNameLength;
  const localName = data.subarray(localNameStart, localNameEnd).toString("utf8");
  const payloadStart = localNameEnd + localExtraLength;
  const payloadEnd = payloadStart + compressedSize;
  if (
    localFlags !== flags ||
    localMethod !== method ||
    localTime !== time ||
    localDate !== date ||
    localChecksum !== checksum ||
    localCompressedSize !== compressedSize ||
    localUncompressedSize !== uncompressedSize ||
    localExtraLength !== 0 ||
    localName !== entryPath ||
    payloadEnd > centralOffset
  ) {
    fail(`ZIP local entry is corrupt for ${entryPath}.`);
  }
  const payload = data.subarray(payloadStart, payloadEnd);
  if (crc32(payload) !== checksum) {
    fail(`ZIP CRC mismatch for ${entryPath}.`);
  }
  return {
    entry: { path: entryPath, data: Buffer.from(payload) },
    nextLocalOffset: payloadEnd,
  };
}

function validateZipEntryOrder(entries) {
  const paths = entries.map((entry) => entry.path);
  if (
    new Set(paths).size !== paths.length ||
    [...paths].sort(compareText).some((value, index) => value !== paths[index])
  ) {
    fail("ZIP entries must be unique and sorted.");
  }
}

export function readDeterministicZip(archive) {
  const data = Buffer.isBuffer(archive) ? archive : Buffer.from(archive);
  const { centralOffset, endOffset, entryCount } = readZipLayout(data);
  const entries = [];
  let centralCursor = centralOffset;
  let expectedLocalOffset = 0;
  for (let index = 0; index < entryCount; index += 1) {
    const centralEntry = readCentralDirectoryEntry(
      data,
      centralCursor,
      endOffset,
      expectedLocalOffset,
    );
    const localEntry = readLocalZipEntry(data, centralEntry, centralOffset);
    entries.push(localEntry.entry);
    expectedLocalOffset = localEntry.nextLocalOffset;
    centralCursor = centralEntry.nextCentralCursor;
  }
  if (centralCursor !== endOffset || expectedLocalOffset !== centralOffset) {
    fail("ZIP archive contains unindexed data or a malformed central directory.");
  }
  validateZipEntryOrder(entries);
  return entries;
}

function validateEmbeddedStoreMetadata(byPath) {
  const expectedPaths = REQUIRED_LOCALES.map((locale) => `metadata/${locale}.json`);
  const actualPaths = [...byPath.keys()].filter((entryPath) => entryPath.startsWith("metadata/"));
  compareSets(actualPaths, expectedPaths, "Embedded store metadata");

  const metadataEntries = [];
  for (const locale of REQUIRED_LOCALES) {
    const entryPath = `metadata/${locale}.json`;
    let metadata;
    try {
      metadata = JSON.parse(byPath.get(entryPath).data.toString("utf8"));
    } catch (error) {
      fail(`Invalid embedded ${locale} metadata: ${error.message}`);
    }
    assertMetadataLocale(metadata, locale, `Embedded ${entryPath}`);
    metadataEntries.push(metadata);
  }
  assertValidStoreMetadata(metadataEntries);
}

function readEmbeddedJson(byPath, entryPath, label) {
  const entry = byPath.get(entryPath);
  if (!entry) fail(`ZIP archive is missing ${entryPath}.`);
  try {
    return JSON.parse(entry.data.toString("utf8"));
  } catch (error) {
    fail(`Invalid embedded ${label}: ${error.message}`);
  }
}

function validateEmbeddedRenderInputs(
  manifest,
  byPath,
  captureManifest,
  renderManifest,
  finalAssets,
) {
  if (!Array.isArray(manifest.renderInputs)) {
    fail("Embedded package manifest must contain a renderInputs array.");
  }

  const renderInputsByPath = new Map();
  for (const input of manifest.renderInputs) {
    const inputPath = assertSafeRelativePath(input?.path, "embedded render input path");
    if (
      renderInputsByPath.has(inputPath) ||
      !Number.isSafeInteger(input.bytes) ||
      input.bytes < 0 ||
      !/^[a-f0-9]{64}$/.test(input.sha256 ?? "")
    ) {
      fail(`Embedded render input metadata is invalid or duplicated for ${inputPath}.`);
    }
    renderInputsByPath.set(inputPath, input);
  }

  compareSets(
    [...renderInputsByPath.keys()],
    collectRenderInputPaths(captureManifest, renderManifest, finalAssets),
    "Embedded render inputs",
  );

  for (const [repoPath, archivePath] of EMBEDDED_RENDER_INPUTS) {
    const input = renderInputsByPath.get(repoPath);
    const entry = byPath.get(archivePath);
    if (
      !input ||
      !entry ||
      input.bytes !== entry.data.length ||
      input.sha256 !== sha256(entry.data)
    ) {
      fail(`Embedded render input hash or metadata mismatch for ${repoPath}.`);
    }
  }
  return renderInputsByPath;
}

function validateEmbeddedLedgerAsset(asset, outputEntry, ledgerEntry, renderInputsByPath) {
  assertDecodedOpaqueRgbPng(outputEntry.data, asset, `Embedded asset ${asset.id}`);
  if (
    ledgerEntry?.status !== "final-candidate" ||
    ledgerEntry.renderMode !== "final" ||
    ledgerEntry.sourceGap ||
    ledgerEntry.output !== asset.finalOutput ||
    ledgerEntry.sha256 !== sha256(outputEntry.data) ||
    ledgerEntry.bytes !== outputEntry.data.length ||
    ledgerEntry.width !== asset.width ||
    ledgerEntry.height !== asset.height ||
    ledgerEntry.bitDepth !== 8 ||
    ledgerEntry.pngColorType !== 2 ||
    ledgerEntry.alpha !== false
  ) {
    fail(`Embedded delivery ledger hash or metadata mismatch for ${asset.id}.`);
  }

  const expectedSources = expectedAssetSources(asset);
  const ledgerSources = Array.isArray(ledgerEntry.sources) ? ledgerEntry.sources : [];
  compareSets(
    ledgerSources.map((source) => source.path),
    expectedSources.map((source) => source.path),
    `${asset.id} embedded ledger sources`,
  );
  if (new Set(ledgerSources.map((source) => source.path)).size !== ledgerSources.length) {
    fail(`Embedded delivery ledger contains duplicate sources for ${asset.id}.`);
  }
  for (const source of expectedSources) {
    const ledgerSource = ledgerSources.find((candidate) => candidate.path === source.path);
    const renderInput = renderInputsByPath.get(source.path);
    const expectedWidth = source.expectedWidth ?? source.width;
    const expectedHeight = source.expectedHeight ?? source.height;
    if (
      !ledgerSource ||
      !renderInput ||
      ledgerSource.sha256 !== renderInput.sha256 ||
      ledgerSource.width !== expectedWidth ||
      ledgerSource.height !== expectedHeight
    ) {
      fail(`Embedded delivery ledger source metadata mismatch for ${asset.id}: ${source.path}.`);
    }
  }
}

function validateEmbeddedLedger(renderManifest, ledger, finalAssets) {
  validateLedgerHeader(ledger, renderManifest);
  const manifestIds = new Set(renderManifest.assets.map((asset) => asset.id));
  const unknownLedgerIds = [...new Set(ledger.assets.map((entry) => entry.id))].filter(
    (id) => !manifestIds.has(id),
  );
  if (unknownLedgerIds.length > 0) {
    fail(`Embedded delivery ledger contains unexpected asset ids: ${unknownLedgerIds.join(", ")}.`);
  }
  const finalEntries = ledger.assets.filter((entry) => entry.renderMode === "final");
  compareSets(
    finalEntries.map((entry) => entry.id),
    finalAssets.map((asset) => asset.id),
    "Embedded final delivery ledger entries",
  );
  if (new Set(finalEntries.map((entry) => entry.id)).size !== finalEntries.length) {
    fail("Embedded delivery ledger contains duplicate final asset entries.");
  }
  return finalEntries;
}

function validateEmbeddedFinalAssets(
  manifest,
  byPath,
  finalAssets,
  finalEntries,
  renderInputsByPath,
) {
  const filesByPath = new Map(manifest.files.map((file) => [file.path, file]));
  const archivePaths = [];
  for (const asset of finalAssets) {
    const archivePath = archiveAssetPath(asset.finalOutput);
    const outputEntry = byPath.get(archivePath);
    const file = filesByPath.get(archivePath);
    if (!outputEntry || file?.role !== assetRole(asset)) {
      fail(`Embedded package is missing the declared ${assetRole(asset)} ${asset.id}.`);
    }
    archivePaths.push(archivePath);
    validateEmbeddedLedgerAsset(
      asset,
      outputEntry,
      finalEntries.find((entry) => entry.id === asset.id),
      renderInputsByPath,
    );
  }
  return archivePaths;
}

function validateEmbeddedIcons(manifest, byPath, captureManifest, renderInputsByPath) {
  const filesByPath = new Map(manifest.files.map((file) => [file.path, file]));
  const archivePaths = [];
  for (const key of Object.keys(ICON_TARGETS)) {
    const icon = captureManifest.storeAssets?.[key];
    if (!icon?.source || icon.status !== "final-ready") {
      fail(`Embedded ${key} must declare a final-ready source.`);
    }
    const archivePath = archiveAssetPath(iconOutputPath(key, icon));
    const outputEntry = byPath.get(archivePath);
    const file = filesByPath.get(archivePath);
    if (!outputEntry || file?.role !== "icon") {
      fail(`Embedded package is missing the declared ${key}.`);
    }
    const png = assertPngContract(outputEntry.data, icon, `Embedded ${key}`);
    assertDecodedPng(outputEntry.data, png, `Embedded ${key}`);
    if (icon.maxBytes && outputEntry.data.length > icon.maxBytes) {
      fail(`Embedded ${key} exceeds its ${icon.maxBytes}-byte limit.`);
    }
    const sourceInput = renderInputsByPath.get(icon.source);
    if (!sourceInput || sourceInput.sha256 !== sha256(outputEntry.data)) {
      fail(`Embedded ${key} does not match its approved render input.`);
    }
    archivePaths.push(archivePath);
  }
  return archivePaths;
}

function validateEmbeddedAssetFileSet(manifest, expectedAssetPaths) {
  const actualAssetPaths = manifest.files
    .filter(
      (file) =>
        file.path.startsWith("assets/") ||
        ["screenshot", "feature-graphic", "icon", "store-asset"].includes(file.role),
    )
    .map((file) => file.path);
  compareSets(actualAssetPaths, expectedAssetPaths, "Embedded store assets");
}

function validateEmbeddedAssetPayloads(manifest, byPath) {
  const captureManifest = readEmbeddedJson(
    byPath,
    EMBEDDED_RENDER_INPUTS.get(WORKSPACE_PATHS.captureManifest),
    "capture manifest",
  );
  const renderManifest = readEmbeddedJson(
    byPath,
    EMBEDDED_RENDER_INPUTS.get(WORKSPACE_PATHS.renderManifest),
    "render manifest",
  );
  const ledger = readEmbeddedJson(
    byPath,
    "provenance/delivery-ledger.json",
    "delivery ledger",
  );
  assertExactLocales(captureManifest.locales, "Embedded capture manifest locales");
  if (
    manifest.campaign !== captureManifest.campaign ||
    manifest.renderCampaign !== renderManifest.campaign
  ) {
    fail("Embedded campaign metadata does not match the capture and render manifests.");
  }

  const finalAssets = validateRenderAssets(captureManifest, renderManifest);
  const renderInputsByPath = validateEmbeddedRenderInputs(
    manifest,
    byPath,
    captureManifest,
    renderManifest,
    finalAssets,
  );
  const finalEntries = validateEmbeddedLedger(renderManifest, ledger, finalAssets);
  const expectedAssetPaths = [
    ...validateEmbeddedFinalAssets(
      manifest,
      byPath,
      finalAssets,
      finalEntries,
      renderInputsByPath,
    ),
    ...validateEmbeddedIcons(manifest, byPath, captureManifest, renderInputsByPath),
  ];
  validateEmbeddedAssetFileSet(manifest, expectedAssetPaths);
}

function validateEmbeddedPackage(entries) {
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  const manifestEntry = byPath.get(PACKAGE_MANIFEST_ENTRY);
  if (!manifestEntry) fail(`ZIP archive is missing ${PACKAGE_MANIFEST_ENTRY}.`);
  let manifest;
  try {
    manifest = JSON.parse(manifestEntry.data.toString("utf8"));
  } catch (error) {
    fail(`Invalid embedded package manifest: ${error.message}`);
  }
  if (manifest.schemaVersion !== 1) {
    fail(`Unsupported embedded package manifest schema: ${manifest.schemaVersion}.`);
  }
  assertExactLocales(manifest.locales, "Embedded package manifest locales");
  if (!Array.isArray(manifest.files)) {
    fail("Embedded package manifest must contain a files array.");
  }
  const payloadEntries = entries.filter((entry) => entry.path !== PACKAGE_MANIFEST_ENTRY);
  compareSets(
    payloadEntries.map((entry) => entry.path),
    manifest.files.map((file) => file.path),
    "Embedded package payload",
  );
  if (new Set(manifest.files.map((file) => file.path)).size !== manifest.files.length) {
    fail("Embedded package manifest contains duplicate file paths.");
  }
  for (const file of manifest.files) {
    const entry = byPath.get(file.path);
    if (
      !entry ||
      !file.role ||
      file.bytes !== entry.data.length ||
      file.sha256 !== sha256(entry.data)
    ) {
      fail(`Embedded package hash or metadata mismatch for ${file.path}.`);
    }
  }
  validateEmbeddedAssetPayloads(manifest, byPath);
  validateEmbeddedStoreMetadata(byPath);
  return manifest;
}

function packageEntries(inputs) {
  return [
    ...inputs.payloads.map((payload) => ({ path: payload.archivePath, data: payload.data })),
    { path: PACKAGE_MANIFEST_ENTRY, data: inputs.packageManifestData },
  ];
}

export async function writeStorePackage({
  rootDir = process.cwd(),
  archivePath = DEFAULT_ARCHIVE,
  checkFreshness = true,
} = {}) {
  const inputs = await collectPackageInputs({ rootDir, checkFreshness });
  const archive = createDeterministicZip(packageEntries(inputs));
  validateEmbeddedPackage(readDeterministicZip(archive));

  const absoluteArchive = path.isAbsolute(archivePath)
    ? archivePath
    : resolveRepoPath(inputs.rootDir, archivePath, "archive output");
  assertArchiveOutsideManagedFinalRoot(inputs.rootDir, absoluteArchive);
  await mkdir(path.dirname(absoluteArchive), { recursive: true });
  const temporaryArchive = `${absoluteArchive}.${process.pid}.tmp`;
  try {
    await writeFile(temporaryArchive, archive);
    await rm(absoluteArchive, { force: true });
    try {
      await rename(temporaryArchive, absoluteArchive);
    } catch (error) {
      // Rename can fail across volumes when a caller selects a custom destination.
      await copyFile(temporaryArchive, absoluteArchive);
      await rm(temporaryArchive, { force: true });
      if (!(await stat(absoluteArchive).catch(() => null))) throw error;
    }
  } finally {
    await rm(temporaryArchive, { force: true });
  }
  return {
    archivePath: absoluteArchive,
    bytes: archive.length,
    sha256: sha256(archive),
    fileCount: inputs.payloads.length,
  };
}

export async function verifyStorePackage({
  rootDir = process.cwd(),
  archivePath = DEFAULT_ARCHIVE,
  againstWorkspace = true,
  checkFreshness = true,
} = {}) {
  const absoluteRoot = path.resolve(rootDir);
  const absoluteArchive = path.isAbsolute(archivePath)
    ? archivePath
    : resolveRepoPath(absoluteRoot, archivePath, "archive input");
  const archive = await readFile(absoluteArchive).catch(() => null);
  if (!archive) fail(`Store package archive is missing: ${absoluteArchive}`);
  const entries = readDeterministicZip(archive);
  const embeddedManifest = validateEmbeddedPackage(entries);

  if (againstWorkspace) {
    const inputs = await collectPackageInputs({ rootDir: absoluteRoot, checkFreshness });
    const expectedEntries = packageEntries(inputs);
    compareSets(
      entries.map((entry) => entry.path),
      expectedEntries.map((entry) => entry.path),
      "Store package archive",
    );
    const actualByPath = new Map(entries.map((entry) => [entry.path, entry.data]));
    for (const expected of expectedEntries) {
      const actual = actualByPath.get(expected.path);
      if (!actual?.equals(expected.data)) {
        fail(`Store package is stale or modified: ${expected.path}.`);
      }
    }
  }

  return {
    archivePath: absoluteArchive,
    bytes: archive.length,
    sha256: sha256(archive),
    fileCount: embeddedManifest.files.length,
    campaign: embeddedManifest.campaign,
  };
}

function parseCli(argv) {
  const [command, ...rest] = argv;
  if (!command || !["package", "verify"].includes(command)) {
    fail("Usage: node scripts/store-package.mjs <package|verify> [--archive <path>]");
  }
  let archivePath = DEFAULT_ARCHIVE;
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] !== "--archive" || !rest[index + 1]) {
      fail(`Unknown or incomplete argument: ${rest[index]}`);
    }
    archivePath = rest[index + 1];
    index += 1;
  }
  return { command, archivePath };
}

async function main() {
  const { command, archivePath } = parseCli(process.argv.slice(2));
  const result =
    command === "package"
      ? await writeStorePackage({ archivePath })
      : await verifyStorePackage({ archivePath });
  const verb = command === "package" ? "Created" : "Verified";
  console.log(
    `${verb} ${slash(path.relative(process.cwd(), result.archivePath))} (${result.fileCount} files, ${result.bytes} bytes, sha256 ${result.sha256}).`,
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  try {
    await main();
  } catch (error) {
    console.error(`Store package failed: ${error.message}`);
    process.exitCode = 1;
  }
}
