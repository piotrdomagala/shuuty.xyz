import GuidePageClient from '@/components/GuidePageClient';
import body from '@/content/guides/pl/zadanie-dla-wybranych-osob-w-grupie.json';
import { createGuideMetadata, guides } from '@/lib/guidePages';
import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

const guide = requireGuide(guides, 'pl', 'zadanie-dla-wybranych-osob-w-grupie');
const article = asGuideArticle(body);

export const metadata = createGuideMetadata(guide);

export default function GroupPeopleGuidePage() {
  return <GuidePageClient guide={guide} article={article} />;
}
