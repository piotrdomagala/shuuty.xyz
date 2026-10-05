import HomePageClient from '@/components/HomePageClient';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Lista zadań, zadania dla znajomych i grupy z kalendarzem, rezerwacjami i spotkaniami w pobliżu. Zacznij od własnych zadań. iOS i Android.';

export const metadata = createPublicPageMetadata({
  title: 'Shuuty - zadania, terminy i rezerwacje ze znajomymi i w grupach',
  absoluteTitle: true,
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
