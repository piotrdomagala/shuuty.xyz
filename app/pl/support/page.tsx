import SupportPageClient from '@/components/SupportPageClient';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Skontaktuj się ze wsparciem Shuuty w sprawie konta, aplikacji mobilnej lub subskrypcji.';

export const metadata = createPublicPageMetadata({
  title: 'Wsparcie',
  description,
  path: '/pl/support/',
  language: 'pl',
  englishPath: '/support/',
  polishPath: '/pl/support/',
});

export default function PolishSupportPage() {
  return <SupportPageClient initialLanguage="pl" />;
}
