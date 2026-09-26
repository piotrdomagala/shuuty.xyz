// @ts-check
// Language-aware routes for the static site. Plain JavaScript so the page code,
// the unit tests and the static export validator all share one implementation.

/** @typedef {'en' | 'pl' | 'nb'} SiteLanguage */

/** Pages with a Norwegian version; legal documents stay English and Polish. */
export const NORWEGIAN_PATHS = Object.freeze(['/', '/support/', '/facts/']);

/** Legacy addresses (noindex aliases) and the canonical pages they stand for. */
export const LEGACY_ALIASES = Object.freeze({
  '/documents/support/': '/support/',
  '/documents/privacy/': '/privacy/',
  '/documents/terms/': '/terms/',
});

/**
 * Guides use a translated section name in every language, so they do not
 * follow the `/pl` and `/nb` prefix rule. Articles are separate texts per
 * language and live under their language's index.
 */
export const GUIDE_INDEX_PATHS = Object.freeze({
  en: '/guides/',
  pl: '/pl/poradniki/',
  nb: '/nb/guider/',
});

/**
 * The guides index a path belongs to, if any.
 *
 * @param {string} pathname
 * @returns {SiteLanguage | null}
 */
export function guideSectionLanguage(pathname) {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const entry = Object.entries(GUIDE_INDEX_PATHS).find(([, indexPath]) => path.startsWith(indexPath));
  return entry ? /** @type {SiteLanguage} */ (entry[0]) : null;
}

/**
 * The route of an unprefixed English path in the given language. Legacy
 * aliases resolve to their canonical page, and pages without a Norwegian
 * version fall back to English.
 *
 * @param {SiteLanguage} language
 * @param {string} path
 * @returns {string}
 */
export function localizedSitePath(language, path) {
  /** @type {string} */
  const canonicalPath = LEGACY_ALIASES[/** @type {keyof typeof LEGACY_ALIASES} */ (path)] ?? path;

  if (canonicalPath === GUIDE_INDEX_PATHS.en) return GUIDE_INDEX_PATHS[language];
  if (language === 'pl') return `/pl${canonicalPath}`;
  if (language === 'nb' && NORWEGIAN_PATHS.includes(canonicalPath)) return `/nb${canonicalPath}`;
  return canonicalPath;
}

/**
 * Where the language switcher sends a visitor who is on `pathname`. A guide
 * article has no generic counterpart, so it leads to the other language's
 * guides index; article pages pass their translated versions to the switcher.
 *
 * @param {string} pathname
 * @param {SiteLanguage} language
 * @returns {string}
 */
export function languageSwitchPath(pathname, language) {
  if (guideSectionLanguage(pathname)) return GUIDE_INDEX_PATHS[language];

  const englishPath = pathname.replace(/^\/(?:pl|nb)(?=\/|$)/, '') || '/';
  return localizedSitePath(language, englishPath);
}
