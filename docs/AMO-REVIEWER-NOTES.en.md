# Notes for Mozilla reviewers

FireUp 0.4.0 is a desktop Firefox tab-unloading extension. No account, external service or payment is required. The UI supports English and Russian. The minimum Firefox version is 140.

The XPI contains plain source with no compilation, bundling, obfuscation or runtime dependencies. See BUILD-INSTRUCTIONS.md for packaging. Permissions are tabs, storage, alarms, menus and sessions. FireUp does not inject content scripts or read page contents. Tab metadata and queued candidate URLs are processed locally. No telemetry or tab information is transmitted to the developer; required data-collection permissions are ["none"]. See PRIVACY.md and docs/PERMISSIONS.md.

## Functional checks

Use expendable tabs in a test profile. Open the toolbar popup, then Settings. Set the recent working set to 1 and the idle timer to 1 minute and save. The first-install grace period is based on preferences at installation (10 minutes by default); changing the timer does not shorten that original deadline. Manual unloading is available during the grace period.

The primary Unload tabs action defaults to the current window. The scope selector also supports all windows, selected tabs and a site. Manual unloading ignores recent working-set protection and automatic deadlines but still skips active, pinned, audible, capture-active, protected and excluded tabs. Stop cancels between candidate operations.

Use Protect beside a tab or its context menu for 30-minute, one-hour or permanent protection. Domain exclusions include subdomains. Private tabs are excluded. Camera, microphone and screen-sharing protection depends on Firefox's reported state. Unsaved forms, editors and silent playback cannot all be detected; the listing and UI tell users to protect these manually.

Returning within two minutes of a confirmed FireUp unload delays the next automatic sleep. With a 10-minute timer, successive quick returns produce 20, 40, 80 and 120-minute delays. This feature can be disabled in settings.

## Language and settings transfer

Settings → Language offers Browser default, English and Russian. Browser default uses i18n.getUILanguage(), selecting Russian for ru locales and English otherwise. English is the fallback. A saved manual choice updates the panel, settings, context menu and command description. Native manifest messages use packaged _locales/en and _locales/ru catalogs. All translations are local; no translation service is used.

Export produces local JSON with applied preferences, language and excluded domains. New files use format 2. Format 1 from 0.3.0 is accepted and normalized to language auto; it cannot inject a language field into the old schema. Import selection is read-only preview. Apply import revalidates and replaces settings; Cancel leaves preferences unchanged. No open-tab URLs or per-tab protections are exported.

The background page is nonpersistent. Alarms resume the queue; storage.session retains it only for the current browser run. Per-tab protection uses Firefox's sessions API. Pausing automatic sleep removes its periodic alarm rather than scanning tabs while paused.

## Validation evidence

50 Node policy, engine and localization checks and 20 Chromium UI scenarios with mocked Firefox APIs passed. The author reported successful use and memory release for the preceding 0.3.0 behavior in real Firefox. Native Firefox version details and a full scenario log were not supplied; the 0.4.0 localization changes have not been independently verified in native Firefox here. Mocked tests do not establish native compatibility or measured memory savings.
