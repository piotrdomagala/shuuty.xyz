import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const supportEmail = 'shuuty.app@gmail.com';
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shuuty.xyz').replace(
  /\/+$/,
  '',
);
const escapedSiteUrl = siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const openGraphImagePattern = new RegExp(
  `<meta property="og:image" content="${escapedSiteUrl}/opengraph-image\\.png(?:\\?[^\"]+)?"`,
);
const twitterImagePattern = new RegExp(
  `<meta name="twitter:image" content="${escapedSiteUrl}/opengraph-image\\.png"`,
);

const pages = {
  home: {
    path: 'out/index.html',
    route: '/',
    required: [
      'From idea',
      'Say it. Delegate it now. Remind at the right time.',
      'Alex receives the task now.',
      'One group. Any purpose.',
      'Map · Discovery',
      'SoftwareApplication',
      'WebSite',
      'Organization',
      'shuuty-theme',
      'summary_large_image',
      'android-chrome-192x192.png',
      'opengraph-image.png',
      '/images/brand/shuuty-app-icon.png',
      '/images/app/create-menu.png',
      '/images/app/discover-groups.png',
      '/images/app/discover-meetings.png',
      '/images/app/profile-settings.png',
      'https://play.google.com/store/apps/details?id=com.shuuty.app',
      'Switch to light mode',
    ],
    requiredPatterns: [
      /<h1[^>]*>/,
      /<script type="application\/ld\+json">/,
      /<title>Shuuty — Voice Tasks, Groups &amp; Nearby Discovery<\/title>/,
      openGraphImagePattern,
      twitterImagePattern,
    ],
    forbiddenPatterns: [/\/images\/image[1-5]\.webp/],
    routeMetadata: false,
  },
  support: {
    path: 'out/support/index.html',
    route: '/support/',
    required: ['Contact Support', supportEmail, 'Copy email address'],
    requiredPatterns: [
      /<button[^>]+aria-label="Copy email address: shuuty\.app@gmail\.com"/,
      /aria-live="polite"/,
    ],
  },
  privacy: {
    path: 'out/privacy/index.html',
    route: '/privacy/',
    required: ['Privacy Policy of the Shuuty Mobile Application', supportEmail],
  },
  terms: {
    path: 'out/terms/index.html',
    route: '/terms/',
    required: ['Shuuty Mobile Application Terms and Conditions', supportEmail],
  },
};

const failures = [];

for (const [name, page] of Object.entries(pages)) {
  const html = await readFile(new URL(page.path, root), 'utf8');

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

  const canonicalUrl = `${siteUrl}${page.route}`;
  if (!html.includes(`<link rel="canonical" href="${canonicalUrl}"`)) {
    failures.push(`${name} static HTML is missing canonical URL: ${canonicalUrl}`);
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
    failures.push(`${name} static HTML is missing the shared social preview image`);
  }

  if (page.routeMetadata !== false && !/<title>[^<]+\| Shuuty<\/title>/.test(html)) {
    failures.push(`${name} static HTML is missing route metadata`);
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

const sitemap = await readFile(new URL('out/sitemap.xml', root), 'utf8');
for (const route of ['/', '/support/', '/privacy/', '/terms/']) {
  if (!sitemap.includes(`<loc>${siteUrl}${route}</loc>`)) {
    failures.push(`sitemap.xml is missing: ${siteUrl}${route}`);
  }
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
