# Feedback pass QA - 2026-08-23

## Scope and result

This pass addresses the owner review of the refreshed Shuuty landing page on
`agent/shuuty-xyz-refresh-2026`. It changes only the website worktree. It does
not modify the app repository, the store artifact worktree, PR #438, Run 12,
store listings, deployment state or release state.

Independent final review status: **READY - no open P1-P3 findings**.

## Product and visual changes

- Replaced the awkward task mechanism label with `From thought to task - three
  steps.` / `Od myśli do zadania - trzy kroki.` and removed the phrase
  `product flow` from the supporting copy.
- The hero now uses three visibly distinct verified captures: voice input,
  delegated task and Discover map.
- Added one reusable `ProductDeviceFrame` system for iOS phones, Android phones
  and iPad captures. The bezel sits outside the source image and does not crop,
  stretch or recreate product UI.
- The Tasks chapter keeps the exact Golden Relay asset and adds a one-shot
  720 ms resonance tied to the active task step. The mobile resonance stays
  centred behind the active card. Reduced motion disables it.
- Groups, Discover and Product depth use the same manifest-driven frame system.
- Removed the standalone Flow section and its unused PL/EN content and CSS.
- Reduced FAQ from seven repeated questions to four focused questions and
  optically centred the expand/collapse glyphs.
- Language switching preserves the same semantic section and viewport offset.
  The restore is instant even though normal anchor navigation remains smooth.
- Mobile dock targets use one 92 px sticky-header offset, keep 46 x 46 px targets,
  stay reachable in sequential keyboard navigation while visually hidden,
  reveal on keyboard focus, stay visible during pointer interaction, and hide after a
  completed navigation.
- Hash targets skip the reveal transform so first-time anchor navigation does
  not drift by 28 px after the reveal finishes.
- The social preview stays a byte-identical public asset, while its canonical
  Open Graph and Twitter URLs remain fixed to `https://shuuty.com` in Vercel
  preview and production builds.

## Routes

Changed:

- `/`
- `/pl/`

Built and revalidated without content changes:

- `/privacy`, `/pl/privacy`
- `/terms`, `/pl/terms`
- `/support`, `/pl/support`
- `/auth/reset-password`
- `/auth/verify`, `/verify`

PR #11 remains a separate clean draft for `/account-deletion`,
`/pl/account-deletion` and store-facing legal aliases. This pass does not copy,
overwrite or merge its changes. A read-only `git merge-tree` check found four
overlapping files but no conflict markers, so the changes currently auto-merge.
The merge order still needs to be chosen explicitly before either PR reaches
`main`.

## Browser and interaction QA

Direct Playwright with Microsoft Edge was run against the production static
export at `http://127.0.0.1:4174`.

| Check | Result |
| --- | --- |
| Widths | 1440, 1024, 834, 768, 540, 430, 390, 360 and 320 px |
| Horizontal overflow | 0 px across the matrix, including 200% text stress |
| PL / EN switch | Semantic anchor delta 0 px at 200 ms and 1.2 s |
| Hash preservation | Path, hash, language and theme preserved |
| Mobile dock | `#groups` lands at 91.7 px; all targets 46 x 46 px |
| Mobile dock focus | Hidden dock enters the Tab order as `#tasks`, `#groups`, `#discover`, `#download`, then reveals and stays interactive |
| Hero keyboard | ArrowLeft / ArrowRight change state and move focus |
| Tasks keyboard | Arrow keys change the active task step and move focus |
| Golden Relay | Retriggers on hover, focus and selection; mobile clip aligned |
| Reduced motion | Automatic sequence and resonance animation disabled |
| FAQ | Keyboard operation passes; glyph centre delta 0 px |
| Product images | All load; 12 framed placements per locale; no crop or overflow |
| Console | No page errors or console errors in the final interaction pass |

Representative final evidence:

- [Desktop hero](feedback-pass-2026-08-23/final-desktop-1440-pl-light-hero.png)
- [Desktop Tasks](feedback-pass-2026-08-23/final-desktop-1440-pl-light-tasks.png)
- [Desktop FAQ](feedback-pass-2026-08-23/final-desktop-1440-pl-light-faq.png)
- [Tablet Groups](feedback-pass-2026-08-23/final-tablet-834-pl-light-groups.png)
- [Tablet Discover](feedback-pass-2026-08-23/final-tablet-834-pl-light-discover.png)
- [Mobile Tasks Dark](feedback-pass-2026-08-23/final-mobile-390-pl-dark-tasks.png)
- [Mobile group frames](feedback-pass-2026-08-23/final-mobile-390-pl-light-group-frames.png)
- [Mobile Discover frames](feedback-pass-2026-08-23/final-mobile-390-pl-light-discover-frames.png)
- [Mobile FAQ 320](feedback-pass-2026-08-23/final-mobile-320-pl-light-faq.png)

## Verification

- `npm run lint` - pass, no warnings
- `npm run typecheck` - pass
- `npm test` - pass, 12/12, including hidden mobile dock keyboard reachability
- `npm run validate:legal` - pass
- `npm run validate:media` - pass
- `npm run build` - pass, 16/16 static pages plus the public social preview asset
- postbuild localization and static export validation - pass
- `git diff --check` - pass

The only informational build message is the existing `caniuse-lite` freshness
notice. It does not affect the build result.

## Asset inventory and provenance

No product raster was generated, recoloured or reconstructed in this pass.
The existing social preview PNG was relocated byte-for-byte from file-based
Next metadata to `public/opengraph-image.png` so preview builds cannot replace
its canonical production URL with a branch URL.

The page uses eight verified semantic captures in each locale through
`content/product-media.json` and its public runtime projection:

| Slot | Device | Capture theme |
| --- | --- | --- |
| Voice input | iPhone | Dark |
| Assignee | Android phone | Dark |
| Delegated task | iPhone | Dark |
| Groups | iPhone | Dark |
| Group offer gallery | iPad | Dark |
| Modules | iPhone | Light |
| Bookings | Android phone | Light |
| Nearby / map | Android phone | Light |

All 16 source PNGs and all 16 deterministic WebP derivatives match the checked-in
manifest hashes. Device, platform and capture theme now flow mechanically from
the validated source manifest into the public runtime projection. The Golden
Relay uses the exact owner-attested
`public/images/brand/golden-relay-flow.png` asset.

## Known boundary for the final store ZIP

The current manifest intentionally remains an owner-attested canonical source
preview with `artifactBinding: null`.

No-publish Run `32493263971` is complete and exposes 50/50 images, but binds
Android 106 and iOS 143. Current production builds are Android 107 and iOS 144.
The intervening product changes do not alter the Tasks, Groups or Maps captures,
but binding that run as the final website package still requires explicit owner
acceptance and verification of the package, ledger and QA artifact.

After acceptance, integration is mechanical:

1. Verify the three artifact digests and internal ledger hashes.
2. Replace only source entries whose accepted hash differs.
3. Fill `artifactBinding` and set the approved no-publish status.
4. Regenerate deterministic derivatives and the runtime projection.
5. Repeat media validation, tests, production build and the browser matrix.

Until then, the page deliberately keeps genuine Dark task/group captures in the
Light website theme because equivalent approved Light captures do not exist.
It does not fake those missing variants.

## Release state

Prepared for PR review only. No deployment, merge, store mutation, app build or
store capture was performed.
