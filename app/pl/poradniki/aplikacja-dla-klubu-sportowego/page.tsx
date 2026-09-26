import GuidePageClient from '@/components/GuidePageClient';
import body from '@/content/guides/pl/aplikacja-dla-klubu-sportowego.json';
import { createGuideMetadata, guides } from '@/lib/guidePages';
import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

const guide = requireGuide(guides, 'pl', 'aplikacja-dla-klubu-sportowego');
const article = asGuideArticle(body);

export const metadata = createGuideMetadata(guide);

export default function SportsClubGuidePage() {
  return <GuidePageClient guide={guide} article={article} />;
}
