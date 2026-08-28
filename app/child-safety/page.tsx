import DocumentPage from '@/components/DocumentPage';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Read the Shuuty child safety standards and learn how to report child sexual abuse, exploitation, grooming, or other safety concerns.';

export const metadata = createPublicPageMetadata({
  title: 'Child safety standards',
  description,
  path: '/child-safety/',
  englishPath: '/child-safety/',
  polishPath: '/pl/child-safety/',
});

export default function ChildSafetyPage() {
  return (
    <DocumentPage
      titleEn="Child safety standards"
      titlePl="Standardy bezpieczeństwa dzieci"
      fileEn="/documents/child_safety_en.md"
      filePl="/documents/child_safety.md"
    />
  );
}
