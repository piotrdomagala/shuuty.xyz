// The deterministic website derivatives of the canonical product captures.
// The generator, the validator, the runtime projection and the tests share
// this one contract, so a change here is a deliberate, reviewed pipeline change.

export const DERIVATIVE_ENCODER = 'sharp@0.35.3';
export const DERIVATIVE_LIBVIPS = '8.18.3';

const encoderParameters = {
  fit: 'fill',
  kernel: 'lanczos3',
  colourspace: 'srgb',
  stripMetadata: true,
  quality: 88,
  effort: 6,
  smartSubsample: true,
};

// `web` is the half-size image every browser can use. `compact` is a third of
// the capture for small phone frames; srcset lets the browser pick it only
// where it is sharp enough for the frame width and the screen density.
export const WEB_DERIVATIVES = Object.freeze([
  Object.freeze({
    key: 'web',
    sizeLabel: 'half-size',
    divisor: 2,
    suffix: '',
    maxAssetBytes: 200 * 1024,
    maxLocaleBytes: 600 * 1024,
    parameters: Object.freeze({ scale: 0.5, ...encoderParameters }),
  }),
  Object.freeze({
    key: 'compact',
    sizeLabel: 'third-size',
    divisor: 3,
    suffix: '-compact',
    maxAssetBytes: 112 * 1024,
    maxLocaleBytes: 360 * 1024,
    parameters: Object.freeze({ scale: 1 / 3, ...encoderParameters }),
  }),
]);

export function derivativeSize(spec, width, height) {
  return {
    width: Math.max(1, Math.round(width / spec.divisor)),
    height: Math.max(1, Math.round(height / spec.divisor)),
  };
}

export function derivativePath(spec, sourcePath) {
  const extensionStart = sourcePath.lastIndexOf('.');
  if (extensionStart <= sourcePath.lastIndexOf('/')) {
    throw new Error(`Product media path has no extension: ${sourcePath}`);
  }
  return `${sourcePath.slice(0, extensionStart)}${spec.suffix}.webp`;
}

// One pinned sharp pipeline for every derivative.
export function encodeDerivative(sharp, source, spec, width, height) {
  return sharp(source, { failOn: 'error' })
    .resize(width, height, {
      fit: spec.parameters.fit,
      kernel: sharp.kernel.lanczos3,
    })
    .toColourspace(spec.parameters.colourspace)
    .webp({
      quality: spec.parameters.quality,
      effort: spec.parameters.effort,
      smartSubsample: spec.parameters.smartSubsample,
    })
    .toBuffer();
}

// The public rendering projection of one manifest asset: no provenance fields.
export function runtimeAsset({ id, altKey, theme, platform, device, web, compact }) {
  return {
    id,
    altKey,
    theme,
    platform,
    device,
    path: web?.path,
    width: web?.width,
    height: web?.height,
    compact: {
      path: compact?.path,
      width: compact?.width,
      height: compact?.height,
    },
  };
}
