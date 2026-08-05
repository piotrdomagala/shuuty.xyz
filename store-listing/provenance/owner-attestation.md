# Shuuty store-demo media owner attestation

Record ID: `shuuty-media-owner-attestation-2026-08-05`

Status: `owner-attested`

Statement date: `2026-08-05`

## Recorded statement

On 2026-08-05, the Shuuty product owner directly confirmed that the rights to the 15 photographs listed in `media-assets.json` belong to the owner and Shuuty. This record preserves that confirmation as the copyright and marketing-use basis for the store-listing project.

The asserted rights holder is `Shuuty / Shuuty product owner`. The source of the attestation is a direct statement by the product owner in the project conversation. Any acquisition or transfer documents underlying that ownership statement were not separately supplied to this project record.

## Authorized project scope

The owner attestation authorizes use of the listed media in:

- Apple App Store product pages and related store assets.
- Google Play product pages and related store assets.
- `shuuty.xyz` and `shuuty.com`.
- Shuuty promotional and launch materials.

The recorded scope includes reproduction, resizing, cropping, localization, compositing inside product screenshots, and inclusion in store feature graphics or other Shuuty promotional layouts. Territory and duration were not separately specified in the source statement.

## Identity and chain of custody

- Canonical originals: `S-/backend/scripts/assets/store-demo/`.
- Machine-readable register: `store-listing/provenance/media-assets.json`.
- Identity method: exact byte length plus SHA-256 for every original.
- Derivation: the originals are loaded by the isolated `store-demo` fixture, displayed in the Shuuty product UI, and captured into the localized store screenshots.
- Screenshot and render lineage: `store-listing/capture-manifest.json`, `store-listing/studio/render-manifest.json`, and `store-listing/delivery-ledger.json`.

The source photographs are not duplicated into the website repository. Their hashes bind this record to the originals in the `S-` product repository.

## People and likeness status

Copyright ownership and permission concerning a person's likeness are tracked separately. This attestation does not make an unrecorded claim about model releases.

- 13 assets visibly contain one or more people. Their likeness-release status is `to-be-confirmed` until the owner supplies or confirms the applicable basis.
- 2 assets contain no visible person. Their likeness-release status is `not-applicable`.

The per-file status is recorded in `media-assets.json`. A release marked `to-be-confirmed` is a documentation state - it does not assert that permission is absent or present.

## Record integrity

This file is a project evidence record of the owner's direct statement. Any replacement or modification of a source image must receive a new hash entry and a fresh rights review before the affected store or website assets are packaged.
