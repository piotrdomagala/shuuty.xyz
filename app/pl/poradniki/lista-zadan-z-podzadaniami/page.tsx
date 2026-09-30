import GuidePageClient from '@/components/GuidePageClient';
import body from '@/content/guides/pl/lista-zadan-z-podzadaniami.json';
import { createGuideMetadata, guides } from '@/lib/guidePages';
import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

const guide = requireGuide(guides, 'pl', 'lista-zadan-z-podzadaniami');
const article = asGuideArticle(body);

export const metadata = createGuideMetadata(guide);

export default function PrivateTasksGuidePage() {
  return <GuidePageClient guide={guide} article={article} />;
}
