import type { Metadata } from 'next';
import socialCards from '@/content/social-cards.json';

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

export const APP_STORE_ID = '6670202422';
export const APP_STORE_URL = `https://apps.apple.com/app/shuuty/id${APP_STORE_ID}`;
export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.shuuty.app';
export const APP_STORE_DEVELOPER_URL = 'https://apps.apple.com/us/developer/shuuty/id1765294634';
export const GOOGLE_PLAY_DEVELOPER_URL = 'https://play.google.com/store/apps/developer?id=Shuuty';

// Public, non-secret build settings. Each one stays off until the owner sets the
// matching GitHub Actions variable, so local builds never report analytics.
function readPublicSetting(value: string | undefined, pattern: RegExp): string | null {
  const trimmed = value?.trim();
  return trimmed && pattern.test(trimmed) ? trimmed : null;
}

export const GOATCOUNTER_CODE = readPublicSetting(
  process.env.NEXT_PUBLIC_GOATCOUNTER_CODE,
  /^[a-z0-9-]{2,50}$/,
);

const APP_STORE_PROVIDER_TOKEN = readPublicSetting(
  process.env.NEXT_PUBLIC_APP_STORE_PROVIDER_TOKEN,
  /^\d{4,12}$/,
);

const CAMPAIGN_PATTERN = /^[a-z0-9-]{1,30}$/;

// Tagged store links for buttons. Google Play reads `referrer` in its UTM
// acquisition report; App Store campaign links need the provider token `pt`.
// Structured data and llms.txt keep the clean URLs above.
export function createStoreLinks(campaign: string) {
  if (!CAMPAIGN_PATTERN.test(campaign)) {
    throw new Error(`Invalid store campaign name: ${campaign}`);
  }

  const android = new URL(GOOGLE_PLAY_URL);
  android.searchParams.set(
    'referrer',
    new URLSearchParams({
      utm_source: 'shuuty.com',
      utm_medium: 'website',
      utm_campaign: campaign,
    }).toString(),
  );

  if (!APP_STORE_PROVIDER_TOKEN) {
    return { android: android.toString(), ios: APP_STORE_URL };
  }

  const ios = new URL(APP_STORE_URL);
  ios.searchParams.set('pt', APP_STORE_PROVIDER_TOKEN);
  ios.searchParams.set('ct', campaign);
  ios.searchParams.set('mt', '8');
  return { android: android.toString(), ios: ios.toString() };
}

type SocialCardLanguage = keyof typeof socialCards.cards;

// One preview card per site language, generated from the canonical captures
// by scripts/generate-social-cards.mjs and checked by validate-social-cards.
export function socialImage(language: SocialCardLanguage) {
  const card = socialCards.cards[language];
  return {
    url: `${SITE_URL}${card.image.path}`,
    width: card.image.width,
    height: card.image.height,
    alt: card.alt,
    type: card.image.mediaType,
  };
}

function socialMetadata({
  title,
  description,
  path,
  language,
  alternateLanguages,
}: {
  title: string;
  description: string;
  path: `/${string}`;
  language: SocialCardLanguage;
  alternateLanguages: SocialCardLanguage[];
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  const socialTitle = `${title} | Shuuty`;
  const image = socialImage(language);
  return {
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      type: 'website',
      locale: OPEN_GRAPH_LOCALES[language],
      alternateLocale: alternateLanguages
        .filter((locale) => locale !== language)
        .map((locale) => OPEN_GRAPH_LOCALES[locale]),
      siteName: 'Shuuty',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

interface PageMetadataOptions {
  title: string;
  description: string;
  path: `/${string}`;
  language?: 'en' | 'pl' | 'nb';
  englishPath?: `/${string}`;
  polishPath?: `/${string}`;
  norwegianPath?: `/${string}`;
}

const OPEN_GRAPH_LOCALES = { en: 'en_US', pl: 'pl_PL', nb: 'nb_NO' } as const;

export function createLanguageAlternates(
  englishPath: `/${string}`,
  polishPath: `/${string}`,
  norwegianPath?: `/${string}`,
) {
  return {
    en: englishPath,
    pl: polishPath,
    ...(norwegianPath ? { nb: norwegianPath } : {}),
    'x-default': englishPath,
  };
}

export function createPublicPageMetadata({
  title,
  description,
  path,
  language = 'en',
  englishPath = path,
  polishPath,
  norwegianPath,
}: PageMetadataOptions): Metadata {
  const languageAlternates = polishPath
    ? createLanguageAlternates(englishPath, polishPath, norwegianPath)
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: path,
      ...(languageAlternates ? { languages: languageAlternates } : {}),
    },
    ...socialMetadata({
      title,
      description,
      path,
      language,
      alternateLanguages: norwegianPath ? ['en', 'pl', 'nb'] : ['en', 'pl'],
    }),
  };
}

type TranslatedPaths = Partial<Record<SocialCardLanguage, `/${string}`>>;

// Pages whose translations are any subset of the site languages, such as
// guides. hreflang is declared only when another language exists, and a page
// that is not ready for search (an empty guides index) stays noindex, follow.
export function createTranslatedPageMetadata({
  title,
  description,
  path,
  language,
  translations,
  noindex = false,
}: {
  title: string;
  description: string;
  path: `/${string}`;
  language: SocialCardLanguage;
  translations: TranslatedPaths;
  noindex?: boolean;
}): Metadata {
  const languages = Object.keys(translations) as SocialCardLanguage[];
  const hasTranslations = languages.some((code) => code !== language);

  return {
    title,
    description,
    alternates: {
      canonical: path,
      ...(hasTranslations
        ? {
            languages: {
              ...translations,
              ...(translations.en ? { 'x-default': translations.en } : {}),
            },
          }
        : {}),
    },
    ...socialMetadata({
      title,
      description,
      path,
      language,
      alternateLanguages: languages,
    }),
    ...(noindex
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
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
  englishCanonicalPath,
  polishCanonicalPath,
}: {
  title: string;
  description: string;
  canonicalPath: `/${string}`;
  englishCanonicalPath: `/${string}`;
  polishCanonicalPath: `/${string}`;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: createLanguageAlternates(
        englishCanonicalPath,
        polishCanonicalPath,
      ),
    },
    // An old address shares like the page it stands for, in that page's language.
    ...socialMetadata({
      title,
      description,
      path: canonicalPath,
      language: canonicalPath === polishCanonicalPath ? 'pl' : 'en',
      alternateLanguages: ['en', 'pl'],
    }),
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
