// @ts-check
// Guides: a registry of articles (content/guides.json) and one body file per
// article (content/guides/<language>/<slug>.json). Plain JavaScript so the
// pages, the unit tests and the static export validator share one reading.

import { GUIDE_INDEX_PATHS } from './sitePaths.mjs';

/** @typedef {import('./sitePaths.mjs').SiteLanguage} SiteLanguage */

/**
 * @typedef {{
 *   topic: string;
 *   language: SiteLanguage;
 *   slug: string;
 *   title: string;
 *   description: string;
 *   heading: string;
 *   updatedOn: string;
 *   updatedLabel: string;
 * }} GuideEntry
 */

/**
 * @typedef {(
 *   | { type: 'h2' | 'h3' | 'p'; text: string }
 *   | { type: 'ul' | 'ol'; items: string[] }
 * )} GuideBlock
 */

/** @typedef {{ question: string; answer: string }} GuideQuestion */

/** @typedef {{ body: GuideBlock[]; faq?: GuideQuestion[] }} GuideArticle */

export const GUIDE_LANGUAGES = /** @type {const} */ (['en', 'pl', 'nb']);

// A topic ties translations together and names the store campaign
// `web-guide-<topic>-<language>`, which must stay within 30 characters.
const TOPIC_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOPIC_MAX_LENGTH = 17;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX_LENGTH = 80;
const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MIN_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 160;
const LONG_DASH_PATTERN = /[\u2013\u2014]/u;
const BLOCK_TYPES = new Set(['h2', 'h3', 'p', 'ul', 'ol']);

/**
 * The registry entries with their declared type; an empty JSON array would
 * otherwise type as `never[]`.
 *
 * @param {readonly unknown[]} entries
 * @returns {readonly GuideEntry[]}
 */
export function asGuides(entries) {
  return /** @type {readonly GuideEntry[]} */ (entries);
}

/**
 * An article body with its declared type; JSON imports widen block types to
 * `string`. The validator and the unit tests check the actual shape.
 *
 * @param {unknown} value
 * @returns {GuideArticle}
 */
export function asGuideArticle(value) {
  return /** @type {GuideArticle} */ (value);
}

/**
 * @param {GuideEntry} guide
 * @returns {string}
 */
export function guidePath(guide) {
  return `${GUIDE_INDEX_PATHS[guide.language]}${guide.slug}/`;
}

/**
 * @param {readonly GuideEntry[]} guides
 * @param {SiteLanguage} language
 * @returns {GuideEntry[]}
 */
export function guidesIn(guides, language) {
  return guides.filter((guide) => guide.language === language);
}

/**
 * @param {readonly GuideEntry[]} guides
 * @param {SiteLanguage} language
 * @param {string} slug
 * @returns {GuideEntry}
 */
export function requireGuide(guides, language, slug) {
  const guide = guides.find((entry) => entry.language === language && entry.slug === slug);
  if (!guide) throw new Error(`content/guides.json has no ${language} guide "${slug}"`);
  return guide;
}

/**
 * Translations of a guide, including the guide itself, keyed by language.
 *
 * @param {readonly GuideEntry[]} guides
 * @param {GuideEntry} guide
 * @returns {Partial<Record<SiteLanguage, string>>}
 */
export function guideAlternates(guides, guide) {
  return Object.fromEntries(
    guides.filter((entry) => entry.topic === guide.topic).map((entry) => [entry.language, guidePath(entry)]),
  );
}

/**
 * Where each language button leads from a guide: its translation when one
 * exists, otherwise that language's guides index.
 *
 * @param {readonly GuideEntry[]} guides
 * @param {GuideEntry} guide
 * @returns {Record<SiteLanguage, string>}
 */
export function guideSwitchPaths(guides, guide) {
  const alternates = guideAlternates(guides, guide);
  return {
    en: alternates.en ?? GUIDE_INDEX_PATHS.en,
    pl: alternates.pl ?? GUIDE_INDEX_PATHS.pl,
    nb: alternates.nb ?? GUIDE_INDEX_PATHS.nb,
  };
}

/**
 * @param {GuideEntry} guide
 * @returns {string}
 */
export function guideStoreCampaign(guide) {
  return `web-guide-${guide.topic}-${guide.language}`;
}

/**
 * Splits `**bold**` markers into segments. The only inline markup in guide
 * text; an unmatched marker is a content error.
 *
 * @param {string} text
 * @returns {{ text: string; strong: boolean }[]}
 */
