import HomePageClient from '@/components/HomePageClient';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Zamieniaj pomysły w działanie z Shuuty: twórz i deleguj kompletne zadania głosem, buduj grupy do pracy, społeczności, usług i sprzedaży, organizuj spotkania, rezerwacje i odkrywaj to, czego potrzebujesz w pobliżu.';

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
