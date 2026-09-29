import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SiteLanguage } from '@/components/documentLocale';
import guidesContent from '@/content/guides.json';
import {
  GUIDE_LANGUAGES,
  asGuideArticle,
  asGuides,
  guidePath,
  guidesIn,
  type GuideBlock,
} from '@/lib/guides.mjs';
import { getProductMediaPlacement, type ProductMediaPlacement } from '@/lib/productMedia';

export type GuideCard = Readonly<{
  slug: string;
  href: string;
  heading: string;
  description: string;
  stepCount: number;
  previews: readonly ProductMediaPlacement[];
}>;

type StepBlock = Extract<GuideBlock, { type: 'step' }>;

// Three screens tell the path: where it starts, a step in the middle and where
// it ends. Shorter guides show every step they have.
export function previewSteps<T>(steps: readonly T[]): T[] {
  if (steps.length <= 3) return [...steps];
  return [steps[0], steps[Math.floor((steps.length - 1) / 2)], steps[steps.length - 1]];
}

function readArticle(language: SiteLanguage, slug: string) {
  const file = join(process.cwd(), 'content', 'guides', language, `${slug}.json`);
  return asGuideArticle(JSON.parse(readFileSync(file, 'utf8')));
}

// Runs at build time in the index pages (server components), so the article
// bodies never reach the browser bundle; the index only receives these cards.
export function guideCardsByLanguage(): Record<SiteLanguage, GuideCard[]> {
  const guides = asGuides(guidesContent.guides);
  const byLanguage = {} as Record<SiteLanguage, GuideCard[]>;
  for (const language of GUIDE_LANGUAGES) {
    byLanguage[language] = guidesIn(guides, language).map((guide) => {
      const steps = readArticle(language, guide.slug).body.filter(
        (block): block is StepBlock => block.type === 'step',
      );
      return {
        slug: guide.slug,
        href: guidePath(guide),
        heading: guide.heading,
        description: guide.description,
        stepCount: steps.length,
        previews: previewSteps(steps).map((step) => getProductMediaPlacement(step.media)),
      };
    });
  }
  return byLanguage;
}
