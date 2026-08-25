import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const outputPath = fileURLToPath(new URL('out/', root));
const supportEmail = 'shuuty.app@gmail.com';
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shuuty.com').replace(
  /\/+$/,
  '',
);
const escapedSiteUrl = siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const openGraphImagePattern = new RegExp(
  `<meta(?=[^>]*\\bproperty="og:image")(?=[^>]*\\bcontent="${escapedSiteUrl}/opengraph-image\\.png(?:\\?[^\"]+)?")[^>]*>`,
);
const twitterImagePattern = new RegExp(
  `<meta(?=[^>]*\\bname="twitter:image")(?=[^>]*\\bcontent="${escapedSiteUrl}/opengraph-image\\.png")[^>]*>`,
);

const pages = {
  home: {
    path: 'out/index.html',
    route: '/',
    required: [
      'From idea',
      'Say it. Delegate it. Get it done.',
      'Say it. Choose a person or group. The task is ready.',
      'From thought to task - three steps.',
      'Your group can become its own world.',
      'A place to work',
      'A service offer',
      'A sales showcase',
      'Gallery',
      'Projects',
      'Start simple. Add structure when it helps.',
      'Map · Discovery',
      'SoftwareApplication',
      'WebSite',
      'Organization',
      'FAQPage',
      'shuuty-theme',
      'summary_large_image',
      'android-chrome-192x192.png',
      'opengraph-image.png',
      '/images/brand/shuuty-app-icon.png',
      '/images/brand/golden-relay-flow.png',
      '/images/product/canonical-flow-2026/en-US/01-voice-input.webp',
      '/images/product/canonical-flow-2026/en-US/02-assignee.webp',
      '/images/product/canonical-flow-2026/en-US/03-delegated-task.webp',
      '/images/product/canonical-flow-2026/en-US/04-groups.webp',
      '/images/product/canonical-flow-2026/en-US/05-group-offer-gallery.webp',
      '/images/product/canonical-flow-2026/en-US/06-modules.webp',
      '/images/product/canonical-flow-2026/en-US/07-bookings.webp',
      '/images/product/canonical-flow-2026/en-US/08-nearby.webp',
      'https://play.google.com/store/apps/details?id=com.shuuty.app',
      '/account-deletion/',
      'Switch to light mode',
    ],
    requiredPatterns: [
      /<h1[^>]*>/,
      /<script type="application\/ld\+json">/,
      /<details[^>]*open=""/,
      /<title>Shuuty - Voice Tasks, Flexible Groups &amp; Meetings<\/title>/,
      openGraphImagePattern,
      twitterImagePattern,
    ],
    forbiddenPatterns: [
      /\/images\/image[1-5]\.webp/,
      /\/images\/app\/(?:create-menu|discover-groups|discover-meetings|profile-settings)\.(?:jpe?g|png)/,
      /\/images\/product\/canonical-flow-2026\/pl-PL\//,
      /\/images\/product\/canonical-flow-2026\/[^"' )]+\.png/,
      /exports\/final/,
    ],
    routeMetadata: false,
    language: 'en',
    alternateRoute: '/pl/',
  },
  homePl: {
    path: 'out/pl/index.html',
    route: '/pl/',
    required: [
      'Od pomysłu',
      'Powiedz. Deleguj. Działajcie.',
      'Powiedz. Wybierz osobę lub grupę. Zadanie jest gotowe.',
      'Od myśli do zadania - trzy kroki.',
      'Twoja grupa może stać się własnym światem.',
      'Miejsce pracy',
      'Oferta usługowa',
      'Oferta sprzedażowa',
      'Galeria',
      'Projekty',
      'Zacznij prosto. Dodaj strukturę, gdy pomaga.',
      'FAQPage',
      'Co Shuuty rozumie z zadania głosowego?',
      '/pl/support/',
      '/pl/account-deletion/',
      '/pl/privacy/',
      '/pl/terms/',
      '/images/brand/golden-relay-flow.png',
      '/images/product/canonical-flow-2026/pl-PL/01-voice-input.webp',
      '/images/product/canonical-flow-2026/pl-PL/02-assignee.webp',
      '/images/product/canonical-flow-2026/pl-PL/03-delegated-task.webp',
      '/images/product/canonical-flow-2026/pl-PL/04-groups.webp',
      '/images/product/canonical-flow-2026/pl-PL/05-group-offer-gallery.webp',
      '/images/product/canonical-flow-2026/pl-PL/06-modules.webp',
      '/images/product/canonical-flow-2026/pl-PL/07-bookings.webp',
      '/images/product/canonical-flow-2026/pl-PL/08-nearby.webp',
    ],
    requiredPatterns: [
      /<h1[^>]*>/,
      /<script type="application\/ld\+json">/,
      /<details[^>]*open=""/,
      /<title>Zadania głosowe, grupy i spotkania \| Shuuty<\/title>/,
      openGraphImagePattern,
      twitterImagePattern,
    ],
    forbiddenPatterns: [
      /\/images\/app\/(?:create-menu|discover-groups|discover-meetings|profile-settings)\.(?:jpe?g|png)/,
      /\/images\/product\/canonical-flow-2026\/en-US\//,
      /\/images\/product\/canonical-flow-2026\/[^"' )]+\.png/,
      /exports\/final/,
    ],
    language: 'pl',
    alternateRoute: '/',
  },
  support: {
    path: 'out/support/index.html',
    route: '/support/',
    required: ['Contact Support', supportEmail, 'Copy email address', '/account-deletion/'],
    requiredPatterns: [
      /<button[^>]+aria-label="Copy email address: shuuty\.app@gmail\.com"/,
      /aria-live="polite"/,
    ],
    language: 'en',
    alternateRoute: '/pl/support/',
  },
  supportPl: {
    path: 'out/pl/support/index.html',
    route: '/pl/support/',
    required: ['Pomoc i kontakt', supportEmail, 'Kopiuj adres e-mail', '/pl/account-deletion/'],
    requiredPatterns: [
      /<button[^>]+aria-label="Kopiuj adres e-mail: shuuty\.app@gmail\.com"/,
      /aria-live="polite"/,
    ],
    language: 'pl',
    alternateRoute: '/support/',
  },
  accountDeletion: {
    path: 'out/account-deletion/index.html',
    route: '/account-deletion/',
    required: [
      'Delete your Shuuty account',
      supportEmail,
      'Never send us your password',
      'does not automatically cancel a subscription',
    ],
    language: 'en',
    alternateRoute: '/pl/account-deletion/',
  },
  accountDeletionPl: {
    path: 'out/pl/account-deletion/index.html',
    route: '/pl/account-deletion/',
    required: [
      'Usuń konto Shuuty',
      supportEmail,
      'Nigdy nie przesyłaj nam hasła',
      'nie anuluje automatycznie subskrypcji',
    ],
    language: 'pl',
    alternateRoute: '/account-deletion/',
  },
  privacy: {
    path: 'out/privacy/index.html',
    route: '/privacy/',
    required: ['Privacy Policy of the Shuuty Mobile Application', supportEmail],
    language: 'en',
    alternateRoute: '/pl/privacy/',
  },
  privacyPl: {
    path: 'out/pl/privacy/index.html',
    route: '/pl/privacy/',
    required: ['Polityka prywatności aplikacji mobilnej Shuuty', supportEmail],
    language: 'pl',
    alternateRoute: '/privacy/',
  },
  terms: {
    path: 'out/terms/index.html',
    route: '/terms/',
    required: ['Shuuty Mobile Application Terms and Conditions', supportEmail],
    language: 'en',
    alternateRoute: '/pl/terms/',
  },
  termsPl: {
    path: 'out/pl/terms/index.html',
    route: '/pl/terms/',
    required: ['Regulamin aplikacji mobilnej Shuuty', supportEmail],
    language: 'pl',
    alternateRoute: '/terms/',
  },
  legacyPrivacy: {
    path: 'out/documents/privacy/index.html',
    route: '/documents/privacy/',
    canonicalRoute: '/privacy/',
    required: ['Privacy Policy of the Shuuty Mobile Application', supportEmail],
    language: 'en',
    noindex: true,
  },
  legacyPrivacyPl: {
    path: 'out/pl/documents/privacy/index.html',
    route: '/pl/documents/privacy/',
    canonicalRoute: '/pl/privacy/',
    required: ['Polityka prywatności aplikacji mobilnej Shuuty', supportEmail],
    language: 'pl',
    noindex: true,
  },
  legacyTerms: {
    path: 'out/documents/terms/index.html',
    route: '/documents/terms/',
    canonicalRoute: '/terms/',
    required: ['Shuuty Mobile Application Terms and Conditions', supportEmail],
    language: 'en',
    noindex: true,
  },
  legacyTermsPl: {
    path: 'out/pl/documents/terms/index.html',
    route: '/pl/documents/terms/',
    canonicalRoute: '/pl/terms/',
    required: ['Regulamin aplikacji mobilnej Shuuty', supportEmail],
    language: 'pl',
    noindex: true,
  },
  legacySupport: {
    path: 'out/documents/support/index.html',
    route: '/documents/support/',
    canonicalRoute: '/support/',
    required: ['Contact Support', supportEmail],
    language: 'en',
    noindex: true,
  },
  legacySupportPl: {
    path: 'out/pl/documents/support/index.html',
    route: '/pl/documents/support/',
    canonicalRoute: '/pl/support/',
    required: ['Pomoc i kontakt', supportEmail],
    language: 'pl',
    noindex: true,
  },
};

const failures = [];

async function findRouteDirectories(directory) {
  const routeDirectories = [];
  const entries = await readdir(directory, { withFileTypes: true });

  if (entries.some((entry) => entry.isFile() && entry.name === '__next._tree.txt')) {
    routeDirectories.push(directory);
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('__next.')) continue;
    routeDirectories.push(...(await findRouteDirectories(join(directory, entry.name))));
  }

  return routeDirectories;
}

for (const routeDirectory of await findRouteDirectories(outputPath)) {
  const routeSegments = relative(outputPath, routeDirectory).split(sep).filter(Boolean);
  const expectedPageSegment = [
    '__next',
    ...routeSegments,
    '__PAGE__',
    'txt',
  ].join('.');
  const entries = await readdir(routeDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('__next.')) {
      failures.push(
        `${relative(outputPath, join(routeDirectory, entry.name))} is a non-portable nested segment cache path`,
      );
    }
  }

  if (!entries.some((entry) => entry.isFile() && entry.name === expectedPageSegment)) {
    failures.push(
      `${relative(outputPath, routeDirectory) || '/'} is missing portable segment cache file: ${expectedPageSegment}`,
    );
  }
}

