# Shuuty website product-media contract

## Purpose

The build-only source of truth is `content/product-media.json`. It holds verified
provenance, hashes and the artifact binding. The browser imports only the generated
`content/product-media.runtime.json` projection with `id`, `altKey`, public path and
dimensions. Components never receive local source paths, artifact identities or
source hashes. They also do not read store working directories or guess filenames
from an export. This keeps the current site operational and makes the later Golden
Relay import a bounded asset change.

The Creative Production rules for this repository are source preservation and
exact content:

- preserve the real product UI, language, theme, ordering and approved crop;
- do not recreate missing screens, labels, controls or device frames;
- do not let generated imagery alter UI text, logos, claims or product data;
- use only assets whose source and hash can be bound to the accepted package.

## Current checked-in media

The website now carries 16 byte-for-byte canonical product captures selected from
`piotrdomagala/S-` at `20a14889e2397514b7c7bcd73269508f24c8004f` - eight
`en-US` and eight `pl-PL`. They are clean product UI, not the marketing boards from
`exports/final`. Each locale deliberately includes iOS and Android plus Dark and
Light screens.

The checked-in paths are:

```text
public/images/product/canonical-flow-2026/en-US/01-voice-input.png ... 08-nearby.png
public/images/product/canonical-flow-2026/pl-PL/01-voice-input.png ... 08-nearby.png
public/images/product/canonical-flow-2026/en-US/01-voice-input.webp ... 08-nearby.webp
public/images/product/canonical-flow-2026/pl-PL/01-voice-input.webp ... 08-nearby.webp
```

`content/product-media.json` schema 2 records every source path, source SHA-256,
dimensions, locale, theme, platform, device and semantic slot. The PNG copies are
exact - no crop, compression, generated UI or content change was made. Each source
also owns a deterministic WebP record with its source SHA-256, output SHA-256,
byte length, half-size dimensions and pinned Sharp/libvips pipeline. Only WebP
paths enter the runtime manifest and static HTML.
The Golden Relay line used by the interactive task flow is also an exact copy of
`store-listing/assets/brand/golden-relay-transparent-2048x256.png`, SHA-256
`4e49a0b5b2f07f5cb934321d573173463e5ab10d986c29acf64593548956ce15`.

This checked-in set is an owner-attested website preview, not the final store
artifact binding. `artifactBinding` therefore remains `null`, and
`finalArtifactContract.status` remains `awaiting-approved-no-publish-package`.

## Final package gate

Do not promote the current source preview to the final artifact binding until one
accepted no-publish workflow after PR #438 has produced and verified all three
artifacts:

- `shuuty-store-listing-package-<sha>`;
- `shuuty-store-listing-ledger-<sha>`;
- `shuuty-store-listing-qa-<sha>`.

Validation happens outside the repository before any website copy:

1. Verify exactly 50 images - 32 App Store and 18 Google Play.
2. Verify one workflow run, head SHA and release binding across package, ledger
   and QA evidence.
3. Verify every file against its ledger SHA-256, dimensions, format, locale,
   platform, device and store position.
4. Require the release-ready gate and accepted visual QA.
5. Reject partial `exports/final`, draft or temporary paths, symlinks, additional
   files and MIME types that do not match magic bytes.
6. Keep download URLs, credentials and signed URLs outside the repository.

## Required website slots

The accepted package must provide both `pl-PL` and `en-US` for each slot:

1. `voice-input`
2. `assignee`
3. `delegated-task`
4. `groups`
5. `group-offer-gallery`
6. `modules`
7. `bookings`
8. `nearby`

Each imported build-only record adds:

- `semanticSlot`;
- a locale-neutral `altKey` whose PL and EN text lives in `homeContent.json`;
- a canonical relative entry inside the accepted package and a public path;
- source SHA-256 and public-file SHA-256;
- locale, platform, device and store position;
- width, height, media type and theme.

The manifest-level `artifactBinding` records `artifactRunId`, `artifactHeadSha`,
the canonical `shuuty-store-listing-package-<sha>.zip` basename, `packageSha256`,
`ledgerSha256` and `qaSha256`. It contains no local absolute path, credential,
remote signed URL or temporary directory.

## Canonical source selection

The clean product captures fit the website phone frames better than the store
boards, which already contain their own Golden Relay headline and marketing copy.
The current per-locale preview is deliberately mixed across both platforms:

