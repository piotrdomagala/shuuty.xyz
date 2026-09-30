import GuidePageClient from '@/components/GuidePageClient';
import body from '@/content/guides/en/task-for-selected-people-in-a-group.json';
import { createGuideMetadata, guides } from '@/lib/guidePages';
import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

const guide = requireGuide(guides, 'en', 'task-for-selected-people-in-a-group');
const article = asGuideArticle(body);

export const metadata = createGuideMetadata(guide);

export default function SelectedPeopleGuidePage() {
  return <GuidePageClient guide={guide} article={article} />;
}
