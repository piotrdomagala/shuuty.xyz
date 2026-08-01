import HomePageClient from '@/components/HomePageClient';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Zamieniaj pomysły w działanie z Shuuty: twórz i deleguj zadania głosem, buduj elastyczne grupy, organizuj spotkania i odkrywaj to, czego potrzebujesz w pobliżu.';

export const metadata = createPublicPageMetadata({
  title: 'Zadania głosowe, grupy i spotkania',
  description,
  path: '/pl/',
  language: 'pl',
  englishPath: '/',
  polishPath: '/pl/',
});

export default function PolishHomePage() {
  return <HomePageClient initialLanguage="pl" />;
}
