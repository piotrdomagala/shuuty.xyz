import HomePageClient from '@/components/HomePageClient';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Lag huskelister og oppgaver med stemmen og gi dem til venner eller grupper. Shuuty holder påminnelser, chat, kalender og møter samlet - på iOS og Android.';

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
