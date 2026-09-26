# Guides

Guides are practical articles at `/guides/` (en), `/pl/poradniki/` (pl) and `/nb/guider/` (nb). Each language has its own texts; a translation is linked by a shared `topic`.

## Adding a guide

1. Add an entry to `content/guides.json` under `guides`:

   ```json
   {
     "topic": "sports-club",
     "language": "pl",
     "slug": "aplikacja-dla-klubu-sportowego",
     "title": "Up to 60 characters, shown as '<title> | Shuuty'",
     "description": "50-160 characters for search results and the index card.",
     "heading": "The h1 of the article",
     "updatedOn": "2026-09-27",
     "updatedLabel": "Zaktualizowano 27 września 2026"
   }
   ```

   `topic` is lowercase words joined by hyphens, at most 17 characters. It links translations and names the store campaign `web-guide-<topic>-<language>` and the click events `store-ios-guide-<topic>-<language>` and `store-android-guide-<topic>-<language>`.

2. Add the body at `content/guides/<language>/<slug>.json`:

   ```json
   {
     "body": [
       { "type": "p", "text": "Opening paragraph. **Bold** is the only inline markup." },
       { "type": "h2", "text": "Section" },
       { "type": "h3", "text": "Subsection" },
       { "type": "ul", "items": ["First point;", "second point."] },
       { "type": "ol", "items": ["Step one.", "Step two."] }
     ],
     "faq": [{ "question": "Question?", "answer": "Answer." }]
   }
   ```

   The body opens with a paragraph and has at least one `h2`. `faq` is optional; its entries also become FAQPage structured data.

3. Add the page at `app/<section>/<slug>/page.tsx` (`app/guides/`, `app/pl/poradniki/` or `app/nb/guider/`):

   ```tsx
   import GuidePageClient from '@/components/GuidePageClient';
   import body from '@/content/guides/pl/aplikacja-dla-klubu-sportowego.json';
   import { createGuideMetadata, guides } from '@/lib/guidePages';
   import { asGuideArticle, requireGuide } from '@/lib/guides.mjs';

   const guide = requireGuide(guides, 'pl', 'aplikacja-dla-klubu-sportowego');
   const article = asGuideArticle(body);

   export const metadata = createGuideMetadata(guide);

   export default function GuidePage() {
     return <GuidePageClient guide={guide} article={article} />;
   }
   ```

   Static export cannot build a dynamic route with no pages, so each guide has its own small page file.

## What follows automatically

- The index of that language lists the guide, becomes indexable and joins the sitemap; the home and document footers link it. Until a language has a guide, its index stays `noindex, follow` and unlinked.
- hreflang links only real translations (x-default only when an English version exists); the language buttons open the translation or, without one, the other language's index.
- `html lang` is set for every page in the Polish and Norwegian sections.

## Checks

- `scripts/guides.test.mjs` checks the registry, every body, the page files and the path rules.
- `scripts/validate-static-export.mjs` checks the built pages: text, canonical, hreflang, one h1, noindex rules, structured data, store campaign and click events, sitemap, footers, and that no built guide folder is missing from the registry.
- Texts use the short hyphen `-` only. Norwegian text is reviewed before merge.
