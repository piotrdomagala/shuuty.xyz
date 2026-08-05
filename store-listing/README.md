# Shuuty store listing 2026

This directory is the source of truth for the official App Store and Google Play refresh.
It is kept separate from the mobile product logic in `S-`.

## Current result

- Polish and en-US metadata is complete and within both stores' limits.
- The canonical source set contains 8 Polish and 8 English app captures.
- Every locale keeps its UI, people, tasks, groups, dates, locations, interests, and messages in the same language.
- The opening story is voice input - named assignee - delegated task.
- The remaining story covers flexible groups, rich sales or service presentation, group modules, bookings, and nearby discovery.
- Dark mode is used for frames 01-05 and Light mode for frames 06-08.
- The final renderer produces 16 Google Play phone images, 16 App Store iPhone 6.9-inch images, and localized PL and EN Google Play feature graphics.
- The current gold `S` is exported for both stores.

The phone and feature sets are complete visual candidates. Copyright provenance is owner-attested for all 15 store-demo photographs. Upload remains blocked until the likeness basis for the 13 images containing people, native icon parity, and the final policy declarations are confirmed. App Store also needs a native iOS parity check and an explicit decision about the currently declared iPad support because this Windows environment cannot run `xcrun` or an iOS Simulator.

## Campaign story

1. `Powiedz.` / `Say it.` - create a task naturally with voice.
2. `Deleguj.` / `Delegate it.` - select Olek or Alex as the assignee.
3. `Działajcie.` / `Get it done.` - show the delegated task and its conversation.
4. Show groups as workspaces, communities, and offers.
5. Show a detailed product or service presentation with a gallery, location, and interests.
6. Show group modules and settings.
7. Show a populated booking calendar.
8. Show local discovery in Warsaw or London.

Calendar and booking never appear as the direct result of the voice action.

## Tracked upload assets

- Apple icon: `store-listing/assets/store/app-store/app-icon-1024.png`
- Google Play icon: `store-listing/assets/store/google-play/app-icon-512.png`
- Previous abstract Google Play feature reference: `store-listing/assets/store/google-play/feature-graphic-1024x500.png`
- Localized Google Play feature outputs: `store-listing/exports/final/google-play/<locale>/feature/product-proof.png`
- Golden Relay overlay: `store-listing/assets/brand/golden-relay-transparent-2048x256.png`
- Canonical and archive-only source captures: `store-listing/assets/source/android/<locale>/`, classified in `capture-manifest.json`
- Store metadata: `store-listing/metadata/`
- Remote change-set and backup template: `store-listing/console-change-set-template.md`
- Render contract: `store-listing/studio/render-manifest.json`
- Media rights register: `store-listing/provenance/media-assets.json`
- Owner attestation: `store-listing/provenance/owner-attestation.md`
- Google Play artifact permission evidence: `store-listing/provenance/google-play-artifact-evidence.md`

Generated phone renders and the delivery ledger live under `store-listing/exports/` and `store-listing/delivery-ledger.json`. They are intentionally ignored because they are reproducible and add about 25 MB per render set.

## Delivery matrix

| Surface | Locale | Count | Dimensions |
| --- | --- | ---: | ---: |
| App Store iPhone 6.9-inch | pl-PL | 8 | 1320x2868 |
| App Store iPhone 6.9-inch | en-US | 8 | 1320x2868 |
| Google Play phone | pl-PL | 8 | 1080x1920 |
| Google Play phone | en-US | 8 | 1080x1920 |
| Google Play feature graphic | pl-PL | 1 | 1024x500 |
| Google Play feature graphic | en-US | 1 | 1024x500 |
| App Store icon | localization-independent | 1 | 1024x1024 |
| Google Play icon | localization-independent | 1 | 512x512 |

## Validation and rendering

Run:

```bash
npm run validate:store-listing
npm run store:studio:validate
node --test scripts/store-studio.test.mjs scripts/store-package.test.mjs
node scripts/store-studio.mjs render --mode=final
npm run store:package
npm run store:verify
```

The validators check metadata limits, locale coverage, ordered phone matrices per platform, real raster sources, dimensions, crop bounds, output paths, the localized product-proof feature contract, required Golden Relay artwork, RGB output, alpha rules, the complete 15-file media-rights register, the remote change-set template, and final readiness.

The final visual QA compares the selected reference and rendered sequences in the same review board. It caught and corrected both a Golden Relay overlap and the Polish voice screenshots showing an English input-language chip.

## Publication boundary

Nothing in this directory uploads, publishes, deploys, merges, or changes a live store listing. App Store Connect and Play Console still require manual review of privacy declarations, age rating, data safety, pricing, countries, support details, and the release binary.
