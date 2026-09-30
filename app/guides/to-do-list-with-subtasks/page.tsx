import GuidePageClient from '@/components/GuidePageClient';
import body from '@/content/guides/en/to-do-list-with-subtasks.json';
import { createGuideMetadata, guides } from '@/lib/guidePages';
import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

const guide = requireGuide(guides, 'en', 'to-do-list-with-subtasks');
const article = asGuideArticle(body);

export const metadata = createGuideMetadata(guide);

export default function TodoListGuidePage() {
  return <GuidePageClient guide={guide} article={article} />;
}
