const SITE_HOST = 'shuuty.com';
const SITEMAP_URL = `https://${SITE_HOST}/sitemap.xml`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const INDEXNOW_KEY = '82c89256cd2a7441fe790b5d949d58fedac21a8a5c3a0faf';
const KEY_LOCATION = `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`;
const REQUEST_TIMEOUT_MS = 20_000;
const IS_DRY_RUN = process.argv.includes('--dry-run');

function decodeXmlText(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

function extractCanonicalUrls(sitemapXml) {
  const matches = sitemapXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/giu);
  const urls = new Set();

  for (const match of matches) {
    const candidate = new URL(decodeXmlText(match[1].trim()));

    if (candidate.protocol !== 'https:' || candidate.hostname !== SITE_HOST) {
      throw new Error(`Unexpected URL in sitemap: ${candidate.href}`);
    }

    urls.add(candidate.href);
  }

  if (urls.size === 0) {
    throw new Error(`No canonical URLs found in ${SITEMAP_URL}.`);
  }

  if (urls.size > 10_000) {
    throw new Error(`IndexNow accepts at most 10,000 URLs per request; found ${urls.size}.`);
  }

  return [...urls];
}

async function fetchWithTimeout(url, options = {}) {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function main() {
  const sitemapResponse = await fetchWithTimeout(SITEMAP_URL, {
    headers: { Accept: 'application/xml, text/xml;q=0.9, */*;q=0.1' },
  });

  if (!sitemapResponse.ok) {
    throw new Error(
      `Could not fetch sitemap (${sitemapResponse.status} ${sitemapResponse.statusText}).`,
    );
  }

  const urlList = extractCanonicalUrls(await sitemapResponse.text());
  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  if (IS_DRY_RUN) {
    console.log(`IndexNow dry run: ${urlList.length} canonical URL(s) are ready.`);
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const submissionResponse = await fetchWithTimeout(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (![200, 202].includes(submissionResponse.status)) {
    const responseBody = (await submissionResponse.text()).trim().slice(0, 500);
    const details = responseBody ? ` Response: ${responseBody}` : '';

    throw new Error(
      `IndexNow rejected the submission (${submissionResponse.status} ${submissionResponse.statusText}).${details}`,
    );
  }

  console.log(
    `IndexNow accepted ${urlList.length} canonical URL(s) from ${SITEMAP_URL} ` +
      `(HTTP ${submissionResponse.status}).`,
  );
}

main().catch((error) => {
  console.error(`IndexNow notification failed: ${error.message}`);
  process.exitCode = 1;
});
