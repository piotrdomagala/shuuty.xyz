# Shuuty store listing 2026

This directory is the source of truth for the official App Store and Google Play
relaunch. It is intentionally separate from the mobile product logic in `S-`.

## Scope

- Polish and English metadata for both stores.
- A shared, privacy-safe capture manifest for iPhone, iPad, Android phone, and
  Android tablet.
- The creative brief for screenshots, the Google Play feature graphic, and the
  optional preview video.
- Export validation before anything is uploaded to a store.

The actual product UI, AppIcon, and launcher icons remain owned by `S-`. Final
approved and anonymised screenshots may be copied here; working captures that
contain personal data must never be committed.

## Current status

- Metadata: first production draft, ready for product/legal review.
- Capture plan: ready.
- Visual direction: ready for three concept explorations once clean source
  captures are available.
- Final screenshot and video exports: blocked on clean iPhone/iPad captures and
  a deterministic demo account.

## Validation

Run:

```bash
npm run validate:store-listing
```

The validator checks Apple and Google character limits, required URLs, locale
coverage, screenshot counts, and export dimensions declared in the manifest.

## Publication boundary

These files can be uploaded manually in App Store Connect and Play Console. A
future automated uploader must use narrowly scoped credentials supplied through
the local environment; credentials must never be committed here.
