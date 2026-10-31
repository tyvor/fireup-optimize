# Mozilla submission notes for 0.4.2

The version notes below are for the public release-notes field. The reviewer note is for the private notes field. Testing steps and packaging details follow as a reference.

## Version notes

- Fixed timing issues that could override newly assigned or renewed tab protection.
- Clarified what manual unloading affects when search and filters hide tabs.
- Reduced repeated full-tab queries during automatic unloading and unnecessary session writes.
- Added a minimum popup width to prevent the panel from collapsing during startup.
- Added regression tests for tab protection, recent-tab updates, queue recovery and popup sizing.

## Reviewer note

In this update, the automatic unload queue was changed to update recent-tab activity from browser events. Repeated full-tab queries and queue checkpoint copies were reduced, while the final safety checks before each unload were kept. The update also includes the protection fixes from 0.4.1 and a minimum popup width.

No permissions were added. FireUp runs locally in desktop Firefox 140 or newer and needs no account, payment or external service.

The package contains readable JavaScript, HTML and CSS. There is no compilation, bundling, minification, obfuscation or downloaded code. Packaging only ZIPs the files in the extension directory. npm dependencies are used for development checks.

Source code: https://github.com/tyvor/fireup-optimize

Build instructions: https://github.com/tyvor/fireup-optimize/blob/main/BUILD-INSTRUCTIONS.md

## Packaging and permissions

[Build instructions](../BUILD-INSTRUCTIONS.md) explain how to create the XPI with `manifest.json` at the archive root. File contents are unchanged during packaging. [Publishing](PUBLISHING.md) includes the source-archive command.

The permissions are `tabs`, `storage`, `alarms`, `menus` and `sessions`. There are no content scripts or website-content host permissions. Tab information is processed locally and isn't transmitted. The manifest declares required data collection as `["none"]`. See [Privacy](../PRIVACY.md) and [Permissions](PERMISSIONS.md).

## Testing steps

Use disposable pages in a separate Firefox profile. Open several tabs, leave one active and protect one background tab. Run a manual unload from the toolbar panel. The active and protected tabs should stay loaded; selecting an unloaded tab should reload it. No test credentials are needed.

The panel defaults to the current window. Other scopes are all windows, selected tabs and a site. Search and filters only change the displayed list; hidden tabs in the chosen scope are still included. Manual unloading skips recent-tab and idle delays but respects protection and site exclusions. **Stop** cancels the remaining queue.

For automatic unloading, set the recent-tab count to 1 and the idle timer to 1 minute. The first-install grace period is based on the settings at installation, normally 10 minutes. Reducing the timer afterward doesn't shorten that grace period. Manual unloading works during it.

Check 30-minute, one-hour and permanent protection from the panel or tab context menu. Site exclusions cover subdomains. Private, active, pinned, audible and loading tabs are excluded, as are camera, microphone and screen sharing when Firefox reports them.

Protect unsaved forms, editors and silent playback before unloading. FireUp doesn't read page contents and can't reliably detect all of these situations. Unsaved work may be lost.

Returning to a tab within two minutes of a confirmed FireUp unload delays its next automatic sleep. With a 10-minute base timer, repeated quick returns give 20, 40, 80 and 120-minute delays. This setting can be disabled.

## Language, settings and background work

**Settings → Language** offers Browser default, English and Russian. Russian Firefox locales select Russian; other locales select English. A saved override also updates context menus and the shortcut description. All translations are included locally.

Exported JSON contains preferences, language and excluded domains. It doesn't include open tabs or per-tab protection. Import first shows a preview. **Apply** validates the data again and replaces settings; **Cancel** leaves them unchanged. Format 2 is current; format 1 from 0.3.0 imports with Browser default language. Version 0.3.0 can't read format 2.

Alarms resume work after Firefox suspends the background page, and session storage holds the pending queue for the current browser run. Per-tab protection uses Firefox's sessions API. Pausing automatic sleep removes the periodic alarm.

## Validation

[Testing](TESTING.md) records the automated checks and the popup check in Firefox. [Performance](PERFORMANCE.md) contains the queue benchmark and its limits.

Mozilla lint reports no errors or notices. The local wrapper allows one Android-only minimum-version warning because FireUp targets desktop Firefox.
