import type { Metadata } from 'next';
import DocumentPage from '@/components/DocumentPage';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Shuuty',
  description:
    'Terms and conditions for the Shuuty mobile application, including Free, Pro, and Teams plans.',
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
