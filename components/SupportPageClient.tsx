'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { DocumentShell } from '@/components/DocumentChrome';
import {
  documentTranslations,
  localizedSitePath,
  type SiteLanguage,
} from '@/components/documentLocale';
import { useSiteLanguage } from '@/components/useSiteLanguage';
import styles from '@/app/documents.module.css';

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
    accountDeletionHint: 'Need to delete your account or submit a deletion request?',
    accountDeletionAction: 'Delete your account',
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
    accountDeletionHint: 'Chcesz usunąć konto albo wysłać prośbę o jego usunięcie?',
    accountDeletionAction: 'Usuń konto',
  },
  nb: {
    ...documentTranslations.nb,
    pageTitle: 'Hjelp og kontakt',
    contactTitle: 'Hvordan kan vi hjelpe?',
    contactDescription:
      'Skriv til oss om kontoen, appen eller abonnementet ditt. Oppgi gjerne telefonmodell, systemversjon og appversjon hvis det kan hjelpe oss å finne feilen.',
    emailAction: 'Åpne e-postappen',
    emailHint: 'Hvis knappen ikke åpner e-postappen, kan du kopiere adressen:',
    emailSubject: 'Hjelp med Shuuty',
    copyAddress: 'Kopier e-postadressen',
    copied: 'E-postadressen er kopiert.',
    copyFailed: 'Kunne ikke kopiere adressen. Marker den og kopier den selv.',
    accountDeletionHint: 'Vil du slette kontoen eller sende en forespørsel om sletting?',
    accountDeletionAction: 'Slett kontoen',
  },
} as const;

const SUPPORT_LANGUAGES = ['en', 'pl', 'nb'] as const;

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
  initialLanguage?: SiteLanguage;
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
    (nextLanguage: SiteLanguage) => {
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
      languages={SUPPORT_LANGUAGES}
      onLanguageChange={handleLanguageChange}
      tagline={translations.footerTagline}
      supportLabel={translations.support}
      accountDeletionLabel={translations.accountDeletion}
      childSafetyLabel={translations.childSafety}
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
        >
          <span>{SUPPORT_EMAIL}</span>
          {/* Keeps the accessible name readable: "address, Copy email address". */}
          <span className={styles.srOnly}>, </span>
          <span className={styles.copyAction}>{translations.copyAddress}</span>
        </button>
        <p className={styles.copyStatus} role="status" aria-live="polite">
          {copyAnnouncement}
        </p>

        <p className={styles.supportHint}>{translations.accountDeletionHint}</p>
        <Link
          href={localizedSitePath(language, '/account-deletion/')}
          className={styles.supportMailButton}
        >
          <span>{translations.accountDeletionAction}</span>
        </Link>
      </div>
    </DocumentShell>
  );
}
