# Shuuty store upload checklist

## Readiness

- App Store Connect read-only access: verified on 2026-08-05 for Apple ID `6670202422` and bundle `com.shuuty.app`.
- Current public iOS version: `2.0.4`; the release metadata and current TestFlight line use `2.2.1`.
- Current highest iOS build: `133`, uploaded 2026-07-31, processing state `VALID`, not expired, minimum iOS `15.1`.
- If build `133` is not the final release binary, the replacement build number must be at least `134`.
- No App Store Connect version, localization, screenshot, build selection, submission, or publication has been changed by this workspace.
- Google Play Developer API access: verified on 2026-08-05 for package `com.shuuty.app`.
- Current Google Play tracks: production has completed `versionCode 27` plus an empty pre-existing draft; internal has completed `versionCode 105`; beta and alpha are empty.
- Current EAS remote Android version code: `105`; the next production build with configured remote `autoIncrement` must be verified as `106` or higher.
- Google Play listing dry-run: both PL and EN metadata plus 20 image uploads were accepted inside a temporary edit, but `edits.validate` stopped on an Advertising ID declaration mismatch. The edit was deleted without commit and the live listing did not change.
- Android Advertising ID evidence: the Play-generated production `versionCode 27` APK contains one `AD_ID` and four `ACCESS_ADSERVICES_*` permissions. It is the concrete blocker while the console declaration remains `No`.
- Internal `versionCode 105` is permission-clean with zero `AD_ID` and zero `ACCESS_ADSERVICES_*`, but its Play-generated APK still contains the `android.adservices.AD_SERVICES_CONFIG` property. The full hash-bound evidence is in `provenance/google-play-artifact-evidence.md`.
- Android release gate: the current source and merged release manifest remove the permissions and property, but the final signed AAB `106+` and its Play-generated artifact must both be checked before the declaration remains `No`.
- Google Play creative pack: complete visual candidate, upload blocked by the final gates below.
- App Store creative pack: complete visual candidate.
- App Store native iOS parity: required before upload because the current Windows host cannot run an iOS Simulator.
- App Store device scope: resolve `supportsTablet: true` and `TARGETED_DEVICE_FAMILY = 1,2` by either supplying 13-inch iPad screenshots or returning the release to iPhone-only.
- App Store privacy URL currently saved in the live listing, `https://shuuty.com/documents/privacy`, returns `404`; replace it with `https://shuuty.com/privacy/` in the new listing.
- Media copyright: owner-attested for all 15 avatars, covers, and gallery images in `provenance/media-assets.json`.
- People and likeness: the product owner authorized Shuuty use of every likeness visible in 13 registered images on 2026-08-05; the 2 person-free images are `not-applicable`. This records permission, not a real-person model release or independently verified generation method.
- Native icon parity: verify the iOS AppIcon and Android adaptive launcher icon against the approved gold `S` master.
- Store publication, release binaries, pricing, privacy declarations, and legal approval: manual owner actions.

## Remote change control

- Working draft content may be created or modified only after a complete timestamped backup of the current store state.
- Before every remote mutation, prepare `current value -> proposed value` using `console-change-set-template.md`, grouped by store, version, locale, field, and asset position.
- Wait for explicit approval of that exact change set. A general instruction to continue is not approval to commit, submit, publish, promote a binary, or alter release state.
- Google Play temporary edits used for inventory or dry-runs must be deleted without commit. Never call `edits.commit` without explicit approval.
- Never use the Play API while another person is editing the same app in Play Console. First resolve the pre-existing empty production draft and any other pending console work.
- Never submit to App Review, release or schedule an App Store version, select a build, enable phased release, or publish without explicit approval.
- Never change prices, subscriptions, products, distribution, ratings, policies, advertising declarations, Data safety, App Privacy, legal declarations, or compliance answers without explicit approval.
- Backups and reports must not contain credentials, private keys, access tokens, or signed download URLs.
- After any approved draft mutation, read the result back through the store API and prepare a post-change report. Publication remains a separate approval gate.

## Asset order

Use the same order for both stores and both locales:

1. Voice input.
2. Named assignee.
3. Delegated task.
4. Work, community, and offers.
5. Rich product or service presentation.
6. Group modules and settings.
7. Booking calendar.
8. Nearby discovery.

Do not mix locale folders. Polish screenshots use `pl-PL`; English screenshots use `en-US`.

## Release notes and build correlation

1. Before every clean Android or iOS production build, run `corepack yarn release:notes:draft` in the product repository and hand-author the matching PL and EN release entry.
2. Run `corepack yarn release:notes:validate` before starting either production build.
3. Record the common source commit, marketing version, intended store release, and localized `Co nowego` / `What's New` text in the release change set.
4. Treat the manually uploaded Google Play AAB and the iOS EAS build as separate artifacts. Record the Android `versionCode`, AAB SHA-256, EAS build ID if applicable, iOS build number, and iOS EAS build ID.
5. After both actual build numbers are known, run `corepack yarn release:notes:finalize --android-build X --ios-build Y` and verify the generated in-app history matches the localized store release notes.
6. If only one platform is built first, follow the repository's documented placeholder procedure and re-finalize as soon as the second real build number exists.
7. Do not infer that an EAS build was submitted to a store. Build, upload, build selection, submission, rollout, and publication are separate recorded approval gates.

