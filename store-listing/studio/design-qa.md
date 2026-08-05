# Golden Relay final design QA

## Result

The Golden Relay phone matrix is complete for Google Play and is a complete visual candidate for App Store.

- 8 ordered screenshots per locale and platform.
- 32 phone renders in total.
- Two localized 1024x500 Google Play feature graphics - PL and EN.
- One real transparent Golden Relay raster shared by all phone compositions.
- Real app captures only - no CSS, div, glyph, or SVG substitute for visible artwork.

## Final sequence

1. Voice input - Dark.
2. Olek or Alex selected as the assignee - Dark.
3. Delegated task detail and discussion - Dark.
4. Multi-purpose groups list - Dark.
5. Rich product or service group with gallery, public location, and interests - Dark.
6. Group settings and modules - Light.
7. Populated booking calendar - Light.
8. Discover map in Warsaw or London - Light.

## Visual comparison

The selected reference and every rendered sequence were placed in the same comparison boards for direct review.

The review found and corrected:

- the Golden Relay step overlapping a long headline;
- Polish voice frames displaying the `EN` speech-language chip;
- inconsistent placement between the 1080x1920 and 1320x2868 canvases.
- generic capability headlines that did not explain what Shuuty actually shows;
- the abstract feature-graphic node and check, now replaced with the real voice, assignee, and delegated-task flow.

The corrected boards cover Google Play and App Store in both `pl-PL` and `en-US`.

## Technical verification

- Studio tests: 12/12 passed.
- Capture bundles: 16/16 validated.
- Phone renders: 32/32 RGB PNG without alpha.
- Feature graphics: 2/2 at 1024x500, RGB PNG without alpha.
- Apple icon: 1024x1024 RGB PNG without alpha.
- Google Play icon: 512x512 PNG, fully opaque, below 1 MB.
- Metadata validation: passed for both locales.
- Mobile typecheck and targeted store-listing tests: passed.
- Backend fixture safety and QA: passed, including 1682 backend tests.

## Remaining publication gate

Status: `BLOCK_UPLOAD` while local work continues.

The creative candidates pass their technical checks. Copyright provenance is owner-attested and hash-bound for all 15 store-demo images, and the product owner has authorized Shuuty use of the likenesses visible in 13 of them. The authorization does not claim a real-person model release or independently verify the reported generation method. Before any console upload, confirm native launcher-icon parity. App Store also needs one native iOS parity check and a decision about the current iPad declaration because the Windows host has no `xcrun` or iOS Simulator. The current iPhone canvases use the same cross-platform product UI and are suitable for design review, but they should not be called native iOS captures until that check is complete.

Manual App Store Connect and Play Console fields, store credentials, release binaries, privacy declarations, age rating, pricing, countries, and final submission remain outside this renderer.
