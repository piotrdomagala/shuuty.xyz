import HomePageClient from '@/components/HomePageClient';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Oppgaver, grupper og møter i én app: si en oppgave og gi den videre, opprett en gruppe for familien, klubben eller kundene, og møt folk i nærheten.';

export const metadata = createPublicPageMetadata({
  title: 'Huskeliste med stemmen, grupper og møter',
  description,
  path: '/nb/',
  language: 'nb',
  englishPath: '/',
  polishPath: '/pl/',
  norwegianPath: '/nb/',
});

export default function NorwegianHomePage() {
  return <HomePageClient initialLanguage="nb" />;
}
