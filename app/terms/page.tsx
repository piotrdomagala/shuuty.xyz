import DocumentPage from '@/components/DocumentPage';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Terms and conditions for the Shuuty mobile application, including Free, Pro, and Teams plans.';

export const metadata = createPublicPageMetadata({
  title: 'Terms & Conditions',
  description,
  path: '/terms/',
});

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
