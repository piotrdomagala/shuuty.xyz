// usage, from inside a worktree of piotrdomagala/S- (never the owner's main
// checkout):
//   node <path to this site>/scripts/verify-product-media-sources.mjs
//
// Checks every product capture against the app repository at import time:
// the source commit (the asset's own sourceCommit, or the preview source
// commit) is on origin after a fetch, and the file at sourceArtifactEntry in
// that commit has exactly the recorded sourceSha256. The site's CI cannot read
// the private app repository, so this runs where a checkout of it exists.
//
// The script takes no arguments: git works in the current directory, and the
// only values it passes to git are full commit SHAs and plain repository
// paths from the site's own manifest, checked before use.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const COMMIT = /^[a-f0-9]{40}$/u;
const ENTRY = /^store-listing\/assets\/source\/[A-Za-z0-9._/-]+\.png$/u;

// git from a fixed install location, not whatever PATH resolves first.
const GIT = [
  'C:\\Program Files\\Git\\cmd\\git.exe',
  '/usr/bin/git',
  '/usr/local/bin/git',
  '/opt/homebrew/bin/git',
].find((candidate) => existsSync(candidate));
if (!GIT) {
  console.error('git was not found in a standard install location.');
  process.exit(2);
}

const git = (args, options = {}) =>
  execFileSync(GIT, args, { maxBuffer: 64 * 1024 * 1024, ...options });

let origin = '';
try {
  origin = git(['remote', 'get-url', 'origin']).toString().trim();
} catch {
  origin = '';
}
// The app repository is piotrdomagala/Shuuty- on GitHub (S- is its local folder).
if (!/github\.com[/:]piotrdomagala\/Shuuty-(\.git)?$/u.test(origin)) {
  console.error('Run this from inside a worktree of piotrdomagala/S-.');
  process.exit(2);
}

const manifest = JSON.parse(
  await readFile(new URL('../content/product-media.json', import.meta.url), 'utf8'),
);

git(['fetch', '--quiet', 'origin']);

const failures = [];
const onOrigin = new Map();
for (const asset of manifest.assets) {
  const commit = asset.sourceCommit ?? manifest.source.commit;
  if (!COMMIT.test(commit ?? '') || !ENTRY.test(asset.sourceArtifactEntry ?? '')
    || asset.sourceArtifactEntry.split('/').includes('..')) {
    failures.push(`${asset.id}: source commit or entry is not in the expected form.`);
    continue;
  }
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
