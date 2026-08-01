import DocumentPage from '@/components/DocumentPage';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Informacje o tym, jak Shuuty przetwarza i chroni dane osobowe w aplikacji mobilnej oraz na publicznej stronie internetowej.';

export const metadata = createPublicPageMetadata({
  title: 'Polityka prywatności',
  description,
  path: '/pl/privacy/',
  language: 'pl',
  englishPath: '/privacy/',
  polishPath: '/pl/privacy/',
});

export default function PolishPrivacyPage() {
  return (
    <DocumentPage
      titleEn="Privacy Policy"
      titlePl="Polityka prywatności"
      fileEn="/documents/privacy_en.md"
      filePl="/documents/privacy.md"
      initialLanguage="pl"
    />
  );
}
