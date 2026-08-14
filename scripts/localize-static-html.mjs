import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const polishPages = [
  'out/pl/index.html',
  'out/pl/privacy/index.html',
  'out/pl/terms/index.html',
  'out/pl/support/index.html',
  'out/pl/account-deletion/index.html',
  'out/pl/documents/privacy/index.html',
  'out/pl/documents/terms/index.html',
  'out/pl/documents/support/index.html',
];

for (const pagePath of polishPages) {
  const pageUrl = new URL(pagePath, root);
  const html = await readFile(pageUrl, 'utf8');

  if (/<html[^>]+lang="pl"/i.test(html)) {
    continue;
  }

  if (!/<html[^>]+lang="en"/i.test(html)) {
    throw new Error(`${pagePath} does not contain a supported html lang attribute`);
  }

  const localizedHtml = html.replace(/(<html[^>]+lang=")en("[^>]*>)/i, '$1pl$2');
  await writeFile(pageUrl, localizedHtml, 'utf8');
}

console.log('Polish static pages use lang="pl" on the html element.');
