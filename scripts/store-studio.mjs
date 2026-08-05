import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import {
  renderAssetDocument,
  renderPreviewIndex,
} from "../store-listing/studio/template.mjs";
import { validatePhoneCropContract } from "./store-render-validation.mjs";

export {
  validateCaptureRect,
  validateMinimumCaptureCoverage,
  validatePhoneCropContract,
  validatePhoneObjectPosition,
} from "./store-render-validation.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const storeRoot = path.join(repoRoot, "store-listing");
const manifestPath = path.join(storeRoot, "studio", "render-manifest.json");
const ledgerPath = path.join(storeRoot, "delivery-ledger.json");
const exportsRoot = path.join(storeRoot, "exports");
const draftsRoot = path.join(exportsRoot, "drafts");
const finalRoot = path.join(exportsRoot, "final");
const RENDER_MODES = new Set(["draft", "final"]);
const FINAL_ICON_DIRECTORIES = new Map([
  ["appStoreIcon", "store-listing/exports/final/app-store/icon"],
  ["googlePlayIcon", "store-listing/exports/final/google-play/icon"],
]);
const PHONE_DEVICE_SET_KEYS = new Map([
  ["app-store:iphone-6.9", "appStoreIphone69"],
  ["google-play:phone", "googlePlayPhone"],
]);

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".ttf", "font/ttf"],
]);

const parseArgs = (argv) => {
  const [command = "help", ...rest] = argv;
  const options = new Map();
  for (const token of rest) {
    const match = token.match(/^--([^=]+)(?:=(.*))?$/);
    if (!match) {
      throw new Error(`Unknown argument: ${token}`);
    }
    options.set(match[1], match[2] ?? true);
  }
  return { command, options };
};

export const parseRenderMode = (value) => {
  const mode = value ?? "draft";
  if (typeof mode !== "string" || !RENDER_MODES.has(mode)) {
    throw new Error(`Invalid render mode: ${String(value)}. Use draft or final.`);
  }
  return mode;
};

export const assetOutputForMode = (asset, renderMode) => {
  const output = renderMode === "draft" ? asset.output : asset.finalOutput;
  if (typeof output !== "string" || output.trim() === "") {
    throw new Error(`Asset ${asset.id} has no ${renderMode} output path.`);
  }
  return output;
};

const assetOutputSlot = (asset) => {
  if (asset.kind === "feature") {
    return "feature";
  }
  if (asset.kind === "phone" && typeof asset.deviceSlot === "string" && asset.deviceSlot !== "") {
    return asset.deviceSlot;
  }
  throw new Error(`Asset ${asset.id} has no output slot for kind ${String(asset.kind)}.`);
};

export const validateFeatureCopyContract = (asset, campaign) => {
  const supportedLocales = new Set(campaign.locales ?? []);
  if (asset.locale !== "localization-independent" && !supportedLocales.has(asset.locale)) {
    throw new Error(`Feature ${asset.id} has unsupported locale: ${asset.locale}`);
  }

  const copy = campaign.storeAssets?.[asset.storeAssetId];
  if (!copy) {
    throw new Error(`Feature ${asset.id} references unknown store asset copy: ${asset.storeAssetId}`);
  }
  const localizedAltText = copy.altText;
  for (const locale of supportedLocales) {
    if (typeof localizedAltText?.[locale] !== "string" || localizedAltText[locale].trim() === "") {
      throw new Error(`Feature ${asset.id} is missing ${locale} alt text.`);
    }
  }

  const expectedSourceLocale = asset.locale;
  const featureSources = asset.source ? [asset.source] : (asset.sources ?? []);
  for (const source of featureSources) {
    if (source.locale !== expectedSourceLocale) {
      throw new Error(
        `Feature ${asset.id} source locale ${String(source.locale)} does not match ${expectedSourceLocale}.`,
      );
    }
  }

  const steps = copy.steps?.[asset.locale] ?? null;
  if (
    asset.composition === "product-proof" &&
    (!Array.isArray(steps) ||
      steps.length !== 3 ||
      steps.some((step) => typeof step !== "string" || step.trim() === ""))
  ) {
    throw new Error(`Feature ${asset.id} needs exactly three ${asset.locale} product-proof steps.`);
  }

  return {
    altText:
      asset.locale === "localization-independent"
        ? localizedAltText["en-US"] ?? Object.values(localizedAltText)[0]
        : localizedAltText[asset.locale],
    localizedAltText,
    steps,
  };
};

