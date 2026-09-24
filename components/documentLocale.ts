export type DocumentLanguage = 'en' | 'pl';

// Norwegian covers the landing and support pages. Legal documents stay English
// and Polish, so Norwegian visitors are sent to the English versions.
export type SiteLanguage = DocumentLanguage | 'nb';

export { languageSwitchPath, localizedSitePath } from '@/lib/sitePaths.mjs';

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
    themeToLight: 'Switch to light mode',
    themeToDark: 'Switch to dark mode',
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
    themeToLight: 'Włącz jasny motyw',
    themeToDark: 'Włącz ciemny motyw',
  },
  nb: {
    backTitle: 'Tilbake til forsiden',
    languageSwitcher: 'Språk',
    support: 'Hjelp',
    accountDeletion: 'Slett konto',
    childSafety: 'Barnesikkerhet',
    privacy: 'Personvern',
    terms: 'Vilkår',
    footerTagline: 'Fra idé til handling.',
    themeToLight: 'Bytt til lyst tema',
    themeToDark: 'Bytt til mørkt tema',
  },
} as const;
