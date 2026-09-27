// usage: npm run verify:media-sources -- <path to a worktree of piotrdomagala/S->
//
// Checks every product capture against the app repository at import time:
// the source commit (the asset's own sourceCommit, or the preview source
// commit) is on origin after a fetch, and the file at sourceArtifactEntry in
// that commit has exactly the recorded sourceSha256. The site's CI cannot read
// the private app repository, so this runs where a checkout of it exists -
// never in the owner's main checkout, pass a worktree.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const worktree = process.argv[2];
if (!worktree) {
  console.error('Pass the path to a worktree of piotrdomagala/S-.');
  process.exit(2);
}

const git = (args, options = {}) =>
  execFileSync('git', ['-C', worktree, ...args], { maxBuffer: 64 * 1024 * 1024, ...options });

const manifest = JSON.parse(
  await readFile(new URL('../content/product-media.json', import.meta.url), 'utf8'),
);

git(['fetch', '--quiet', 'origin']);

const failures = [];
const onOrigin = new Map();
for (const asset of manifest.assets) {
  const commit = asset.sourceCommit ?? manifest.source.commit;
  if (!onOrigin.has(commit)) {
    let reachable = false;
    try {
      git(['cat-file', '-e', `${commit}^{commit}`], { stdio: 'ignore' });
      reachable = git(['branch', '-r', '--contains', commit]).toString().trim().length > 0;
    } catch {
      reachable = false;
    }
    onOrigin.set(commit, reachable);
  }
  if (!onOrigin.get(commit)) {
    failures.push(`${asset.id}: ${commit} is not on origin of the app repository.`);
    continue;
  }
  let bytes;
  try {
    bytes = git(['show', `${commit}:${asset.sourceArtifactEntry}`]);
  } catch {
    failures.push(`${asset.id}: ${asset.sourceArtifactEntry} is missing in ${commit}.`);
    continue;
  }
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== asset.sourceSha256) {
    failures.push(`${asset.id}: ${asset.sourceArtifactEntry} in ${commit} is ${sha256}, not ${asset.sourceSha256}.`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `All ${manifest.assets.length} product captures match their source commits on origin (${[...onOrigin.keys()].join(', ')}).`,
);
