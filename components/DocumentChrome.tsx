'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  documentTranslations,
  localizedSitePath,
  type SiteLanguage,
} from '@/components/documentLocale';
import guidesContent from '@/content/guides.json';
import { asGuides, guidesIn } from '@/lib/guides.mjs';
import styles from '@/app/documents.module.css';

const languageLabels: Record<SiteLanguage, string> = { en: 'EN', pl: 'PL', nb: 'NB' };

// Legal documents exist in English and Polish only; pages with a Norwegian
// version pass all three languages.
const DEFAULT_LANGUAGES: readonly SiteLanguage[] = ['en', 'pl'];

const localizedPath = localizedSitePath;

type Theme = 'light' | 'dark';

const themeColor: Record<Theme, string> = {
  light: '#FFFBF5',
  dark: '#0D1117',
};

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === 'dark') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

interface DocumentHeaderProps {
  title: string;
  backTitle: string;
  languageSwitcherLabel: string;
  language: SiteLanguage;
  languages?: readonly SiteLanguage[];
  onLanguageChange: (language: SiteLanguage) => void;
}

export function DocumentHeader({
  title,
  backTitle,
  languageSwitcherLabel,
  language,
  languages = DEFAULT_LANGUAGES,
  onLanguageChange,
}: DocumentHeaderProps) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.style.colorScheme = nextTheme;
      document
        .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
        .forEach((meta) => meta.setAttribute('content', themeColor[nextTheme]));

      try {
        window.localStorage.setItem('shuuty-theme', nextTheme);
      } catch {
        // The selected theme still applies when storage is unavailable.
      }

      return nextTheme;
    });
  }, []);

  const themeToggleLabel =
    theme === 'dark'
      ? documentTranslations[language].themeToLight
      : documentTranslations[language].themeToDark;

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link
          href={localizedPath(language, '/')}
          className={styles.backButton}
          title={backTitle}
          aria-label={backTitle}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className={styles.headerInfo}>
          <Image
            src="/images/brand/shuuty-app-icon.png"
            alt="Shuuty"
            width={40}
            height={40}
            className={styles.logo}
            loading="eager"
          />
          <p className={styles.headerTitle}>{title}</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.themeButton}
            onClick={toggleTheme}
            aria-label={themeToggleLabel}
            title={themeToggleLabel}
          >
            <ThemeIcon theme={theme} />
          </button>
          <div
            className={styles.languageSwitcher}
            role="group"
            aria-label={languageSwitcherLabel}
          >
            {languages.map((code) => (
              <button
                key={code}
                type="button"
                className={`${styles.languageButton} ${
                  language === code ? styles.languageButtonActive : ''
                }`}
                onClick={() => onLanguageChange(code)}
                aria-pressed={language === code}
              >
                {languageLabels[code]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

interface DocumentFooterProps {
  tagline: string;
  supportLabel: string;
  accountDeletionLabel: string;
  childSafetyLabel: string;
  privacyLabel: string;
  termsLabel: string;
  language: SiteLanguage;
}

export function DocumentFooter({
  tagline,
  supportLabel,
  accountDeletionLabel,
  childSafetyLabel,
  privacyLabel,
  termsLabel,
  language,
}: DocumentFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerBrand}>
          <p className={styles.footerBrandName}>Shuuty</p>
          <p>{tagline}</p>
        </div>
        <nav className={styles.footerLinks}>
          <Link href={localizedPath(language, '/support/')} className={styles.footerLink}>
            {supportLabel}
          </Link>
          <Link href={localizedPath(language, '/facts/')} className={styles.footerLink}>
            {documentTranslations[language].facts}
          </Link>
          {/* The guides link appears once the language has a published guide. */}
          {guidesIn(asGuides(guidesContent.guides), language).length > 0 ? (
            <Link href={localizedPath(language, '/guides/')} className={styles.footerLink}>
              {guidesContent.index[language].navTitle}
            </Link>
          ) : null}
          <Link
            href={localizedPath(language, '/account-deletion/')}
            className={styles.footerLink}
          >
            {accountDeletionLabel}
          </Link>
          <Link
            href={localizedPath(language, '/child-safety/')}
            className={styles.footerLink}
          >
            {childSafetyLabel}
          </Link>
          <Link href={localizedPath(language, '/privacy/')} className={styles.footerLink}>
            {privacyLabel}
          </Link>
          <Link href={localizedPath(language, '/terms/')} className={styles.footerLink}>
            {termsLabel}
          </Link>
        </nav>
      </div>
    </footer>
  );
}

interface DocumentShellProps {
  title: string;
  backTitle: string;
  languageSwitcherLabel: string;
  language: SiteLanguage;
  languages?: readonly SiteLanguage[];
  onLanguageChange: (language: SiteLanguage) => void;
  tagline: string;
  supportLabel: string;
  accountDeletionLabel: string;
  childSafetyLabel: string;
  privacyLabel: string;
  termsLabel: string;
  children: ReactNode;
}

export function DocumentShell({
  title,
  backTitle,
  languageSwitcherLabel,
  language,
  languages,
  onLanguageChange,
  tagline,
  supportLabel,
  accountDeletionLabel,
  childSafetyLabel,
  privacyLabel,
  termsLabel,
  children,
}: DocumentShellProps) {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.backgroundDecor} aria-hidden="true">
        <div className={`${styles.floatingShape} ${styles.shape1}`} />
        <div className={`${styles.floatingShape} ${styles.shape2}`} />
      </div>

      <DocumentHeader
        title={title}
        backTitle={backTitle}
        languageSwitcherLabel={languageSwitcherLabel}
        language={language}
        languages={languages}
        onLanguageChange={onLanguageChange}
      />

      <main className={styles.main} lang={language}>
        <div className={styles.contentCard}>{children}</div>
      </main>

      <DocumentFooter
        tagline={tagline}
        supportLabel={supportLabel}
        accountDeletionLabel={accountDeletionLabel}
        childSafetyLabel={childSafetyLabel}
        privacyLabel={privacyLabel}
        termsLabel={termsLabel}
        language={language}
      />
    </div>
  );
}
