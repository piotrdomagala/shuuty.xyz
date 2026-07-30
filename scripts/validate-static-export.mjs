import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const supportEmail = 'shuuty.app@gmail.com';

const pages = {
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

  if (!/<title>[^<]+\| Shuuty<\/title>/.test(html)) {
    failures.push(`${name} static HTML is missing route metadata`);
  }
}
if (failures.length > 0) {
  console.error(`Static export validation failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Static legal and support page validation passed.');
}
