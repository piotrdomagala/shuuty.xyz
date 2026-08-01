import DocumentPage from '@/components/DocumentPage';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'How Shuuty processes and protects personal data in the mobile application and public website.';

export const metadata = createPublicPageMetadata({
  title: 'Privacy Policy',
  description,
  path: '/privacy/',
});

export default function PrivacyPage() {
  return (
    <DocumentPage
      titleEn="Privacy Policy"
      titlePl="Polityka Prywatności"
      fileEn="/documents/privacy_en.md"
      filePl="/documents/privacy.md"
    />
  );
}
