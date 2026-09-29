import GuidesIndexClient from '@/components/GuidesIndexClient';
import { guideCardsByLanguage } from '@/lib/guideCards';
import { createGuidesIndexMetadata } from '@/lib/guidePages';

export const metadata = createGuidesIndexMetadata('pl');

export default function PolishGuidesPage() {
  return <GuidesIndexClient initialLanguage="pl" cards={guideCardsByLanguage()} />;
}