const validateCompleteFeatureSourceContract = (asset) => {
  if (Array.isArray(asset.sources) && asset.sources.length > 0) {
    throw new Error(
      `Feature ${asset.id} cannot mix a complete raster source with panel sources.`,
    );
  }
  if (
    asset.locale !== "localization-independent" ||
    asset.source.locale !== "localization-independent"
  ) {
    throw new Error(
      `Complete feature raster ${asset.id} must be localization-independent.`,
    );
  }
  if (asset.width !== 1024 || asset.height !== 500) {
    throw new Error(`Complete feature raster ${asset.id} must use a 1024×500 canvas.`);
  }
  if (
    asset.source.expectedWidth !== asset.width ||
    asset.source.expectedHeight !== asset.height
  ) {
    throw new Error(
      `Complete feature raster ${asset.id} source dimensions must match its canvas.`,
    );
  }
  if (typeof asset.source.path !== "string" || asset.source.path.trim() === "") {
    throw new Error(`Complete feature raster ${asset.id} must reference a real PNG source.`);
  }
  if (asset.status !== "final-ready") {
    throw new Error(`Complete feature raster ${asset.id} must be marked final-ready.`);
  }
  if (asset.sourceGap?.trim()) {
    throw new Error(`Complete feature raster ${asset.id} cannot declare a source gap.`);
  }
  if (asset.requiresRelayArtwork !== false) {
    throw new Error(
      `Complete feature raster ${asset.id} must set requiresRelayArtwork to false.`,
    );
  }
  if (asset.relayArtwork) {
    throw new Error(
      `Complete feature raster ${asset.id} cannot add separate relay artwork.`,
    );
  }
  return { mode: "complete-raster", sources: [asset.source] };
};

const validateProductProofPanel = (asset, source, index, expectedRole) => {
  if (source.role !== expectedRole) {
    throw new Error(
      `Product-proof feature ${asset.id} source ${index + 1} must use role ${expectedRole}.`,
    );
  }
  if (
    typeof source.path !== "string" ||
    source.path.trim() === "" ||
    !Number.isInteger(source.expectedWidth) ||
    !Number.isInteger(source.expectedHeight) ||
    typeof source.objectPosition !== "string" ||
    source.objectPosition.trim() === ""
  ) {
    throw new Error(
      `Product-proof feature ${asset.id} source ${source.role} needs a real PNG contract and crop position.`,
    );
  }
};

const validateProductProofSourceContract = (asset) => {
  if (asset.composition !== "product-proof") {
    throw new Error(
      `Feature ${asset.id} must use one complete raster or the product-proof composition.`,
    );
  }
  if (asset.locale === "localization-independent") {
    throw new Error(`Product-proof feature ${asset.id} must use a supported store locale.`);
  }
  if (asset.width !== 1024 || asset.height !== 500) {
    throw new Error(`Product-proof feature ${asset.id} must use a 1024×500 canvas.`);
  }
  if (asset.status !== "final-ready") {
    throw new Error(`Product-proof feature ${asset.id} must be marked final-ready.`);
  }
  if (asset.sourceGap?.trim()) {
    throw new Error(`Product-proof feature ${asset.id} cannot declare a source gap.`);
  }
  if (asset.requiresRelayArtwork !== true || !asset.relayArtwork) {
    throw new Error(`Product-proof feature ${asset.id} requires the real Golden Relay artwork.`);
  }
  if (!Array.isArray(asset.sources) || asset.sources.length !== 3) {
    throw new Error(
      `Feature asset ${asset.id} must use one complete raster or exactly three real source captures.`,
    );
  }
  const expectedRoles = ["voice", "assignee", "task"];
  for (const [index, source] of asset.sources.entries()) {
    validateProductProofPanel(asset, source, index, expectedRoles[index]);
  }
  return { mode: "product-proof", sources: asset.sources };
};

export const validateFeatureSourceContract = (asset) => {
  if (asset.source) {
    return validateCompleteFeatureSourceContract(asset);
  }
  return validateProductProofSourceContract(asset);
};

const phoneThemeForScreenshot = (screenshotId, darkSlots, lightSlots) => {
  if (darkSlots.has(screenshotId)) return "dark";
  if (lightSlots.has(screenshotId)) return "light";
  return null;
};

export const validatePhoneMatrix = (assets, campaign) => {
  const locales = campaign.locales ?? [];
  const sequence = campaign.coveragePlan?.primaryPhoneNarrative ?? [];
  const darkSlots = new Set(campaign.coveragePlan?.themeProof?.darkSlots ?? []);
  const lightSlots = new Set(campaign.coveragePlan?.themeProof?.lightSlots ?? []);
  const phones = assets.filter((asset) => asset.kind === "phone");

  if (sequence.length !== 8) {
    throw new Error(
      `Phone matrix narrative must contain exactly 8 ordered screenshot slots; found ${sequence.length}.`,
    );
  }
  if (phones.length === 0) {
    throw new Error("Phone matrix must contain at least one platform.");
  }

  const platforms = new Set(
    [...PHONE_DEVICE_SET_KEYS.keys()].map((slot) => slot.slice(0, slot.indexOf(":"))),
  );
  for (const asset of phones) {
    if (typeof asset.platform !== "string" || asset.platform.trim() === "") {
      throw new Error(`Phone asset ${asset.id} must declare a platform.`);
    }
    validatePhoneDeviceSet(asset, campaign);
    platforms.add(asset.platform);
  }

  const seen = new Set();
  for (const platform of platforms) {
    const platformPhones = phones.filter((asset) => asset.platform === platform);
    const expectedPlatformCount = locales.length * sequence.length;
    if (platformPhones.length !== expectedPlatformCount) {
      throw new Error(
        `Phone matrix for ${platform} must contain 8 ordered screenshots per locale (${expectedPlatformCount} total); found ${platformPhones.length}.`,
      );
    }

    for (const locale of locales) {
      const localized = platformPhones
        .filter((asset) => asset.locale === locale)
        .sort((left, right) => left.stage.index - right.stage.index);
      if (localized.length !== sequence.length) {
        throw new Error(
          `Phone matrix for ${platform}/${locale} must contain exactly ${sequence.length} assets.`,
        );
      }

      localized.forEach((asset, index) => {
        const expectedStage = index + 1;
        const expectedScreenshotId = sequence[index];
        if (asset.stage.index !== expectedStage || asset.stage.total !== sequence.length) {
          throw new Error(
            `Phone asset ${asset.id} must declare stage ${expectedStage}/${sequence.length}.`,
          );
        }
        if (asset.screenshotId !== expectedScreenshotId) {
          throw new Error(
            `Phone asset ${asset.id} uses ${asset.screenshotId}; expected ${expectedScreenshotId} at stage ${expectedStage}.`,
          );
        }
        const key = `${platform}:${locale}:${asset.screenshotId}`;
        if (seen.has(key)) {
          throw new Error(`Duplicate phone matrix slot: ${key}.`);
        }
        seen.add(key);

        const expectedTheme = phoneThemeForScreenshot(
          asset.screenshotId,
          darkSlots,
          lightSlots,
        );
        if (!expectedTheme || asset.theme !== expectedTheme) {
          throw new Error(
            `Phone asset ${asset.id} must use the declared matrix theme for ${asset.screenshotId}.`,
          );
        }
      });
    }
  }
};

