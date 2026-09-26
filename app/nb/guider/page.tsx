import GuidesIndexClient from '@/components/GuidesIndexClient';
import { createGuidesIndexMetadata } from '@/lib/guidePages';

export const metadata = createGuidesIndexMetadata('nb');

export default function NorwegianGuidesPage() {
  return <GuidesIndexClient initialLanguage="nb" />;
}
