import GuidePageClient from '@/components/GuidePageClient';
import body from '@/content/guides/en/group-profile-cover-description-interests.json';
import { createGuideMetadata, guides } from '@/lib/guidePages';
import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

const guide = requireGuide(guides, 'en', 'group-profile-cover-description-interests');
const article = asGuideArticle(body);

export const metadata = createGuideMetadata(guide);

export default function GroupProfileEnGuidePage() {
  return <GuidePageClient guide={guide} article={article} />;
}
