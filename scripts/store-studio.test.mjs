import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAssetsReadyForMode,
  assetOutputForMode,
  mergeLedgerEntries,
  parseRenderMode,
  validateCaptureRect,
  validateFeatureCopyContract,
  validateFeatureSourceContract,
  validatePhoneMatrix,
  validateOutputPath,
} from "./store-studio.mjs";
import {
  renderAssetDocument,
  renderPreviewIndex,
} from "../store-listing/studio/template.mjs";

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
  screenshotId: "voice",
  stage: { index: 1, total: 3 },
  source: { path: "source.png", locale: "en-US" },
  objectPosition: "50% 100%",
  width: 1080,
  height: 1920,
  captureRect: { x: 27, y: 219, width: 1024, height: 1688 },
  output: "store-listing/exports/drafts/google-play/en-US/phone-DRAFT.png",
  finalOutput: "store-listing/exports/final/google-play/en-US/phone.png",
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

test("partial render ledger merge preserves unrelated entries", () => {
  const existing = [
    { id: "first", renderMode: "draft", sha256: "old" },
    { id: "second", renderMode: "draft", sha256: "keep" },
    { id: "first", renderMode: "final", sha256: "final-keep" },
  ];
  const merged = mergeLedgerEntries(existing, [
    { id: "first", renderMode: "draft", sha256: "new" },
  ]);
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

test("phone matrix validates every platform independently with localized ordered slots", () => {
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
    coveragePlan: {
      primaryPhoneNarrative: sequence,
      themeProof: {
        darkSlots: sequence.slice(0, 5),
        lightSlots: sequence.slice(5),
      },
    },
  };
  const platforms = ["google-play", "app-store"];
  const assets = platforms.flatMap((platform) =>
    matrixCampaign.locales.flatMap((locale) =>
      sequence.map((screenshotId, index) => ({
        id: `${platform}-${locale}-${index + 1}`,
        kind: "phone",
        platform,
        locale,
        screenshotId,
        theme: index < 5 ? "dark" : "light",
        stage: { index: index + 1, total: 8 },
      })),
    ),
  );

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
