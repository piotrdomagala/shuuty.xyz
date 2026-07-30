'use client';

import { useCallback, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import type { DocumentLanguage } from '@/components/documentLocale';

const isDocumentLanguage = (value: unknown): value is DocumentLanguage =>
  value === 'en' || value === 'pl';

const persistLanguage = (language: DocumentLanguage) => {
  Cookies.set('lang', language, { expires: 365, sameSite: 'lax' });
  document.documentElement.lang = language;
};

export function useSiteLanguage() {
  const [language, setLanguage] = useState<DocumentLanguage>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedLanguage = Cookies.get('lang');
    const preferredLanguage = navigator.languages?.[0] ?? navigator.language;
    const detectedLanguage: DocumentLanguage = preferredLanguage
      ?.toLowerCase()
      .startsWith('pl')
      ? 'pl'
      : 'en';
    const initialLanguage = isDocumentLanguage(savedLanguage)
      ? savedLanguage
      : detectedLanguage;

    setLanguage(initialLanguage);
    persistLanguage(initialLanguage);
    setIsReady(true);
  }, []);

  const changeLanguage = useCallback((nextLanguage: DocumentLanguage) => {
    setLanguage(nextLanguage);
    persistLanguage(nextLanguage);
  }, []);

  return { language, changeLanguage, isReady };
}
