import HomePageClient from '@/components/HomePageClient';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Twórz zadania głosem i przekazuj je znajomym lub grupom. Shuuty trzyma razem przypomnienia, czat, kalendarz i spotkania - na iOS i Androidzie.';

export const metadata = createPublicPageMetadata({
  title: 'Zadania głosowe, grupy i spotkania',
  description,
  path: '/pl/',
  language: 'pl',
  englishPath: '/',
  polishPath: '/pl/',
  norwegianPath: '/nb/',
});

export default function PolishHomePage() {
  return <HomePageClient initialLanguage="pl" />;
}
