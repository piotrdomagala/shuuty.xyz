import HomePageClient from '@/components/HomePageClient';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'En oppgaveliste, oppgaver til venner og grupper med kalender, bestillinger og møter i nærheten. Start med dine egne oppgaver. iOS og Android.';

export const metadata = createPublicPageMetadata({
  title: 'Shuuty - oppgaver, avtaler og reservasjoner med venner og grupper',
  absoluteTitle: true,
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