for (const [name, page] of Object.entries(pages)) {
  const html = await readFile(new URL(page.path, root), 'utf8');

  const htmlLanguagePattern = new RegExp(`<html[^>]+lang="${page.language}"`, 'i');
  if (!htmlLanguagePattern.test(html)) {
    failures.push(`${name} static HTML should use lang="${page.language}" on the html element`);
  }
  if (html.includes('=/^/pl')) {
    failures.push(`${name} static HTML contains a malformed language bootstrap expression`);
  }

  for (const expectedText of page.required) {
    if (!html.includes(expectedText)) {
      failures.push(`${name} static HTML is missing: ${expectedText}`);
    }
  }

  for (const expectedPattern of page.requiredPatterns ?? []) {
    if (!expectedPattern.test(html)) {
      failures.push(`${name} static HTML is missing: ${expectedPattern}`);
    }
  }

  for (const forbiddenPattern of page.forbiddenPatterns ?? []) {
    if (forbiddenPattern.test(html)) {
      failures.push(`${name} static HTML still contains: ${forbiddenPattern}`);
    }
  }

  const canonicalUrl = `${siteUrl}${page.canonicalRoute ?? page.route}`;
  if (!html.includes(`<link rel="canonical" href="${canonicalUrl}"`)) {
    failures.push(`${name} static HTML is missing canonical URL: ${canonicalUrl}`);
  }

  if (page.alternateRoute) {
    const englishRoute = page.language === 'pl' ? page.alternateRoute : page.route;
    const polishRoute = page.language === 'pl' ? page.route : page.alternateRoute;
    const expectedAlternates = {
      en: `${siteUrl}${englishRoute}`,
      pl: `${siteUrl}${polishRoute}`,
      'x-default': `${siteUrl}${englishRoute}`,
    };

    for (const [language, url] of Object.entries(expectedAlternates)) {
      const alternatePattern = new RegExp(
        `<link rel="alternate" hrefLang="${language}" href="${url.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        )}"`,
        'i',
      );
      if (!alternatePattern.test(html)) {
        failures.push(`${name} static HTML is missing ${language} alternate: ${url}`);
      }
    }
  }

  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (h1Count !== 1) {
    failures.push(`${name} static HTML should contain exactly one h1, found ${h1Count}`);
  }

  for (const sharedSocialTag of [
    '<meta property="og:type" content="website"',
    '<meta property="og:site_name" content="Shuuty"',
    '<meta name="twitter:card" content="summary_large_image"',
  ]) {
    if (!html.includes(sharedSocialTag)) {
      failures.push(`${name} static HTML is missing: ${sharedSocialTag}`);
    }
  }

  if (!openGraphImagePattern.test(html) || !twitterImagePattern.test(html)) {
    const detectedSocialImageTags = html.match(
      /<meta[^>]*(?:property="og:image"|name="twitter:image")[^>]*>/g,
    ) ?? [];
    failures.push(
      `${name} static HTML is missing the shared social preview image; detected tags: ${
        detectedSocialImageTags.join(' | ') || 'none'
      }`,
    );
  }

  if (page.routeMetadata !== false && !/<title>[^<]+\| Shuuty<\/title>/.test(html)) {
    failures.push(`${name} static HTML is missing route metadata`);
  }

  if (page.noindex && !html.includes('<meta name="robots" content="noindex, follow"')) {
    failures.push(`${name} static HTML is missing noindex, follow`);
  }
}

