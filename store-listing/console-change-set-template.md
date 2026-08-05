# Shuuty store console change set

Use one document per remote mutation session. Complete the backup and comparison before changing App Store Connect or Google Play.

## Session

- Date and time:
- Operator:
- Store:
- App identifier:
- Version or track:
- Mode: draft only
- Product source commit:
- Store-listing source commit:

## Backup record

- Backup directory or artifact:
- Backup timestamp:
- Locales captured:
- Text fields captured:
- Asset inventory, order, and hashes captured:
- Active tracks or selected build captured:
- Existing pending drafts captured:
- Credentials and signed URLs excluded: yes / no

## Existing pending work

| Store surface | Current pending state | Known owner | Safe to continue |
|---|---|---|---|
| | | | |

Stop before mutation if any pending state has unknown ownership.

## Current value -> proposed value

| Store | Version or track | Locale | Field or asset position | Current value | Proposed value | Reason | Validation |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

For images, include filename, dimensions, color mode, alpha state, byte size, checksum, and exact carousel position.

## Release correlation - complete only when a clean build is involved

- PL `Co nowego` source and validation result:
- EN `What's New` source and validation result:
- Android version name and `versionCode`:
- Android AAB SHA-256:
- Android upload method: manual / not applicable
- iOS marketing version and build number:
- iOS EAS build ID:
- iOS upload method: EAS / not applicable
- Both binaries built from the recorded product commit: yes / no

Recording an artifact here does not authorize uploading, selecting, promoting, or publishing it.

## Prohibited without separate explicit approval

- Google Play `edits.commit`.
- App Review submission or App Store release.
- Binary upload, build selection, track promotion, release deactivation, rollout, or phased release.
- Prices, subscriptions, products, distribution, ratings, policies, advertising declarations, Data safety, App Privacy, or other compliance answers.

## Approval

- Exact change set presented to owner:
- Explicit draft-mutation approval received:
- Publication approval received: no

## Post-change read-back

- Remote state read back:
- Values match the approved change set:
- Unexpected differences:
- Temporary Google edit deleted without commit:
- Submission or publication performed: no
