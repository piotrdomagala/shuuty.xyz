import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import pngjs from "pngjs";
import {
  collectPackageInputs,
  createDeterministicZip,
  readDeterministicZip,
  verifyStorePackage,
  writeStorePackage,
} from "./store-package.mjs";

const { PNG } = pngjs;

const LOCALES = ["en-US", "pl-PL"];
const NARRATIVE = [
  "01-voice",
  "02-assignee",
  "03-task",
  "04-groups",
  "05-offer",
  "06-modules",
  "07-bookings",
  "08-discover",
];

function digest(data) {
  return createHash("sha256").update(data).digest("hex");
}

function png(width, height, marker, colorType = 2) {
  const buffer = Buffer.alloc(40 + Buffer.byteLength(marker));
  Buffer.from("89504e470d0a1a0a", "hex").copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  buffer[24] = 8;
  buffer[25] = colorType;
  buffer.write(marker, 40, "utf8");
  return buffer;
}

function validIconPng(width, height, colorType, alpha = 255) {
  const image = new PNG({ width, height });
  for (let offset = 0; offset < image.data.length; offset += 4) {
    image.data[offset] = 8;
    image.data[offset + 1] = 12;
    image.data[offset + 2] = 24;
    image.data[offset + 3] = alpha;
  }
  return PNG.sync.write(image, {
    colorType,
    inputColorType: 6,
    inputHasAlpha: true,
  });
}

const APP_ICON_PNG = validIconPng(1024, 1024, 2);
const PLAY_ICON_PNG = validIconPng(512, 512, 6);

function validMetadata(locale) {
  return {
    locale,
    appStore: {
      name: "Shuuty",
      subtitle: "Voice tasks",
      promotionalText: "Say it. Delegate it. Get it done.",
      keywords: "voice,tasks,groups",
      description: "Create and delegate tasks with full context.",
      whatsNew: "Improved voice tasks and group workflows.",
      marketingUrl: "https://shuuty.com/",
      supportUrl: "https://shuuty.com/support/",
      privacyPolicyUrl: "https://shuuty.com/privacy/",
      termsOfUseUrl: "https://shuuty.com/terms/",
    },
    googlePlay: {
      appName: "Shuuty",
      shortDescription: "Create and delegate voice tasks.",
      fullDescription: "Create and delegate tasks with full context.",
      releaseNotes: "Improved voice tasks and group workflows.",
    },
  };
}

async function writeRepoFile(rootDir, relativePath, data) {
  const absolutePath = path.join(rootDir, ...relativePath.split("/"));
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, data);
  return absolutePath;
}

