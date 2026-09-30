import GuidePageClient from '@/components/GuidePageClient';
import body from '@/content/guides/pl/profil-grupy-okladka-opis-zainteresowania.json';
import { createGuideMetadata, guides } from '@/lib/guidePages';
import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

const guide = requireGuide(guides, 'pl', 'profil-grupy-okladka-opis-zainteresowania');
const article = asGuideArticle(body);

export const metadata = createGuideMetadata(guide);

export default function GroupProfileGuidePage() {
  return <GuidePageClient guide={guide} article={article} />;
}
