'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { DocumentLanguage } from '@/components/documentLocale';
import styles from '@/app/documents.module.css';

const languageOptions: { code: DocumentLanguage; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'pl', label: 'PL' },
];

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
  language: DocumentLanguage;
  onLanguageChange: (language: DocumentLanguage) => void;
}

export function DocumentHeader({
  title,
  backTitle,
  languageSwitcherLabel,
  language,
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
    language === 'pl'
      ? theme === 'dark'
        ? 'Włącz jasny motyw'
        : 'Włącz ciemny motyw'
      : theme === 'dark'
        ? 'Switch to light mode'
        : 'Switch to dark mode';

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link
          href="/"
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
            priority
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
            {languageOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                className={`${styles.languageButton} ${
                  language === option.code ? styles.languageButtonActive : ''
                }`}
                onClick={() => onLanguageChange(option.code)}
                aria-pressed={language === option.code}
              >
                {option.label}
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
  privacyLabel: string;
  termsLabel: string;
}

export function DocumentFooter({
  tagline,
  supportLabel,
  privacyLabel,
  termsLabel,
}: DocumentFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerBrand}>
          <h3>Shuuty</h3>
          <p>{tagline}</p>
        </div>
        <nav className={styles.footerLinks}>
          <Link href="/support/" className={styles.footerLink}>
            {supportLabel}
          </Link>
          <Link href="/privacy/" className={styles.footerLink}>
            {privacyLabel}
          </Link>
          <Link href="/terms/" className={styles.footerLink}>
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
  language: DocumentLanguage;
  onLanguageChange: (language: DocumentLanguage) => void;
  tagline: string;
  supportLabel: string;
  privacyLabel: string;
  termsLabel: string;
  children: ReactNode;
}

export function DocumentShell({
  title,
  backTitle,
  languageSwitcherLabel,
  language,
  onLanguageChange,
  tagline,
  supportLabel,
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
        onLanguageChange={onLanguageChange}
      />

      <main className={styles.main}>
        <div className={styles.contentCard}>{children}</div>
      </main>

      <DocumentFooter
        tagline={tagline}
        supportLabel={supportLabel}
        privacyLabel={privacyLabel}
        termsLabel={termsLabel}
      />
    </div>
  );
}
