import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { DERIVATIVE_ENCODER, DERIVATIVE_LIBVIPS } from './product-media-derivatives.mjs';

const defaultRoot = new URL('../', import.meta.url);
const cardLanguages = ['en', 'pl', 'nb'];
// Norway has no Norwegian captures yet, so its card shows the English ones,
// exactly like the Norwegian landing page.
const captureLocaleForCard = { en: 'en-US', pl: 'pl-PL', nb: 'en-US' };
const cardSize = { width: 1200, height: 630 };
// WhatsApp and some messengers skip previews above roughly 300 KB.
const maxCardBytes = 250 * 1024;
// Every glyph here exists in the card font; anything else would silently fall
// back to a system font and make the card depend on the machine.
const renderableText = /^[A-Za-z0-9ĄĆĘŁŃÓŚŹŻąćęłńóśźżÆØÅæøå .,:;!?'()&-]+$/u;
const longDash = /[\u2013\u2014]/u;

function checkText(label, value, failures, { rendered = true } = {}) {
  if (typeof value !== 'string' || !value.trim()) {
    failures.push(`${label} must be a non-empty string.`);
    return;
  }
  if (longDash.test(value)) {
    failures.push(`${label} must use the short hyphen, not a long dash.`);
  }
  if (rendered && !renderableText.test(value)) {
    failures.push(`${label} contains characters the card font cannot render.`);
  }
}

function checkCaptures(label, screens, expectedLocale, mediaById, failures) {
  if (!Array.isArray(screens) || screens.length < 2 || screens.length > 3) {
    failures.push(`${label}.screens must list two or three product captures.`);
    return;
  }
  for (const id of screens) {
    const asset = mediaById.get(id);
    if (!asset) {
      failures.push(`${label}.screens references unknown capture ${id}.`);
    } else if (asset.locales?.[0] !== expectedLocale) {
      failures.push(`${label}.screens must use ${expectedLocale} captures; ${id} is not.`);
    }
  }
}

async function checkCardImage(language, card, root, failures) {
  const image = card.image ?? {};
  const label = `cards.${language}.image`;
  const expectedPath = `/images/social/shuuty-${language}.jpg`;
  if (image.path !== expectedPath) {
    failures.push(`${label}.path must be ${expectedPath}.`);
    return;
  }
  if (image.mediaType !== 'image/jpeg') {
    failures.push(`${label}.mediaType must be image/jpeg.`);
  }
  if (image.width !== cardSize.width || image.height !== cardSize.height) {
    failures.push(`${label} must be ${cardSize.width}x${cardSize.height}.`);
  }
  if (!Number.isInteger(image.byteLength) || image.byteLength > maxCardBytes) {
    failures.push(`${label} must stay within the ${maxCardBytes}-byte preview budget.`);
  }

  let buffer;
  try {
    buffer = await readFile(new URL(`public${image.path}`, root));
  } catch {
    failures.push(`${label} is missing at public${image.path}.`);
    return;
  }
  const digest = createHash('sha256').update(buffer).digest('hex');
  if (digest !== image.sha256) {
    failures.push(`${label} SHA-256 is ${digest}; expected ${image.sha256}.`);
  }
  if (buffer.length !== image.byteLength) {
    failures.push(`${label} is ${buffer.length} bytes; expected ${image.byteLength}.`);
  }
  try {
    const metadata = await sharp(buffer, { failOn: 'error' }).metadata();
    if (metadata.format !== 'jpeg') {
      failures.push(`${label} is not a JPEG file.`);
    } else if (metadata.width !== cardSize.width || metadata.height !== cardSize.height) {
      failures.push(`${label} file is ${metadata.width}x${metadata.height}.`);
    }
  } catch {
    failures.push(`${label} is not a readable image.`);
  }
}

function checkHeadline(label, headline, failures) {
  if (!Array.isArray(headline) || headline.length !== 2) {
    failures.push(`${label}.headline must have two lines.`);
    return false;
  }
  headline.forEach((line, index) => checkText(`${label}.headline[${index}]`, line, failures));
  return true;
}

function checkRenderer(config, failures) {
  if (config.schemaVersion !== 1) {
    failures.push('Social card schemaVersion must be 1.');
  }
  const renderer = config.renderer ?? {};
  if (renderer.encoder !== DERIVATIVE_ENCODER || renderer.libvips !== DERIVATIVE_LIBVIPS) {
    failures.push(`Social cards must be rendered with ${DERIVATIVE_ENCODER} and libvips ${DERIVATIVE_LIBVIPS}.`);
  }
  for (const field of ['fontSha256', 'iconSha256']) {
    if (!/^[a-f0-9]{64}$/u.test(renderer[field] || '')) {
      failures.push(`renderer.${field} must be a lowercase SHA-256 digest.`);
    }
  }
}

// A card is stale once any capture it was rendered from has changed.
function checkCardSources(label, card, mediaById, failures) {
  const sources = card.sources ?? {};
  if (JSON.stringify(Object.keys(sources)) !== JSON.stringify(card.screens ?? [])) {
    failures.push(`${label}.sources must record exactly the listed captures.`);
  }
  for (const [id, sourceSha256] of Object.entries(sources)) {
    const asset = mediaById.get(id);
    if (asset && asset.sha256 !== sourceSha256) {
      failures.push(`${label} was rendered from an older ${id}; regenerate the social cards.`);
    }
  }
}

async function checkCard(language, card, { homeContent, mediaById, root }, failures) {
  const label = `cards.${language}`;
  if (
    checkHeadline(label, card.headline, failures) &&
    card.headline.join(' ') !== homeContent[language]?.hero?.relay
  ) {
    failures.push(`${label}.headline must read exactly like the ${language} hero relay.`);
  }
  checkText(`${label}.tagline`, card.tagline, failures);
  checkText(`${label}.footer`, card.footer, failures);
  checkText(`${label}.alt`, card.alt, failures, { rendered: false });
  checkCaptures(label, card.screens, captureLocaleForCard[language], mediaById, failures);
  checkCardSources(label, card, mediaById, failures);
  await checkCardImage(language, card, root, failures);
}

async function checkSocialDirectory(root, failures) {
  const expectedFiles = new Set(cardLanguages.map((language) => `shuuty-${language}.jpg`));
  let socialFiles = [];
  try {
    socialFiles = await readdir(new URL('public/images/social/', root));
  } catch {
    // Missing card files are reported per card.
  }
  for (const file of socialFiles) {
    if (!expectedFiles.has(file)) {
      failures.push(`public/images/social/${file} is not a recorded social card.`);
    }
  }
}

function checkProductHuntGallery(gallery, mediaById, failures) {
  if (!Array.isArray(gallery) || gallery.length === 0) {
    failures.push('productHuntGallery must list the Product Hunt images.');
    return;
  }
  for (const [index, image] of gallery.entries()) {
    const label = `productHuntGallery[${index}]`;
    if (!/^\d{2}-[a-z-]+$/u.test(image.id || '')) {
      failures.push(`${label}.id must look like 01-name.`);
    }
    checkHeadline(label, image.headline, failures);
    checkText(`${label}.tagline`, image.tagline, failures);
    checkText(`${label}.footer`, image.footer, failures);
    checkCaptures(label, image.screens, 'en-US', mediaById, failures);
  }
}

export async function validateSocialCards(root = defaultRoot) {
  const [config, media, homeContent] = await Promise.all([
    readFile(new URL('content/social-cards.json', root), 'utf8').then(JSON.parse),
    readFile(new URL('content/product-media.json', root), 'utf8').then(JSON.parse),
    readFile(new URL('app/homeContent.json', root), 'utf8').then(JSON.parse),
  ]);
  const failures = [];
  const mediaById = new Map(media.assets.map((asset) => [asset.id, asset]));

  checkRenderer(config, failures);
  if (JSON.stringify(Object.keys(config.cards ?? {})) !== JSON.stringify(cardLanguages)) {
    failures.push(`Social cards must cover exactly ${cardLanguages.join(', ')}.`);
  }
  for (const language of cardLanguages) {
    const card = config.cards?.[language];
    if (card) await checkCard(language, card, { homeContent, mediaById, root }, failures);
  }
  await checkSocialDirectory(root, failures);
  checkProductHuntGallery(config.productHuntGallery, mediaById, failures);

  return failures;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const failures = await validateSocialCards();
  if (failures.length > 0) {
    console.error(`Social card validation failed:\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
  } else {
    console.log('Social cards match their captures, hashes, size budget and copy rules.');
  }
}
