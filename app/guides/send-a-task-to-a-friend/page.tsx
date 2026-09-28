import GuidePageClient from '@/components/GuidePageClient';
import body from '@/content/guides/en/send-a-task-to-a-friend.json';
import { createGuideMetadata, guides } from '@/lib/guidePages';
import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

const guide = requireGuide(guides, 'en', 'send-a-task-to-a-friend');
const article = asGuideArticle(body);

export const metadata = createGuideMetadata(guide);

export default function FriendTaskGuidePage() {
  return <GuidePageClient guide={guide} article={article} />;
}
