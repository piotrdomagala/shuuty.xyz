'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import {
  DocumentFooter,
  DocumentHeader,
  type DocumentLanguage,
} from '@/components/DocumentChrome';
import styles from '../documents.module.css';

const SUPPORT_EMAIL = 'support@shuuty.pl';

const translations = {
  en: {
    pageTitle: 'Contact Support',
    backTitle: 'Back to home',
    languageSwitcher: 'Language',
    contactTitle: 'How can we help?',
    contactDescription:
      'Email us about your account, the app, or your subscription. When relevant, include your device model, system version, and app version to help us investigate.',
    emailAction: 'Open email app',
    emailHint: "If the button doesn't open your email app, copy this address:",
    emailSubject: 'Shuuty support',
    support: 'Support',
    privacy: 'Privacy',
    terms: 'Terms',
    footerTagline: 'Connecting people through meaningful activities',
  },
  pl: {
    pageTitle: 'Kontakt z pomocą',
    backTitle: 'Powrót do strony głównej',
    languageSwitcher: 'Język',
    contactTitle: 'Jak możemy pomóc?',
    contactDescription:
      'Napisz do nas w sprawie konta, aplikacji lub subskrypcji. Jeśli pomoże to w diagnozie, podaj model urządzenia, wersję systemu i wersję aplikacji.',
    emailAction: 'Otwórz pocztę',
    emailHint: 'Jeśli przycisk nie otworzy aplikacji pocztowej, skopiuj adres:',
    emailSubject: 'Pomoc Shuuty',
    support: 'Wsparcie',
    privacy: 'Prywatność',
    terms: 'Regulamin',
    footerTagline: 'Łączymy ludzi poprzez wspólne aktywności',
  },
};

export default function SupportPage() {
  const [language, setLanguage] = useState<DocumentLanguage>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = Cookies.get('lang') as DocumentLanguage | undefined;
    if (savedLang === 'en' || savedLang === 'pl') {
      setLanguage(savedLang);
      return;
    }

    const preferredLanguage = navigator.languages?.[0] ?? navigator.language;
    setLanguage(preferredLanguage?.toLowerCase().startsWith('pl') ? 'pl' : 'en');
  }, []);

  const t = translations[language];
  const supportMailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t.emailSubject)}`;

  const handleLanguageChange = (nextLanguage: DocumentLanguage) => {
    setLanguage(nextLanguage);
    Cookies.set('lang', nextLanguage, { expires: 365 });
  };

  if (!mounted) return null;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.backgroundDecor}>
        <div className={`${styles.floatingShape} ${styles.shape1}`} />
        <div className={`${styles.floatingShape} ${styles.shape2}`} />
      </div>

      <DocumentHeader
        title={t.pageTitle}
        backTitle={t.backTitle}
        languageSwitcherLabel={t.languageSwitcher}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      <main className={styles.main}>
        <div className={styles.contentCard}>
          <div className={styles.formContainer}>
            <div className={styles.supportIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className={styles.formIntro}>
              <h2>{t.contactTitle}</h2>
              <p>{t.contactDescription}</p>
            </div>

            <a href={supportMailHref} className={styles.supportMailButton}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{t.emailAction}</span>
            </a>

            <p className={styles.supportHint}>{t.emailHint}</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.supportEmailLink}>
              {SUPPORT_EMAIL}
            </a>
          </div>
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

