import { STORE_METADATA_LOCALES } from "./store-metadata-validation.mjs";

export const STORE_MEDIA_ATTESTATION_ID =
  "shuuty-media-owner-attestation-2026-08-05";

export const STORE_MEDIA_FILES = Object.freeze([
  "avatar-alex.webp",
  "avatar-maja.webp",
  "avatar-mia.webp",
  "avatar-nina.webp",
  "avatar-noah.webp",
  "avatar-olek.webp",
  "cover-brand-portraits.webp",
  "cover-ceramics.webp",
  "cover-studio.webp",
  "cover-walk-london.webp",
  "cover-walk.webp",
  "gallery-brand-portrait.webp",
  "gallery-brand-studio.webp",
  "gallery-ceramics-collection.webp",
  "gallery-ceramics-glazing.webp",
]);

const EXPECTED_SCOPES = [
  "apple-app-store",
  "google-play",
  "shuuty.xyz",
  "shuuty.com",
  "shuuty-promotional-materials",
];

const REQUIRED_ATTESTATION_TEXT = [
  STORE_MEDIA_ATTESTATION_ID,
  "2026-08-05",
  "Apple App Store",
  "Google Play",
  "shuuty.xyz",
  "shuuty.com",
  "owner-authorized",
  "does not claim that a real-person model release exists",
];

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const createFailureCollector = (failures) => (condition, message) => {
  if (!condition) failures.push(message);
};

function validateAttestation(attestation, requireValue) {
  requireValue(
    attestation.recordId === STORE_MEDIA_ATTESTATION_ID,
    `Media provenance must reference ${STORE_MEDIA_ATTESTATION_ID}`,
  );
  requireValue(
    attestation.copyrightStatus === "owner-attested",
    "Media copyright status must be owner-attested",
  );
  requireValue(
    attestation.underlyingAcquisitionDocumentation === "not-recorded",
    "Media provenance must keep underlying acquisition documentation neutral",
  );
  requireValue(
    attestation.likenessAuthorizationStatus === "owner-authorized" &&
      attestation.likenessAuthorizationDate === "2026-08-05" &&
      attestation.likenessAuthorizationSource ===
        "Direct product-owner statement in the project conversation",
    "Media provenance must record the dated direct owner likeness authorization",
  );
  requireValue(
    attestation.modelReleaseDocumentation === "not-recorded" &&
      attestation.generationOrigin === "owner-reported-generated-for-shuuty" &&
      attestation.generationMethodDocumentation ===
        "not-independently-verified",
    "Media provenance must preserve the model-release and generation-method evidence limits",
  );
  requireValue(
    JSON.stringify(attestation.authorizedScopes) ===
      JSON.stringify(EXPECTED_SCOPES),
    "Media provenance must include the approved store, website, and promotional scopes",
  );
}

function validateLikeness(likeness, assetId, requireValue, failures) {
  if (likeness.personPresence === "none") {
    requireValue(
      likeness.recognizableFace === false &&
        likeness.releaseStatus === "not-applicable",
      `${assetId} must use not-applicable when no person is visible`,
    );
    return;
  }
  if (likeness.personPresence === "visible") {
    requireValue(
      typeof likeness.recognizableFace === "boolean" &&
        likeness.releaseStatus === "owner-authorized",
      `${assetId} must reference the recorded owner likeness authorization`,
    );
    return;
  }
  failures.push(`${assetId} has an unsupported person-presence status`);
}

function recordLikenessStatus(likeness, state) {
  if (likeness.releaseStatus === "owner-authorized") {
    state.ownerAuthorizedLikenessCount += 1;
  }
  if (likeness.releaseStatus === "not-applicable") {
    state.notApplicableLikenessCount += 1;
  }
}

