import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const manifestUrl = new URL('content/product-media.json', root);
const publicRoot = resolve(fileURLToPath(new URL('public', root)));
const imagesRoot = resolve(publicRoot, 'images');
const encoder = 'sharp@0.35.3';
const libvips = '8.18.3';
const maxAssetBytes = 200 * 1024;
const maxLocaleBytes = 600 * 1024;
const parameters = {
  scale: 0.5,
  fit: 'fill',
  kernel: 'lanczos3',
  colourspace: 'srgb',
  stripMetadata: true,
  quality: 88,
  effort: 6,
  smartSubsample: true,
};

function isContainedPath(parent, candidate) {
  const relativePath = relative(parent, candidate);
  return (
    relativePath === '' ||
    (!relativePath.startsWith(`..${sep}`) && relativePath !== '..' && !isAbsolute(relativePath))
  );
}

function resolvePublicImage(publicPath) {
  if (
    typeof publicPath !== 'string' ||
    !/^\/images\/[A-Za-z0-9._/-]+$/u.test(publicPath) ||
    publicPath.includes('\\') ||
    publicPath.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error(`Refusing unsafe public image path: ${publicPath}`);
  }
  const filePath = resolve(publicRoot, `.${publicPath}`);
  if (!isContainedPath(imagesRoot, filePath)) {
    throw new Error(`Refusing to generate media outside public/images: ${publicPath}`);
  }
  return filePath;
}

async function readCanonicalSource(asset, sourceFile) {
  const pathSegments = relative(publicRoot, sourceFile).split(sep);
  let currentPath = publicRoot;
  for (const segment of pathSegments) {
    currentPath = resolve(currentPath, segment);
    if ((await lstat(currentPath)).isSymbolicLink()) {
      throw new Error(`Source path must not contain symlinks: ${asset.id}.`);
    }
  }

  const [realImagesRoot, realSourceFile, sourceStat] = await Promise.all([
    realpath(imagesRoot),
    realpath(sourceFile),
    lstat(sourceFile),
  ]);
  if (!isContainedPath(realImagesRoot, realSourceFile) || !sourceStat.isFile()) {
    throw new Error(`Source must be a regular file below public/images: ${asset.id}.`);
  }
  return readFile(realSourceFile);
}

function webPathFor(sourcePath) {
  const extension = extname(sourcePath);
  if (!extension) throw new Error(`Product media path has no extension: ${sourcePath}`);
  return `${sourcePath.slice(0, -extension.length)}.webp`;
}

function digest(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

if (sharp.versions.sharp !== encoder.split('@')[1] || sharp.versions.vips !== libvips) {
  throw new Error(
    `Expected ${encoder} with libvips ${libvips}; received ` +
    `sharp@${sharp.versions.sharp} with libvips ${sharp.versions.vips}.`,
  );
}

sharp.cache(false);

const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
const generated = [];
const localeBytes = new Map();
let totalSourceBytes = 0;
let totalWebBytes = 0;

for (const asset of manifest.assets) {
  const sourceFile = resolvePublicImage(asset.path);
  const webPath = webPathFor(asset.path);
  const webFile = resolvePublicImage(webPath);
  const width = Math.max(1, Math.round(asset.width * parameters.scale));
  const height = Math.max(1, Math.round(asset.height * parameters.scale));
  const source = await readCanonicalSource(asset, sourceFile);
  const sourceMetadata = await sharp(source, { failOn: 'error' }).metadata();
  const expectedFormat = asset.mediaType === 'image/png' ? 'png' : 'jpeg';

  if (
    digest(source) !== asset.sha256 ||
    asset.sourceSha256 !== asset.sha256 ||
    sourceMetadata.format !== expectedFormat ||
    sourceMetadata.width !== asset.width ||
    sourceMetadata.height !== asset.height
  ) {
    throw new Error(`Source provenance validation failed before generation for ${asset.id}.`);
  }

  const output = await sharp(source, { failOn: 'error' })
    .resize(width, height, {
      fit: parameters.fit,
      kernel: sharp.kernel.lanczos3,
    })
    .toColourspace(parameters.colourspace)
    .webp({
      quality: parameters.quality,
      effort: parameters.effort,
      smartSubsample: parameters.smartSubsample,
    })
    .toBuffer();
  const outputMetadata = await sharp(output, { failOn: 'error' }).metadata();

  if (
    outputMetadata.format !== 'webp' ||
    outputMetadata.width !== width ||
    outputMetadata.height !== height
  ) {
    throw new Error(`Generated derivative metadata is invalid for ${asset.id}.`);
  }
  if (output.length > maxAssetBytes) {
    throw new Error(`${asset.id} derivative exceeds the ${maxAssetBytes}-byte asset budget.`);
  }

  const locale = asset.locales?.[0];
  localeBytes.set(locale, (localeBytes.get(locale) ?? 0) + output.length);
  generated.push({
    asset,
    output,
    webFile,
    tempFile: `${webFile}.tmp-${process.pid}`,
    metadata: {
      path: webPath,
      mediaType: 'image/webp',
      width,
      height,
      byteLength: output.length,
      sha256: digest(output),
      sourceSha256: asset.sha256,
      encoder,
      libvips,
      parameters,
    },
  });
  totalSourceBytes += source.length;
  totalWebBytes += output.length;
}

for (const [locale, byteLength] of localeBytes) {
  if (byteLength > maxLocaleBytes) {
    throw new Error(`${locale} derivatives exceed the ${maxLocaleBytes}-byte locale budget.`);
  }
}

try {
  for (const item of generated) {
    await mkdir(dirname(item.tempFile), { recursive: true });
    await writeFile(item.tempFile, item.output);
  }
  for (const item of generated) {
    await rename(item.tempFile, item.webFile);
    item.asset.web = item.metadata;
  }
  manifest.schemaVersion = 2;
  await writeFile(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
} finally {
  await Promise.all(
    generated.map((item) => rm(item.tempFile, { force: true })),
  );
}

const savings = totalSourceBytes === 0
  ? 0
  : Math.round((1 - totalWebBytes / totalSourceBytes) * 1000) / 10;
console.log(
  `Generated ${manifest.assets.length} deterministic WebP derivatives: ` +
  `${totalSourceBytes} -> ${totalWebBytes} bytes (${savings}% smaller).`,
);
for (const [locale, byteLength] of localeBytes) {
  console.log(`${locale}: ${byteLength} bytes.`);
}