export const validatePhoneDeviceSet = (asset, campaign) => {
  const slot = `${asset.platform}:${asset.deviceSlot}`;
  const deviceSetKey = PHONE_DEVICE_SET_KEYS.get(slot);
  const deviceSet = deviceSetKey ? campaign.deviceSets?.[deviceSetKey] : null;
  if (!deviceSet) {
    throw new Error(
      `Phone asset ${asset.id} has no campaign device set for ${asset.platform}/${String(asset.deviceSlot)}.`,
    );
  }
  if (
    !Number.isInteger(deviceSet.width) ||
    !Number.isInteger(deviceSet.height) ||
    deviceSet.width <= 0 ||
    deviceSet.height <= 0
  ) {
    throw new Error(`Campaign device set ${deviceSetKey} has invalid dimensions.`);
  }
  if (asset.width !== deviceSet.width || asset.height !== deviceSet.height) {
    throw new Error(
      `Phone asset ${asset.id} canvas is ${asset.width}×${asset.height}; campaign device set ${deviceSetKey} requires ${deviceSet.width}×${deviceSet.height}.`,
    );
  }
  return deviceSet;
};

export const mergeLedgerEntries = (existingEntries, renderedEntries) => {
  const merged = new Map();
  for (const entry of [...(existingEntries ?? []), ...renderedEntries]) {
    merged.set(`${entry.renderMode ?? "draft"}:${entry.id}`, entry);
  }
  return [...merged.values()];
};

export const reconcileLedgerEntries = (
  existingEntries,
  renderedEntries,
  { isPartial },
) => {
  if (isPartial) {
    return mergeLedgerEntries(existingEntries, renderedEntries);
  }
  return [...renderedEntries];
};

const readJson = async (target) => JSON.parse(await readFile(target, "utf8"));
const resolveRepoPath = (relativePath) => path.resolve(repoRoot, relativePath);
const dataUrl = async (target, mimeType) =>
  `data:${mimeType};base64,${(await readFile(target)).toString("base64")}`;