for (const [name, canonicalRoute] of Object.entries({
  'privacy.html': '/privacy/',
  'terms.html': '/terms/',
  'support.html': '/support/',
})) {
  const html = await readFile(new URL(`out/documents/${name}`, root), 'utf8');
  if (!html.includes(`http-equiv="refresh" content="0; url=${canonicalRoute}"`)) {
    failures.push(`${name} is missing its canonical refresh target`);
  }
  if (!html.includes(`<link rel="canonical" href="${siteUrl}${canonicalRoute}"`)) {
    failures.push(`${name} is missing its canonical URL`);
  }
  if (!html.includes('<meta name="robots" content="noindex, follow"')) {
    failures.push(`${name} is missing noindex, follow`);
  }
}

const handOffPages = [
  {
    name: 'verify',
    path: 'out/verify/index.html',
    route: '/verify/',
    title: 'Verify your email | Shuuty',
  },
  {
    name: 'auth verify',
    path: 'out/auth/verify/index.html',
    route: '/auth/verify/',
    title: 'Verify your email | Shuuty',
  },
  {
    name: 'reset password',
    path: 'out/auth/reset-password/index.html',
    route: '/auth/reset-password/',
    title: 'Reset your password | Shuuty',
  },
];

for (const page of handOffPages) {
  const html = await readFile(new URL(page.path, root), 'utf8');
  const canonicalUrl = `${siteUrl}${page.route}`;

  if (!html.includes('<meta name="robots" content="noindex, nofollow"')) {
    failures.push(`${page.name} static HTML is missing noindex, nofollow`);
  }
  if (!html.includes(`<link rel="canonical" href="${canonicalUrl}"`)) {
    failures.push(`${page.name} static HTML is missing canonical URL: ${canonicalUrl}`);
  }
  if (!html.includes(`<title>${page.title}</title>`)) {
    failures.push(`${page.name} static HTML is missing route title: ${page.title}`);
  }
}

