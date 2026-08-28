import DocumentPage from '@/components/DocumentPage';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Poznaj standardy bezpieczeństwa dzieci Shuuty oraz sposoby zgłaszania wykorzystywania seksualnego dzieci, groomingu i innych zagrożeń.';

export const metadata = createPublicPageMetadata({
  title: 'Standardy bezpieczeństwa dzieci',
  description,
  path: '/pl/child-safety/',
  language: 'pl',
  englishPath: '/child-safety/',
  polishPath: '/pl/child-safety/',
});

export default function PolishChildSafetyPage() {
  return (
    <DocumentPage
      titleEn="Child safety standards"
      titlePl="Standardy bezpieczeństwa dzieci"
      fileEn="/documents/child_safety_en.md"
      filePl="/documents/child_safety.md"
      initialLanguage="pl"
    />
  );
}
