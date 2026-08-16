import manifest from '@/content/product-media.runtime.json';

export type ProductMediaId = (typeof manifest.assets)[number]['id'];
export type ProductMediaLanguage = 'en' | 'pl';

type ProductMediaAsset = (typeof manifest.assets)[number];
type ProductMediaPlacementSet =
  (typeof manifest.placementSets)[keyof typeof manifest.placementSets];

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

export function getProductMediaPlacements(language: ProductMediaLanguage) {
  const setId = placementSelection[language];
  const placementSet = placementSets[setId];

  if (!placementSet) {
    throw new Error(`Unknown product media placement set: ${setId}`);
  }

  const resolved = {
    voiceInput: getProductMedia(placementSet.voiceInput),
    assignee: getProductMedia(placementSet.assignee),
    delegatedTask: getProductMedia(placementSet.delegatedTask),
    groups: getProductMedia(placementSet.groups),
    groupGallery: getProductMedia(placementSet.groupGallery),
    modules: getProductMedia(placementSet.modules),
    bookings: getProductMedia(placementSet.bookings),
    nearby: getProductMedia(placementSet.nearby),
  } as const;

  return {
    ...resolved,
    hero: [resolved.voiceInput, resolved.assignee, resolved.delegatedTask],
  } as const;
}
