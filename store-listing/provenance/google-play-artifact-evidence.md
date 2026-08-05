# Google Play artifact permission evidence

Evidence date: 2026-08-05

Package: `com.shuuty.app`

## Collection boundary

The Play-generated universal APKs were retrieved through read-only Google Play Developer API operations. No edit was committed, no binary was uploaded or promoted, no track was changed, and no advertising or privacy declaration was modified.

Credentials, private keys, access tokens, signed URLs, temporary download URLs, and local credential paths are intentionally excluded.

## Artifact findings

| Track | Version | Artifact | SHA-256 | `AD_ID` permissions | `ACCESS_ADSERVICES_*` permissions | `android.adservices.AD_SERVICES_CONFIG` property | Finding |
|---|---|---|---|---:|---:|---|---|
| production | `versionCode 27`, `versionName 2.0.4` | Play-generated universal APK | `161f2a9115d5d8a4cc26984315b44c5371556ce50acfad715c4e29403d41f6f5` | 1 | 4 | Not recorded in this evidence item | Concrete blocker while the Play Console declaration says the app does not use Advertising ID |
| internal | `versionCode 105`, `versionName 2.10.11` | Play-generated universal APK | `df9406aeb3e2b52d6f887d3e1688aa2249a74934eee22286b58ec17c2ae7dbf3` | 0 | 0 | Present | Permission-clean, but not the final clean target because the property remains |

The EAS AAB corresponding to internal `versionCode 105` has SHA-256 `783430955ceda954ab04c2542a62a316a3a4453a6688f0bcd1d9500e0e0ea5e2`.

## Release gate

- Production `versionCode 27` explains the Advertising ID validation failure and must be replaced through an explicitly approved release action before the listing edit can validate against the current declaration.
- Internal `versionCode 105` proves the Advertising ID and AdServices permissions are absent from that artifact, but its residual `AD_SERVICES_CONFIG` property keeps it from being the final target.
- The next signed candidate, expected as `versionCode 106` or higher, must contain no `AD_ID`, no `ACCESS_ADSERVICES_*`, and no unnecessary `android.adservices.AD_SERVICES_CONFIG` property.
- Verify both the signed AAB and the Play-generated artifact before preparing another listing dry-run.
- Changing the Advertising ID declaration, uploading or promoting a binary, replacing a release, moving tracks, or calling `edits.commit` remains prohibited without an exact approved change set.
