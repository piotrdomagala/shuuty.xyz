import { access, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const outputPath = fileURLToPath(new URL('out/', root));
const supportEmail = 'shuuty.app@gmail.com';
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shuuty.com').replace(/\/+$/, '');
const escapedSiteUrl = siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const openGraphImagePattern = new RegExp(
  `<meta(?=[^>]*\\bproperty="og:image")(?=[^>]*\\bcontent="${escapedSiteUrl}/opengraph-image\\.png(?:\\?[^\"]+)?")[^>]*>`,
);
const twitterImagePattern = new RegExp(
  `<meta(?=[^>]*\\bname="twitter:image")(?=[^>]*\\bcontent="${escapedSiteUrl}/opengraph-image\\.png")[^>]*>`,
);

// Norwegian covers the landing and support pages only.
const homeAlternates = { en: '/', pl: '/pl/', nb: '/nb/', 'x-default': '/' };
const supportAlternates = {
  en: '/support/',
  pl: '/pl/support/',
  nb: '/nb/support/',
  'x-default': '/support/',
};
const copyButtonPattern = (actionLabel) =>
  new RegExp(
    `<button[^>]*><span>shuuty\\.app@gmail\\.com</span><span[^>]*>, </span><span[^>]*>${actionLabel}</span></button>`,
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
    languageAlternates: homeAlternates,
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
    languageAlternates: homeAlternates,
  },
  homeNb: {
    path: 'out/nb/index.html',
    route: '/nb/',
    required: [
      'Fra idé',
      'Si det. Deleger det. Få det gjort.',
      'Si det. Velg en person eller gruppe. Oppgaven er klar.',
      'Fra tanke til oppgave - tre steg.',
      'Gruppen din kan bli en egen verden.',
      'Et arbeidssted',
      'Et tjenestetilbud',
      'Et utstillingsvindu',
      'FAQPage',
      'Hva forstår Shuuty av en oppgave du sier høyt?',
      '/nb/support/',
      '/account-deletion/',
      '/privacy/',
      '/terms/',
      '/images/product/canonical-flow-2026/en-US/01-voice-input.webp',
      '/images/product/canonical-flow-2026/en-US/02-assignee.webp',
      '/images/product/canonical-flow-2026/en-US/03-delegated-task.webp',
      '/images/product/canonical-flow-2026/en-US/08-nearby.webp',
      'og:locale" content="nb_NO"',
    ],
    requiredPatterns: [
      /<h1[^>]*>/,
      /<script type="application\/ld\+json">/,
      /<details[^>]*open=""/,
      /<title>Huskeliste med stemmen, grupper og møter \| Shuuty<\/title>/,
      openGraphImagePattern,
      twitterImagePattern,
    ],
    forbiddenPatterns: [
      /\/images\/product\/canonical-flow-2026\/pl-PL\//,
      /\/images\/product\/canonical-flow-2026\/[^"' )]+\.png/,
      // Legal documents have no Norwegian version; links must go to English.
      /href="\/nb\/(?:privacy|terms|account-deletion|child-safety)\//,
      /exports\/final/,
    ],
    language: 'nb',
    languageAlternates: homeAlternates,
  },
  support: {
    path: 'out/support/index.html',
    route: '/support/',
    required: ['Contact Support', supportEmail, 'Copy email address', '/account-deletion/'],
    requiredPatterns: [
      // The visible text is the accessible name, so it cannot drift from what
      // speech-input users see (WCAG 2.5.3 Label in Name). A visually hidden
      // comma keeps the address and the action apart when read aloud.
      copyButtonPattern('Copy email address'),
      /aria-live="polite"/,
    ],
    language: 'en',
    alternateRoute: '/pl/support/',
    languageAlternates: supportAlternates,
  },
  supportPl: {
    path: 'out/pl/support/index.html',
    route: '/pl/support/',
    required: ['Pomoc i kontakt', supportEmail, 'Kopiuj adres e-mail', '/pl/account-deletion/'],
    requiredPatterns: [copyButtonPattern('Kopiuj adres e-mail'), /aria-live="polite"/],
    language: 'pl',
    alternateRoute: '/support/',
    languageAlternates: supportAlternates,
  },
  supportNb: {
    path: 'out/nb/support/index.html',
    route: '/nb/support/',
    required: [
      'Hjelp og kontakt',
      supportEmail,
      'Kopier e-postadressen',
      'href="/account-deletion/"',
      'og:locale" content="nb_NO"',
    ],
    requiredPatterns: [copyButtonPattern('Kopier e-postadressen'), /aria-live="polite"/],
    forbiddenPatterns: [/href="\/nb\/(?:privacy|terms|account-deletion|child-safety)\//],
    language: 'nb',
    languageAlternates: supportAlternates,
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
  childSafety: {
    path: 'out/child-safety/index.html',
    route: '/child-safety/',
    required: [
      'Shuuty Child Safety Standards',
      'zero tolerance',
      'child sexual abuse and exploitation (CSAE)',
      'child sexual abuse material (CSAM)',
      'Report a child safety concern',
      'National Center for Missing &amp; Exploited Children (NCMEC)',
      supportEmail,
    ],
    language: 'en',
    alternateRoute: '/pl/child-safety/',
  },
  childSafetyPl: {
    path: 'out/pl/child-safety/index.html',
    route: '/pl/child-safety/',
    required: [
      'Standardy bezpieczeństwa dzieci Shuuty',
      'zasadę zerowej tolerancji',
      'Child Sexual Abuse and Exploitation - CSAE',
      'Child Sexual Abuse Material - CSAM',
      'Zgłoś problem dotyczący bezpieczeństwa dzieci',
      'National Center for Missing &amp; Exploited Children (NCMEC)',
      supportEmail,
    ],
    language: 'pl',
    alternateRoute: '/child-safety/',
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
    languageAlternates: {
      en: '/privacy/',
      pl: '/pl/privacy/',
      'x-default': '/privacy/',
    },
  },
  legacyPrivacyPl: {
    path: 'out/pl/documents/privacy/index.html',
    route: '/pl/documents/privacy/',
    canonicalRoute: '/pl/privacy/',
    required: ['Polityka prywatności aplikacji mobilnej Shuuty', supportEmail],
    language: 'pl',
    noindex: true,
    languageAlternates: {
      en: '/privacy/',
      pl: '/pl/privacy/',
      'x-default': '/privacy/',
    },
  },
  legacyTerms: {
    path: 'out/documents/terms/index.html',
    route: '/documents/terms/',
    canonicalRoute: '/terms/',
    required: ['Shuuty Mobile Application Terms and Conditions', supportEmail],
    language: 'en',
    noindex: true,
    languageAlternates: {
      en: '/terms/',
      pl: '/pl/terms/',
      'x-default': '/terms/',
    },
  },
  legacyTermsPl: {
    path: 'out/pl/documents/terms/index.html',
    route: '/pl/documents/terms/',
    canonicalRoute: '/pl/terms/',
    required: ['Regulamin aplikacji mobilnej Shuuty', supportEmail],
    language: 'pl',
    noindex: true,
    languageAlternates: {
      en: '/terms/',
      pl: '/pl/terms/',
      'x-default': '/terms/',
    },
  },
  legacySupport: {
    path: 'out/documents/support/index.html',
    route: '/documents/support/',
    canonicalRoute: '/support/',
    required: ['Contact Support', supportEmail],
    language: 'en',
    noindex: true,
    languageAlternates: {
      en: '/support/',
      pl: '/pl/support/',
      'x-default': '/support/',
    },
  },
  legacySupportPl: {
    path: 'out/pl/documents/support/index.html',
    route: '/pl/documents/support/',
    canonicalRoute: '/pl/support/',
    required: ['Pomoc i kontakt', supportEmail],
    language: 'pl',
    noindex: true,
    languageAlternates: {
      en: '/support/',
      pl: '/pl/support/',
      'x-default': '/support/',
    },
  },
};

const failures = [];
const fgsEvidenceDirectory = new URL(
  'out/google-play/foreground-service/microphone/',
  root,
);
const fgsEvidencePage = await readFile(
  new URL('index.html', fgsEvidenceDirectory),
  'utf8',
);
const fgsEvidenceVideo = await readFile(
  new URL('voice-task-fgs-demo-redacted-v6.mp4', fgsEvidenceDirectory),
);
const fgsEvidenceSha256 = createHash('sha256').update(fgsEvidenceVideo).digest('hex');

if (!fgsEvidencePage.includes('<meta name="robots" content="noindex, nofollow, noarchive" />')) {
  failures.push('FGS evidence page is missing noindex, nofollow, noarchive');
}
if (
  !fgsEvidencePage.includes(
    '<source src="./voice-task-fgs-demo-redacted-v6.mp4" type="video/mp4" />',
  )
) {
  failures.push('FGS evidence page is missing the exact hosted v6 video source');
}
if (fgsEvidenceVideo.length !== 1_228_536) {
  failures.push(`FGS evidence video has unexpected size: ${fgsEvidenceVideo.length}`);
}
if (fgsEvidenceSha256 !== 'f3b376db323c79f5f79a062be96c442770701cedb19a7d2a5b5662630e518fc4') {
  failures.push(`FGS evidence video has unexpected SHA-256: ${fgsEvidenceSha256}`);
}

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
  const expectedPageSegment = ['__next', ...routeSegments, '__PAGE__', 'txt'].join('.');
  const entries = await readdir(routeDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('__next.')) {
      failures.push(
        `${relative(
          outputPath,
          join(routeDirectory, entry.name),
        )} is a non-portable nested segment cache path`,
      );
    }
  }

  if (!entries.some((entry) => entry.isFile() && entry.name === expectedPageSegment)) {
    failures.push(
      `${
        relative(outputPath, routeDirectory) || '/'
      } is missing portable segment cache file: ${expectedPageSegment}`,
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

  if (page.alternateRoute || page.languageAlternates) {
    const englishRoute = page.language === 'pl' ? page.alternateRoute : page.route;
    const polishRoute = page.language === 'pl' ? page.route : page.alternateRoute;
    const alternateRoutes = page.languageAlternates ?? {
      en: englishRoute,
      pl: polishRoute,
      'x-default': englishRoute,
    };
    const expectedAlternates = Object.fromEntries(
      Object.entries(alternateRoutes).map(([language, route]) => [language, `${siteUrl}${route}`]),
    );

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
    const detectedSocialImageTags =
      html.match(/<meta[^>]*(?:property="og:image"|name="twitter:image")[^>]*>/g) ?? [];
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

for (const name of ['privacy.html', 'terms.html', 'support.html']) {
  try {
    await access(new URL(`out/documents/${name}`, root));
    failures.push(
      `${name} must not be exported; GitHub Pages serves it for /documents/${name.replace(
        /\.html$/,
        '',
      )} and shadows the Next alias`,
    );
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
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

// Measurement: tagged store buttons, click events, Smart App Banner and opt-in
// analytics. Public build settings mirror lib/site.ts.
const goatCounterCode = /^[a-z0-9-]{2,50}$/.test(process.env.NEXT_PUBLIC_GOATCOUNTER_CODE?.trim() ?? '')
  ? process.env.NEXT_PUBLIC_GOATCOUNTER_CODE.trim()
  : null;
const appStoreProviderToken = /^\d{4,12}$/.test(
  process.env.NEXT_PUBLIC_APP_STORE_PROVIDER_TOKEN?.trim() ?? '',
)
  ? process.env.NEXT_PUBLIC_APP_STORE_PROVIDER_TOKEN.trim()
  : null;

for (const [language, homePath] of Object.entries({
  en: 'out/index.html',
  pl: 'out/pl/index.html',
  nb: 'out/nb/index.html',
})) {
  const html = await readFile(new URL(homePath, root), 'utf8');

  if (!html.includes('<meta name="apple-itunes-app" content="app-id=6670202422"/>')) {
    failures.push(`${homePath} is missing the iOS Smart App Banner`);
  }
  if (
    !html.includes(
      '"downloadUrl":["https://apps.apple.com/app/shuuty/id6670202422","https://play.google.com/store/apps/details?id=com.shuuty.app"]',
    )
  ) {
    failures.push(`${homePath} structured data must keep clean store URLs`);
  }

  // Every site language must be declared consistently, and the contact point
  // must link to the support page in the page's own language.
  const siteLanguages = ['en', 'pl', 'nb'];
  const structuredData = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const graph = structuredData ? JSON.parse(structuredData[1])['@graph'] ?? [] : [];
  const webSite = graph.find((node) => node['@type'] === 'WebSite');
  const contactPoint = graph.find((node) => node['@type'] === 'Organization')?.contactPoint;
  const supportRoute = language === 'en' ? '/support/' : `/${language}/support/`;
  for (const [label, languages] of [
    ['WebSite.inLanguage', webSite?.inLanguage],
    ['Organization.contactPoint.availableLanguage', contactPoint?.availableLanguage],
  ]) {
    if (siteLanguages.some((siteLanguage) => !languages?.includes(siteLanguage))) {
      failures.push(`${homePath} ${label} must list ${siteLanguages.join(', ')}`);
    }
  }
  if (contactPoint?.url !== `${siteUrl}${supportRoute}`) {
    failures.push(`${homePath} contactPoint.url should be ${siteUrl}${supportRoute}`);
  }

  // Open Graph mirrors hreflang: the page's own locale plus the other two.
  const openGraphLocales = { en: 'en_US', pl: 'pl_PL', nb: 'nb_NO' };
  const ownLocale = html.match(/<meta property="og:locale" content="([^"]+)"/)?.[1];
  const alternateLocales = [
    ...html.matchAll(/<meta property="og:locale:alternate" content="([^"]+)"/g),
  ].map((match) => match[1]).sort();
  const expectedAlternates = Object.entries(openGraphLocales)
    .filter(([siteLanguage]) => siteLanguage !== language)
    .map(([, locale]) => locale)
    .sort();
  if (ownLocale !== openGraphLocales[language]) {
    failures.push(`${homePath} og:locale should be ${openGraphLocales[language]}, found ${ownLocale}`);
  }
  if (JSON.stringify(alternateLocales) !== JSON.stringify(expectedAlternates)) {
    failures.push(
      `${homePath} og:locale:alternate should be ${expectedAlternates.join(', ')}, found ${
        alternateLocales.join(', ') || 'none'
      }`,
    );
  }

  // React also emits a matching <link rel="preload" fetchPriority="high">; only
  // the <img> elements are counted here.
  const highPriorityImages = html.match(/<img[^>]*\bfetchPriority="high"[^>]*>/gi) ?? [];
  if (
    highPriorityImages.length !== 1
    || !highPriorityImages[0].includes('/01-voice-input.webp"')
  ) {
    failures.push(`${homePath} should give exactly one image, the LCP hero, high fetch priority`);
  }

  for (const placement of ['hero', 'download']) {
    const campaign = `web-home-${placement}-${language}`;
    const playReferrer = `referrer=utm_source%3Dshuuty.com%26utm_medium%3Dwebsite%26utm_campaign%3D${campaign}`;
    if (!html.includes(playReferrer)) {
      failures.push(`${homePath} is missing the Google Play referrer for ${campaign}`);
    }
    for (const platform of ['ios', 'android']) {
      const clickEvent = `data-goatcounter-click="store-${platform}-${placement}-${language}"`;
      if (!html.includes(clickEvent)) {
        failures.push(`${homePath} is missing ${clickEvent}`);
      }
    }
    const appStoreCampaign = `pt=${appStoreProviderToken}&amp;ct=${campaign}&amp;mt=8`;
    if (appStoreProviderToken && !html.includes(appStoreCampaign)) {
      failures.push(`${homePath} is missing the App Store campaign link for ${campaign}`);
    }
  }
  if (!appStoreProviderToken && /apps\.apple\.com[^"]*[?&](?:amp;)?pt=/.test(html)) {
    failures.push(`${homePath} has an App Store provider token without a configured value`);
  }
}

const listHtmlFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return entry.name === '_next' ? [] : listHtmlFiles(path);
      return entry.name.endsWith('.html') ? [path] : [];
    }),
  );
  return files.flat();
};

for (const htmlPath of await listHtmlFiles(outputPath)) {
  const html = await readFile(htmlPath, 'utf8');
  const hasAnalytics = html.includes('gc.zgo.at/count.js');
  const displayPath = relative(outputPath, htmlPath).split(sep).join('/');
  if (!goatCounterCode && hasAnalytics) {
    failures.push(`${displayPath} loads analytics although NEXT_PUBLIC_GOATCOUNTER_CODE is not set`);
  }
  if (
    goatCounterCode
    && displayPath.endsWith('index.html')
    && !displayPath.startsWith('google-play/')
    && !html.includes(`data-goatcounter="https://${goatCounterCode}.goatcounter.com/count"`)
  ) {
    failures.push(`${displayPath} is missing the configured GoatCounter script`);
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
  'User-agent: CCBot\nDisallow: /',
  'User-agent: Google-Extended\nAllow: /',
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
  '/child-safety/',
  '/pl/child-safety/',
  '/privacy/',
  '/pl/privacy/',
  '/terms/',
  '/pl/terms/',
  '/nb/',
  '/nb/support/',
]) {
  if (!sitemap.includes(`<loc>${siteUrl}${route}</loc>`)) {
    failures.push(`sitemap.xml is missing: ${siteUrl}${route}`);
  }
}
for (const alternates of [homeAlternates, supportAlternates]) {
  for (const [language, route] of Object.entries(alternates)) {
    if (!sitemap.includes(`hreflang="${language}" href="${siteUrl}${route}"`)) {
      failures.push(`sitemap.xml is missing ${language} language alternate for ${route}`);
    }
  }
}
for (const route of ['/nb/privacy/', '/nb/terms/', '/nb/account-deletion/', '/nb/child-safety/']) {
  if (sitemap.includes(`${siteUrl}${route}`)) {
    failures.push(`sitemap.xml lists a Norwegian legal page that does not exist: ${route}`);
  }
}

const llms = await readFile(new URL('out/llms.txt', root), 'utf8');
for (const expectedText of [
  '# Shuuty',
  `${siteUrl}/pl/`,
  `${siteUrl}/nb/`,
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
for (const [field, expected] of Object.entries({
  id: '/',
  start_url: '/',
  scope: '/',
  lang: 'en',
})) {
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
