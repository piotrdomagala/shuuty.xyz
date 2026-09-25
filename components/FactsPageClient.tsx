'use client';

import { DocumentShell } from '@/components/DocumentChrome';
import { documentTranslations, type SiteLanguage } from '@/components/documentLocale';
import { useSiteLanguage } from '@/components/useSiteLanguage';
import facts from '@/content/facts.json';
import { SITE_URL } from '@/lib/site';
import styles from '@/app/documents.module.css';
import factsStyles from '@/app/facts.module.css';

const FACTS_LANGUAGES = ['en', 'pl', 'nb'] as const;

// AlternativeTo allows hosting the badge ourselves; the link keeps their own
// badge parameters and points at the listing.
const ALTERNATIVETO_LISTING_URL =
  'https://alternativeto.net/software/shuuty/about/?utm_source=badge&utm_medium=referral';

type FactItem = Readonly<{ text: string; platform?: string }>;

const itemText = ({ text, platform }: FactItem) => (platform ? `${platform}: ${text}` : text);

function createFactsSchema(language: SiteLanguage) {
  const page = facts.pages[language];
  const pageUrl = `${SITE_URL}${page.path}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: page.title,
        description: page.description,
        inLanguage: language,
        dateModified: facts.checkedOn,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#mobile-app` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        inLanguage: language,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        mainEntity: page.faq.map((entry) => ({
          '@type': 'Question',
          name: entry.question,
          acceptedAnswer: { '@type': 'Answer', text: entry.answer.map(itemText).join(' ') },
        })),
      },
    ],
  };
}

function ListedOn({ label }: Readonly<{ label: string }>) {
  return (
    <p className={factsStyles.listedOn}>
      <span>{label}</span>
      <a
        href={ALTERNATIVETO_LISTING_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-goatcounter-click="outbound-alternativeto"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a small static vector badge; next/image adds nothing in a static export */}
        <img
          src="/images/badges/alternativeto-listed.svg"
          alt="Shuuty | AlternativeTo"
          width={183}
          height={59}
          loading="lazy"
        />
      </a>
    </p>
  );
}

interface FactsPageClientProps {
  initialLanguage?: SiteLanguage;
}

export default function FactsPageClient({ initialLanguage = 'en' }: FactsPageClientProps) {
  const { language, changeLanguage } = useSiteLanguage(initialLanguage);
  const translations = documentTranslations[language];
  const page = facts.pages[language];

  return (
    <DocumentShell
      title={page.navTitle}
      backTitle={translations.backTitle}
      languageSwitcherLabel={translations.languageSwitcher}
      language={language}
      languages={FACTS_LANGUAGES}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(createFactsSchema(initialLanguage)) }}
      />
      <article className={styles.markdown} lang={language}>
        <h1>{page.title}</h1>
        <p className={factsStyles.checked}>{page.checkedLabel}</p>

        {page.sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
            <h2 id={`${section.id}-heading`}>{section.heading}</h2>
            <ul>
              {section.items.map((item: FactItem) => (
                <li key={item.text}>
                  {item.platform ? <strong>{item.platform}: </strong> : null}
                  {item.text}
                </li>
              ))}
            </ul>
            {section.id === 'publisher' ? <ListedOn label={page.listedOn} /> : null}
          </section>
        ))}

        <section id="faq" aria-labelledby="faq-heading">
          <h2 id="faq-heading">{page.faqHeading}</h2>
          {page.faq.map((entry) => (
            <details key={entry.question} className={factsStyles.faqItem}>
              <summary>{entry.question}</summary>
              <p>{entry.answer.map(itemText).join(' ')}</p>
            </details>
          ))}
        </section>
      </article>
    </DocumentShell>
  );
}
