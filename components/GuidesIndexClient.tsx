'use client';

import Link from 'next/link';
import { DocumentShell } from '@/components/DocumentChrome';
import {
  documentTranslations,
  localizedSitePath,
  type SiteLanguage,
} from '@/components/documentLocale';
import { useSiteLanguage } from '@/components/useSiteLanguage';
import guidesContent from '@/content/guides.json';
import { GUIDE_LANGUAGES, asGuides, guidePath, guidesIn } from '@/lib/guides.mjs';
import styles from '@/app/documents.module.css';
import guideStyles from '@/app/guides.module.css';

const guides = asGuides(guidesContent.guides);

interface GuidesIndexClientProps {
  initialLanguage?: SiteLanguage;
}

export default function GuidesIndexClient({
  initialLanguage = 'en',
}: Readonly<GuidesIndexClientProps>) {
  const { language, changeLanguage } = useSiteLanguage(initialLanguage);
  const translations = documentTranslations[language];
  const copy = guidesContent.index[language];
  const entries = guidesIn(guides, language);

  return (
    <DocumentShell
      title={copy.navTitle}
      backTitle={translations.backTitle}
      languageSwitcherLabel={translations.languageSwitcher}
      language={language}
      languages={GUIDE_LANGUAGES}
      onLanguageChange={changeLanguage}
      tagline={translations.footerTagline}
      supportLabel={translations.support}
      accountDeletionLabel={translations.accountDeletion}
      childSafetyLabel={translations.childSafety}
      privacyLabel={translations.privacy}
      termsLabel={translations.terms}
    >
      <article className={styles.markdown} lang={language}>
        <h1>{copy.title}</h1>
        <p className={guideStyles.intro}>{copy.intro}</p>

        {entries.length > 0 ? (
          <ul className={guideStyles.guideList}>
            {entries.map((guide) => (
              <li key={guide.slug}>
                <h2>
                  <Link href={guidePath(guide)}>{guide.heading}</Link>
                </h2>
                <p>{guide.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {copy.empty}{' '}
            <Link href={localizedSitePath(language, '/facts/')}>{copy.factsLink}</Link>
          </p>
        )}
      </article>
    </DocumentShell>
  );
}
