'use client';

import { DocumentShell } from '@/components/DocumentChrome';
import { documentTranslations } from '@/components/documentLocale';
import { useSiteLanguage } from '@/components/useSiteLanguage';
import styles from '@/app/documents.module.css';

interface DocumentPageClientProps {
  titleEn: string;
  titlePl: string;
  contentEn: string;
  contentPl: string;
}

export default function DocumentPageClient({
  titleEn,
  titlePl,
  contentEn,
  contentPl,
}: DocumentPageClientProps) {
  const { language, changeLanguage } = useSiteLanguage();
  const translations = documentTranslations[language];
  const pageTitle = language === 'pl' ? titlePl : titleEn;
  const content = language === 'pl' ? contentPl : contentEn;

  return (
    <DocumentShell
      title={pageTitle}
      backTitle={translations.backTitle}
      languageSwitcherLabel={translations.languageSwitcher}
      language={language}
      onLanguageChange={changeLanguage}
      tagline={translations.footerTagline}
      supportLabel={translations.support}
      privacyLabel={translations.privacy}
      termsLabel={translations.terms}
    >
      <article
        className={styles.markdown}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </DocumentShell>
  );
}