const assertInside = (parent, target) => {
  const relative = path.relative(parent, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing path outside ${parent}: ${target}`);
  }
};

export const resetFinalExportsForFullRender = async ({
  renderMode,
  onlyId,
  rootDir = repoRoot,
}) => {
  if (renderMode !== "final" || onlyId !== undefined) {
    return false;
  }

  const resolvedRoot = path.resolve(rootDir);
  const resolvedExportsRoot = path.join(resolvedRoot, "store-listing", "exports");
  const resolvedFinalRoot = path.join(resolvedExportsRoot, "final");
  assertInside(resolvedExportsRoot, resolvedFinalRoot);
  await rm(resolvedFinalRoot, { recursive: true, force: true });
  return true;
};

export const copyApprovedIconsForRenderMode = async ({
  campaign,
  renderMode,
  rootDir = repoRoot,
}) => {
  if (renderMode !== "final") {
    return [];
  }

  const resolvedRoot = path.resolve(rootDir);
  const copied = [];
  for (const [key, relativeDirectory] of FINAL_ICON_DIRECTORIES) {
    const icon = campaign.storeAssets?.[key];
    if (icon?.status !== "final-ready" || typeof icon.source !== "string") {
      throw new Error(`${key} must declare a final-ready approved source.`);
    }

    const source = path.resolve(resolvedRoot, icon.source);
    assertInside(resolvedRoot, source);
    const outputDirectory = path.resolve(resolvedRoot, relativeDirectory);
    const output = path.join(outputDirectory, path.basename(icon.source));
    assertInside(path.join(resolvedRoot, "store-listing", "exports", "final"), output);
    await mkdir(outputDirectory, { recursive: true });
    await copyFile(source, output);
    copied.push({
      key,
      source: path.relative(resolvedRoot, source).replaceAll("\\", "/"),
      output: path.relative(resolvedRoot, output).replaceAll("\\", "/"),
    });
  }
  return copied;
};

export const validateOutputPath = (asset, renderMode) => {
  const relativePath = assetOutputForMode(asset, renderMode);
  const output = resolveRepoPath(relativePath);
  assertInside(exportsRoot, output);
  const modeRoot = renderMode === "draft" ? draftsRoot : finalRoot;
  if (renderMode === "draft") {
    assertInside(draftsRoot, output);
  } else {
    assertInside(finalRoot, output);
    const normalized = relativePath.replaceAll("\\", "/");
    if (normalized.toLowerCase().includes("/drafts/") || /draft/i.test(path.basename(normalized))) {
      throw new Error(`Final output for ${asset.id} cannot use a draft path or filename: ${relativePath}`);
    }
  }
  const slot = assetOutputSlot(asset);
  const expectedDirectory = path.join(modeRoot, asset.platform, asset.locale, slot);
  if (path.dirname(output) !== expectedDirectory) {
    const expectedRelativeDirectory = path.relative(repoRoot, expectedDirectory).replaceAll("\\", "/");
    throw new Error(
      `${renderMode} output for ${asset.id} must be inside ${expectedRelativeDirectory}: ${relativePath}`,
    );
  }
  return output;
};

const validateArtworkRect = (asset, artwork) => {
  const rect = artwork.rect;
  if (
    !rect ||
    [rect.x, rect.y, rect.width, rect.height].some((value) => !Number.isInteger(value)) ||
    rect.x < 0 ||
    rect.y < 0 ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    rect.x + rect.width > asset.width ||
    rect.y + rect.height > asset.height
  ) {
    throw new Error(`Relay artwork for ${asset.id} must have an integer rectangle inside its canvas.`);
  }
};

const readPng = async (target) => {
  const buffer = await readFile(target);
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 26 || buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error(`Not a valid PNG: ${target}`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
    bytes: buffer.length,
  };
};

const sha256 = async (target) =>
  createHash("sha256").update(await readFile(target)).digest("hex");

const assertFile = async (relativePath, label) => {
  const target = resolveRepoPath(relativePath);
  assertInside(repoRoot, target);
  if (!existsSync(target) || !(await stat(target)).isFile()) {
    throw new Error(`Missing ${label}: ${relativePath}`);
  }
  return target;
};

const assertPngDimensions = async (relativePath, expectedWidth, expectedHeight, label) => {
  const target = await assertFile(relativePath, label);
  const png = await readPng(target);
  if (png.width !== expectedWidth || png.height !== expectedHeight) {
    throw new Error(
      `${label} has ${png.width}×${png.height}; expected ${expectedWidth}×${expectedHeight}: ${relativePath}`,
    );
  }
  return { target, png };
};

const chromeCandidates = () => {
  const candidates = [process.env.CHROME_PATH];
  if (process.platform === "win32") {
    candidates.push(
      path.join(process.env.ProgramFiles ?? "", "Google", "Chrome", "Application", "chrome.exe"),
      path.join(process.env["ProgramFiles(x86)"] ?? "", "Google", "Chrome", "Application", "chrome.exe"),
      path.join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "Application", "chrome.exe"),
    );
  } else {
    candidates.push("/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  }
  return candidates.filter(Boolean);
};

const findChrome = () => {
  const chrome = chromeCandidates().find((candidate) => existsSync(candidate));
  if (!chrome) {
    throw new Error("Local Google Chrome was not found. Set CHROME_PATH to the Chrome executable.");
  }
  return chrome;
};

export const windowsPowerShellPath = (systemRoot) => {
  if (typeof systemRoot !== "string" || !path.win32.isAbsolute(systemRoot)) {
    throw new Error("SystemRoot must be an absolute Windows path.");
  }
  return path.win32.join(
    systemRoot,
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );
};

export const containsFourPartVersion = (value) => {
  let completedParts = 0;
  let digitCount = 0;
  for (const character of value) {
    if (character >= "0" && character <= "9") {
      digitCount += 1;
      continue;
    }
    if (character === "." && digitCount > 0 && completedParts < 3) {
      completedParts += 1;
      digitCount = 0;
      continue;
    }
    if (completedParts === 3 && digitCount > 0) return true;
    completedParts = 0;
    digitCount = 0;
  }
  return completedParts === 3 && digitCount > 0;
};

const getChromeVersion = (chrome) => {
  if (process.platform === "win32") {
    const escaped = chrome.replaceAll("'", "''");
    const powershell = windowsPowerShellPath(process.env.SystemRoot);
    if (!existsSync(powershell)) {
      throw new Error(`Windows PowerShell was not found at ${powershell}.`);
    }
    const result = spawnSync(
      powershell,
      ["-NoProfile", "-Command", `(Get-Item -LiteralPath '${escaped}').VersionInfo.ProductVersion`],
      { encoding: "utf8", windowsHide: true },
    );
    const version = result.stdout?.trim();
    if (result.status === 0 && version) {
      return `Google Chrome ${version}`;
    }
  } else {
    const direct = spawnSync(chrome, ["--version"], {
      encoding: "utf8",
      timeout: 5000,
      windowsHide: true,
    });
    const directVersion = `${direct.stdout ?? ""} ${direct.stderr ?? ""}`.trim();
    if (directVersion && containsFourPartVersion(directVersion)) {
      return directVersion;
    }
  }
  throw new Error(`Unable to determine Chrome version for ${chrome}`);
};

const loadContext = async () => {
  const manifest = await readJson(manifestPath);
  const campaignPath = resolveRepoPath(manifest.copySource);
  const campaign = await readJson(campaignPath);
  const assetPaths = new Set([manifest.brandMark.path]);
  for (const asset of manifest.assets) {
    if (asset.relayArtwork?.path) {
      assetPaths.add(asset.relayArtwork.path);
    }
    if (asset.kind === "phone") {
      if (asset.source?.path) {
        assetPaths.add(asset.source.path);
      }
    } else if (asset.source?.path) {
      assetPaths.add(asset.source.path);
    } else {
      for (const source of asset.sources ?? []) {
        assetPaths.add(source.path);
      }
    }
  }
  const assetDataUrls = {};
  for (const relativePath of assetPaths) {
    assetDataUrls[relativePath] = await dataUrl(resolveRepoPath(relativePath), "image/png");
  }

  let studioCss = await readFile(path.join(storeRoot, "studio", "studio.css"), "utf8");
  for (const font of manifest.fonts) {
    const publicUrl = `/${font.path.replace(/^store-listing\//, "").replaceAll("\\", "/")}`;
    studioCss = studioCss.replaceAll(publicUrl, await dataUrl(resolveRepoPath(font.path), "font/ttf"));
  }
  return { manifest, campaign, assetDataUrls, studioCss };
};

const validateManifestContract = (manifest, campaign) => {
  if (manifest.schemaVersion !== 1) {
    throw new Error(`Unsupported studio manifest schema: ${manifest.schemaVersion}`);
  }
  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
    throw new Error("Studio manifest has no assets.");
  }
  validatePhoneMatrix(manifest.assets, campaign);
};

const validateStudioAssetContract = (asset, ids) => {
  if (ids.has(asset.id)) {
    throw new Error(`Duplicate studio asset id: ${asset.id}`);
  }
  ids.add(asset.id);
  if (
    !Number.isInteger(asset.width) ||
    !Number.isInteger(asset.height) ||
    asset.width <= 0 ||
    asset.height <= 0
  ) {
    throw new Error(`Asset ${asset.id} has invalid dimensions.`);
  }
  validateOutputPath(asset, "draft");
  validateOutputPath(asset, "final");
};

const validateRelayArtworkSource = async (asset) => {
  if (!asset.relayArtwork) return;
  validateArtworkRect(asset, asset.relayArtwork);
  await assertPngDimensions(
    asset.relayArtwork.path,
    asset.relayArtwork.expectedWidth,
    asset.relayArtwork.expectedHeight,
    `relay artwork for ${asset.id}`,
  );
};

const validatePhoneAssetContext = async (asset, campaign) => {
  if (!campaign.locales?.includes(asset.locale) || asset.source?.locale !== asset.locale) {
    throw new Error(`Phone asset ${asset.id} has inconsistent locale metadata.`);
  }
  const screenshot = campaign.screenshots?.find((entry) => entry.id === asset.screenshotId);
  if (!screenshot?.headline?.[asset.locale] || !screenshot?.altText?.[asset.locale]) {
    throw new Error(`Asset ${asset.id} is missing ${asset.locale} copy in capture-manifest.json.`);
  }
  if (asset.source.path) {
    await assertPngDimensions(
      asset.source.path,
      asset.source.expectedWidth,
      asset.source.expectedHeight,
      `source for ${asset.id}`,
    );
  } else if (asset.status !== "technical-draft" || !asset.sourceGap?.trim()) {
    throw new Error(
      `Phone asset ${asset.id} without a source path must be a technical draft with a source gap.`,
    );
  }
  validatePhoneCropContract(asset);
};

const validateFeatureAssetContext = async (asset, campaign) => {
  const featureSource = validateFeatureSourceContract(asset);
  validateFeatureCopyContract(asset, campaign);
  for (const source of featureSource.sources) {
    const { png } = await assertPngDimensions(
      source.path,
      source.expectedWidth,
      source.expectedHeight,
      `source for ${asset.id}`,
    );
    if (featureSource.mode === "complete-raster" && png.colorType !== 2) {
      throw new Error(
        `Complete feature raster ${asset.id} must be an RGB PNG without alpha.`,
      );
    }
  }
  const sourceCoverage = featureSource.mode === "complete-raster"
    ? 1
    : ((asset.width - 40) * (asset.height - 40)) / (asset.width * asset.height);
  if (sourceCoverage < asset.minimumCaptureCoverage) {
    throw new Error(
      `Feature ${asset.id} source coverage ${(sourceCoverage * 100).toFixed(2)}% is below ${(asset.minimumCaptureCoverage * 100).toFixed(2)}%.`,
    );
  }
};

const validateStudioAsset = async (asset, campaign, ids) => {
  validateStudioAssetContract(asset, ids);
  await validateRelayArtworkSource(asset);
  if (asset.kind === "phone") {
    await validatePhoneAssetContext(asset, campaign);
    return;
  }
  if (asset.kind === "feature") {
    await validateFeatureAssetContext(asset, campaign);
    return;
  }
  throw new Error(`Unsupported asset kind: ${asset.kind}`);
};

const validateStudioSupportFiles = async (manifest) => {
  await assertPngDimensions(
    manifest.reference.path,
    manifest.reference.expectedWidth,
    manifest.reference.expectedHeight,
    "selected Golden Relay reference",
  );
  await assertPngDimensions(
    manifest.brandMark.path,
    manifest.brandMark.expectedWidth,
    manifest.brandMark.expectedHeight,
    "gold S brand mark",
  );
  for (const font of manifest.fonts) {
    await assertFile(font.path, `DM Sans ${font.weight} font`);
  }
  await assertFile("store-listing/assets/fonts/DM-Sans-NOTICE.md", "DM Sans license notice");
  await assertFile("store-listing/assets/fonts/OFL-1.1.txt", "SIL Open Font License text");
  await assertFile("store-listing/studio/studio.css", "studio stylesheet");
};

const validateContext = async ({ manifest, campaign }) => {
  validateManifestContract(manifest, campaign);
  const ids = new Set();
  for (const asset of manifest.assets) {
    await validateStudioAsset(asset, campaign, ids);
  }
  await validateStudioSupportFiles(manifest);
};

export const commandRequiresChrome = (command) =>
  command === "validate" || command === "render";

const resolveChrome = () => {
  const chrome = findChrome();
  return { chrome, chromeVersion: getChromeVersion(chrome) };
};

const assetPathFromUrl = (pathname) => {
  const decoded = decodeURIComponent(pathname);
  const routes = [
    ["/assets/", path.join(storeRoot, "assets")],
    ["/references/", path.join(storeRoot, "references")],
    ["/studio/", path.join(storeRoot, "studio")],
  ];
  for (const [prefix, root] of routes) {
    if (decoded.startsWith(prefix)) {
      const target = path.resolve(root, decoded.slice(prefix.length));
      assertInside(root, target);
      return target;
    }
  }
  return null;
};

const startStudioServer = async (context, requestedPort = 0, renderMode = "draft") => {
  const { manifest, campaign } = context;
  const byId = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      if (requestUrl.pathname === "/") {
        const campaignHeadline = campaign.campaignHeadline?.["en-US"] ?? "Golden Relay";
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end(
          renderPreviewIndex({ assets: manifest.assets, campaignHeadline, renderMode }),
        );
        return;
      }
      if (requestUrl.pathname.startsWith("/render/")) {
        const id = decodeURIComponent(requestUrl.pathname.slice("/render/".length));
        const asset = byId.get(id);
        if (!asset) {
          response.writeHead(404).end("Unknown studio asset");
          return;
        }
        const html = renderAssetDocument({
          asset,
          campaign,
          tokens: manifest.tokens,
          brandMark: manifest.brandMark,
          assetDataUrls: context.assetDataUrls,
          studioCss: context.studioCss,
          renderMode,
        });
        response.writeHead(200, {
          "Cache-Control": "no-store",
          "Content-Type": "text/html; charset=utf-8",
        });
        response.end(html);
        return;
      }

      const target = assetPathFromUrl(requestUrl.pathname);
      if (!target || !existsSync(target) || !(await stat(target)).isFile()) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": MIME_TYPES.get(path.extname(target).toLowerCase()) ?? "application/octet-stream",
      });
      response.end(await readFile(target));
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(error instanceof Error ? error.message : String(error));
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(requestedPort, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Studio server did not expose a TCP address.");
  }
  return { server, port: address.port };
};

