import { readFile, writeFile } from 'node:fs/promises';
import { WEB_DERIVATIVES, runtimeAsset } from './product-media-derivatives.mjs';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL('content/product-media.json', root), 'utf8'),
);

for (const asset of manifest.assets) {
  for (const spec of WEB_DERIVATIVES) {
    if (!asset[spec.key]) {
      throw new Error(`${asset.id} has no validated ${spec.key} website derivative.`);
    }
  }
}

const runtimeManifest = {
  schemaVersion: manifest.schemaVersion,
  assets: manifest.assets.map(runtimeAsset),
  placementSets: manifest.placementSets,
  placementSelection: manifest.placementSelection,
};

await writeFile(
  new URL('content/product-media.runtime.json', root),
  `${JSON.stringify(runtimeManifest, null, 2)}\n`,
  'utf8',
);

console.log('Synchronized the public runtime media projection.');
