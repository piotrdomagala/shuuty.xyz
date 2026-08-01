import DocumentPage from '@/components/DocumentPage';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Regulamin aplikacji mobilnej Shuuty, w tym zasady planów Free, Pro i Teams.';

export const metadata = createPublicPageMetadata({
  title: 'Regulamin',
  description,
  path: '/pl/terms/',
  language: 'pl',
  englishPath: '/terms/',
  polishPath: '/pl/terms/',
});

export default function PolishTermsPage() {
  return (
    <DocumentPage
      titleEn="Terms & Conditions"
      titlePl="Regulamin"
      fileEn="/documents/terms_en.md"
      filePl="/documents/terms.md"
      initialLanguage="pl"
    />
  );
}
