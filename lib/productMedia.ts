import manifest from '@/content/product-media.runtime.json';

export type ProductMediaId = (typeof manifest.assets)[number]['id'];
export type ProductMediaLanguage = 'en' | 'pl';

type CanonicalMediaAsset = (typeof manifest.assets)[number];
type GuideCaptureAsset = (typeof manifest.guideCaptures)[number];
type ProductMediaAsset = CanonicalMediaAsset | GuideCaptureAsset;
type ProductMediaPlacementSet =
  (typeof manifest.placementSets)[keyof typeof manifest.placementSets];

export type ProductDeviceFrameKind = 'ios-phone' | 'android-phone' | 'ios-tablet';
export type ProductCaptureTheme = 'light' | 'dark';
type Presented<Asset> = Asset & Readonly<{
  frameKind: ProductDeviceFrameKind;
  captureTheme: ProductCaptureTheme;
}>;
export type ProductMediaPlacement = Presented<ProductMediaAsset>;

const canonicalById = new Map(
  manifest.assets.map((asset) => [asset.id, asset] as const),
);
// Emulator captures of app screens that only guide steps show.
const guideCaptureById = new Map(
  manifest.guideCaptures.map((asset) => [asset.id, asset] as const),
);

function getCanonicalMedia(id: string): CanonicalMediaAsset {
  const media = canonicalById.get(id);

  if (!media) {
    throw new Error(`Unknown product media slot: ${id}`);
  }

  return media;
}

export function getProductMedia(id: string): ProductMediaAsset {
  const media = canonicalById.get(id) ?? guideCaptureById.get(id);

  if (!media) {
    throw new Error(`Unknown product media slot: ${id}`);
  }

  return media;
}

const placementSets = manifest.placementSets as Record<string, ProductMediaPlacementSet>;
const placementSelection = manifest.placementSelection as Record<ProductMediaLanguage, string>;

function withPresentation<Asset extends ProductMediaAsset>(asset: Asset): Presented<Asset> {
  let frameKind: ProductDeviceFrameKind = 'ios-phone';

  if (asset.platform === 'android') {
    frameKind = 'android-phone';
  } else if (asset.device.startsWith('ipad')) {
    frameKind = 'ios-tablet';
  }

  return {
    ...asset,
    frameKind,
    captureTheme: asset.theme as ProductCaptureTheme,
  };
}

// One registered capture with its device frame, e.g. for a guide step.
export function getProductMediaPlacement(id: string): ProductMediaPlacement {
  return withPresentation(getProductMedia(id));
}

export function getProductMediaPlacements(language: ProductMediaLanguage) {
  const setId = placementSelection[language];
  const placementSet = placementSets[setId];

  if (!placementSet) {
    throw new Error(`Unknown product media placement set: ${setId}`);
  }

  const resolved = {
    voiceInput: withPresentation(getCanonicalMedia(placementSet.voiceInput)),
    assignee: withPresentation(getCanonicalMedia(placementSet.assignee)),
    delegatedTask: withPresentation(getCanonicalMedia(placementSet.delegatedTask)),
    groups: withPresentation(getCanonicalMedia(placementSet.groups)),
    groupGallery: withPresentation(getCanonicalMedia(placementSet.groupGallery)),
    modules: withPresentation(getCanonicalMedia(placementSet.modules)),
    bookings: withPresentation(getCanonicalMedia(placementSet.bookings)),
    nearby: withPresentation(getCanonicalMedia(placementSet.nearby)),
  } as const;

  return {
    ...resolved,
    hero: [resolved.voiceInput, resolved.delegatedTask, resolved.nearby],
  } as const;
}
