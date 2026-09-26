import FactsPageClient from '@/components/FactsPageClient';
import facts from '@/content/facts.json';
import { createPublicPageMetadata } from '@/lib/site';

const page = facts.pages.en;

export const metadata = createPublicPageMetadata({
  title: page.navTitle,
  description: page.description,
  path: '/facts/',
  englishPath: '/facts/',
  polishPath: '/pl/facts/',
  norwegianPath: '/nb/facts/',
});

export default function FactsPage() {
  return <FactsPageClient />;
}
