import type { MetadataRoute } from 'next';

const BASE_URL = 'https://shuuty.xyz';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/support/`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy/`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/terms/`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];
}
