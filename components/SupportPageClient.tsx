'use client';

import { useCallback, useState } from 'react';
import { DocumentShell } from '@/components/DocumentChrome';
import { documentTranslations } from '@/components/documentLocale';
import { useSiteLanguage } from '@/components/useSiteLanguage';
import styles from '@/app/documents.module.css';
import type { DocumentLanguage } from '@/components/documentLocale';

const SUPPORT_EMAIL = 'shuuty.app@gmail.com';

const supportTranslations = {
  en: {
    ...documentTranslations.en,
    pageTitle: 'Contact Support',
    contactTitle: 'How can we help?',
    contactDescription:
      'Email us about your account, the app, or your subscription. When relevant, include your device model, system version, and app version to help us investigate.',
    emailAction: 'Open email app',
    emailHint: "If the button doesn't open your email app, copy this address:",
    emailSubject: 'Shuuty support',
    copyAddress: 'Copy email address',
    copied: 'Email address copied.',
    copyFailed: 'Could not copy the address. Select it and copy it manually.',
  },
  pl: {
    ...documentTranslations.pl,
    pageTitle: 'Pomoc i kontakt',
    contactTitle: 'Jak możemy pomóc?',
    contactDescription:
      'Napisz do nas w sprawie konta, aplikacji lub subskrypcji. Jeśli pomoże to w diagnozie, podaj model urządzenia, wersję systemu i wersję aplikacji.',
    emailAction: 'Otwórz pocztę',
    emailHint: 'Jeśli przycisk nie otworzy aplikacji pocztowej, skopiuj adres:',
    emailSubject: 'Pomoc Shuuty',
    copyAddress: 'Kopiuj adres e-mail',
    copied: 'Adres e-mail został skopiowany.',
    copyFailed: 'Nie udało się skopiować adresu. Zaznacz go i skopiuj ręcznie.',
  },
} as const;

type CopyStatus = 'idle' | 'copied' | 'failed';

const MailIcon = ({ strokeWidth }: { strokeWidth: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    aria-hidden="true"
  >
    <path
      d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m3 7 9 6 9-6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface SupportPageClientProps {
  initialLanguage?: DocumentLanguage;
}

export default function SupportPageClient({ initialLanguage = 'en' }: SupportPageClientProps) {
  const { language, changeLanguage } = useSiteLanguage(initialLanguage);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const translations = supportTranslations[language];
  const supportMailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    translations.emailSubject,
  )}`;

  const copySupportAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  }, []);

  const handleLanguageChange = useCallback(
    (nextLanguage: 'en' | 'pl') => {
      setCopyStatus('idle');
      changeLanguage(nextLanguage);
    },
    [changeLanguage],
  );

  const copyAnnouncement =
    copyStatus === 'copied'
      ? translations.copied
      : copyStatus === 'failed'
        ? translations.copyFailed
        : '';

  return (
    <DocumentShell
      title={translations.pageTitle}
      backTitle={translations.backTitle}
      languageSwitcherLabel={translations.languageSwitcher}
      language={language}
      onLanguageChange={handleLanguageChange}
      tagline={translations.footerTagline}
      supportLabel={translations.support}
      privacyLabel={translations.privacy}
      termsLabel={translations.terms}
    >
      <div className={styles.formContainer} lang={language}>
        <div className={styles.supportIcon} aria-hidden="true">
          <MailIcon strokeWidth="1.8" />
        </div>

        <div className={styles.formIntro}>
          <h1>{translations.contactTitle}</h1>
          <p>{translations.contactDescription}</p>
        </div>

        <a href={supportMailHref} className={styles.supportMailButton}>
          <MailIcon strokeWidth="2" />
          <span>{translations.emailAction}</span>
        </a>

        <p className={styles.supportHint}>{translations.emailHint}</p>
        <button
          type="button"
          className={styles.supportEmailButton}
          onClick={copySupportAddress}
          aria-label={`${translations.copyAddress}: ${SUPPORT_EMAIL}`}
        >
          <span>{SUPPORT_EMAIL}</span>
          <span className={styles.copyAction}>{translations.copyAddress}</span>
        </button>
        <p className={styles.copyStatus} role="status" aria-live="polite">
          {copyAnnouncement}
        </p>
      </div>
    </DocumentShell>
  );
}
