import DocumentPage from '@/components/DocumentPage';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Start deletion of your Shuuty account and learn what happens to account data and store subscriptions.';

export const metadata = createPublicPageMetadata({
  title: 'Delete your account',
  description,
  path: '/account-deletion/',
  englishPath: '/account-deletion/',
  polishPath: '/pl/account-deletion/',
});

export default function AccountDeletionPage() {
  return (
    <DocumentPage
      titleEn="Delete your account"
      titlePl="Usuń konto"
      fileEn="/documents/account_deletion_en.md"
      filePl="/documents/account_deletion.md"
    />
  );
}
