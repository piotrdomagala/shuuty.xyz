import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/verify/', '/auth/verify/', '/auth/reset-password/'],
    },
    sitemap: 'https://shuuty.xyz/sitemap.xml',
    host: 'https://shuuty.xyz',
  };
}
