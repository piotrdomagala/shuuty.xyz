import GuidePageClient from '@/components/GuidePageClient';
import body from '@/content/guides/nb/gruppeoppgaver-steg-for-steg.json';
import { createGuideMetadata, guides } from '@/lib/guidePages';
import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

const guide = requireGuide(guides, 'nb', 'gruppeoppgaver-steg-for-steg');
const article = asGuideArticle(body);

export const metadata = createGuideMetadata(guide);

export default function GroupTasksGuidePage() {
  return <GuidePageClient guide={guide} article={article} />;
}
