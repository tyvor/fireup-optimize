# Publishing FireUp 0.4.0

Release materials are prepared here. The public GitHub repository and a Mozilla listing are separate publication steps; an unsigned package is not a signed Firefox release.

## GitHub

Repository: [tyvor/fireup-optimize](https://github.com/tyvor/fireup-optimize). Source code uses the author-approved MIT license. Issues are enabled, with bug and feature forms in `.github/ISSUE_TEMPLATE/`. The check workflow runs Node tests and packaging; it does not publish releases automatically.

Only source, tests, documentation and demonstration screenshots belong in the repository. Keep personal backups, exports, browser profiles, logs, working directories and generated unsigned packages out of Git.

Use these listing addresses:

- Homepage: https://github.com/tyvor/fireup-optimize
- Support website: https://github.com/tyvor/fireup-optimize/issues
- Privacy notice: https://github.com/tyvor/fireup-optimize/blob/main/PRIVACY.md

Add a real Mozilla installation link to the README only after the listing exists.

## Mozilla

1. Sign in to Add-ons Developer Hub. The author reviews and accepts any developer agreement.
2. Select **Submit a New Add-on**, then **On this site** for public listing.
3. Upload `FireUp-0.4.0-unsigned.xpi`, produced by Build.ps1. If this add-on ID is already registered, update that existing add-on instead of creating a duplicate. Use a new version number when the form requires one.
4. Fix validator errors and review warnings. Select verified desktop platforms; do not claim Android support. The minimum Firefox version is 140.
5. If source is requested, provide `FireUp-0.4.0-reviewer-source.zip` from the release-preparation bundle. The code is readable and has no transpilation or build transformation. A public GitHub repository does not replace a requested source upload.
6. Fill the listing using [AMO-LISTING.en.md](AMO-LISTING.en.md), select MIT, add the GitHub addresses and screenshots with their captions. The privacy notice is in [PRIVACY.md](../PRIVACY.md).
7. Paste [AMO-REVIEWER-NOTES.en.md](AMO-REVIEWER-NOTES.en.md) into reviewer notes. Check the author's details, then submit.
8. After signing and publication, test ordinary installation from the listing and add its actual URL to the README. Do not present the unsigned package as a permanent installer.

Upload subsequent versions on the existing add-on page. Preserve `fireup@local.extension` for that add-on. A GitHub commit alone does not update users' installed extensions; each release must also be submitted to Mozilla.

## Explain to users

Unsaved forms, editors and silent playback need manual protection because FireUp does not read page contents. Tab metadata and candidate URLs are processed locally. Settings exports include excluded domains and language preferences, not open-tab URLs. Issues are public and should not contain personal profiles, cookies or tokens. Memory savings vary by page and Firefox.

The interface supports English and Russian. Browser default follows Firefox's interface language with English fallback; a saved manual choice overrides it. New exports use format 2; old format 1 exports remain importable.

## Official references

- [Submitting an add-on](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
- [Mozilla add-on policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)
- [Signing and distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)

References checked October 24, 2026. Mozilla determines review outcomes and timing.
