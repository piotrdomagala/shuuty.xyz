'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from '@/app/documents.module.css';

export type DocumentLanguage = 'en' | 'pl';

const languageOptions: { code: DocumentLanguage; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'pl', label: 'PL' },
];

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
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link href="/" className={styles.backButton} title={backTitle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className={styles.headerInfo}>
          <Image
            src="/images/shuuty_icon.webp"
            alt="Shuuty"
            width={86}
            height={40}
            className={styles.logo}
          />
          <h1 className={styles.headerTitle}>{title}</h1>
        </div>
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
          <Link href="/support" className={styles.footerLink}>
            {supportLabel}
          </Link>
          <Link href="/privacy" className={styles.footerLink}>
            {privacyLabel}
          </Link>
          <Link href="/terms" className={styles.footerLink}>
            {termsLabel}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
