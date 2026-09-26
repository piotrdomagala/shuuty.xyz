import GuidesIndexClient from '@/components/GuidesIndexClient';
import { createGuidesIndexMetadata } from '@/lib/guidePages';

export const metadata = createGuidesIndexMetadata('pl');

export default function PolishGuidesPage() {
  return <GuidesIndexClient initialLanguage="pl" />;
}
