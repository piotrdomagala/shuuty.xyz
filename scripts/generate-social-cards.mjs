// Social preview cards (Open Graph, one per site language) and Product Hunt
// gallery images, composed from the canonical product captures. A capture is
// only scaled and placed in a rounded frame - its pixels are never edited.
//
//   node scripts/generate-social-cards.mjs
//     writes public/images/social/shuuty-<language>.jpg and records each card
//     (hash, size, the exact capture hashes it used) in content/social-cards.json
//   node scripts/generate-social-cards.mjs --product-hunt <directory>
//     writes the Product Hunt gallery into a directory outside public/ with a
//     product-hunt-gallery.json record; nothing in the site changes.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const rootPath = resolve(fileURLToPath(root));
const configUrl = new URL('content/social-cards.json', root);
const mediaUrl = new URL('content/product-media.json', root);

export const SOCIAL_CARD_SIZE = Object.freeze({ width: 1200, height: 630 });
const PRODUCT_HUNT_SIZE = Object.freeze({ width: 1270, height: 760 });
const colors = {
  background: '#0d1117',
  ink: '#f0f6fc',
  gold: '#ffe5a0',
  muted: '#9da7b3',
  bezel: '#05070a',
  frame: '#30363d',
};

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const escapeMarkup = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function readVerified(relativePath, expectedSha256, label) {
  const buffer = await readFile(join(rootPath, relativePath));
  if (sha256(buffer) !== expectedSha256) {
    throw new Error(`${label} at ${relativePath} does not match its recorded SHA-256.`);
  }
  return buffer;
}

