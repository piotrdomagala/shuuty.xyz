import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  assertAssetsReadyForMode,
  assetOutputForMode,
  commandRequiresChrome,
  copyApprovedIconsForRenderMode,
  parseRenderMode,
  reconcileLedgerEntries,
  resetFinalExportsForFullRender,
  validateCaptureRect,
  validateFeatureCopyContract,
  validateFeatureSourceContract,
  validatePhoneDeviceSet,
  validatePhoneMatrix,
  validateOutputPath,
  windowsPowerShellPath,
} from "./store-studio.mjs";
import {
  renderAssetDocument,
  renderPreviewIndex,
} from "../store-listing/studio/template.mjs";

test("only renderer commands require a local Chrome installation", () => {
  assert.equal(commandRequiresChrome("preview"), false);
  assert.equal(commandRequiresChrome("validate"), true);
  assert.equal(commandRequiresChrome("render"), true);
});

const campaign = {
  locales: ["pl-PL", "en-US"],
  storeAssets: {
    googlePlayFeatureGraphic: {
      altText: {
        "pl-PL": "Polski opis grafiki.",
        "en-US": "English feature graphic description.",
      },
      steps: {
        "pl-PL": ["Powiedz.", "Deleguj.", "Działajcie."],
        "en-US": ["Say it.", "Delegate it.", "Get it done."],
      },
    },
  },
  screenshots: [
    {
      id: "voice",
      headline: { "en-US": "Say it." },
      altText: { "en-US": "Voice task capture." },
    },
  ],
};

const phoneAsset = {
  id: "phone",
  kind: "phone",
  status: "technical-draft",
  platform: "google-play",
  locale: "en-US",
  deviceSlot: "phone",
  screenshotId: "voice",
  stage: { index: 1, total: 3 },
  source: { path: "source.png", locale: "en-US" },
  objectPosition: "50% 100%",
  width: 1080,
  height: 1920,
  captureRect: { x: 27, y: 219, width: 1024, height: 1688 },
  output: "store-listing/exports/drafts/google-play/en-US/phone/phone-DRAFT.png",
  finalOutput: "store-listing/exports/final/google-play/en-US/phone/phone.png",
};

const templateContext = {
  asset: phoneAsset,
  campaign,
  tokens: {
    background: "#000000",
    panel: "#111111",
    ink: "#ffffff",
    muted: "#aaaaaa",
    gold: "#ffe5a0",
    goldStrong: "#f4c95d",
  },
  brandMark: { path: "brand.png" },
  assetDataUrls: {
    "source.png": "data:image/png;base64,source",
    "brand.png": "data:image/png;base64,brand",
  },
  studioCss: ".phone-capture{left:var(--capture-x)}",
};

