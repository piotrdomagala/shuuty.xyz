import type { Metadata } from 'next';
import guidesContent from '@/content/guides.json';
import { asGuides, guideAlternates, guidePath, guidesIn, type GuideEntry } from '@/lib/guides.mjs';
import { createTranslatedPageMetadata } from '@/lib/site';
import { GUIDE_INDEX_PATHS, type SiteLanguage } from '@/lib/sitePaths.mjs';

export const guides = asGuides(guidesContent.guides);

type SitePath = `/${string}`;

// An index without guides in its language stays out of search until the first
// guide lands; the sitemap and the footers follow the same rule.
export function createGuidesIndexMetadata(language: SiteLanguage): Metadata {
  const copy = guidesContent.index[language];
  const hasGuides = guidesIn(guides, language).length > 0;
  const translations = Object.fromEntries(
    Object.entries(GUIDE_INDEX_PATHS).filter(
      ([code]) => guidesIn(guides, code as SiteLanguage).length > 0,
    ),
  ) as Partial<Record<SiteLanguage, SitePath>>;

  return createTranslatedPageMetadata({
    title: copy.navTitle,
    description: copy.description,
    path: GUIDE_INDEX_PATHS[language] as SitePath,
    language,
    translations: hasGuides ? translations : {},
    noindex: !hasGuides,
  });
}

export function createGuideMetadata(guide: GuideEntry): Metadata {
  return createTranslatedPageMetadata({
    title: guide.title,
    description: guide.description,
    path: guidePath(guide) as SitePath,
    language: guide.language,
    translations: guideAlternates(guides, guide) as Partial<Record<SiteLanguage, SitePath>>,
  });
}