async function renderText(text, { size, color, width, fontfile }) {
  const { data, info } = await sharp({
    text: {
      text: `<span foreground="${color}">${escapeMarkup(text)}</span>`,
      font: `Geist ${size}`,
      fontfile,
      width,
      rgba: true,
      dpi: 72,
      wrap: 'word',
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { input: data, width: info.width, height: info.height };
}

// The largest size, down to `minSize`, at which the text fits on one line,
// or null when it does not fit even at `minSize`.
async function fittedSize(text, { maxSize, minSize, width, fontfile }) {
  for (let size = maxSize; size >= minSize; size -= 1) {
    const probe = await renderText(text, { size, color: colors.ink, fontfile });
    if (probe.width <= width) return size;
  }
  return null;
}

async function renderPhone(source, screenHeight) {
  const metadata = await sharp(source, { failOn: 'error' }).metadata();
  const screenWidth = Math.round((screenHeight * metadata.width) / metadata.height);
  const radius = Math.round(screenWidth * 0.1);
  const bezel = Math.max(5, Math.round(screenWidth * 0.032));
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${screenWidth}" height="${screenHeight}">` +
      `<rect width="${screenWidth}" height="${screenHeight}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
  );
  const screen = await sharp(source, { failOn: 'error' })
    .resize(screenWidth, screenHeight, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .toColourspace('srgb')
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const width = screenWidth + bezel * 2;
  const height = screenHeight + bezel * 2;
  const outerRadius = radius + bezel;
  const frame = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<rect x="0.75" y="0.75" width="${width - 1.5}" height="${height - 1.5}" rx="${outerRadius}" ry="${outerRadius}" ` +
      `fill="${colors.bezel}" stroke="${colors.frame}" stroke-width="1.5"/></svg>`,
  );
  const input = await sharp(frame)
    .composite([{ input: screen, left: bezel, top: bezel }])
    .png()
    .toBuffer();
  return { input, width, height, radius: outerRadius };
}

// Three captures: the middle one in front, two smaller ones behind it.
// Two captures: the first in front on the left, the second behind on the right.
function placePhones(phones, area) {
  const overlap = (phone) => Math.round(phone.width * 0.26);
  if (phones.length === 3) {
    const [left, center, right] = phones;
    const centerX = Math.round(area.x + (area.width - center.width) / 2);
    const sideTop = Math.round(area.y + (area.height - left.height) / 2 + area.height * 0.04);
    return [
      { phone: left, left: centerX - left.width + overlap(left), top: sideTop },
      { phone: right, left: centerX + center.width - overlap(right), top: sideTop },
      { phone: center, left: centerX, top: Math.round(area.y + (area.height - center.height) / 2) },
    ];
  }
  if (phones.length === 2) {
    const [front, back] = phones;
    const total = front.width + back.width - overlap(back);
    const startX = Math.round(area.x + (area.width - total) / 2);
    return [
      { phone: back, left: startX + front.width - overlap(back), top: area.y },
      { phone: front, left: startX, top: area.y + area.height - front.height },
    ];
  }
  throw new Error(`Unsupported number of captures: ${phones.length}`);
}

function backgroundSvg({ width, height }, placements, shadowBlur) {
  const shadows = placements
    .map(
      ({ phone, left, top }) =>
        `<rect x="${left + 6}" y="${top + 14}" width="${phone.width}" height="${phone.height}" ` +
        `rx="${phone.radius}" fill="#000" opacity="0.55" filter="url(#shadow)"/>`,
    )
    .join('');
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      '<defs>' +
      '<radialGradient id="warm" cx="0.08" cy="0.05" r="0.75">' +
      `<stop offset="0" stop-color="${colors.gold}" stop-opacity="0.17"/>` +
      `<stop offset="1" stop-color="${colors.gold}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="cool" cx="0.82" cy="0.95" r="0.65">' +
      '<stop offset="0" stop-color="#7dd3fc" stop-opacity="0.12"/>' +
      '<stop offset="1" stop-color="#7dd3fc" stop-opacity="0"/></radialGradient>' +
      `<filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${shadowBlur}"/></filter>` +
      '</defs>' +
      `<rect width="${width}" height="${height}" fill="${colors.background}"/>` +
      `<rect width="${width}" height="${height}" fill="url(#warm)"/>` +
      `<rect width="${width}" height="${height}" fill="url(#cool)"/>` +
      shadows +
      '</svg>',
  );
}

async function renderIcon(iconSource, size) {
  const radius = Math.round(size * 0.22);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
  );
  return sharp(iconSource, { failOn: 'error' })
    .resize(size, size, { kernel: sharp.kernel.lanczos3 })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

// Scales every measure from the 630 px card height, so the Product Hunt size
// keeps the same proportions.
async function composeCard(size, content, captures, assets) {
  const unit = size.height / 630;
  const px = (value) => Math.round(value * unit);
  const margin = px(64);
  const textWidth = Math.round(size.width * 0.43);
  const gap = px(24);
  const phoneArea = {
    x: margin + textWidth + gap,
    y: px(48),
    width: size.width - margin - textWidth - gap - px(20),
    height: size.height - px(96),
  };

  const heights = captures.length === 3
    ? [phoneArea.height * 0.84, phoneArea.height, phoneArea.height * 0.84]
    : [phoneArea.height * 0.94, phoneArea.height * 0.86];
  const phones = await Promise.all(
    captures.map((capture, index) => renderPhone(capture, Math.round(heights[index]))),
  );
  const placements = placePhones(phones, phoneArea);

  const text = (value, options) => renderText(value, { fontfile: assets.fontPath, ...options });
  const fit = (value, maxSize, minSize) =>
    fittedSize(value, { maxSize, minSize, width: textWidth, fontfile: assets.fontPath });
  // Both headline lines share one size, so the relay reads as one statement,
  // and never wrap: a headline that does not fit must be shortened instead.
  const headlineSizes = [];
  for (const line of content.headline) headlineSizes.push(await fit(line, px(62), px(44)));
  if (headlineSizes.includes(null)) {
    throw new Error(`Headline "${content.headline.join(' ')}" does not fit the card; shorten it.`);
  }
  const headlineSize = Math.min(...headlineSizes);
  // A long tagline may wrap once it reaches its smallest readable size.
  const taglineSize = await fit(content.tagline, px(29), px(24));
  const [icon, wordmark, line1, line2, tagline, domain, footer] = await Promise.all([
    renderIcon(assets.icon, px(72)),
    text('Shuuty', { size: px(38), color: colors.ink }),
    text(content.headline[0], { size: headlineSize, color: colors.ink }),
    text(content.headline[1], { size: headlineSize, color: colors.gold }),
    taglineSize
      ? text(content.tagline, { size: taglineSize, color: colors.muted })
      : text(content.tagline, { size: px(24), color: colors.muted, width: textWidth }),
    text('shuuty.com', { size: px(28), color: colors.gold }),
    text(content.footer, { size: px(22), color: colors.muted, width: textWidth }),
  ]);

  const iconTop = px(58);
  const headlineTop = px(190);
  const layers = [
    { input: icon, left: margin, top: iconTop },
    {
      input: wordmark.input,
      left: margin + px(72) + px(18),
      top: iconTop + Math.round((px(72) - wordmark.height) / 2),
    },
    { input: line1.input, left: margin, top: headlineTop },
    { input: line2.input, left: margin, top: headlineTop + line1.height + px(4) },
    {
      input: tagline.input,
      left: margin,
      top: headlineTop + line1.height + line2.height + px(30),
    },
    { input: domain.input, left: margin, top: size.height - px(58) - footer.height - px(10) - domain.height },
    { input: footer.input, left: margin, top: size.height - px(58) - footer.height },
    ...placements.map(({ phone, left, top }) => ({ input: phone.input, left, top })),
  ];

  return sharp(backgroundSvg(size, placements, px(16)))
    .composite(layers)
    .toColourspace('srgb');
}

async function loadInputs() {
  const config = JSON.parse(await readFile(configUrl, 'utf8'));
  const media = JSON.parse(await readFile(mediaUrl, 'utf8'));
  const { renderer } = config;
  if (sharp.versions.sharp !== renderer.encoder.split('@')[1] || sharp.versions.vips !== renderer.libvips) {
    throw new Error(
      `Expected ${renderer.encoder} with libvips ${renderer.libvips}; received ` +
        `sharp@${sharp.versions.sharp} with libvips ${sharp.versions.vips}.`,
    );
  }
  await readVerified(renderer.font, renderer.fontSha256, 'Card font');
  const assets = {
    fontPath: join(rootPath, renderer.font),
    icon: await readVerified(renderer.icon, renderer.iconSha256, 'Card icon'),
  };
  const mediaById = new Map(media.assets.map((asset) => [asset.id, asset]));

  async function readCaptures(ids) {
    const captures = [];
    const sources = {};
    for (const id of ids) {
      const asset = mediaById.get(id);
      if (!asset) throw new Error(`Unknown product capture: ${id}`);
      captures.push(
        await readVerified(`public${asset.path}`, asset.sha256, `Canonical capture ${id}`),
      );
      sources[id] = asset.sha256;
    }
    return { captures, sources };
  }

  return { config, assets, readCaptures };
}

function jpegOptions(renderer) {
  return {
    quality: renderer.jpeg.quality,
    chromaSubsampling: renderer.jpeg.chromaSubsampling,
    mozjpeg: renderer.jpeg.mozjpeg,
  };
}

async function generateSiteCards() {
  const { config, assets, readCaptures } = await loadInputs();
  sharp.cache(false);
  for (const [language, card] of Object.entries(config.cards)) {
    const { captures, sources } = await readCaptures(card.screens);
    const pipeline = await composeCard(SOCIAL_CARD_SIZE, card, captures, assets);
    const output = await pipeline.jpeg(jpegOptions(config.renderer)).toBuffer();
    const path = `/images/social/shuuty-${language}.jpg`;
    await mkdir(join(rootPath, 'public', 'images', 'social'), { recursive: true });
    await writeFile(join(rootPath, 'public', ...path.split('/').filter(Boolean)), output);
    card.sources = sources;
    card.image = {
      path,
      mediaType: 'image/jpeg',
      width: SOCIAL_CARD_SIZE.width,
      height: SOCIAL_CARD_SIZE.height,
      byteLength: output.length,
      sha256: sha256(output),
    };
    console.log(`${language}: ${path} ${output.length} bytes.`);
  }
  await writeFile(configUrl, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

async function generateProductHuntGallery(directory) {
  const target = resolve(directory);
  const inside = relative(rootPath, target);
  if (!inside.startsWith('..') && !isAbsolute(inside)) {
    throw new Error('The Product Hunt gallery is written outside the site repository.');
  }
  const { config, assets, readCaptures } = await loadInputs();
  sharp.cache(false);
  await mkdir(target, { recursive: true });
  const record = {
    generatedAt: new Date().toISOString(),
    size: PRODUCT_HUNT_SIZE,
    renderer: config.renderer,
    images: [],
  };
  for (const image of config.productHuntGallery) {
    const { captures, sources } = await readCaptures(image.screens);
    const pipeline = await composeCard(PRODUCT_HUNT_SIZE, image, captures, assets);
    const output = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    const file = `shuuty-product-hunt-${image.id}.png`;
    await writeFile(join(target, file), output);
    record.images.push({ file, byteLength: output.length, sha256: sha256(output), sources });
    console.log(`${file}: ${output.length} bytes.`);
  }
  await writeFile(join(target, 'product-hunt-gallery.json'), `${JSON.stringify(record, null, 2)}\n`);
}

const productHuntIndex = process.argv.indexOf('--product-hunt');
if (productHuntIndex > 0) {
  const directory = process.argv[productHuntIndex + 1];
  if (!directory) throw new Error('Pass the target directory after --product-hunt.');
  await generateProductHuntGallery(directory);
} else {
  await generateSiteCards();
}