const chromeBaseArgs = (profileDir) => [
  "--headless=new",
  "--hide-scrollbars",
  "--disable-extensions",
  "--disable-default-apps",
  "--no-first-run",
  "--force-device-scale-factor=1",
  "--run-all-compositor-stages-before-draw",
  `--user-data-dir=${profileDir}`,
];

const runChild = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (status) => resolve({ status, stdout, stderr }));
  });

const assertBrowserReady = async ({ chrome, profileDir, url }) => {
  const result = await runChild(chrome, [
    ...chromeBaseArgs(profileDir),
    "--virtual-time-budget=7500",
    "--dump-dom",
    url,
  ]);
  if (result.status !== 0) {
    throw new Error(`Chrome readiness check failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  if (!result.stdout.includes('data-studio-ready="true"')) {
    const htmlTag = result.stdout.match(/<html[^>]*>/)?.[0] ?? "missing <html> tag";
    throw new Error(`Chrome did not load every image/font for ${url}: ${htmlTag}`);
  }
};

const renderWithChrome = async ({ chrome, profileDir, asset, url, output }) => {
  const args = [
    ...chromeBaseArgs(profileDir),
    "--virtual-time-budget=7500",
    `--window-size=${asset.width},${asset.height}`,
    `--screenshot=${output}`,
    url,
  ];
  const result = await runChild(chrome, args);
  if (result.status !== 0) {
    throw new Error(`Chrome render failed (${result.status}): ${result.stderr || result.stdout}`);
  }
};

const sourceListForAsset = (asset) => {
  if (asset.kind === "phone") return [asset.source];
  if (asset.source) return [asset.source];
  return asset.sources;
};

const ledgerEntry = async ({ asset, output, campaign, chromeVersion, renderMode }) => {
  const png = await readPng(output);
  if (png.width !== asset.width || png.height !== asset.height) {
    throw new Error(
      `Rendered ${asset.id} is ${png.width}×${png.height}; expected ${asset.width}×${asset.height}.`,
    );
  }
  if (png.colorType !== 2) {
    throw new Error(`Rendered ${asset.id} PNG color type is ${png.colorType}; expected RGB color type 2 with no alpha.`);
  }

  const sourceList = sourceListForAsset(asset);
  const sources = [];
  for (const source of sourceList) {
    const sourceTarget = resolveRepoPath(source.path);
    const sourcePng = await readPng(sourceTarget);
    sources.push({
      path: source.path,
      sha256: await sha256(sourceTarget),
      width: sourcePng.width,
      height: sourcePng.height,
      colorType: sourcePng.colorType,
    });
  }

  const screenshot = asset.screenshotId
    ? campaign.screenshots.find((entry) => entry.id === asset.screenshotId)
    : null;
  const featureCopy = asset.kind === "feature"
    ? validateFeatureCopyContract(asset, campaign)
    : null;
  return {
    id: asset.id,
    renderMode,
    status: renderMode === "draft" ? "technical-draft" : "final-candidate",
    sourceGap: asset.sourceGap ?? null,
    platform: asset.platform,
    deviceSlot: asset.deviceSlot,
    locale: asset.locale,
    theme: asset.theme,
    output: path.relative(repoRoot, output).replaceAll("\\", "/"),
    sha256: await sha256(output),
    bytes: png.bytes,
    width: png.width,
    height: png.height,
    bitDepth: png.bitDepth,
    pngColorType: png.colorType,
    colorModel: "RGB",
    alpha: false,
    headline: screenshot?.headline?.[asset.locale] ?? null,
    altText: screenshot?.altText?.[asset.locale] ?? featureCopy?.altText ?? null,
    localizedAltText: featureCopy?.localizedAltText ?? null,
    sources,
    renderer: chromeVersion,
  };
};

export const assertAssetsReadyForMode = (assets, renderMode) => {
  if (renderMode !== "final") {
    return;
  }
  for (const asset of assets) {
    if (asset.status !== "final-ready") {
      throw new Error(
        `Asset ${asset.id} is ${asset.status}; final rendering requires status final-ready.`,
      );
    }
    if (asset.sourceGap) {
      throw new Error(`Asset ${asset.id} has a source gap and cannot be rendered in final mode.`);
    }
    if (asset.kind === "phone" && !asset.source?.path) {
      throw new Error(`Asset ${asset.id} has no real source capture and cannot be rendered in final mode.`);
    }
    if (asset.kind === "feature") {
      validateFeatureSourceContract(asset);
    }
    if (asset.requiresRelayArtwork && !asset.relayArtwork) {
      throw new Error(
        `Asset ${asset.id} requires real raster relay artwork before final rendering.`,
      );
    }
  }
};

const ledgerStatus = (entries) => {
  const modes = new Set(entries.map((entry) => entry.renderMode ?? "draft"));
  if (modes.size > 1) {
    return "mixed-draft-and-final-candidates";
  }
  return modes.has("final")
    ? "final-candidates-require-publication-approval"
    : "technical-draft-not-for-publication";
};

const readExistingLedger = async (campaign) => {
  if (!existsSync(ledgerPath)) {
    return null;
  }
  const ledger = await readJson(ledgerPath);
  if (ledger.campaign !== campaign) {
    throw new Error(
      `Existing ledger campaign ${String(ledger.campaign)} does not match ${campaign}.`,
    );
  }
  return ledger;
};

const runRender = async ({ context, chrome, chromeVersion, onlyId, renderMode }) => {
  const isPartial = onlyId !== undefined;
  const assets = isPartial
    ? context.manifest.assets.filter((asset) => asset.id === onlyId)
    : context.manifest.assets;
  if (isPartial && assets.length === 0) {
    throw new Error(`Unknown asset id: ${onlyId}`);
  }
  assertAssetsReadyForMode(assets, renderMode);
  const pendingSources = assets
    .filter((asset) => asset.kind === "phone" && !asset.source?.path)
    .map((asset) => asset.id);
  if (pendingSources.length > 0) {
    throw new Error(
      `Cannot render phone placeholders without real source captures: ${pendingSources.join(", ")}. Use --id for a sourced draft.`,
    );
  }

  const { server, port } = await startStudioServer(context, 0, renderMode);
  const profileRoot = await mkdtemp(path.join(tmpdir(), "shuuty-store-studio-"));
  const entries = [];
  try {
    const resetFinalExports = await resetFinalExportsForFullRender({
      renderMode,
      onlyId,
    });
    if (resetFinalExports) {
      console.log(`cleared ${path.relative(repoRoot, finalRoot)} before full final render`);
    }
    for (const asset of assets) {
      const output = validateOutputPath(asset, renderMode);
      await mkdir(path.dirname(output), { recursive: true });
      const url = `http://127.0.0.1:${port}/render/${encodeURIComponent(asset.id)}`;
      const readinessProfile = await mkdtemp(path.join(profileRoot, "ready-"));
      const renderProfile = await mkdtemp(path.join(profileRoot, "render-"));
      await assertBrowserReady({ chrome, profileDir: readinessProfile, url });
      await renderWithChrome({ chrome, profileDir: renderProfile, asset, url, output });
      const entry = await ledgerEntry({
        asset,
        output,
        campaign: context.campaign,
        chromeVersion,
        renderMode,
      });
      entries.push(entry);
      console.log(
        `rendered ${entry.output} (${entry.width}×${entry.height}, RGB/no alpha, sha256 ${entry.sha256})`,
      );
      if (entry.sourceGap) {
        console.warn(`source gap: ${entry.id}: ${entry.sourceGap}`);
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(profileRoot, { recursive: true, force: true });
  }

  const copiedIcons = await copyApprovedIconsForRenderMode({
    campaign: context.campaign,
    renderMode,
  });
  for (const icon of copiedIcons) {
    console.log(`copied ${icon.source} -> ${icon.output}`);
  }

  const existingLedger = isPartial
    ? await readExistingLedger(context.manifest.campaign)
    : null;
  const ledgerEntries = reconcileLedgerEntries(existingLedger?.assets, entries, {
    isPartial,
  });
  const ledger = {
    schemaVersion: 2,
    campaign: context.manifest.campaign,
    status: ledgerStatus(ledgerEntries),
    generatedAt: new Date().toISOString(),
    latestRenderMode: renderMode,
    nodeVersion: process.version,
    chromeExecutable: chrome,
    chromeVersion,
    manifest: path.relative(repoRoot, manifestPath).replaceAll("\\", "/"),
    assets: ledgerEntries,
  };
  await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
  console.log(
    `ledger ${path.relative(repoRoot, ledgerPath)} (${entries.length} updated, ${ledgerEntries.length} total assets)`,
  );
};

const runPreview = async ({ context, port, renderMode }) => {
  const { server, port: actualPort } = await startStudioServer(context, port, renderMode);
  console.log(`Golden Relay studio (${renderMode}): http://127.0.0.1:${actualPort}/`);
  console.log(
    renderMode === "draft"
      ? "Technical preview only; no files are published or deployed."
      : "Final-candidate preview only; publication still requires explicit approval.",
  );
  const stop = () => server.close(() => process.exit(0));
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
};

const printHelp = () => {
  console.log(`Usage:
  node scripts/store-studio.mjs validate
  node scripts/store-studio.mjs preview [--port=4179] [--mode=draft|final]
  node scripts/store-studio.mjs render [--id=asset-id] [--mode=draft|final]

Draft mode is the default. Final mode always requires the explicit --mode=final flag.`);
};

const validateCommandOptions = (command, options) => {
  const allowedByCommand = {
    help: new Set(["help"]),
    validate: new Set(["help"]),
    preview: new Set(["help", "port", "mode"]),
    render: new Set(["help", "id", "mode"]),
  };
  const allowed = allowedByCommand[command];
  if (!allowed) {
    throw new Error(`Unknown command: ${command}`);
  }
  for (const option of options.keys()) {
    if (!allowed.has(option)) {
      throw new Error(`Unknown option for ${command}: --${option}`);
    }
  }
};

const main = async () => {
  const { command, options } = parseArgs(process.argv.slice(2));
  validateCommandOptions(command, options);
  if (command === "help" || options.has("help")) {
    printHelp();
    return;
  }
  const context = await loadContext();
  await validateContext(context);
  const { chrome, chromeVersion } = commandRequiresChrome(command)
    ? resolveChrome()
    : { chrome: null, chromeVersion: null };
  console.log(
    chromeVersion
      ? `validated Golden Relay studio with ${chromeVersion}`
      : "validated Golden Relay studio preview; Chrome is not required",
  );

  if (command === "validate") {
    return;
  }
  if (command === "preview") {
    const renderMode = parseRenderMode(options.get("mode"));
    const port = Number(options.get("port") ?? 4179);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid preview port: ${options.get("port")}`);
    }
    assertAssetsReadyForMode(context.manifest.assets, renderMode);
    await runPreview({ context, port, renderMode });
    return;
  }
  if (command === "render") {
    const renderMode = parseRenderMode(options.get("mode"));
    const onlyId = options.get("id");
    if (options.has("id") && (typeof onlyId !== "string" || onlyId.trim() === "")) {
      throw new Error("--id requires an asset id, for example --id=gp-phone-en-01-voice-draft.");
    }
    await runRender({
      context,
      chrome,
      chromeVersion,
      onlyId,
      renderMode,
    });
    return;
  }
  throw new Error(`Unknown command: ${command}`);
};

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
