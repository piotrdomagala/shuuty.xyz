'use client';

import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { parseMarkdown } from '@/lib/markdown';
import {
  DocumentFooter,
  DocumentHeader,
  type DocumentLanguage,
} from '@/components/DocumentChrome';
import styles from '@/app/documents.module.css';

interface DocumentPageProps {
  titleEn: string;
  titlePl: string;
  fileEn: string;
  filePl: string;
}

const sharedTranslations = {
  en: {
    languageSwitcher: 'Language',
    support: 'Support',
    privacy: 'Privacy',
    terms: 'Terms',
    footerTagline: 'Connecting people through meaningful activities',
    loading: 'Loading...',
    error: 'Error loading content. Please try again later.',
  },
  pl: {
    languageSwitcher: 'Język',
    support: 'Wsparcie',
    privacy: 'Prywatność',
    terms: 'Regulamin',
    footerTagline: 'Łączymy ludzi poprzez wspólne aktywności',
    loading: 'Ładowanie...',
    error: 'Błąd ładowania treści. Spróbuj ponownie później.',
  },
};

export default function DocumentPage({ titleEn, titlePl, fileEn, filePl }: DocumentPageProps) {
  const [language, setLanguage] = useState<DocumentLanguage>('en');
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = Cookies.get('lang') as DocumentLanguage | undefined;
    if (savedLang === 'en' || savedLang === 'pl') {
      setLanguage(savedLang);
      return;
    }

    const preferredLanguage =
      navigator.languages?.[0] ?? navigator.language;
    setLanguage(preferredLanguage?.toLowerCase().startsWith('pl') ? 'pl' : 'en');
  }, []);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    const file = language === 'pl' ? filePl : fileEn;

    try {
      const response = await fetch(file);
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const text = await response.text();
      setContent(parseMarkdown(text));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [language, fileEn, filePl]);

  useEffect(() => {
    if (mounted) {
      fetchContent();
    }
  }, [mounted, fetchContent]);

  const handleLanguageChange = useCallback((nextLanguage: DocumentLanguage) => {
    setLanguage(nextLanguage);
    Cookies.set('lang', nextLanguage, { expires: 365 });
  }, []);

  const t = sharedTranslations[language];
  const pageTitle = language === 'pl' ? titlePl : titleEn;

  if (!mounted) {
    return null;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.backgroundDecor}>
        <div className={`${styles.floatingShape} ${styles.shape1}`} />
        <div className={`${styles.floatingShape} ${styles.shape2}`} />
      </div>

      <DocumentHeader
        title={pageTitle}
        backTitle="Back to home"
        languageSwitcherLabel={t.languageSwitcher}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      <main className={styles.main}>
        <div className={styles.contentCard}>
          {isLoading && (
            <div className={styles.markdown}>
              <p style={{ textAlign: 'center' }}>{t.loading}</p>
            </div>
          )}
          {hasError && (
            <div className={styles.markdown}>
              <p style={{ textAlign: 'center', color: 'var(--color-error)' }}>{t.error}</p>
            </div>
          )}
          {!isLoading && !hasError && (
            <article 
              className={styles.markdown}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      </main>

      <DocumentFooter
        tagline={t.footerTagline}
        supportLabel={t.support}
        privacyLabel={t.privacy}
        termsLabel={t.terms}
      />
    </div>
  );
}

