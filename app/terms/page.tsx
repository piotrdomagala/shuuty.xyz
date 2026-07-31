import type { Metadata } from 'next';
import DocumentPage from '@/components/DocumentPage';

const description =
  'Terms and conditions for the Shuuty mobile application, including Free, Pro, and Teams plans.';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description,
  alternates: { canonical: '/terms/' },
  openGraph: {
    title: 'Terms & Conditions | Shuuty',
    description,
    url: '/terms/',
  },
};

export default function TermsPage() {
  return (
    <DocumentPage
      titleEn="Terms & Conditions"
      titlePl="Regulamin"
      fileEn="/documents/terms_en.md"
      filePl="/documents/terms.md"
    />
  );
}
