import GuidePageClient from '@/components/GuidePageClient';
import body from '@/content/guides/en/group-tasks-step-by-step.json';
import { createGuideMetadata, guides } from '@/lib/guidePages';
import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

const guide = requireGuide(guides, 'en', 'group-tasks-step-by-step');
const article = asGuideArticle(body);

export const metadata = createGuideMetadata(guide);

export default function GroupTasksGuidePage() {
  return <GuidePageClient guide={guide} article={article} />;
}