async function writeJson(rootDir, relativePath, value) {
  return writeRepoFile(rootDir, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function createFixture() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "shuuty-store-package-"));
  const sourcePaths = new Map();
  for (const locale of LOCALES) {
    for (const screenshotId of NARRATIVE) {
      const sourcePath = `store-listing/assets/source/${locale}/${screenshotId}.png`;
      const data = png(1080, 2400, `${locale}-${screenshotId}-source`);
      await writeRepoFile(rootDir, sourcePath, data);
      sourcePaths.set(`${locale}:${screenshotId}`, { path: sourcePath, data });
    }
  }
  const relayPath = "store-listing/assets/brand/relay.png";
  const brandPath = "store-listing/assets/brand/icon.png";
  await writeRepoFile(rootDir, relayPath, png(2048, 256, "relay"));
  await writeRepoFile(rootDir, brandPath, png(1024, 1024, "brand"));
  await writeRepoFile(rootDir, "store-listing/studio/template.mjs", "export {};\n");
  await writeRepoFile(rootDir, "store-listing/studio/studio.css", ":root {}\n");
  await writeRepoFile(
    rootDir,
    "store-listing/console-change-set-template.md",
    "# Console change set\n",
  );
  await writeRepoFile(rootDir, "store-listing/upload-checklist.md", "# Upload checklist\n");
  await writeJson(rootDir, "store-listing/provenance/media-assets.json", {
    schemaVersion: 1,
    status: "owner-attested",
    assets: [],
  });
  await writeRepoFile(
    rootDir,
    "store-listing/provenance/google-play-artifact-evidence.md",
    "# Google Play artifact evidence\n",
  );
  await writeRepoFile(
    rootDir,
    "store-listing/provenance/owner-attestation.md",
    "# Owner attestation\n",
  );

  const appIconSource = "store-listing/assets/store/app-store/app-icon-1024.png";
  const playIconSource = "store-listing/assets/store/google-play/app-icon-512.png";
  const appIcon = APP_ICON_PNG;
  const playIcon = PLAY_ICON_PNG;
  await writeRepoFile(rootDir, appIconSource, appIcon);
  await writeRepoFile(rootDir, playIconSource, playIcon);
  await writeRepoFile(
    rootDir,
    "store-listing/exports/final/app-store/icon/app-icon-1024.png",
    appIcon,
  );
  await writeRepoFile(
    rootDir,
    "store-listing/exports/final/google-play/icon/app-icon-512.png",
    playIcon,
  );

  const captureManifest = {
    schemaVersion: 3,
    campaign: "official-2026",
    locales: ["pl-PL", "en-US"],
    deviceSets: {
      appStoreIphone69: { requiredCaptures: 8, locales: ["pl-PL", "en-US"] },
      googlePlayPhone: { requiredCaptures: 8, locales: ["pl-PL", "en-US"] },
    },
    storeAssets: {
      appStoreIcon: {
        source: appIconSource,
        status: "final-ready",
        width: 1024,
        height: 1024,
        bitDepth: 8,
        alpha: false,
      },
      googlePlayIcon: {
        source: playIconSource,
        status: "final-ready",
        width: 512,
        height: 512,
        maxBytes: 1_048_576,
        bitDepth: 8,
        alpha: true,
        opaque: true,
      },
      googlePlayFeatureGraphic: {
        localization: "per-locale",
        width: 1024,
        height: 500,
        outputs: {
          "en-US": "store-listing/exports/final/google-play/en-US/feature/product-proof.png",
          "pl-PL": "store-listing/exports/final/google-play/pl-PL/feature/product-proof.png",
        },
      },
    },
    coveragePlan: { primaryPhoneNarrative: NARRATIVE },
  };

  const assets = [];
  for (const platform of ["app-store", "google-play"]) {
    for (const locale of LOCALES) {
      for (const [index, screenshotId] of NARRATIVE.entries()) {
        const source = sourcePaths.get(`${locale}:${screenshotId}`);
        const deviceSlot = platform === "app-store" ? "iphone-6.9" : "phone";
        const width = platform === "app-store" ? 1320 : 1080;
        const height = platform === "app-store" ? 2868 : 1920;
        const output = `store-listing/exports/final/${platform}/${locale}/${deviceSlot}/${String(index + 1).padStart(2, "0")}.png`;
        const outputData = png(width, height, `${platform}-${locale}-${screenshotId}-output`);
        await writeRepoFile(rootDir, output, outputData);
        assets.push({
          id: `${platform}-${locale}-${screenshotId}`,
          kind: "phone",
          status: "final-ready",
          platform,
          deviceSlot,
          locale,
          screenshotId,
          stage: { index: index + 1, total: 8 },
          source: {
            path: source.path,
            locale,
            expectedWidth: 1080,
            expectedHeight: 2400,
          },
          width,
          height,
          finalOutput: output,
          _outputData: outputData,
        });
      }
    }
  }

  for (const locale of LOCALES) {
    const featureSources = NARRATIVE.slice(0, 3).map((screenshotId, index) => {
      const source = sourcePaths.get(`${locale}:${screenshotId}`);
      return {
        role: ["voice", "assignee", "task"][index],
        path: source.path,
        locale,
        expectedWidth: 1080,
        expectedHeight: 2400,
      };
    });
    const output = `store-listing/exports/final/google-play/${locale}/feature/product-proof.png`;
    const outputData = png(1024, 500, `${locale}-feature-output`);
    await writeRepoFile(rootDir, output, outputData);
    assets.push({
      id: `google-play-${locale}-feature`,
      kind: "feature",
      composition: "product-proof",
      status: "final-ready",
      platform: "google-play",
      deviceSlot: "feature-graphic",
      locale,
      storeAssetId: "googlePlayFeatureGraphic",
      sources: featureSources,
      relayArtwork: { path: relayPath },
      width: 1024,
      height: 500,
      finalOutput: output,
      _outputData: outputData,
    });
  }

  const renderManifest = {
    schemaVersion: 3,
    campaign: "official-2026-golden-relay",
    status: "final-ready",
    brandMark: { path: brandPath },
    fonts: [],
    assets: assets.map(({ _outputData, ...asset }) => asset),
  };
  const ledger = {
    schemaVersion: 2,
    campaign: renderManifest.campaign,
    generatedAt: "2030-01-01T00:00:00.000Z",
    latestRenderMode: "final",
    manifest: "store-listing/studio/render-manifest.json",
    assets: assets.map((asset) => ({
      id: asset.id,
      renderMode: "final",
      status: "final-candidate",
      sourceGap: null,
      output: asset.finalOutput,
      sha256: digest(asset._outputData),
      bytes: asset._outputData.length,
      width: asset.width,
      height: asset.height,
      pngColorType: 2,
      alpha: false,
      sources: (asset.source ? [asset.source] : asset.sources).map((source) => {
        const sourceData = sourcePaths.get(`${asset.locale}:${NARRATIVE.find((id) => source.path.endsWith(`${id}.png`))}`)?.data;
        return {
          path: source.path,
          sha256: digest(sourceData),
          width: 1080,
          height: 2400,
        };
      }),
    })),
  };

  await writeJson(rootDir, "store-listing/capture-manifest.json", captureManifest);
  await writeJson(rootDir, "store-listing/studio/render-manifest.json", renderManifest);
  await writeJson(rootDir, "store-listing/delivery-ledger.json", ledger);
  for (const locale of LOCALES) {
    await writeJson(rootDir, `store-listing/metadata/${locale}.json`, validMetadata(locale));
  }

  const oldTime = new Date("2020-01-01T00:00:00.000Z");
  const newTime = new Date("2021-01-01T00:00:00.000Z");
  const renderInputs = [
    "store-listing/capture-manifest.json",
    "store-listing/studio/render-manifest.json",
    "store-listing/studio/template.mjs",
    "store-listing/studio/studio.css",
    brandPath,
    relayPath,
    appIconSource,
    playIconSource,
    ...[...sourcePaths.values()].map((source) => source.path),
  ];
  for (const relativePath of renderInputs) {
    await utimes(path.join(rootDir, ...relativePath.split("/")), oldTime, oldTime);
  }
  for (const asset of assets) {
    await utimes(path.join(rootDir, ...asset.finalOutput.split("/")), newTime, newTime);
  }

  return { rootDir, assets, sourcePaths };
}

