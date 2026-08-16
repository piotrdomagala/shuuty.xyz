import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL('content/product-media.json', root), 'utf8'),
);

const runtimeManifest = {
  schemaVersion: manifest.schemaVersion,
  assets: manifest.assets.map(({ id, altKey, path, width, height }) => ({
    id,
    altKey,
    path,
    width,
    height,
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
