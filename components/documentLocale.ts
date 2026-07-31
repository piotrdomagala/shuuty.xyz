export type DocumentLanguage = 'en' | 'pl';

export const documentTranslations = {
  en: {
    backTitle: 'Back to home',
    languageSwitcher: 'Language',
    support: 'Support',
    privacy: 'Privacy',
    terms: 'Terms',
    footerTagline: 'From idea to action.',
  },
  pl: {
    backTitle: 'Powrót do strony głównej',
    languageSwitcher: 'Język',
    support: 'Wsparcie',
    privacy: 'Prywatność',
    terms: 'Regulamin',
    footerTagline: 'Od pomysłu do działania.',
  },
} as const;