const robots = await readFile(new URL('out/robots.txt', root), 'utf8');
if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) {
  failures.push('robots.txt is missing the canonical sitemap URL');
}
if (/Disallow:\s*\/(?:verify|auth\/)/.test(robots)) {
  failures.push('robots.txt blocks a noindex hand-off route from being crawled');
}
for (const expectedDirective of [
  'Content-Signal: search=yes, ai-input=yes, ai-train=no',
  'User-agent: OAI-SearchBot',
  'User-agent: Claude-SearchBot',
  'User-agent: PerplexityBot',
  'User-agent: GPTBot\nDisallow: /',
  'User-agent: ClaudeBot\nDisallow: /',
  'User-agent: Google-Extended\nDisallow: /',
]) {
  if (!robots.includes(expectedDirective)) {
    failures.push(`robots.txt is missing: ${expectedDirective}`);
  }
}

const sitemap = await readFile(new URL('out/sitemap.xml', root), 'utf8');
for (const route of [
  '/',
  '/pl/',
  '/support/',
  '/pl/support/',
  '/account-deletion/',
  '/pl/account-deletion/',
  '/privacy/',
  '/pl/privacy/',
  '/terms/',
  '/pl/terms/',
]) {
  if (!sitemap.includes(`<loc>${siteUrl}${route}</loc>`)) {
    failures.push(`sitemap.xml is missing: ${siteUrl}${route}`);
  }
}
for (const [language, route] of Object.entries({ en: '/', pl: '/pl/', 'x-default': '/' })) {
  if (!sitemap.includes(`hreflang="${language}" href="${siteUrl}${route}"`)) {
    failures.push(`sitemap.xml is missing ${language} language alternate`);
  }
}

