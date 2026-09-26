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
 * The route of an unprefixed English path in the given language. Legacy
 * aliases resolve to their canonical page, and pages without a Norwegian
 * version fall back to English.
 *
 * @param {SiteLanguage} language
 * @param {string} path
 * @returns {string}
 */
export function localizedSitePath(language, path) {
  const canonicalPath = LEGACY_ALIASES[/** @type {keyof typeof LEGACY_ALIASES} */ (path)] ?? path;

  if (language === 'pl') return `/pl${canonicalPath}`;
  if (language === 'nb' && NORWEGIAN_PATHS.includes(canonicalPath)) return `/nb${canonicalPath}`;
  return canonicalPath;
}

/**
 * Where the language switcher sends a visitor who is on `pathname`.
 *
 * @param {string} pathname
 * @param {SiteLanguage} language
 * @returns {string}
 */
export function languageSwitchPath(pathname, language) {
  const englishPath = pathname.replace(/^\/(?:pl|nb)(?=\/|$)/, '') || '/';
  return localizedSitePath(language, englishPath);
}