async function withFixture(run) {
  const fixture = await createFixture();
  try {
    await run(fixture);
  } finally {
    await rm(fixture.rootDir, { recursive: true, force: true });
  }
}

async function rewriteArchiveMetadata(archivePath, locale, mutate) {
  const entries = readDeterministicZip(await readFile(archivePath));
  const metadataPath = `metadata/${locale}.json`;
  const metadataEntry = entries.find((entry) => entry.path === metadataPath);
  const packageManifestEntry = entries.find(
    (entry) => entry.path === "PACKAGE-MANIFEST.json",
  );
  assert.ok(metadataEntry);
  assert.ok(packageManifestEntry);

  const metadata = JSON.parse(metadataEntry.data.toString("utf8"));
  mutate(metadata);
  metadataEntry.data = Buffer.from(`${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  const packageManifest = JSON.parse(packageManifestEntry.data.toString("utf8"));
  const metadataFile = packageManifest.files.find((file) => file.path === metadataPath);
  assert.ok(metadataFile);
  metadataFile.bytes = metadataEntry.data.length;
  metadataFile.sha256 = digest(metadataEntry.data);
  packageManifestEntry.data = Buffer.from(
    `${JSON.stringify(packageManifest, null, 2)}\n`,
    "utf8",
  );

  await writeFile(archivePath, createDeterministicZip(entries));
}

async function swapArchiveMetadataPayloads(archivePath) {
  const entries = readDeterministicZip(await readFile(archivePath));
  const metadataPaths = LOCALES.map((locale) => `metadata/${locale}.json`);
  const metadataEntries = metadataPaths.map((metadataPath) =>
    entries.find((entry) => entry.path === metadataPath),
  );
  const packageManifestEntry = entries.find(
    (entry) => entry.path === "PACKAGE-MANIFEST.json",
  );
  assert.ok(metadataEntries.every(Boolean));
  assert.ok(packageManifestEntry);

  [metadataEntries[0].data, metadataEntries[1].data] = [
    metadataEntries[1].data,
    metadataEntries[0].data,
  ];

  const packageManifest = JSON.parse(packageManifestEntry.data.toString("utf8"));
  for (const metadataEntry of metadataEntries) {
    const metadataFile = packageManifest.files.find((file) => file.path === metadataEntry.path);
    assert.ok(metadataFile);
    metadataFile.bytes = metadataEntry.data.length;
    metadataFile.sha256 = digest(metadataEntry.data);
  }
  packageManifestEntry.data = Buffer.from(
    `${JSON.stringify(packageManifest, null, 2)}\n`,
    "utf8",
  );

  await writeFile(archivePath, createDeterministicZip(entries));
}

test("store package is deterministic and verifies against the workspace", async () => {
  await withFixture(async ({ rootDir }) => {
    const firstPath = path.join(rootDir, "first.zip");
    const secondPath = path.join(rootDir, "second.zip");
    const first = await writeStorePackage({ rootDir, archivePath: firstPath });
    const second = await writeStorePackage({ rootDir, archivePath: secondPath });
    assert.equal(first.fileCount, 46);
    assert.equal(first.sha256, second.sha256);
    assert.deepEqual(await readFile(firstPath), await readFile(secondPath));

    const entries = readDeterministicZip(await readFile(firstPath));
    const changeSetTemplate = entries.find(
      (entry) => entry.path === "release/console-change-set-template.md",
    );
    assert.equal(changeSetTemplate?.data.toString("utf8"), "# Console change set\n");
    const playEvidence = entries.find(
      (entry) => entry.path === "provenance/google-play-artifact-evidence.md",
    );
    assert.equal(playEvidence?.data.toString("utf8"), "# Google Play artifact evidence\n");

    const verified = await verifyStorePackage({ rootDir, archivePath: firstPath });
    assert.equal(verified.sha256, first.sha256);
    assert.equal(verified.fileCount, 46);
  });
});

test("package and archive-only verification reject over-limit metadata", async () => {
  const expectedFailure = /en-US App Store subtitle is 31\/30 characters/;

  await withFixture(async ({ rootDir }) => {
    const metadataPath = "store-listing/metadata/en-US.json";
    const metadata = validMetadata("en-US");
    metadata.appStore.subtitle = "x".repeat(31);
    await writeJson(rootDir, metadataPath, metadata);

    await assert.rejects(
      () => writeStorePackage({ rootDir, archivePath: path.join(rootDir, "invalid.zip") }),
      expectedFailure,
    );
  });

  await withFixture(async ({ rootDir }) => {
    const archivePath = path.join(rootDir, "forged-over-limit.zip");
    await writeStorePackage({ rootDir, archivePath });
    await rewriteArchiveMetadata(archivePath, "en-US", (metadata) => {
      metadata.appStore.subtitle = "x".repeat(31);
    });

    await assert.rejects(
      () =>
        verifyStorePackage({
          rootDir,
          archivePath,
          againstWorkspace: false,
          checkFreshness: false,
        }),
      expectedFailure,
    );
  });
});

test("package and archive-only verification reject a missing required URL", async () => {
  const expectedFailure = /en-US App Store supportUrl is required/;

  await withFixture(async ({ rootDir }) => {
    const metadataPath = "store-listing/metadata/en-US.json";
    const metadata = validMetadata("en-US");
    metadata.appStore.supportUrl = null;
    await writeJson(rootDir, metadataPath, metadata);

    await assert.rejects(
      () => writeStorePackage({ rootDir, archivePath: path.join(rootDir, "invalid.zip") }),
      expectedFailure,
    );
  });

  await withFixture(async ({ rootDir }) => {
    const archivePath = path.join(rootDir, "forged-missing-url.zip");
    await writeStorePackage({ rootDir, archivePath });
    await rewriteArchiveMetadata(archivePath, "en-US", (metadata) => {
      metadata.appStore.supportUrl = null;
    });

    await assert.rejects(
      () =>
        verifyStorePackage({
          rootDir,
          archivePath,
          againstWorkspace: false,
          checkFreshness: false,
        }),
      expectedFailure,
    );
  });
});

test("package collection binds metadata locale to its workspace filename", async () => {
  await withFixture(async ({ rootDir }) => {
    const englishPath = path.join(rootDir, "store-listing/metadata/en-US.json");
    const polishPath = path.join(rootDir, "store-listing/metadata/pl-PL.json");
    const [englishMetadata, polishMetadata] = await Promise.all([
      readFile(englishPath),
      readFile(polishPath),
    ]);
    await Promise.all([
      writeFile(englishPath, polishMetadata),
      writeFile(polishPath, englishMetadata),
    ]);

    await assert.rejects(
      () => collectPackageInputs({ rootDir, checkFreshness: false }),
      /en-US metadata declares locale pl-PL; expected en-US/,
    );
  });
});

test("archive-only verification rejects swapped metadata with forged manifest hashes", async () => {
  await withFixture(async ({ rootDir }) => {
    const archivePath = path.join(rootDir, "forged-swapped-locales.zip");
    await writeStorePackage({ rootDir, archivePath });
    await swapArchiveMetadataPayloads(archivePath);

    await assert.rejects(
      () =>
        verifyStorePackage({
          rootDir,
          archivePath,
          againstWorkspace: false,
          checkFreshness: false,
        }),
      /Embedded metadata\/en-US\.json declares locale pl-PL; expected en-US/,
    );
  });
});

test("console change-set template is mandatory", async () => {
  await withFixture(async ({ rootDir }) => {
    await rm(path.join(rootDir, "store-listing/console-change-set-template.md"));
    await assert.rejects(
      () => collectPackageInputs({ rootDir }),
      /Missing required console-change-set-template/,
    );
  });
});

test("Google Play artifact evidence is mandatory", async () => {
  await withFixture(async ({ rootDir }) => {
    await rm(path.join(rootDir, "store-listing/provenance/google-play-artifact-evidence.md"));
    await assert.rejects(
      () => collectPackageInputs({ rootDir }),
      /Missing required google-play-artifact-evidence/,
    );
  });
});

test("missing and unexpected final exports are rejected", async () => {
  await withFixture(async ({ rootDir, assets }) => {
    const missing = assets[0].finalOutput;
    await rm(path.join(rootDir, ...missing.split("/")));
    await assert.rejects(
      () => collectPackageInputs({ rootDir }),
      /Missing required .* final output/,
    );
  });

  await withFixture(async ({ rootDir }) => {
    await writeRepoFile(
      rootDir,
      "store-listing/exports/final/google-play/en-US/phone/old.png",
      png(1080, 1920, "unexpected"),
    );
    await assert.rejects(
      () => collectPackageInputs({ rootDir }),
      /unexpected: .*old\.png/,
    );
  });
});

test("ledger hash mismatches and stale render inputs are rejected", async () => {
  await withFixture(async ({ rootDir, assets }) => {
    await writeRepoFile(rootDir, assets[0].finalOutput, png(assets[0].width, assets[0].height, "changed"));
    await assert.rejects(
      () => collectPackageInputs({ rootDir }),
      /Delivery ledger hash or metadata mismatch/,
    );
  });

  await withFixture(async ({ rootDir, sourcePaths }) => {
    const source = [...sourcePaths.values()][0];
    const future = new Date("2040-01-01T00:00:00.000Z");
    await utimes(path.join(rootDir, ...source.path.split("/")), future, future);
    await assert.rejects(() => collectPackageInputs({ rootDir }), /Stale final asset/);
  });
});

test("final screenshots and ledger entries enforce RGB without alpha", async () => {
  await withFixture(async ({ rootDir, assets }) => {
    const asset = assets[0];
    const rgbaOutput = png(asset.width, asset.height, "rgba-final-output", 6);
    await writeRepoFile(rootDir, asset.finalOutput, rgbaOutput);

    const ledgerPath = "store-listing/delivery-ledger.json";
    const ledger = JSON.parse(
      await readFile(path.join(rootDir, ...ledgerPath.split("/")), "utf8"),
    );
    const entry = ledger.assets.find((candidate) => candidate.id === asset.id);
    entry.sha256 = digest(rgbaOutput);
    entry.bytes = rgbaOutput.length;
    entry.pngColorType = 6;
    entry.alpha = true;
    await writeJson(rootDir, ledgerPath, ledger);

    await assert.rejects(
      () => collectPackageInputs({ rootDir, checkFreshness: false }),
      /final output has PNG color type 6; expected RGB color type 2 with no alpha/,
    );
  });

  await withFixture(async ({ rootDir, assets }) => {
    const ledgerPath = "store-listing/delivery-ledger.json";
    const ledger = JSON.parse(
      await readFile(path.join(rootDir, ...ledgerPath.split("/")), "utf8"),
    );
    const entry = ledger.assets.find((candidate) => candidate.id === assets[0].id);
    entry.pngColorType = 6;
    entry.alpha = true;
    await writeJson(rootDir, ledgerPath, ledger);

    await assert.rejects(
      () => collectPackageInputs({ rootDir, checkFreshness: false }),
      /Delivery ledger PNG contract mismatch.*expected pngColorType 2 and alpha false/,
    );
  });
});

test("both localized Google Play feature graphics are mandatory", async () => {
  await withFixture(async ({ rootDir }) => {
    const manifestPath = path.join(rootDir, "store-listing/studio/render-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const polishFeature = manifest.assets.find(
      (asset) => asset.kind === "feature" && asset.locale === "pl-PL",
    );
    polishFeature.locale = "localization-independent";
    await writeJson(rootDir, "store-listing/studio/render-manifest.json", manifest);
    await assert.rejects(
      () => collectPackageInputs({ rootDir, checkFreshness: false }),
      /unsupported locale localization-independent/,
    );
  });
});

test("icon alpha contracts reject mismatched PNG color types", async () => {
  await withFixture(async ({ rootDir }) => {
    const rgbPlayIcon = png(512, 512, "rgb-play-icon");
    await writeRepoFile(
      rootDir,
      "store-listing/assets/store/google-play/app-icon-512.png",
      rgbPlayIcon,
    );
    await writeRepoFile(
      rootDir,
      "store-listing/exports/final/google-play/icon/app-icon-512.png",
      rgbPlayIcon,
    );
    await assert.rejects(
      () => collectPackageInputs({ rootDir, checkFreshness: false }),
      /googlePlayIcon source has PNG color type 2; expected color type 6 for alpha: true/,
    );
  });

  await withFixture(async ({ rootDir }) => {
    const rgbaAppIcon = png(1024, 1024, "rgba-app-icon", 6);
    await writeRepoFile(
      rootDir,
      "store-listing/assets/store/app-store/app-icon-1024.png",
      rgbaAppIcon,
    );
    await writeRepoFile(
      rootDir,
      "store-listing/exports/final/app-store/icon/app-icon-1024.png",
      rgbaAppIcon,
    );
    await assert.rejects(
      () => collectPackageInputs({ rootDir, checkFreshness: false }),
      /appStoreIcon source has PNG color type 6; expected color type 2 for alpha: false/,
    );
  });
});

test("icon contracts reject non-8-bit PNGs before alpha rescaling", async () => {
  await withFixture(async ({ rootDir }) => {
    const sixteenBitPlayIcon = Buffer.from(PLAY_ICON_PNG);
    sixteenBitPlayIcon[24] = 16;
    await writeRepoFile(
      rootDir,
      "store-listing/assets/store/google-play/app-icon-512.png",
      sixteenBitPlayIcon,
    );
    await writeRepoFile(
      rootDir,
      "store-listing/exports/final/google-play/icon/app-icon-512.png",
      sixteenBitPlayIcon,
    );

    await assert.rejects(
      () => collectPackageInputs({ rootDir, checkFreshness: false }),
      /googlePlayIcon source has PNG bit depth 16; expected 8/,
    );
  });
});

test("Google Play icon alpha samples must all be fully opaque", async () => {
  const translucentIcon = validIconPng(512, 512, 6, 255);
  const decoded = PNG.sync.read(translucentIcon);
  decoded.data[3] = 254;
  const encoded = PNG.sync.write(decoded, {
    colorType: 6,
    inputColorType: 6,
    inputHasAlpha: true,
  });

  await withFixture(async ({ rootDir }) => {
    await writeRepoFile(
      rootDir,
      "store-listing/assets/store/google-play/app-icon-512.png",
      encoded,
    );
    await writeRepoFile(
      rootDir,
      "store-listing/exports/final/google-play/icon/app-icon-512.png",
      encoded,
    );

    await assert.rejects(
      () => collectPackageInputs({ rootDir, checkFreshness: false }),
      /googlePlayIcon source is not fully opaque at pixel 0,0/,
    );
  });

  await withFixture(async ({ rootDir }) => {
    await writeRepoFile(
      rootDir,
      "store-listing/exports/final/google-play/icon/app-icon-512.png",
      encoded,
    );

    await assert.rejects(
      () => collectPackageInputs({ rootDir, checkFreshness: false }),
      /googlePlayIcon final export is not fully opaque at pixel 0,0/,
    );
  });
});

test("archive verification detects payload tampering", async () => {
  await withFixture(async ({ rootDir }) => {
    const archivePath = path.join(rootDir, "store.zip");
    await writeStorePackage({ rootDir, archivePath });
    const archive = await readFile(archivePath);
    const markerOffset = archive.indexOf(Buffer.from('"locale"', "utf8"));
    assert.ok(markerOffset > 0);
    archive[markerOffset + 1] ^= 0x01;
    await writeFile(archivePath, archive);
    await assert.rejects(
      () =>
        verifyStorePackage({
          rootDir,
          archivePath,
          againstWorkspace: false,
          checkFreshness: false,
        }),
      /CRC mismatch/,
    );
  });
});