test("only final rendering copies approved store icons byte-for-byte", async () => {
  const rootDir = await mkdtemp(path.join(tmpdir(), "shuuty-store-icons-"));
  const iconCampaign = {
    storeAssets: {
      appStoreIcon: {
        source: "approved/app-icon-1024.png",
        status: "final-ready",
      },
      googlePlayIcon: {
        source: "approved/app-icon-512.png",
        status: "final-ready",
      },
    },
  };
  const appStoreBytes = Buffer.from("approved-app-store-icon");
  const googlePlayBytes = Buffer.from("approved-google-play-icon");

  try {
    await mkdir(path.join(rootDir, "approved"), { recursive: true });
    await writeFile(path.join(rootDir, "approved", "app-icon-1024.png"), appStoreBytes);
    await writeFile(path.join(rootDir, "approved", "app-icon-512.png"), googlePlayBytes);

    assert.deepEqual(
      await copyApprovedIconsForRenderMode({
        campaign: iconCampaign,
        renderMode: "draft",
        rootDir,
      }),
      [],
    );
    await assert.rejects(
      readFile(
        path.join(
          rootDir,
          "store-listing",
          "exports",
          "final",
          "app-store",
          "icon",
          "app-icon-1024.png",
        ),
      ),
      { code: "ENOENT" },
    );

    const copied = await copyApprovedIconsForRenderMode({
      campaign: iconCampaign,
      renderMode: "final",
      rootDir,
    });
    assert.deepEqual(
      copied.map(({ key, output }) => ({ key, output })),
      [
        {
          key: "appStoreIcon",
          output: "store-listing/exports/final/app-store/icon/app-icon-1024.png",
        },
        {
          key: "googlePlayIcon",
          output: "store-listing/exports/final/google-play/icon/app-icon-512.png",
        },
      ],
    );
    assert.deepEqual(
      await readFile(path.join(rootDir, ...copied[0].output.split("/"))),
      appStoreBytes,
    );
    assert.deepEqual(
      await readFile(path.join(rootDir, ...copied[1].output.split("/"))),
      googlePlayBytes,
    );
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("only a full final render clears the final export root", async () => {
  const rootDir = await mkdtemp(path.join(tmpdir(), "shuuty-store-final-reset-"));
  const finalAsset = path.join(rootDir, "store-listing", "exports", "final", "stale.png");
  const draftAsset = path.join(rootDir, "store-listing", "exports", "drafts", "keep.png");
  const siblingAsset = path.join(rootDir, "store-listing", "exports", "final-backup", "keep.png");

  try {
    for (const target of [finalAsset, draftAsset, siblingAsset]) {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, "fixture");
    }

    assert.equal(
      await resetFinalExportsForFullRender({ renderMode: "final", onlyId: "one", rootDir }),
      false,
    );
    assert.equal(
      await resetFinalExportsForFullRender({ renderMode: "final", onlyId: "", rootDir }),
      false,
    );
    assert.equal(
      await resetFinalExportsForFullRender({ renderMode: "draft", rootDir }),
      false,
    );
    assert.equal(await readFile(finalAsset, "utf8"), "fixture");

    assert.equal(
      await resetFinalExportsForFullRender({ renderMode: "final", rootDir }),
      true,
    );
    await assert.rejects(readFile(finalAsset), { code: "ENOENT" });
    assert.equal(await readFile(draftAsset, "utf8"), "fixture");
    assert.equal(await readFile(siblingAsset, "utf8"), "fixture");
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("Windows PowerShell is resolved without searching PATH", () => {
  assert.equal(
    windowsPowerShellPath("C:\\Windows"),
    "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
  );
  assert.throws(() => windowsPowerShellPath("Windows"), /absolute Windows path/);
});

test("draft is the safe default and final must be explicit", () => {
  assert.equal(parseRenderMode(undefined), "draft");
  assert.equal(parseRenderMode("final"), "final");
  assert.throws(() => parseRenderMode(true), /Invalid render mode/);
  assert.throws(() => parseRenderMode("publication"), /Invalid render mode/);
});

test("final outputs cannot point at draft directories or filenames", () => {
  assert.equal(assetOutputForMode(phoneAsset, "final"), phoneAsset.finalOutput);
  assert.doesNotThrow(() => validateOutputPath(phoneAsset, "final"));
  assert.throws(
    () =>
      validateOutputPath(
        { ...phoneAsset, finalOutput: "store-listing/exports/drafts/google-play/phone.png" },
        "final",
      ),
    /outside|draft path/,
  );
  assert.throws(
    () =>
      validateOutputPath(
        { ...phoneAsset, finalOutput: "store-listing/exports/final/google-play/phone-DRAFT.png" },
        "final",
      ),
    /draft path or filename/,
  );
});

test("draft and final output paths bind platform, locale, and device slot", () => {
  const invalidPaths = [
    ["draft", "output", "store-listing/exports/drafts/app-store/en-US/phone/phone-DRAFT.png"],
    ["draft", "output", "store-listing/exports/drafts/google-play/pl-PL/phone/phone-DRAFT.png"],
    ["draft", "output", "store-listing/exports/drafts/google-play/en-US/tablet/phone-DRAFT.png"],
    ["final", "finalOutput", "store-listing/exports/final/app-store/en-US/phone/phone.png"],
    ["final", "finalOutput", "store-listing/exports/final/google-play/pl-PL/phone/phone.png"],
    ["final", "finalOutput", "store-listing/exports/final/google-play/en-US/tablet/phone.png"],
  ];

  for (const [renderMode, outputKey, outputPath] of invalidPaths) {
    assert.throws(
      () => validateOutputPath({ ...phoneAsset, [outputKey]: outputPath }, renderMode),
      /must be inside store-listing\/exports\/(?:drafts|final)\/google-play\/en-US\/phone/,
    );
  }
});

test("feature output paths bind their kind directory in both modes", () => {
  const featureAsset = {
    ...phoneAsset,
    id: "feature",
    kind: "feature",
    deviceSlot: "feature-graphic",
    output: "store-listing/exports/drafts/google-play/en-US/feature/feature-DRAFT.png",
    finalOutput: "store-listing/exports/final/google-play/en-US/feature/feature.png",
  };

  assert.doesNotThrow(() => validateOutputPath(featureAsset, "draft"));
  assert.doesNotThrow(() => validateOutputPath(featureAsset, "final"));
  assert.throws(
    () =>
      validateOutputPath(
        {
          ...featureAsset,
          output: "store-listing/exports/drafts/google-play/en-US/feature-graphic/feature-DRAFT.png",
        },
        "draft",
      ),
    /must be inside store-listing\/exports\/drafts\/google-play\/en-US\/feature/,
  );
  assert.throws(
    () =>
      validateOutputPath(
        {
          ...featureAsset,
          finalOutput: "store-listing/exports/final/google-play/en-US/phone/feature.png",
        },
        "final",
      ),
    /must be inside store-listing\/exports\/final\/google-play\/en-US\/feature/,
  );
});

test("final rendering rejects technical drafts and source gaps", () => {
  assert.doesNotThrow(() => assertAssetsReadyForMode([phoneAsset], "draft"));
  assert.throws(() => assertAssetsReadyForMode([phoneAsset], "final"), /final-ready/);
  assert.throws(
    () =>
      assertAssetsReadyForMode(
        [{ ...phoneAsset, status: "final-ready", sourceGap: "missing clean capture" }],
        "final",
      ),
    /source gap/,
  );
  assert.doesNotThrow(() =>
    assertAssetsReadyForMode([{ ...phoneAsset, status: "final-ready" }], "final"),
  );
  assert.throws(
    () =>
      assertAssetsReadyForMode(
        [{ ...phoneAsset, status: "final-ready", requiresRelayArtwork: true }],
        "final",
      ),
    /real raster relay artwork/,
  );
  assert.doesNotThrow(() =>
    assertAssetsReadyForMode(
      [
        {
          ...phoneAsset,
          status: "final-ready",
          requiresRelayArtwork: true,
          relayArtwork: { path: "relay.png" },
        },
      ],
      "final",
    ),
  );
});

test("captureRect controls bounded output geometry", () => {
  assert.equal(validateCaptureRect(phoneAsset), (1024 * 1688) / (1080 * 1920));
  assert.throws(
    () => validateCaptureRect({ ...phoneAsset, captureRect: { x: 900, y: 0, width: 300, height: 100 } }),
    /inside its canvas/,
  );

  const html = renderAssetDocument(templateContext);
  assert.match(html, /--capture-x: 27px/);
  assert.match(html, /--capture-y: 219px/);
  assert.match(html, /--capture-width: 1024px/);
  assert.match(html, /--capture-height: 1688px/);
  assert.match(html, /--layout-scale: 1/);

  const appStoreHtml = renderAssetDocument({
    ...templateContext,
    asset: { ...phoneAsset, layoutScale: 1.222222, headlineSize: 96 },
  });
  assert.match(appStoreHtml, /--layout-scale: 1\.222222/);
  assert.match(appStoreHtml, /class="canvas phone-canvas"[^>]+--headline-size: 96px/);
});

test("final document contains no technical-draft burn-in", () => {
  const draftHtml = renderAssetDocument({ ...templateContext, renderMode: "draft" });
  const finalHtml = renderAssetDocument({ ...templateContext, renderMode: "final" });
  assert.match(draftHtml, /Technical draft/);
  assert.doesNotMatch(finalHtml, /technical draft/i);
  assert.doesNotMatch(finalHtml, /draft-status/);
});

test("missing relay artwork is not replaced with CSS or div art", () => {
  const html = renderAssetDocument(templateContext);
  assert.doesNotMatch(html, /relay-track|feature-relay/);
  assert.doesNotMatch(html, /class="relay-artwork"/);
});

test("feature copy validates locale and localized alt text", () => {
  const feature = {
    id: "feature-en",
    kind: "feature",
    locale: "en-US",
    storeAssetId: "googlePlayFeatureGraphic",
    sources: [{ locale: "en-US" }, { locale: "en-US" }, { locale: "en-US" }],
  };
  const copy = validateFeatureCopyContract(feature, campaign);
  assert.equal(copy.altText, "English feature graphic description.");
  assert.deepEqual(copy.localizedAltText, campaign.storeAssets.googlePlayFeatureGraphic.altText);

  assert.throws(
    () => validateFeatureCopyContract({ ...feature, locale: "de-DE" }, campaign),
    /unsupported locale/,
  );
  assert.throws(
    () =>
      validateFeatureCopyContract(
        { ...feature, sources: [{ locale: "pl-PL" }] },
        campaign,
      ),
    /does not match/,
  );
  assert.throws(
    () =>
      validateFeatureCopyContract(feature, {
        ...campaign,
        storeAssets: {
          googlePlayFeatureGraphic: { altText: { "en-US": "English only." } },
        },
      }),
    /missing pl-PL alt text/,
  );
});

test("complete feature raster is localization-independent and final-ready", () => {
  const feature = {
    id: "feature-raster",
    kind: "feature",
    status: "final-ready",
    requiresRelayArtwork: false,
    locale: "localization-independent",
    storeAssetId: "googlePlayFeatureGraphic",
    source: {
      path: "feature.png",
      locale: "localization-independent",
      expectedWidth: 1024,
      expectedHeight: 500,
    },
    width: 1024,
    height: 500,
  };

  assert.deepEqual(validateFeatureSourceContract(feature), {
    mode: "complete-raster",
    sources: [feature.source],
  });
  assert.equal(validateFeatureCopyContract(feature, campaign).altText, "English feature graphic description.");
  assert.doesNotThrow(() => assertAssetsReadyForMode([feature], "final"));

  const html = renderAssetDocument({
    ...templateContext,
    asset: feature,
    assetDataUrls: { "feature.png": "data:image/png;base64,feature" },
    renderMode: "final",
  });
  assert.match(html, /class="feature-raster"/);
  assert.match(html, /data:image\/png;base64,feature/);
  assert.doesNotMatch(html, /feature-panels|feature-panel|relay-artwork/);
  assert.doesNotMatch(html, /technical draft/i);

  assert.throws(
    () => validateFeatureSourceContract({ ...feature, locale: "en-US" }),
    /localization-independent/,
  );
  assert.throws(
    () => validateFeatureSourceContract({ ...feature, width: 1080 }),
    /1024×500/,
  );
  assert.throws(
    () => validateFeatureSourceContract({ ...feature, status: "technical-draft" }),
    /final-ready/,
  );
  assert.throws(
    () => validateFeatureSourceContract({ ...feature, sourceGap: "art pending" }),
    /source gap/,
  );
  assert.throws(
    () => validateFeatureSourceContract({ ...feature, requiresRelayArtwork: true }),
    /requiresRelayArtwork to false/,
  );
  assert.throws(
    () => validateFeatureSourceContract({ ...feature, sources: [{ locale: "en-US" }] }),
    /cannot mix/,
  );
});

test("localized product-proof feature is final-ready and rejects unclassified panels", () => {
  const productProofFeature = {
    id: "product-proof-feature",
    kind: "feature",
    composition: "product-proof",
    status: "final-ready",
    requiresRelayArtwork: true,
    locale: "en-US",
    storeAssetId: "googlePlayFeatureGraphic",
    width: 1024,
    height: 500,
    sources: [
      {
        role: "voice",
        path: "voice.png",
        locale: "en-US",
        expectedWidth: 1080,
        expectedHeight: 2400,
        objectPosition: "50% 68%",
      },
      {
        role: "assignee",
        path: "assignee.png",
        locale: "en-US",
        expectedWidth: 1080,
        expectedHeight: 2400,
        objectPosition: "50% 44%",
      },
      {
        role: "task",
        path: "task.png",
        locale: "en-US",
        expectedWidth: 1080,
        expectedHeight: 2400,
        objectPosition: "50% 5%",
      },
    ],
    relayArtwork: {
      path: "relay.png",
      rect: { x: 120, y: 180, width: 840, height: 105 },
    },
  };

  assert.deepEqual(validateFeatureSourceContract(productProofFeature), {
    mode: "product-proof",
    sources: productProofFeature.sources,
  });
  assert.equal(
    validateFeatureCopyContract(productProofFeature, campaign).steps[1],
    "Delegate it.",
  );
  assert.doesNotThrow(() => assertAssetsReadyForMode([productProofFeature], "final"));

  const html = renderAssetDocument({
    ...templateContext,
    asset: productProofFeature,
    assetDataUrls: {
      "voice.png": "data:image/png;base64,voice",
      "assignee.png": "data:image/png;base64,assignee",
      "task.png": "data:image/png;base64,task",
      "relay.png": "data:image/png;base64,relay",
      "brand.png": "data:image/png;base64,brand",
    },
    renderMode: "final",
  });
  assert.match(html, /feature-product-proof/);
  assert.match(html, /feature-proof-card-voice/);
  assert.match(html, /Say it\./);
  assert.match(html, /Delegate it\./);
  assert.match(html, /Get it done\./);
  assert.doesNotMatch(html, /technical draft/i);

  assert.throws(
    () =>
      validateFeatureSourceContract({
        ...productProofFeature,
        composition: undefined,
      }),
    /product-proof composition/,
  );
});

test("partial render ledger reconciliation preserves unrelated entries", () => {
  const existing = [
    { id: "first", renderMode: "draft", sha256: "old" },
    { id: "second", renderMode: "draft", sha256: "keep" },
    { id: "first", renderMode: "final", sha256: "final-keep" },
  ];
  const merged = reconcileLedgerEntries(
    existing,
    [{ id: "first", renderMode: "draft", sha256: "new" }],
    { isPartial: true },
  );
  assert.equal(merged.length, 3);
  assert.equal(
    merged.find((entry) => entry.id === "first" && entry.renderMode === "draft").sha256,
    "new",
  );
  assert.equal(
    merged.find((entry) => entry.id === "second" && entry.renderMode === "draft").sha256,
    "keep",
  );
  assert.equal(
    merged.find((entry) => entry.id === "first" && entry.renderMode === "final").sha256,
    "final-keep",
  );
});

test("full render rebuilds the complete ledger while partial render remains additive", () => {
  const existing = [
    { id: "legacy-draft", sha256: "legacy" },
    { id: "stale-draft", renderMode: "draft", sha256: "stale" },
    { id: "stale-final", renderMode: "final", sha256: "final-stale" },
  ];

  assert.deepEqual(
    reconcileLedgerEntries(
      existing,
      [{ id: "current-draft", renderMode: "draft", sha256: "current" }],
      { isPartial: false },
    ).map(({ id, renderMode }) => [id, renderMode ?? "draft"]),
    [["current-draft", "draft"]],
  );

  assert.deepEqual(
    reconcileLedgerEntries(
      existing,
      [{ id: "current-final", renderMode: "final", sha256: "current" }],
      { isPartial: false },
    ).map(({ id, renderMode }) => [id, renderMode ?? "draft"]),
    [["current-final", "final"]],
  );
});

const createPhoneMatrixFixture = () => {
  const sequence = [
    "01-voice-input",
    "02-assignee",
    "03-delegated",
    "04-groups",
    "05-product-group",
    "06-group-settings",
    "07-booking-calendar",
    "08-discover",
  ];
  const matrixCampaign = {
    locales: ["pl-PL", "en-US"],
    deviceSets: {
      appStoreIphone69: { width: 1320, height: 2868 },
      googlePlayPhone: { width: 1080, height: 1920 },
    },
    coveragePlan: {
      primaryPhoneNarrative: sequence,
      themeProof: {
        darkSlots: sequence.slice(0, 5),
        lightSlots: sequence.slice(5),
      },
    },
  };
  const platforms = [
    { platform: "google-play", deviceSlot: "phone", width: 1080, height: 1920 },
    { platform: "app-store", deviceSlot: "iphone-6.9", width: 1320, height: 2868 },
  ];
  const assets = platforms.flatMap(({ platform, deviceSlot, width, height }) =>
    matrixCampaign.locales.flatMap((locale) =>
      sequence.map((screenshotId, index) => ({
        id: `${platform}-${locale}-${index + 1}`,
        kind: "phone",
        platform,
        deviceSlot,
        width,
        height,
        locale,
        screenshotId,
        theme: index < 5 ? "dark" : "light",
        stage: { index: index + 1, total: 8 },
      })),
    ),
  );

  return { assets, matrixCampaign };
};

test("phone matrix requires App Store delivery assets", () => {
  const { assets, matrixCampaign } = createPhoneMatrixFixture();
  assert.throws(
    () => validatePhoneMatrix(assets.filter((asset) => asset.platform !== "app-store"), matrixCampaign),
    /app-store.*16 total.*found 0/,
  );
});

test("phone matrix requires Google Play delivery assets", () => {
  const { assets, matrixCampaign } = createPhoneMatrixFixture();
  assert.throws(
    () => validatePhoneMatrix(assets.filter((asset) => asset.platform !== "google-play"), matrixCampaign),
    /google-play.*16 total.*found 0/,
  );
});

test("phone matrix validates every platform independently with localized ordered slots", () => {
  const { assets, matrixCampaign } = createPhoneMatrixFixture();

  assert.doesNotThrow(() => validatePhoneMatrix(assets, matrixCampaign));
  assert.equal(assets.length, 32);
  assert.throws(
    () => validatePhoneMatrix(assets.filter((asset) => asset.id !== "app-store-pl-PL-1"), matrixCampaign),
    /app-store.*16 total.*found 15/,
  );
  assert.throws(
    () => validatePhoneMatrix(
      assets.map((asset, index) => index === 5 ? { ...asset, theme: "dark" } : asset),
      matrixCampaign,
    ),
    /declared matrix theme/,
  );
  assert.throws(
    () => validatePhoneMatrix(
      assets.map((asset, index) => index === 0 ? { ...asset, platform: "" } : asset),
      matrixCampaign,
    ),
    /must declare a platform/,
  );
  assert.throws(
    () => validatePhoneMatrix(
      assets.map((asset, index) => index === 0 ? { ...asset, width: 1079 } : asset),
      matrixCampaign,
    ),
    /googlePlayPhone requires 1080×1920/,
  );
  assert.throws(
    () => validatePhoneDeviceSet({ ...assets[0], deviceSlot: "tablet" }, matrixCampaign),
    /no campaign device set for google-play\/tablet/,
  );
});

test("source placeholders remain visible in the studio index but cannot render", () => {
  const placeholder = {
    ...phoneAsset,
    id: "pending-phone",
    source: { ...phoneAsset.source, path: null },
    sourceGap: "Clean capture pending.",
  };
  assert.throws(
    () => renderAssetDocument({ ...templateContext, asset: placeholder }),
    /placeholder cannot be rendered/,
  );

  const index = renderPreviewIndex({
    assets: [placeholder, phoneAsset],
    campaignHeadline: "Golden Relay",
  });
  assert.match(index, /pending-phone/);
  assert.match(index, /source capture pending/);
  assert.doesNotMatch(index, /href="\/render\/pending-phone"/);
  assert.match(index, /href="\/render\/phone"/);
});
