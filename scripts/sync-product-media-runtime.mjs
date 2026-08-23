import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL('content/product-media.json', root), 'utf8'),
);

for (const asset of manifest.assets) {
  if (!asset.web) {
    throw new Error(`${asset.id} has no validated website derivative.`);
  }
}

const runtimeManifest = {
  schemaVersion: manifest.schemaVersion,
  assets: manifest.assets.map(({ id, altKey, theme, platform, device, web }) => ({
    id,
    altKey,
    theme,
    platform,
    device,
    path: web.path,
    width: web.width,
    height: web.height,
  })),
  placementSets: manifest.placementSets,
  placementSelection: manifest.placementSelection,
};

await writeFile(
  new URL('content/product-media.runtime.json', root),
  `${JSON.stringify(runtimeManifest, null, 2)}\n`,
  'utf8',
);

console.log('Synchronized the public runtime media projection.');
