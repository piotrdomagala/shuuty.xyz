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

The four active screenshots already existed on `origin/main` at
`7e3c0bdbf40cb7c8646de9a0be42648811e02638`. Their bytes are unchanged. Their
extensions were corrected from `.png` to `.jpg` because the files are JPEGs.

| Placement | Public path | SHA-256 | Locale | Theme |
| --- | --- | --- | --- | --- |
| Creation entry | `/images/app/create-menu.jpg` | `90e39996d591e1b3233a3721ede64b9c3cb26f30ae8c79346b346e1bf0260b8c` | EN | Light |
| Profile settings | `/images/app/profile-settings.jpg` | `24678a8a252fec0e4b79499b6371b8373bb9948563cee60e326a3298d586cc5c` | EN | Light |
| Nearby groups | `/images/app/discover-groups.jpg` | `5da99fc4ff2ac8d1f97e7e9c232d1410c422e4fa5b7c07c4b8dbe59acd16c2cf` | EN | Light |
| Nearby meetings | `/images/app/discover-meetings.jpg` | `0b3056a282afa7065358d315408d7eda1755b7533d10cfe3388561d136774d3f` | EN | Light |

These are temporary website-baseline assets, not the final Golden Relay set.
They do not provide complete PL/EN or Light/Dark coverage and have no binding to
Android 106 or iOS 143. This limitation stays explicit in the manifest.

## Final package gate

Do not import anything until one accepted no-publish workflow after PR #438 has
produced and verified all three artifacts:

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

## Read-only candidate selection

The current store materials were reviewed only as visual and provenance references.
They are not copied into this branch and remain ineligible until the accepted
no-publish artifact exists. The clean product captures fit the website phone frames
better than the store boards, which already contain their own Golden Relay headline
and marketing copy.

The provisional per-locale selection is deliberately mixed across both platforms:

| Slot | Platform and device | Relative source entry |
| --- | --- | --- |
| `voice-input` | iOS, iPhone 6.9 | `provenance/ios-captures/source/iphone-6.9/<locale>/voice-input-dark-<lang>.png` |
| `assignee` | Android phone | `provenance/android-captures/<locale>/<lang>-02-assignee-<person>-dark/voice-assignee-<person>-dark-<lang>.png` |
| `delegated-task` | iOS, iPhone 6.9 | `provenance/ios-captures/source/iphone-6.9/<locale>/delegated-task-detail-dark-<lang>.png` |
| `groups` | iOS, iPhone 6.9 | `provenance/ios-captures/source/iphone-6.9/<locale>/groups-list-dark-<lang>.png` |
| `group-offer-gallery` | iOS, iPhone 6.9 | `provenance/ios-captures/source/iphone-6.9/<locale>/product-group-gallery-dark-<lang>.png` |
| `modules` | iOS, iPhone 6.9 | `provenance/ios-captures/source/iphone-6.9/<locale>/group-settings-modules-light-<lang>.png` |
| `bookings` | Android phone | `provenance/android-captures/<locale>/<lang>-07-booking-light/booking-calendar-populated-light-<lang>.png` |
| `nearby` | Android phone | `provenance/android-captures/<locale>/<lang>-08-discover-<city>-light/discover-map-light-<lang>.png` |

Here `<locale>` is `en-US` or `pl-PL`, `<lang>` is `en` or `pl`, and `<person>`
is `alex` or `olek`, and `<city>` is `london` or `warsaw`. These are paths inside
the current package structure, not paths to a working export directory. This mapping
preserves the same 1-8 flow, both languages, Dark and Light product states, and
visible iOS and Android representation.

The current Android PL group list contains fallback initials instead of the verified
avatars. The Android module screen has a line crossing the final task row, and the
Android group-gallery capture has a more severe top crop. Those variants are not in
the provisional selection. iPad captures stay in provenance but cannot be selected
for the existing phone-shaped placements. Final hashes and filenames must be read
again from the accepted artifact - this table is not an artifact binding.

## Mechanical import

1. Copy the verified subset byte-for-byte to stable paths such as
   `public/images/product/golden-relay-2026/pl-PL/01-voice-input.png` and the EN
   equivalent.
2. Add the imported records and relative `sourceArtifactEntry` values to the
   build-only `content/product-media.json`.
3. Change `finalArtifactContract.status` to `approved-no-publish-imported` and
   fill `artifactBinding`.
4. Add separate `placementSets` for `en` and `pl`, bind every semantic placement
   to an asset of the matching locale, and update `placementSelection`. The
   resolver constructs the three-screen hero from `voiceInput`, `assignee` and
   `delegatedTask`; layout components require no rewrite.
5. Run `npm run sync:media-runtime`. Commit the deterministic runtime projection;
   never add provenance fields to it.
6. Run `npm run validate:media`, `npm test`, `npm run typecheck`, `npm run lint`
   and `npm run build`.
7. Repeat browser QA for PL/EN, Light/Dark and desktop/tablet/mobile.

The current schema deliberately validates each selected import as an exact
byte-for-byte copy: `sourceSha256` must equal the public asset `sha256`, every
`sourceArtifactEntry` must be unique, and every semantic slot must use its matching
localized alt key. A later WebP or AVIF derivative requires an explicit schema and
validator extension that records both source and output hashes before a selected
asset may differ from its accepted source. Missing screens must never be generated
or reconstructed.

PR #9 remains an archive. Its raster files and ignored `exports` directories are
not inputs to this contract. Only its semantic slot vocabulary informed the
stable names above.
