# Publishing an update

FireUp already has a [public Mozilla listing](https://addons.mozilla.org/firefox/addon/fireup-optimize/) and a [GitHub repository](https://github.com/tyvor/fireup-optimize). An update needs to reach both: publishing source to GitHub doesn't update installed Firefox copies.

## GitHub

Review the 1.0.0 changes on a branch based on `main`. Commit the source, tests, documentation and demo screenshots. Keep browser profiles, personal exports, backups, logs and generated packages out of the source tree.

Run the checks described in [Testing](TESTING.md). The workflow runs them on pushes and pull requests, then packages an unsigned XPI. After merging, create a draft release for tag `v1.0.0` targeting the commit with version 1.0.0. Link to the Mozilla listing for regular installation.

## Mozilla

Submit 1.0.0 as an update to the existing FireUp listing:

1. Follow the [build instructions](../BUILD-INSTRUCTIONS.md) and use `dist/FireUp-1.0.0-unsigned.xpi`.
2. Open FireUp in [Developer Hub](https://addons.mozilla.org/developers/) and upload a new version to the existing add-on. Keep `fireup@local.extension` as its ID.
3. Check the validation results. This release targets desktop Firefox 140 or newer. Select the desktop platform.
4. Attach the matching source ZIP with `locales/`, the generator and the build instructions. Mozilla requires the input files and instructions for generated files.
5. Use the [submission text](AMO-SUBMISSION.en.md) for version notes and a short reviewer note. The [listing text](AMO-LISTING.en.md), [detailed reviewer notes](AMO-REVIEWER-NOTES.en.md) and [privacy notice](../PRIVACY.md) are also available. Use MIT as the license. Check the author details before submitting.
6. After the signed update becomes available, test an ordinary installation from the listing.

Use the repository as the homepage and [GitHub Issues](https://github.com/tyvor/fireup-optimize/issues) for support. The privacy URL is [the root PRIVACY.md](https://github.com/tyvor/fireup-optimize/blob/main/PRIVACY.md).

Keep the unsaved-input warning and the explanation of local processing in the listing. Update the language list to English, Russian, Japanese, German, Spanish, Mexican Spanish, Portuguese and Brazilian Portuguese.

For current signing rules, see [Mozilla's signing overview](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/) and [source submission guidance](https://extensionworkshop.com/documentation/publish/source-code-submission/).
