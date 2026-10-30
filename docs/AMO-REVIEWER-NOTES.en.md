# Notes for Mozilla reviewers

FireUp 0.4.2 unloads idle tabs in desktop Firefox 140 or newer. It works without an account, payment or external service. The interface supports English and Russian. These notes are prepared for a future submission; Mozilla publication is currently deferred.

This version maintains the recent working set from tab events, reduces queue checkpoint copies and adds a minimum popup width. It also includes the two protection-race fixes from 0.4.1. Candidate safety checks still run before each unload; no new permissions were added.

## Source and packaging

The XPI contains readable JavaScript, HTML and CSS. There is no compilation, bundling, minification, obfuscation or runtime npm dependency. [Build instructions](../BUILD-INSTRUCTIONS.md) explain how to ZIP the contents of `extension/` with `manifest.json` at the archive root. Packaging doesn't change file contents.

The permissions are `tabs`, `storage`, `alarms`, `menus` and `sessions`. FireUp has no content scripts or website-content host permissions. Tab metadata and queued URLs are handled locally; the manifest declares required data collection as `["none"]`. See [Privacy](../PRIVACY.md) and [Permissions](PERMISSIONS.md).

## A short test

Use disposable pages in a separate Firefox profile. Open several tabs, leave one active and protect one background tab. Run a manual unload from the toolbar panel: the active and protected tabs should stay loaded. Return to an unloaded tab to reload it.

The panel defaults to the current window. Other scopes are all windows, checked tabs and a site. Search and filters only change the list, and the panel explains that hidden tabs in the selected scope are still included. Manual unloading bypasses recent-tab and idle delays but keeps the protection rules. Stop cancels the remaining queue.

For automatic unloading, set the working set to 1 and the idle timer to 1 minute. There is a first-install grace period based on the settings at installation, normally 10 minutes. Reducing the timer afterward doesn't shorten that initial grace period. Manual unloading works during it.

Check 30-minute, one-hour and permanent protection from the panel or tab context menu. Site exclusions also cover subdomains. Private, active, pinned, audible and loading tabs are excluded, as are browser-reported calls and screen sharing. Unsaved input and silent playback need manual protection because FireUp doesn't read page contents.

If a tab is reopened within two minutes of a confirmed FireUp unload, the next automatic sleep is delayed. With a 10-minute base timer, repeated quick returns give 20, 40, 80 and 120-minute delays. This setting can be disabled.

## Language, settings and background work

Settings → Language offers Browser default, English and Russian. The default uses Firefox's UI language: Russian for Russian locales, English otherwise. A saved override also updates context menus and the command description. All translations are packaged locally.

Exported JSON contains preferences, language and excluded domains. It doesn't include open tabs or per-tab protection. Importing a file first shows a read-only preview. Apply replaces settings after another validation pass; Cancel leaves the current settings alone. Format 2 is current; format 1 from 0.3.0 imports with Browser default language.

Firefox may suspend the background page. Alarms resume work and `storage.session` holds the queue for the current browser run. Per-tab protection uses the sessions API. Pausing automatic sleep removes the periodic alarm.

## Checks and known limits

79 Node tests, 21 general/language UI scenarios and four startup language/theme combinations pass. The UI checks use Chromium with modeled Firefox APIs. Basic manual testing passed for 0.4.1; native confirmation of the 0.4.2 changes is still pending. The first-opening narrow-popup fix remains a candidate, and no real Firefox RAM or CPU improvement is claimed. [Testing](TESTING.md) and [Performance](PERFORMANCE.md) give the details.

Mozilla lint reports no errors or notices. The local wrapper allows one Android-only minimum-version warning because this is a desktop-only release. Android must remain unselected in AMO.
