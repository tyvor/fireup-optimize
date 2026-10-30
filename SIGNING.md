# Signing and installation

For ordinary use, [install FireUp from Firefox Add-ons](https://addons.mozilla.org/firefox/addon/fireup-optimize/). That listing provides Mozilla-signed builds. Firefox handles updates when a new listed version becomes available.

An XPI produced by `Build.ps1` is unsigned. It's useful for submission to Mozilla and development, but release and beta Firefox require a Mozilla signature for permanent installation. See [Mozilla's signing overview](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).

## Updating the listed add-on

1. Build the package using [BUILD-INSTRUCTIONS.md](BUILD-INSTRUCTIONS.md).
2. Open the existing FireUp entry in [Developer Hub](https://addons.mozilla.org/developers/) and upload a new version. Keep the ID `fireup@local.extension`.
3. Review validation results and follow [PUBLISHING.md](docs/PUBLISHING.md) for the listing and reviewer notes.
4. Once Mozilla makes the signed version available, check installation from the public listing.

For a signed XPI downloaded from Developer Hub, Firefox's add-on manager also offers **Install Add-on From File**. Leave the signed package unchanged.

## Trying a development copy

Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `extension/manifest.json`. That copy lasts until Firefox restarts.

Before switching between development and installed copies, export any settings you want to keep. Per-tab protection isn't part of the export, so check it separately afterward.

Mozilla also offers an unlisted signing channel for self-distribution. FireUp's current manifest has no `update_url` for that route; an unlisted build would need manual updates unless an update service is added. The public listing is the installation route documented in the README.
