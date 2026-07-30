export type DocumentLanguage = 'en' | 'pl';

export const documentTranslations = {
  en: {
    backTitle: 'Back to home',
    languageSwitcher: 'Language',
    support: 'Support',
    privacy: 'Privacy',
    terms: 'Terms',
    footerTagline: 'Connecting people through meaningful activities',
  },
  pl: {
    backTitle: 'Powrót do strony głównej',
    languageSwitcher: 'Język',
    support: 'Wsparcie',
    privacy: 'Prywatność',
    terms: 'Regulamin',
    footerTagline: 'Łączymy ludzi poprzez wspólne aktywności',
  },
} as const;
