import GuidesIndexClient from '@/components/GuidesIndexClient';
import { createGuidesIndexMetadata } from '@/lib/guidePages';

export const metadata = createGuidesIndexMetadata('en');

export default function GuidesPage() {
  return <GuidesIndexClient />;
}
