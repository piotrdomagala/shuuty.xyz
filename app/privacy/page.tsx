import type { Metadata } from 'next';
import DocumentPage from '@/components/DocumentPage';

const description =
  'How Shuuty processes and protects personal data in the mobile application and public website.';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description,
  alternates: { canonical: '/privacy/' },
  openGraph: {
    title: 'Privacy Policy | Shuuty',
    description,
    url: '/privacy/',
  },
};

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
