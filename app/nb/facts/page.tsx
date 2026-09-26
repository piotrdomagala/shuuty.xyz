import FactsPageClient from '@/components/FactsPageClient';
import facts from '@/content/facts.json';
import { createPublicPageMetadata } from '@/lib/site';

const page = facts.pages.nb;

export const metadata = createPublicPageMetadata({
  title: page.navTitle,
  description: page.description,
  path: '/nb/facts/',
  language: 'nb',
  englishPath: '/facts/',
  polishPath: '/pl/facts/',
  norwegianPath: '/nb/facts/',
});

export default function NorwegianFactsPage() {
  return <FactsPageClient initialLanguage="nb" />;
}