function validateMediaAsset(asset, index, state, requireValue, failures) {
  if (!isRecord(asset)) {
    failures.push(`Media asset ${index + 1} must be an object`);
    return;
  }

  const assetId =
    typeof asset.id === "string" && asset.id ? asset.id : "missing";
  requireValue(
    assetId !== "missing" && !state.assetIds.has(assetId),
    `Media asset has a missing or duplicate id: ${assetId}`,
  );
  state.assetIds.add(assetId);

  const fileName =
    typeof asset.fileName === "string" && asset.fileName
      ? asset.fileName
      : "missing";
  requireValue(
    fileName !== "missing" && !state.fileNames.has(fileName),
    `Media asset has a missing or duplicate fileName: ${fileName}`,
  );
  state.fileNames.add(fileName);
  requireValue(
    fileName !== "missing" &&
      asset.relativePath === `backend/scripts/assets/store-demo/${fileName}`,
    `${assetId} has an unexpected source path`,
  );
  requireValue(asset.format === "webp", `${assetId} must be recorded as WebP`);
  requireValue(
    Number.isInteger(asset.width) &&
      asset.width > 0 &&
      Number.isInteger(asset.height) &&
      asset.height > 0,
    `${assetId} must record positive integer dimensions`,
  );
  requireValue(
    Number.isInteger(asset.bytes) && asset.bytes > 0,
    `${assetId} must record a positive byte length`,
  );
  requireValue(
    typeof asset.sha256 === "string" && /^[a-f0-9]{64}$/u.test(asset.sha256),
    `${assetId} must record a lowercase SHA-256 digest`,
  );
  requireValue(
    asset.rightsRecordId === STORE_MEDIA_ATTESTATION_ID &&
      asset.copyrightStatus === "owner-attested",
    `${assetId} must reference the owner attestation`,
  );
  requireValue(
    Array.isArray(asset.locales) &&
      asset.locales.length > 0 &&
      new Set(asset.locales).size === asset.locales.length &&
      asset.locales.every((locale) => STORE_METADATA_LOCALES.includes(locale)),
    `${assetId} has unsupported locale coverage`,
  );

  const likeness = isRecord(asset.likeness) ? asset.likeness : {};
  validateLikeness(likeness, assetId, requireValue, failures);
  recordLikenessStatus(likeness, state);
}

function validateMediaAssetSet(mediaAssets, state, requireValue, failures) {
  for (const [index, asset] of mediaAssets.entries()) {
    validateMediaAsset(asset, index, state, requireValue, failures);
  }

  const requiredMediaFiles = new Set(STORE_MEDIA_FILES);
  requireValue(
    state.fileNames.size === requiredMediaFiles.size &&
      [...state.fileNames].every((fileName) =>
        requiredMediaFiles.has(fileName),
      ),
    `Media provenance filenames must match the complete ${STORE_MEDIA_FILES.length}-file store-demo set`,
  );
  requireValue(
    state.ownerAuthorizedLikenessCount === 13,
    "Exactly 13 media assets must use owner-authorized likeness status",
  );
  requireValue(
    state.notApplicableLikenessCount === 2,
    "Exactly two media assets must use not-applicable likeness status",
  );
}

function validateOwnerAttestation(ownerAttestation, requireValue, failures) {
  if (typeof ownerAttestation !== "string") {
    failures.push("Owner attestation must be UTF-8 text");
    return;
  }
  for (const requiredText of REQUIRED_ATTESTATION_TEXT) {
    requireValue(
      ownerAttestation.includes(requiredText),
      `Owner attestation is missing required text: ${requiredText}`,
    );
  }
}

export function validateStoreMediaProvenance(
  mediaProvenance,
  ownerAttestation,
) {
  const failures = [];
  const requireValue = createFailureCollector(failures);

  if (!isRecord(mediaProvenance)) {
    return ["Media provenance must be an object"];
  }

  const mediaAssets = Array.isArray(mediaProvenance.assets)
    ? mediaProvenance.assets
    : [];
  const attestation = isRecord(mediaProvenance.attestation)
    ? mediaProvenance.attestation
    : {};
  const source = isRecord(mediaProvenance.source) ? mediaProvenance.source : {};

  requireValue(
    mediaProvenance.schemaVersion === 1,
    "Media provenance schemaVersion must be 1",
  );
  requireValue(
    mediaProvenance.status === "owner-attested",
    "Media provenance must retain owner-attested status",
  );
  requireValue(
    mediaProvenance.statementDate === "2026-08-05",
    "Media provenance statement date must be 2026-08-05",
  );
  validateAttestation(attestation, requireValue);
  requireValue(
    source.assetCount === STORE_MEDIA_FILES.length &&
      mediaAssets.length === STORE_MEDIA_FILES.length,
    `Media provenance must contain exactly ${STORE_MEDIA_FILES.length} source assets`,
  );

  const state = {
    assetIds: new Set(),
    fileNames: new Set(),
    ownerAuthorizedLikenessCount: 0,
    notApplicableLikenessCount: 0,
  };
  validateMediaAssetSet(mediaAssets, state, requireValue, failures);
  validateOwnerAttestation(ownerAttestation, requireValue, failures);

  return failures;
}
