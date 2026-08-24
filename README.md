# shuuty.xyz

Public marketing, legal, support, and app hand-off website for the Shuuty mobile application.

## Stack

- Next.js 14 App Router with static export
- React 18 and TypeScript
- CSS Modules with semantic light/dark design tokens
- Outfit and Plus Jakarta Sans
- English and Polish UI copy with cookie persistence

## Main surfaces

- `/` - product landing page focused on voice tasks, delegation, groups, calendars, meetings, and nearby discovery
- `/support/` - support contact surface
- `/privacy/` and `/terms/` - bilingual legal documents
- `/verify/`, `/auth/verify/`, `/auth/reset-password/` - product hand-off pages; excluded from indexing
- `/robots.txt` and `/sitemap.xml` - static SEO metadata routes

The product implementation and business rules live in the separate `S-` repository. This website only describes those capabilities.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation and build

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run build` validates the legal documents, produces the static site in `out/`, and verifies that the exported landing, support, privacy, and terms pages contain their required content.

Because the project uses `output: 'export'`, preview the generated `out/` directory with a static file server rather than `next start`, for example:

```bash
npx serve out
```

## Landing design system

The two themes mirror the current mobile application tokens:

- Light: warm white `#FFFBF5`, ink `#1C1917`, peach `#FFB088`, blue `#89CFF0`
- Dark: deep navy `#0D1117`, raised surface `#161B22`, gold `#FFE5A0`, blue `#7DD3FC`

The selected theme is stored as `shuuty-theme` and applied before first paint. The language is stored in the `lang` cookie.

Current product captures live under `public/images/product/canonical-flow-2026/`
and are registered with source hashes in `content/product-media.json`. The PNG
files are byte-for-byte canonical PL/EN captures selected for the website - never
generated or reconstructed UI. The browser receives deterministic half-size WebP
derivatives whose output hash, byte length, encoder and source hash are recorded
separately. The complete EN set is 494,680 bytes and the PL set is 489,762 bytes.

`npm run generate:media-derivatives` is an explicit asset-maintenance step. A
normal build never regenerates product media; it validates checked-in source and
derivative bytes, provenance, locale isolation and the 200 KiB per-asset / 600 KiB
per-locale budgets.

They remain an explicitly unbound preview. The accepted Golden Relay package will
be integrated through the stable media manifest after the complete 50-image
no-publish artifact passes its ledger and QA gates. See
`docs/PRODUCT-MEDIA-INTEGRATION.md`. Never import a partial `exports/final`
directory or recreate a missing product screen.

## Deployment

The repository is configured for static hosting, including the existing GitHub Pages workflow.

© 2026 Shuuty. All rights reserved.
