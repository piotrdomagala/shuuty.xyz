import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const supportEmail = 'shuuty.app@gmail.com';

const pages = {
  home: {
    path: 'out/index.html',
    required: [
      'From idea',
      'Say it. Delegate it now. Remind at the right time.',
      'Alex receives the task now.',
      'One group. Any purpose.',
      'Map · Discovery',
      'SoftwareApplication',
      'shuuty-theme',
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
      /<title>Shuuty - Voice Tasks, Flexible Groups &amp; Discovery<\/title>/,
    ],
    forbiddenPatterns: [/\/images\/image[1-5]\.webp/],
    routeMetadata: false,
  },
  support: {
    path: 'out/support/index.html',
    required: ['Contact Support', supportEmail, 'Copy email address'],
    requiredPatterns: [
      /<button[^>]+aria-label="Copy email address: shuuty\.app@gmail\.com"/,
      /aria-live="polite"/,
    ],
  },
  privacy: {
    path: 'out/privacy/index.html',
    required: ['Privacy Policy of the Shuuty Mobile Application', supportEmail],
  },
  terms: {
    path: 'out/terms/index.html',
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

  if (page.routeMetadata !== false && !/<title>[^<]+\| Shuuty<\/title>/.test(html)) {
    failures.push(`${name} static HTML is missing route metadata`);
  }
}
if (failures.length > 0) {
  console.error(`Static export validation failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Static landing, legal and support page validation passed.');
}
