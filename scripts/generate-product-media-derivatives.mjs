import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  DERIVATIVE_ENCODER as encoder,
  DERIVATIVE_LIBVIPS as libvips,
  WEB_DERIVATIVES,
  derivativePath,
  derivativeSize,
  encodeDerivative,
} from './product-media-derivatives.mjs';

const root = new URL('../', import.meta.url);
const manifestUrl = new URL('content/product-media.json', root);
const publicRoot = resolve(fileURLToPath(new URL('public', root)));
const imagesRoot = resolve(publicRoot, 'images');

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
const localeBytes = new Map(WEB_DERIVATIVES.map((spec) => [spec.key, new Map()]));
const derivativeBytes = new Map(WEB_DERIVATIVES.map((spec) => [spec.key, 0]));
let totalSourceBytes = 0;

for (const asset of manifest.assets) {
  const sourceFile = resolvePublicImage(asset.path);
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
  totalSourceBytes += source.length;

  for (const spec of WEB_DERIVATIVES) {
    const webPath = derivativePath(spec, asset.path);
    const webFile = resolvePublicImage(webPath);
    const { width, height } = derivativeSize(spec, asset.width, asset.height);
    const output = await encodeDerivative(sharp, source, spec, width, height);
    const outputMetadata = await sharp(output, { failOn: 'error' }).metadata();

    if (
      outputMetadata.format !== 'webp' ||
      outputMetadata.width !== width ||
      outputMetadata.height !== height
    ) {
      throw new Error(`Generated ${spec.key} derivative metadata is invalid for ${asset.id}.`);
    }
    if (output.length > spec.maxAssetBytes) {
      throw new Error(
        `${asset.id} ${spec.key} derivative exceeds the ${spec.maxAssetBytes}-byte asset budget.`,
      );
    }

    const locale = asset.locales?.[0];
    const specLocaleBytes = localeBytes.get(spec.key);
    specLocaleBytes.set(locale, (specLocaleBytes.get(locale) ?? 0) + output.length);
    derivativeBytes.set(spec.key, derivativeBytes.get(spec.key) + output.length);
    generated.push({
      asset,
      key: spec.key,
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
        parameters: spec.parameters,
      },
    });
  }
}

for (const spec of WEB_DERIVATIVES) {
  for (const [locale, byteLength] of localeBytes.get(spec.key)) {
    if (byteLength > spec.maxLocaleBytes) {
      throw new Error(
        `${locale} ${spec.key} derivatives exceed the ${spec.maxLocaleBytes}-byte locale budget.`,
      );
    }
  }
}

try {
  for (const item of generated) {
    await mkdir(dirname(item.tempFile), { recursive: true });
    await writeFile(item.tempFile, item.output);
  }
  for (const item of generated) {
    await rename(item.tempFile, item.webFile);
    item.asset[item.key] = item.metadata;
  }
  manifest.schemaVersion = 2;
  await writeFile(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
} finally {
  await Promise.all(
    generated.map((item) => rm(item.tempFile, { force: true })),
  );
}

for (const spec of WEB_DERIVATIVES) {
  const bytes = derivativeBytes.get(spec.key);
  const savings = totalSourceBytes === 0
    ? 0
    : Math.round((1 - bytes / totalSourceBytes) * 1000) / 10;
  console.log(
    `Generated ${manifest.assets.length} deterministic ${spec.key} WebP derivatives: ` +
    `${totalSourceBytes} -> ${bytes} bytes (${savings}% smaller).`,
  );
  for (const [locale, byteLength] of localeBytes.get(spec.key)) {
    console.log(`${spec.key} ${locale}: ${byteLength} bytes.`);
  }
}