export function textSegments(text) {
  const parts = text.split('**');
  if (parts.length % 2 === 0) throw new Error(`Unmatched ** in guide text: ${text}`);
  return parts
    .map((part, index) => ({ text: part, strong: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function collectStrings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings);
  return [];
}

/**
 * @param {string} where
 * @param {unknown} value
 * @returns {string[]}
 */
function textProblems(where, value) {
  const problems = [];
  for (const text of collectStrings(value)) {
    if (LONG_DASH_PATTERN.test(text)) problems.push(`${where}: use a short hyphen instead of a long dash: ${text}`);
    try {
      textSegments(text);
    } catch (error) {
      problems.push(`${where}: ${/** @type {Error} */ (error).message}`);
    }
  }
  return problems;
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/**
 * Everything wrong with the registry, as readable messages.
 *
 * @param {{ index: Record<string, Record<string, string>>; labels: Record<string, Record<string, string>>; guides: readonly unknown[] }} registry
 * @returns {string[]}
 */
export function guideRegistryProblems(registry) {
  const problems = [...textProblems('content/guides.json', registry)];

  for (const language of GUIDE_LANGUAGES) {
    for (const [group, keys] of /** @type {const} */ ([
      ['index', ['navTitle', 'title', 'description', 'intro', 'empty', 'factsLink']],
      ['labels', ['faqHeading', 'getApp', 'appStorePrefix', 'googlePlayPrefix', 'allGuides', 'facts']],
    ])) {
      for (const key of keys) {
        if (!registry[group]?.[language]?.[key]?.trim()) problems.push(`guides ${group}.${language}.${key} is missing`);
      }
    }
  }

  const guides = asGuides(registry.guides);
  const seen = new Set();
  for (const guide of guides) {
    const name = `guide ${guide.language}/${guide.slug}`;
    if (!GUIDE_LANGUAGES.includes(guide.language)) problems.push(`${name}: unknown language`);
    if (!TOPIC_PATTERN.test(guide.topic) || guide.topic.length > TOPIC_MAX_LENGTH) {
      problems.push(`${name}: topic must be lowercase words joined by hyphens, at most ${TOPIC_MAX_LENGTH} characters`);
    }
    if (!SLUG_PATTERN.test(guide.slug) || guide.slug.length > SLUG_MAX_LENGTH) {
      problems.push(`${name}: slug must be lowercase words joined by hyphens, at most ${SLUG_MAX_LENGTH} characters`);
    }
    for (const key of [`slug:${guide.language}/${guide.slug}`, `topic:${guide.language}/${guide.topic}`]) {
      if (seen.has(key)) problems.push(`${name}: duplicate ${key.split(':')[0]} in ${guide.language}`);
      seen.add(key);
    }
    if (!guide.title?.trim() || guide.title.length > TITLE_MAX_LENGTH) {
      problems.push(`${name}: title must have 1-${TITLE_MAX_LENGTH} characters`);
    }
    if (
      !guide.description
      || guide.description.length < DESCRIPTION_MIN_LENGTH
      || guide.description.length > DESCRIPTION_MAX_LENGTH
    ) {
      problems.push(`${name}: description must have ${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH} characters`);
    }
    if (!guide.heading?.trim()) problems.push(`${name}: heading is missing`);
    if (!isIsoDate(guide.updatedOn)) {
      problems.push(`${name}: updatedOn must be a YYYY-MM-DD date`);
    } else {
      const [year, , day] = guide.updatedOn.split('-');
      const dayPattern = new RegExp(`(?:^|\\D)${Number(day)}(?:\\D|$)`);
      if (!guide.updatedLabel?.includes(year) || !dayPattern.test(guide.updatedLabel)) {
        problems.push(`${name}: updatedLabel must show the day and year of ${guide.updatedOn}`);
      }
    }
  }

  return problems;
}

/**
 * Everything wrong with one article body, as readable messages.
 *
 * @param {string} name
 * @param {GuideArticle} article
 * @returns {string[]}
 */
export function guideArticleProblems(name, article) {
  const problems = [...textProblems(name, article)];
  const body = Array.isArray(article?.body) ? article.body : [];

  if (body.length === 0) problems.push(`${name}: body is empty`);
  if (body[0] && body[0].type !== 'p') problems.push(`${name}: body must open with a paragraph`);
  if (!body.some((block) => block.type === 'h2')) problems.push(`${name}: body needs at least one h2 section`);

  body.forEach((block, index) => {
    if (!BLOCK_TYPES.has(block?.type)) {
      problems.push(`${name}: block ${index} has unknown type ${block?.type}`);
    } else if (block.type === 'ul' || block.type === 'ol') {
      if (!Array.isArray(block.items) || block.items.length === 0 || block.items.some((item) => !item?.trim())) {
        problems.push(`${name}: list block ${index} needs non-empty items`);
      }
    } else if (!('text' in block) || !block.text?.trim()) {
      problems.push(`${name}: ${block.type} block ${index} is empty`);
    }
  });

  for (const [index, entry] of (article?.faq ?? []).entries()) {
    if (!entry?.question?.trim() || !entry?.answer?.trim()) problems.push(`${name}: FAQ entry ${index} is incomplete`);
  }

  return problems;
}
