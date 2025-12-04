'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';
import styles from '../documents.module.css';

type Language = 'en' | 'pl';

const translations = {
  en: {
    pageTitle: 'Privacy Policy',
    support: 'Support',
    privacy: 'Privacy',
    terms: 'Terms',
    footerTagline: 'Connecting people through meaningful activities',
    loading: 'Loading...',
    error: 'Error loading content. Please try again later.',
  },
  pl: {
    pageTitle: 'Polityka Prywatności',
    support: 'Wsparcie',
    privacy: 'Prywatność',
    terms: 'Regulamin',
    footerTagline: 'Łączymy ludzi poprzez wspólne aktywności',
    loading: 'Ładowanie...',
    error: 'Błąd ładowania treści. Spróbuj ponownie później.',
  },
};

// Simple markdown to HTML converter
function parseMarkdown(markdown: string): string {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Line breaks into paragraphs
    .replace(/\n\n/gim, '</p><p>')
    // List items
    .replace(/^- (.*$)/gim, '<li>$1</li>');

  // Wrap list items in ul
  html = html.replace(/(<li>.*<\/li>)/gims, (match) => {
    if (!match.startsWith('<ul>')) {
      return '<ul>' + match + '</ul>';
    }
    return match;
  });

  // Clean up multiple ul tags
  html = html.replace(/<\/ul>\s*<ul>/gim, '');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<h') && !html.startsWith('<ul>') && !html.startsWith('<p>')) {
    html = '<p>' + html + '</p>';
  }

  return html;
}

export default function PrivacyPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = Cookies.get('lang') as Language | undefined;
    if (savedLang && (savedLang === 'en' || savedLang === 'pl')) {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchContent = async () => {
      setIsLoading(true);
      setError(false);
      
      const file = language === 'pl' ? '/documents/privacy.md' : '/documents/privacy_en.md';
      
      try {
        const response = await fetch(file);
        if (!response.ok) throw new Error('Failed to fetch');
        const text = await response.text();
        setContent(parseMarkdown(text));
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [language, mounted]);

  const t = translations[language];

  if (!mounted) return null;

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
            <h1 className={styles.headerTitle}>{t.pageTitle}</h1>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.contentCard}>
          {isLoading ? (
            <div className={styles.markdown}>
              <p style={{ textAlign: 'center' }}>{t.loading}</p>
            </div>
          ) : error ? (
            <div className={styles.markdown}>
              <p style={{ textAlign: 'center', color: 'var(--color-error)' }}>{t.error}</p>
            </div>
          ) : (
            <div 
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

