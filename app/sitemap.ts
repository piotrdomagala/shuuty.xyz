import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

type RouteGroup = Readonly<{
  english: string;
  polish: string;
  norwegian?: string;
  changeFrequency: 'weekly' | 'monthly';
  priority: number;
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  // Norwegian exists for the landing and support pages; legal documents stay
  // English and Polish.
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

  return routeGroups.flatMap(({ english, polish, norwegian, changeFrequency, priority }) => {
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
}
