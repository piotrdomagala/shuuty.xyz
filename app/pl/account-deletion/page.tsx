import DocumentPage from '@/components/DocumentPage';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Rozpocznij usuwanie konta Shuuty i sprawdź, co stanie się z danymi konta oraz subskrypcjami sklepowymi.';

export const metadata = createPublicPageMetadata({
  title: 'Usuń konto',
  description,
  path: '/pl/account-deletion/',
  language: 'pl',
  englishPath: '/account-deletion/',
  polishPath: '/pl/account-deletion/',
});

export default function PolishAccountDeletionPage() {
  return (
    <DocumentPage
      titleEn="Delete your account"
      titlePl="Usuń konto"
      fileEn="/documents/account_deletion_en.md"
      filePl="/documents/account_deletion.md"
      initialLanguage="pl"
    />
  );
}
