import manifest from '@/content/product-media.runtime.json';

export type ProductMediaId = (typeof manifest.assets)[number]['id'];
export type ProductMediaLanguage = 'en' | 'pl';

type ProductMediaAsset = (typeof manifest.assets)[number];
type ProductMediaPlacementSet =
  (typeof manifest.placementSets)[keyof typeof manifest.placementSets];

export type ProductDeviceFrameKind = 'ios-phone' | 'android-phone' | 'ios-tablet';
export type ProductCaptureTheme = 'light' | 'dark';
export type ProductMediaPlacement = ProductMediaAsset & Readonly<{
  frameKind: ProductDeviceFrameKind;
  captureTheme: ProductCaptureTheme;
}>;

const mediaById = new Map(
  manifest.assets.map((asset) => [asset.id, asset] as const),
);

export function getProductMedia(id: string): ProductMediaAsset {
  const media = mediaById.get(id);

  if (!media) {
    throw new Error(`Unknown product media slot: ${id}`);
  }

  return media;
}

const placementSets = manifest.placementSets as Record<string, ProductMediaPlacementSet>;
const placementSelection = manifest.placementSelection as Record<ProductMediaLanguage, string>;

const withPresentation = (asset: ProductMediaAsset): ProductMediaPlacement => {
  const frameKind: ProductDeviceFrameKind = asset.platform === 'android'
    ? 'android-phone'
    : asset.device.startsWith('ipad')
      ? 'ios-tablet'
      : 'ios-phone';

  return {
    ...asset,
    frameKind,
    captureTheme: asset.theme as ProductCaptureTheme,
  };
};

export function getProductMediaPlacements(language: ProductMediaLanguage) {
  const setId = placementSelection[language];
  const placementSet = placementSets[setId];

  if (!placementSet) {
    throw new Error(`Unknown product media placement set: ${setId}`);
  }

  const resolved = {
    voiceInput: withPresentation(getProductMedia(placementSet.voiceInput)),
    assignee: withPresentation(getProductMedia(placementSet.assignee)),
    delegatedTask: withPresentation(getProductMedia(placementSet.delegatedTask)),
    groups: withPresentation(getProductMedia(placementSet.groups)),
    groupGallery: withPresentation(getProductMedia(placementSet.groupGallery)),
    modules: withPresentation(getProductMedia(placementSet.modules)),
    bookings: withPresentation(getProductMedia(placementSet.bookings)),
    nearby: withPresentation(getProductMedia(placementSet.nearby)),
  } as const;

  return {
    ...resolved,
    hero: [resolved.voiceInput, resolved.delegatedTask, resolved.nearby],
  } as const;
}