| Slot | Platform and device | Relative source entry |
| --- | --- | --- |
| `voice-input` | iOS, iPhone 6.9 | `store-listing/assets/source/ios/iphone-6.9/<locale>/voice-input-dark-<lang>.png` |
| `assignee` | Android phone | `store-listing/assets/source/android/<locale>/voice-assignee-<person>-dark-<lang>.png` |
| `delegated-task` | iOS, iPhone 6.9 | `store-listing/assets/source/ios/iphone-6.9/<locale>/delegated-task-detail-dark-<lang>.png` |
| `groups` | iOS, iPhone 6.9 | `store-listing/assets/source/ios/iphone-6.9/<locale>/groups-list-dark-<lang>.png` |
| `group-offer-gallery` | iOS, iPad 13 | `store-listing/assets/source/ios/ipad-13/<locale>/product-group-gallery-dark-<lang>.png` |
| `modules` | iOS, iPhone 6.9 | `store-listing/assets/source/ios/iphone-6.9/<locale>/group-settings-modules-light-<lang>.png` |
| `bookings` | Android phone | `store-listing/assets/source/android/<locale>/booking-calendar-populated-light-<lang>.png` |
| `nearby` | Android phone | `store-listing/assets/source/android/<locale>/discover-map-light-<lang>.png` |

The hero intentionally uses `voice-input`, `delegated-task` and `nearby`: the
first two screens keep the voice-to-complete-task hook coherent, while the third
adds a distinct, verified map view instead of repeating the similar assignee
capture. The dedicated Tasks chapter still uses `voice-input`, `assignee` and
`delegated-task` as its complete three-step handoff.

Here `<locale>` is `en-US` or `pl-PL`, `<lang>` is `en` or `pl`, and `<person>`
is `alex` or `olek`. These are tracked source paths, never paths to a working export
directory. This mapping preserves the same 1-8 flow, both languages, Dark and Light
product states, and visible iOS and Android representation.

The current Android PL group list contains fallback initials instead of the verified
avatars. The Android module screen has a line crossing the final task row, and the
Android and iPhone group-gallery captures have a top crop. Those variants are not in
the preview selection. The clean iPad gallery capture is displayed in the dedicated
tablet-shaped slot; all phone-shaped slots continue to reject iPad assets. Final
hashes and filenames must be read again from the accepted artifact - this table is
not an artifact binding.

## Mechanical import

1. Compare every selected source hash with the accepted package ledger. Copy only
   source files that differ, byte-for-byte, to the stable PNG paths.
2. Replace preview `sourceArtifactEntry` values with accepted package entries in
   the build-only `content/product-media.json`.
3. Change `finalArtifactContract.status` to `approved-no-publish-imported` and
   fill `artifactBinding`.
4. Preserve the separate `en` and `pl` placement sets. The resolver constructs the
   hero from `voiceInput`, `delegatedTask` and `nearby`, while the task handoff uses
   `voiceInput`, `assignee` and `delegatedTask`; layout components require no rewrite.
5. Run `npm run generate:media-derivatives`, then `npm run sync:media-runtime`.
   Commit the deterministic WebP files and runtime projection; never add provenance
   fields to the runtime file. Public theme, platform and device presentation fields
   are projected mechanically from the validated source manifest.
6. Run `npm run validate:media`, `npm test`, `npm run typecheck`, `npm run lint`
   and `npm run build`.
7. Repeat browser QA for PL/EN, Light/Dark and desktop/tablet/mobile.

Schema 2 validates each selected import as an exact byte-for-byte source copy:
`sourceSha256` must equal the PNG `sha256`, every `sourceArtifactEntry` must be safe
and unique, and every semantic slot must use its matching localized alt key. Its
WebP must preserve the locale and filename stem, reproduce with Sharp 0.35.3 and
libvips 8.18.3, match its declared output hash and byte length, and remain at or
below 200 KiB. A complete locale must remain at or below 600 KiB. Missing screens
must never be generated or reconstructed.

The current derivative totals are 494,680 bytes for `en-US` and 489,762 bytes for
`pl-PL`; the largest single WebP is 160,510 bytes. A normal production build only
validates these checked-in bytes. Regeneration is deliberate and fails before
publishing files if source provenance, the pinned pipeline or either budget drifts.

PR #9 remains an archive. Its raster files and ignored `exports` directories are
not inputs to this contract. Only its semantic slot vocabulary informed the
stable names above.
