import GuidesIndexClient from '@/components/GuidesIndexClient';
import { guideCardsByLanguage } from '@/lib/guideCards';
import { createGuidesIndexMetadata } from '@/lib/guidePages';

export const metadata = createGuidesIndexMetadata('en');

export default function GuidesPage() {
  return <GuidesIndexClient cards={guideCardsByLanguage()} />;
}