## App Store Connect

1. Create or open the editable iOS version `2.2.1` and keep release control manual.
2. Confirm whether valid TestFlight build `133` is the intended release binary. If another build is needed, use build `134` or higher.
3. Confirm the selected build uses the current opaque 1024x1024 gold `S` in its AppIcon asset catalog.
4. Run the native iOS parity check. The current App Store compositions use Android source captures and must not be uploaded as final iOS screenshots.
5. Keep the declared iPad support and capture native 13-inch iPad sets in both PL and EN, unless product engineering intentionally ships a new iPhone-only binary.
6. Add shared App Info `en-US`, keep Polish as `pl`, and replace the broken privacy URL with `https://shuuty.com/privacy/`.
7. Open the Polish version localization and upload 8 native files in numeric order after the iOS recapture.
8. Open the en-US version localization and upload 8 native files in numeric order after the iOS recapture.
9. Copy the matching fields from `metadata/pl-PL.json` and `metadata/en-US.json`.
10. Verify name, subtitle, promotional text, keywords, description, What's New, support URL, marketing URL, privacy URL, and terms URL.
11. Review category, age rating, app privacy answers, in-app purchases, pricing, countries, export compliance, DSA trader status, review notes, and support contact.
12. Preview the public product page in both locales before submission.

Reference icon for binary verification: `assets/store/app-store/app-icon-1024.png`.

Apple references:

- https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/
- https://developer.apple.com/help/app-store-connect/manage-app-information/localize-app-information/
- https://developer.apple.com/help/app-store-connect/manage-app-information/add-an-app-icon/

## Google Play Console

1. Back up the complete current Play state and resolve ownership of the empty production draft before any mutation.
2. Review `provenance/google-play-artifact-evidence.md`: production `27` is confirmed as the permission blocker, while internal `105` has no Advertising ID or AdServices permissions but retains `AD_SERVICES_CONFIG`.
3. Build the final signed production AAB from the current source and verify its actual `versionCode` is `106` or higher.
4. Inspect the final AAB manifest and the Play-generated manifest. Require no `AD_ID`, no `ACCESS_ADSERVICES_*`, and no unnecessary `android.adservices.AD_SERVICES_CONFIG` property.
5. Test the clean artifact without changing production. Replacing or deactivating any active artifact requires a separate approved release change set.
6. After an explicitly approved release action replaces the production blocker and every retained active artifact is consistent with the Advertising ID declaration, run a fresh listing dry-run and require `edits.validate = 200`. Delete that edit without commit.
7. Prepare and approve the exact `current value -> proposed value` listing change set.
8. Open Google Play Console - Shuuty - Grow users - Store presence - Main store listing.
9. Upload `assets/store/google-play/app-icon-512.png` as the app icon.
10. In `pl-PL`, upload `exports/final/google-play/pl-PL/feature/product-proof.png` as the feature graphic.
11. In `en-US`, upload `exports/final/google-play/en-US/feature/product-proof.png` as the feature graphic.
12. In `pl-PL`, upload the 8 files from `exports/final/google-play/pl-PL/phone/` in numeric order.
13. In `en-US`, upload the 8 files from `exports/final/google-play/en-US/phone/` in numeric order.
14. Copy the matching app name, short description, full description, and release notes from the metadata JSON files.
15. Enter the matching localized feature and screenshot alt text from `capture-manifest.json` where the console offers the field.
16. Review app category, tags, contact details, privacy policy, ads declaration, app access, target audience, content rating, data safety, in-app products, countries, pricing, and the required account-deletion URL. Any declaration change requires separate explicit approval.
17. Preview both localized listings and check the first three screenshots at thumbnail size.
18. Do not call `edits.commit` until the owner explicitly approves the exact validated edit.

Google references:

- https://support.google.com/googleplay/android-developer/answer/9866151?hl=en
- https://support.google.com/googleplay/android-developer/answer/9844778?hl=en
- https://developer.android.com/distribute/google-play/resources/icon-design-specifications

## Final safety check

- No screenshot exposes an email, password, keyboard, debug overlay, private address, or live private position.
- PL screens contain Polish UI and Polish demo data.
- EN screens contain English UI and English demo data.
- The first three screens show voice - assignee - delegated task.
- The calendar and booking screens appear later in the story.
- Icon, screenshots, feature graphic, metadata, privacy declarations, and release binary describe the same version.
- Every visible avatar, cover, and gallery image matches the hash-bound provenance register.
- Every asset containing a person retains the recorded owner-authorized likeness basis before public upload.
- No upload or submission happens before explicit product-owner approval.
