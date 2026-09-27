import Link from 'next/link';
import type { SiteLanguage } from '@/components/documentLocale';
import guidesContent from '@/content/guides.json';
import { asGuides, guidePath, guidesIn } from '@/lib/guides.mjs';

const guides = asGuides(guidesContent.guides);

interface GuideLinksProps {
  language: SiteLanguage;
  className?: string;
  headingClassName?: string;
}

// The guides of one language, linked from the support and facts pages. Renders
// nothing until that language has a guide, like the footer link.
export default function GuideLinks({
  language,
  className,
  headingClassName,
}: Readonly<GuideLinksProps>) {
  const entries = guidesIn(guides, language);
  if (entries.length === 0) return null;

  return (
    <section id="guides" className={className} aria-labelledby="guides-heading">
      <h2 id="guides-heading" className={headingClassName}>
        {guidesContent.index[language].navTitle}
      </h2>
      <ul>
        {entries.map((guide) => (
          <li key={guide.slug}>
            <Link href={guidePath(guide)}>{guide.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
