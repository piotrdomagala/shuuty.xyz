import type { MetadataRoute } from 'next';
import { guides } from '@/lib/guidePages';
import { guideAlternates, guidePath, guidesIn } from '@/lib/guides.mjs';
import { SITE_URL } from '@/lib/site';
import { GUIDE_INDEX_PATHS, type SiteLanguage } from '@/lib/sitePaths.mjs';

export const dynamic = 'force-static';

type RouteGroup = Readonly<{
  english: string;
  polish: string;
  norwegian?: string;
  changeFrequency: 'weekly' | 'monthly';
  priority: number;
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  // Norwegian exists for the landing, support and facts pages; legal documents
  // stay English and Polish.
  const routeGroups: readonly RouteGroup[] = [
    { english: '/', polish: '/pl/', norwegian: '/nb/', changeFrequency: 'weekly', priority: 1 },
    {
      english: '/support/',
      polish: '/pl/support/',
      norwegian: '/nb/support/',
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      english: '/facts/',
      polish: '/pl/facts/',
      norwegian: '/nb/facts/',
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      english: '/account-deletion/',
      polish: '/pl/account-deletion/',
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      english: '/child-safety/',
      polish: '/pl/child-safety/',
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    { english: '/privacy/', polish: '/pl/privacy/', changeFrequency: 'monthly', priority: 0.4 },
    { english: '/terms/', polish: '/pl/terms/', changeFrequency: 'monthly', priority: 0.4 },
  ];

  const pages = routeGroups.flatMap(({ english, polish, norwegian, changeFrequency, priority }) => {
    const languages = {
      en: `${SITE_URL}${english}`,
      pl: `${SITE_URL}${polish}`,
      ...(norwegian ? { nb: `${SITE_URL}${norwegian}` } : {}),
      'x-default': `${SITE_URL}${english}`,
    };

    return [english, polish, ...(norwegian ? [norwegian] : [])].map((route) => ({
      url: `${SITE_URL}${route}`,
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });

  return [...pages, ...guideEntries()];
}

// Guides are listed only where they exist: an index joins the sitemap with its
// first guide, and hreflang links only real translations.
function guideEntries(): MetadataRoute.Sitemap {
  const withLanguages = (paths: Partial<Record<SiteLanguage, string>>) => {
    const languages: Record<string, string> = Object.fromEntries(
      Object.entries(paths).map(([code, path]) => [code, `${SITE_URL}${path}`]),
    );
    if (Object.keys(languages).length < 2) return {};
    if (languages.en) languages['x-default'] = languages.en;
    return { alternates: { languages } };
  };

  const indexLanguages = (Object.keys(GUIDE_INDEX_PATHS) as SiteLanguage[]).filter(
    (language) => guidesIn(guides, language).length > 0,
  );
  const indexPaths = Object.fromEntries(
    indexLanguages.map((language) => [language, GUIDE_INDEX_PATHS[language]]),
  );

  return [
    ...indexLanguages.map((language) => ({
      url: `${SITE_URL}${GUIDE_INDEX_PATHS[language]}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      ...withLanguages(indexPaths),
    })),
    ...guides.map((guide) => ({
      url: `${SITE_URL}${guidePath(guide)}`,
      lastModified: guide.updatedOn,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      ...withLanguages(guideAlternates(guides, guide)),
    })),
  ];
}
