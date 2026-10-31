# Publishing an update

FireUp is installed from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/fireup-optimize/). Mozilla signs the listed packages, and Firefox handles updates when a new version becomes available.

## Prepare the source

Update the version and changelog, then run the checks in [Testing](TESTING.md). Include the source, tests, documentation and demonstration screenshots in the commit. Generated packages, logs, backups and browser profiles belong outside the source tree.

Publish the commit to GitHub and use that same revision for the package. The GitHub workflow checks the source and builds an unsigned XPI; it doesn't sign or submit the add-on.

## Build the package

Run the command in [Build instructions](../BUILD-INSTRUCTIONS.md). The resulting file is `dist/FireUp-<version>-unsigned.xpi`.

Release and beta Firefox require a Mozilla signature for permanent installation. For development, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `extension/manifest.json`. Temporary add-ons are removed when Firefox restarts. Export settings before switching between installed and development copies, and check per-tab protection separately because it isn't included in exports.

## Create a source archive if requested

From the committed revision used for the XPI, run this in PowerShell after building:

```powershell
$fireupVersion = (Get-Content -LiteralPath ./extension/manifest.json -Raw | ConvertFrom-Json).version
git archive --format=zip --output="dist/FireUp-$fireupVersion-reviewer-source.zip" HEAD
```

This creates an archive of the committed source, including the build instructions. It excludes Git history, untracked files and installed development dependencies. Commit all intended changes first: `git archive HEAD` won't include edits in the working tree.

If Mozilla requests an upload, attach this archive. A repository link doesn't replace a requested source file.

## Submit to Mozilla

1. Open the existing FireUp entry in [Developer Hub](https://addons.mozilla.org/developers/) and upload the unsigned XPI as a new version. Keep the ID `fireup@local.extension`.
2. Review the validation results. FireUp targets desktop Firefox 140 or newer; leave Android unselected. The local lint wrapper explains the Android-only warning.
3. Copy the relevant version notes and private reviewer note from [Reviewer notes](AMO-REVIEWER-NOTES.en.md). Update them for the version being submitted.
4. Review the listing in [English](AMO-LISTING.en.md) and [Russian](AMO-LISTING.ru.md). Keep the unsaved-work warning and the explanation of local processing. Use MIT as the license and check the public author details.
5. After the signed update becomes available, check installation and updating from the public listing.

Use [the repository](https://github.com/tyvor/fireup-optimize) as the add-on homepage, [GitHub Issues](https://github.com/tyvor/fireup-optimize/issues) for support, and [PRIVACY.md](https://github.com/tyvor/fireup-optimize/blob/main/PRIVACY.md) as the privacy URL.

A signed XPI from Developer Hub can also be installed through Firefox's **Install Add-on From File** command. Keep the signed file unchanged. Mozilla offers unlisted signing for self-distribution too, but FireUp has no `update_url` for that route; those builds would need manual updates unless an update service were added.

See Mozilla's [signing overview](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/) and [source submission guidance](https://extensionworkshop.com/documentation/publish/source-code-submission/) for its current requirements.
