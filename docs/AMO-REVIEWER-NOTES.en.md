# Notes for Mozilla reviewers

FireUp 1.0.0 unloads idle tabs in desktop Firefox 140 or newer. It works without an account, payment or external service. Its ID and required permissions match 0.4.2.

## Source and packaging

The XPI contains readable JavaScript, HTML and CSS. The source archive includes the JSON language catalogs and the generator. Follow the [build instructions](../BUILD-INSTRUCTIONS.md) to regenerate the translations and package the XPI.

The permissions are `tabs`, `storage`, `alarms`, `menus` and `sessions`. FireUp has no content scripts or website-content host permissions. Tab metadata and queued URLs are handled locally; the manifest declares required data collection as `["none"]`. See [Privacy](../PRIVACY.md) and [Permissions](PERMISSIONS.md).

## A short test

Use disposable pages in a separate Firefox profile. Open several tabs, leave one active and protect one background tab. Run a manual unload from the toolbar panel: the active and protected tabs should stay loaded. Return to an unloaded tab to reload it.

The panel defaults to the current window. Other scopes are all windows, checked tabs, a site and search results. Expand **Tab list** to see the counters shrink, then select **Search results** and open **Show candidates** to verify that only eligible matches are included. Manual unloading respects protection rules and bypasses recent-tab and idle delays. **Stop** cancels the remaining queue.

For automatic unloading, set the working set to 1 and the idle timer to 1 minute. There is a first-install grace period based on the settings at installation, normally 10 minutes. Reducing the timer afterward doesn't shorten that initial grace period. Manual unloading works during it.

Check 30-minute, one-hour and permanent protection from the panel or tab context menu. Site exclusions also cover subdomains. Private, active, pinned, audible and loading tabs are excluded, as are browser-reported calls and screen sharing. Unsaved input and silent playback need manual protection because FireUp doesn't read page contents.

If a tab is reopened within two minutes of a confirmed FireUp unload, the next automatic sleep is delayed. With a 10-minute base timer, repeated quick returns give 20, 40, 80 and 120-minute delays. This setting can be disabled.

## Language, settings and background work

Settings → Appearance and language offers the browser default plus eight languages. Change the selection to see the unsaved changes message, then save and reopen the toolbar popup to confirm the new language. The saved choice updates the tab context menu and shortcut description. Translations are packaged locally.

Exported JSON contains preferences, language and excluded domains. It doesn't include open tabs or per-tab protection. Importing a file first shows a read-only preview. Apply replaces settings after another validation pass; Cancel leaves the current settings alone. Format 2 is current; format 1 from 0.3.0 imports with Browser default language.

Firefox may suspend the background page. Alarms resume work and `storage.session` holds the queue for the current browser run. Per-tab protection uses the sessions API. Pausing automatic sleep removes the periodic alarm.

## Checks and known limits

See [verification](../VERIFICATION.md) for checks on the 1.0.0 package and [Testing](TESTING.md) for the test suite.
