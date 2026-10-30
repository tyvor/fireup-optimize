# Publishing an update

FireUp already has a [public Mozilla listing](https://addons.mozilla.org/firefox/addon/fireup-optimize/) and a [GitHub repository](https://github.com/tyvor/fireup-optimize). An update needs to reach both: publishing source to GitHub doesn't update installed Firefox copies.

## GitHub

Commit the source, tests, documentation and demo screenshots. Keep browser profiles, personal exports, backups, logs and generated packages out of the source tree.

Run the checks described in [Testing](TESTING.md). The workflow runs them on pushes and pull requests, then packages an unsigned XPI. It doesn't sign or publish the add-on.

## Mozilla

1. Run `Build.ps1` and find `dist/FireUp-0.4.1-unsigned.xpi`.
2. Open FireUp in [Developer Hub](https://addons.mozilla.org/developers/) and upload a new version to the existing add-on. Keep `fireup@local.extension` as its ID.
3. Read the validation results. This release targets desktop Firefox 140 or newer; leave Android unselected. The local lint wrapper documents one Android-only warning.
4. If Mozilla asks for a source archive, provide `FireUp-0.4.1-reviewer-source.zip` from the prepared bundle, including the [build instructions](../BUILD-INSTRUCTIONS.md). A GitHub URL doesn't replace a requested upload.
5. Update the form using [listing text](AMO-LISTING.en.md), [reviewer notes](AMO-REVIEWER-NOTES.en.md) and the [privacy notice](../PRIVACY.md). Use MIT as the license. Check the author details before submitting.
6. After the signed update becomes available, test an ordinary installation from the listing.

Use the repository as the homepage and [GitHub Issues](https://github.com/tyvor/fireup-optimize/issues) for support. The privacy URL is [the root PRIVACY.md](https://github.com/tyvor/fireup-optimize/blob/main/PRIVACY.md).

Keep the unsaved-input warning and the explanation of local processing in the listing. Screenshots shouldn't imply measured memory savings. The interface supports English and Russian; other browser UI languages fall back to English.

For current signing rules, see [Mozilla's signing overview](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/) and [source submission guidance](https://extensionworkshop.com/documentation/publish/source-code-submission/).
