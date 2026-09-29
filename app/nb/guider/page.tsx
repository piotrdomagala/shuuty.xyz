import GuidesIndexClient from '@/components/GuidesIndexClient';
import { guideCardsByLanguage } from '@/lib/guideCards';
import { createGuidesIndexMetadata } from '@/lib/guidePages';

export const metadata = createGuidesIndexMetadata('nb');

export default function NorwegianGuidesPage() {
  return <GuidesIndexClient initialLanguage="nb" cards={guideCardsByLanguage()} />;
}
