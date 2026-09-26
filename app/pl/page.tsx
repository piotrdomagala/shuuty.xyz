import HomePageClient from '@/components/HomePageClient';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Zadania, grupy i spotkania w jednej aplikacji: powiedz zadanie i przekaż je dalej, załóż grupę dla rodziny, klubu albo klientów i spotkaj się w okolicy.';

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
