import SupportPageClient from '@/components/SupportPageClient';
import { createPublicPageMetadata } from '@/lib/site';

const description = 'Kontakt Shuuty om kontoen din, mobilappen eller et abonnement.';

export const metadata = createPublicPageMetadata({
  title: 'Hjelp',
  description,
  path: '/nb/support/',
  language: 'nb',
  englishPath: '/support/',
  polishPath: '/pl/support/',
  norwegianPath: '/nb/support/',
});

export default function NorwegianSupportPage() {
  return <SupportPageClient initialLanguage="nb" />;
}
