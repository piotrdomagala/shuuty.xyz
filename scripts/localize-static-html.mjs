import { readdir, readFile, writeFile } from 'node:fs/promises';
import { GUIDE_INDEX_PATHS } from '../lib/sitePaths.mjs';

const root = new URL('../', import.meta.url);
const localizedPages = {
  pl: [
    'out/pl/index.html',
    'out/pl/privacy/index.html',
    'out/pl/terms/index.html',
    'out/pl/support/index.html',
    'out/pl/facts/index.html',
    'out/pl/account-deletion/index.html',
    'out/pl/child-safety/index.html',
    'out/pl/documents/privacy/index.html',
    'out/pl/documents/terms/index.html',
    'out/pl/documents/support/index.html',
  ],
  nb: ['out/nb/index.html', 'out/nb/support/index.html', 'out/nb/facts/index.html'],
};

// Every page in the Polish and Norwegian guide sections: the index and one
// folder per article.
for (const language of /** @type {const} */ (['pl', 'nb'])) {
  const sectionPath = `out${GUIDE_INDEX_PATHS[language]}`;
  localizedPages[language].push(`${sectionPath}index.html`);
  const entries = await readdir(new URL(sectionPath, root), { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('__next')) {
      localizedPages[language].push(`${sectionPath}${entry.name}/index.html`);
    }
  }
}

for (const [language, pagePaths] of Object.entries(localizedPages)) {
  for (const pagePath of pagePaths) {
    const pageUrl = new URL(pagePath, root);
    const html = await readFile(pageUrl, 'utf8');

    if (new RegExp(`<html[^>]+lang="${language}"`, 'i').test(html)) {
      continue;
    }

    if (!/<html[^>]+lang="en"/i.test(html)) {
      throw new Error(`${pagePath} does not contain a supported html lang attribute`);
    }

    const localizedHtml = html.replace(/(<html[^>]+lang=")en("[^>]*>)/i, `$1${language}$2`);
    await writeFile(pageUrl, localizedHtml, 'utf8');
  }
}

console.log('Polish and Norwegian static pages use their language on the html element.');
