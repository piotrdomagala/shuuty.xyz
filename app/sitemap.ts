import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const routePairs = [
    { english: '/', polish: '/pl/', changeFrequency: 'weekly', priority: 1 },
    { english: '/support/', polish: '/pl/support/', changeFrequency: 'monthly', priority: 0.6 },
    {
      english: '/account-deletion/',
      polish: '/pl/account-deletion/',
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    { english: '/privacy/', polish: '/pl/privacy/', changeFrequency: 'monthly', priority: 0.4 },
    { english: '/terms/', polish: '/pl/terms/', changeFrequency: 'monthly', priority: 0.4 },
  ] as const;

  return routePairs.flatMap(({ english, polish, changeFrequency, priority }) => {
    const languages = {
      en: `${SITE_URL}${english}`,
      pl: `${SITE_URL}${polish}`,
      'x-default': `${SITE_URL}${english}`,
    };

    return [
      {
        url: `${SITE_URL}${english}`,
        changeFrequency,
        priority,
        alternates: { languages },
      },
      {
        url: `${SITE_URL}${polish}`,
        changeFrequency,
        priority,
        alternates: { languages },
      },
    ];
  });
}
