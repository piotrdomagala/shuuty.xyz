import GuidePageClient from '@/components/GuidePageClient';
import body from '@/content/guides/pl/zadania-w-grupie-krok-po-kroku.json';
import { createGuideMetadata, guides } from '@/lib/guidePages';
import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

const guide = requireGuide(guides, 'pl', 'zadania-w-grupie-krok-po-kroku');
const article = asGuideArticle(body);

export const metadata = createGuideMetadata(guide);

export default function GroupTasksGuidePage() {
  return <GuidePageClient guide={guide} article={article} />;
}
