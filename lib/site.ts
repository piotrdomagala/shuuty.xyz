import type { Metadata } from 'next';

const DEFAULT_SITE_URL = 'https://shuuty.com';

function resolveSiteUrl(value: string | undefined): string {
  if (!value) return DEFAULT_SITE_URL;

  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash) {
      return url.origin;
    }
  } catch {
    // Invalid build-time values fall back to the currently active public domain.
  }

  return DEFAULT_SITE_URL;
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const SOCIAL_IMAGE = {
  url: `${SITE_URL}/opengraph-image.png`,
  width: 1200,
  height: 630,
  alt: 'Shuuty mobile app - turn ideas into action with voice tasks, flexible groups and discovery.',
} as const;

interface PageMetadataOptions {
  title: string;
  description: string;
  path: `/${string}`;
  language?: 'en' | 'pl';
  englishPath?: `/${string}`;
  polishPath?: `/${string}`;
}

export function createLanguageAlternates(
  englishPath: `/${string}`,
  polishPath: `/${string}`,
) {
  return {
    en: englishPath,
    pl: polishPath,
    'x-default': englishPath,
  } as const;
}

export function createPublicPageMetadata({
  title,
  description,
  path,
  language = 'en',
  englishPath = path,
  polishPath,
}: PageMetadataOptions): Metadata {
  const socialTitle = `${title} | Shuuty`;
  const languageAlternates = polishPath
    ? createLanguageAlternates(englishPath, polishPath)
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: path,
      ...(languageAlternates ? { languages: languageAlternates } : {}),
    },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      type: 'website',
      locale: language === 'pl' ? 'pl_PL' : 'en_US',
      alternateLocale: [language === 'pl' ? 'en_US' : 'pl_PL'],
      siteName: 'Shuuty',
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [SOCIAL_IMAGE.url],
    },
  };
}

export function createNoIndexMetadata({
  title,
  description,
  path,
}: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export function createLegacyAliasMetadata({
  title,
  description,
  canonicalPath,
}: {
  title: string;
  description: string;
  canonicalPath: `/${string}`;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    },
  };
}