const llms = await readFile(new URL('out/llms.txt', root), 'utf8');
for (const expectedText of [
  '# Shuuty',
  `${siteUrl}/pl/`,
  `${siteUrl}/llms-full.txt`,
  'Shuuty on the App Store',
  'Shuuty on Google Play',
]) {
  if (!llms.includes(expectedText)) {
    failures.push(`llms.txt is missing: ${expectedText}`);
  }
}

const llmsFull = await readFile(new URL('out/llms-full.txt', root), 'utf8');
for (const expectedText of ['Tasks and voice input', 'Zadania i obsługa głosu', supportEmail]) {
  if (!llmsFull.includes(expectedText)) {
    failures.push(`llms-full.txt is missing: ${expectedText}`);
  }
}

const indexNowKey = '82c89256cd2a7441fe790b5d949d58fedac21a8a5c3a0faf';
const indexNowKeyFile = await readFile(new URL(`out/${indexNowKey}.txt`, root), 'utf8');
if (indexNowKeyFile.trim() !== indexNowKey) {
  failures.push('IndexNow key file does not contain the expected public key');
}

const manifest = JSON.parse(await readFile(new URL('out/site.webmanifest', root), 'utf8'));
for (const [field, expected] of Object.entries({ id: '/', start_url: '/', scope: '/', lang: 'en' })) {
  if (manifest[field] !== expected) {
    failures.push(`site.webmanifest should set ${field} to ${expected}`);
  }
}

const favicon = await readFile(new URL('out/favicon.ico', root));
if (!favicon.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0]))) {
  failures.push('favicon.ico is not a valid ICO container');
}

if (failures.length > 0) {
  console.error(`Static export validation failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Static landing, legal and support page validation passed.');
}
