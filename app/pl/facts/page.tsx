import FactsPageClient from '@/components/FactsPageClient';
import facts from '@/content/facts.json';
import { createPublicPageMetadata } from '@/lib/site';

const page = facts.pages.pl;

export const metadata = createPublicPageMetadata({
  title: page.navTitle,
  description: page.description,
  path: '/pl/facts/',
  language: 'pl',
  englishPath: '/facts/',
  polishPath: '/pl/facts/',
  norwegianPath: '/nb/facts/',
});

export default function PolishFactsPage() {
  return <FactsPageClient initialLanguage="pl" />;
}
