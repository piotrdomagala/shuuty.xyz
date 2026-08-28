export type DocumentLanguage = 'en' | 'pl';

export const documentTranslations = {
  en: {
    backTitle: 'Back to home',
    languageSwitcher: 'Language',
    support: 'Support',
    accountDeletion: 'Delete account',
    childSafety: 'Child safety',
    privacy: 'Privacy',
    terms: 'Terms',
    footerTagline: 'From idea to action.',
  },
  pl: {
    backTitle: 'Powrót do strony głównej',
    languageSwitcher: 'Język',
    support: 'Wsparcie',
    accountDeletion: 'Usuń konto',
    childSafety: 'Bezpieczeństwo dzieci',
    privacy: 'Prywatność',
    terms: 'Regulamin',
    footerTagline: 'Od pomysłu do działania.',
  },
} as const;
