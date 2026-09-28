import GuidePageClient from '@/components/GuidePageClient';
import body from '@/content/guides/pl/zadanie-dla-znajomego-krok-po-kroku.json';
import { createGuideMetadata, guides } from '@/lib/guidePages';
import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

const guide = requireGuide(guides, 'pl', 'zadanie-dla-znajomego-krok-po-kroku');
const article = asGuideArticle(body);

export const metadata = createGuideMetadata(guide);

export default function FriendTaskGuidePage() {
  return <GuidePageClient guide={guide} article={article} />;
}
