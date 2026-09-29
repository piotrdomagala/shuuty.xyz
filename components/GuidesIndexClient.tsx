'use client';

import Link from 'next/link';
import { DocumentShell } from '@/components/DocumentChrome';
import {
  documentTranslations,
  localizedSitePath,
  type SiteLanguage,
} from '@/components/documentLocale';
import ProductDeviceFrame from '@/components/ProductDeviceFrame';
import { useSiteLanguage } from '@/components/useSiteLanguage';
import guidesContent from '@/content/guides.json';
import type { GuideCard } from '@/lib/guideCards';
import { GUIDE_LANGUAGES } from '@/lib/guides.mjs';
import styles from '@/app/documents.module.css';
import guideStyles from '@/app/guides.module.css';

interface GuidesIndexClientProps {
  initialLanguage?: SiteLanguage;
  cards: Readonly<Record<SiteLanguage, readonly GuideCard[]>>;
}

type IndexCopy = (typeof guidesContent.index)[SiteLanguage];

function stepCountLabel(copy: IndexCopy, language: SiteLanguage, count: number) {
  const form = new Intl.PluralRules(language).select(count);
  const template = form === 'one' ? copy.stepsOne : form === 'few' ? copy.stepsFew : copy.stepsMany;
  return template.replace('{count}', String(count));
}

function PointIcon({ name }: Readonly<{ name: 'screen' | 'step' | 'honest' }>) {
  const paths = {
    screen: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></>,
    step: <><path d="M4 17h5v-5h5V7h6" /><path d="m17 4 3 3-3 3" /></>,
    honest: <><path d="M12 3 5 6v5c0 4.4 2.9 8.3 7 9.5 4.1-1.2 7-5.1 7-9.5V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

export default function GuidesIndexClient({
  initialLanguage = 'en',
  cards,
}: Readonly<GuidesIndexClientProps>) {
  const { language, changeLanguage } = useSiteLanguage(initialLanguage);
  const translations = documentTranslations[language];
  const copy = guidesContent.index[language];
  const entries = cards[language];

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

        <ul className={guideStyles.points}>
          <li>
            <PointIcon name="screen" />
            <span>{copy.pointScreens}</span>
          </li>
          <li>
            <PointIcon name="step" />
            <span>{copy.pointSteps}</span>
          </li>
          <li>
            <PointIcon name="honest" />
            <span>{copy.pointHonest}</span>
          </li>
        </ul>

        {entries.length > 0 ? (
          <ul className={guideStyles.cards}>
            {entries.map((card) => (
              <li key={card.slug} className={guideStyles.card}>
                <div className={guideStyles.cardVisual} aria-hidden="true">
                  {card.previews.map((media, index) => (
                    <ProductDeviceFrame
                      key={media.id}
                      media={media}
                      alt=""
                      sizes="120px"
                      className={`${guideStyles.cardPhone} ${
                        guideStyles[`cardPhone${index + 1}of${card.previews.length}`] ?? ''
                      }`}
                    />
                  ))}
                </div>
                <div className={guideStyles.cardBody}>
                  <p className={guideStyles.cardMeta}>
                    {stepCountLabel(copy, language, card.stepCount)}
                  </p>
                  <h2>
                    <Link href={card.href} className={guideStyles.cardLink}>
                      {card.heading}
                    </Link>
                  </h2>
                  <p className={guideStyles.cardText}>{card.description}</p>
                  <p className={guideStyles.cardCta} aria-hidden="true">
                    {copy.readGuide}
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </p>
                </div>
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
