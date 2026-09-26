'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { DocumentShell } from '@/components/DocumentChrome';
import { documentTranslations, localizedSitePath } from '@/components/documentLocale';
import { useSiteLanguage } from '@/components/useSiteLanguage';
import guidesContent from '@/content/guides.json';
import {
  GUIDE_LANGUAGES,
  asGuides,
  guidePath,
  guideStoreCampaign,
  guideSwitchPaths,
  textSegments,
  type GuideArticle,
  type GuideBlock,
  type GuideEntry,
} from '@/lib/guides.mjs';
import { GUIDE_INDEX_PATHS } from '@/lib/sitePaths.mjs';
import { SITE_URL, createStoreLinks } from '@/lib/site';
import styles from '@/app/documents.module.css';
import guideStyles from '@/app/guides.module.css';

const guides = asGuides(guidesContent.guides);

function RichText({ text }: Readonly<{ text: string }>) {
  return (
    <>
      {textSegments(text).map((segment, index) =>
        segment.strong ? (
          <strong key={index}>{segment.text}</strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

function Block({ block }: Readonly<{ block: GuideBlock }>) {
  switch (block.type) {
    case 'h2':
      return <h2>{block.text}</h2>;
    case 'h3':
      return <h3>{block.text}</h3>;
    case 'p':
      return (
        <p>
          <RichText text={block.text} />
        </p>
      );
    case 'ul':
    case 'ol': {
      const List = block.type;
      return (
        <List>
          {block.items.map((item) => (
            <li key={item}>
              <RichText text={item} />
            </li>
          ))}
        </List>
      );
    }
  }
}

function createGuideSchema(guide: GuideEntry, article: GuideArticle) {
  const pageUrl = `${SITE_URL}${guidePath(guide)}`;
  const faq = article.faq ?? [];
  const plain = (text: string) => textSegments(text).map((segment) => segment.text).join('');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        url: pageUrl,
        headline: guide.heading,
        description: guide.description,
        inLanguage: guide.language,
        dateModified: guide.updatedOn,
        mainEntityOfPage: pageUrl,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#mobile-app` },
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      ...(faq.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${pageUrl}#faq`,
              inLanguage: guide.language,
              isPartOf: { '@id': `${SITE_URL}/#website` },
              mainEntity: faq.map((entry) => ({
                '@type': 'Question',
                name: plain(entry.question),
                acceptedAnswer: { '@type': 'Answer', text: plain(entry.answer) },
              })),
            },
          ]
        : []),
    ],
  };
}

interface GuidePageClientProps {
  guide: GuideEntry;
  article: GuideArticle;
}

export default function GuidePageClient({ guide, article }: Readonly<GuidePageClientProps>) {
  const switchPaths = useMemo(() => guideSwitchPaths(guides, guide), [guide]);
  const { language, changeLanguage } = useSiteLanguage(guide.language, switchPaths);
  const translations = documentTranslations[language];
  // The article is one text in one language; only the chrome follows the switcher.
  const labels = guidesContent.labels[guide.language];
  const storeLinks = createStoreLinks(guideStoreCampaign(guide));
  const clickSuffix = `guide-${guide.topic}-${guide.language}`;

  return (
    <DocumentShell
      title={guidesContent.index[language].navTitle}
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(createGuideSchema(guide, article)) }}
      />
      <article className={styles.markdown} lang={guide.language}>
        <p className={guideStyles.backLink}>
          <Link href={GUIDE_INDEX_PATHS[guide.language]}>{labels.allGuides}</Link>
        </p>
        <h1>{guide.heading}</h1>
        <p className={guideStyles.updated}>{guide.updatedLabel}</p>

        {article.body.map((block, index) => (
          <Block key={index} block={block} />
        ))}

        {article.faq && article.faq.length > 0 ? (
          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading">{labels.faqHeading}</h2>
            {article.faq.map((entry) => (
              <div key={entry.question}>
                <h3>
                  <RichText text={entry.question} />
                </h3>
                <p>
                  <RichText text={entry.answer} />
                </p>
              </div>
            ))}
          </section>
        ) : null}

        <aside className={guideStyles.getApp} aria-labelledby="get-app-heading">
          <h2 id="get-app-heading">{labels.getApp}</h2>
          <div className={guideStyles.storeRow}>
            <a
              href={storeLinks.ios}
              target="_blank"
              rel="noopener noreferrer"
              className={guideStyles.storeLink}
              data-goatcounter-click={`store-ios-${clickSuffix}`}
            >
              <span className={guideStyles.storePrefix}>{labels.appStorePrefix}</span>
              <span className={guideStyles.storeName}>App Store</span>
            </a>
            <a
              href={storeLinks.android}
              target="_blank"
              rel="noopener noreferrer"
              className={guideStyles.storeLink}
              data-goatcounter-click={`store-android-${clickSuffix}`}
            >
              <span className={guideStyles.storePrefix}>{labels.googlePlayPrefix}</span>
              <span className={guideStyles.storeName}>Google Play</span>
            </a>
          </div>
        </aside>

        <p className={guideStyles.related}>
          <Link href={localizedSitePath(guide.language, '/facts/')}>{labels.facts}</Link>
          {' · '}
          <Link href={GUIDE_INDEX_PATHS[guide.language]}>{labels.allGuides}</Link>
        </p>
      </article>
    </DocumentShell>
  );
}
