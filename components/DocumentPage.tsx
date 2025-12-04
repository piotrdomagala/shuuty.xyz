'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { parseMarkdown } from '@/lib/markdown';
import styles from '@/app/documents.module.css';

type Language = 'en' | 'pl';

interface DocumentPageProps {
  titleEn: string;
  titlePl: string;
  fileEn: string;
  filePl: string;
}

const sharedTranslations = {
  en: {
    support: 'Support',
    privacy: 'Privacy',
    terms: 'Terms',
    footerTagline: 'Connecting people through meaningful activities',
    loading: 'Loading...',
    error: 'Error loading content. Please try again later.',
  },
  pl: {
    support: 'Wsparcie',
    privacy: 'Prywatność',
    terms: 'Regulamin',
    footerTagline: 'Łączymy ludzi poprzez wspólne aktywności',
    loading: 'Ładowanie...',
    error: 'Błąd ładowania treści. Spróbuj ponownie później.',
  },
};

export default function DocumentPage({ titleEn, titlePl, fileEn, filePl }: DocumentPageProps) {
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = Cookies.get('lang') as Language | undefined;
    if (savedLang === 'en' || savedLang === 'pl') {
      setLanguage(savedLang);
    }
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

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.backButton} title="Back to home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className={styles.headerInfo}>
            <Image
              src="/images/shuuty_icon.webp"
              alt="Shuuty"
              width={40}
              height={40}
              className={styles.logo}
            />
            <h1 className={styles.headerTitle}>{pageTitle}</h1>
          </div>
        </div>
      </header>

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

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <h3>Shuuty</h3>
            <p>{t.footerTagline}</p>
          </div>
          <nav className={styles.footerLinks}>
            <Link href="/support" className={styles.footerLink}>{t.support}</Link>
            <Link href="/privacy" className={styles.footerLink}>{t.privacy}</Link>
            <Link href="/terms" className={styles.footerLink}>{t.terms}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

