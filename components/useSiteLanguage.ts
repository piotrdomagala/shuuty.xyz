'use client';

import { useCallback, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import type { DocumentLanguage } from '@/components/documentLocale';

const persistLanguage = (language: DocumentLanguage) => {
  Cookies.set('lang', language, { expires: 365, sameSite: 'lax' });
  document.documentElement.lang = language;
};

const getLocalizedPath = (pathname: string, language: DocumentLanguage) => {
  const englishPath = pathname.replace(/^\/pl(?=\/|$)/, '') || '/';

  if (language === 'en') return englishPath;
  return englishPath === '/' ? '/pl/' : `/pl${englishPath}`;
};

export function useSiteLanguage(initialLanguage: DocumentLanguage = 'en') {
  const [language, setLanguage] = useState<DocumentLanguage>(initialLanguage);

  useEffect(() => {
    persistLanguage(initialLanguage);
  }, [initialLanguage]);

  const changeLanguage = useCallback((nextLanguage: DocumentLanguage) => {
    setLanguage(nextLanguage);
    persistLanguage(nextLanguage);

    const targetPath = getLocalizedPath(window.location.pathname, nextLanguage);
    if (targetPath !== window.location.pathname) {
      window.location.assign(`${targetPath}${window.location.search}${window.location.hash}`);
    }
  }, []);

  return { language, changeLanguage };
}
