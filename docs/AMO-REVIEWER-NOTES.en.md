# Notes for Mozilla reviewers

FireUp 0.3.0 is a desktop Firefox tab-unloading extension. No account, external service or payment is required. The UI is currently in Russian. The minimum Firefox version is 140.

The submitted XPI contains plain source with no build step, remote code or runtime dependencies. See BUILD-INSTRUCTIONS.md for packaging instructions. The extension uses tabs, storage, alarms, menus and sessions. It does not inject content scripts or read page contents. Tab metadata and queued candidate URLs are processed locally. No telemetry or tab information is transmitted to the developer; the manifest declares required data-collection permissions as ["none"]. Details are in PRIVACY.md and docs/PERMISSIONS.md.

## Functional checks

Use expendable test tabs and a separate test profile. Open the toolbar popup. "Настройки" opens settings. Set the recent working set to 1 and the idle timer to 1 minute, then save. Exact Russian labels can also be found in options.html. The first-install grace deadline is based on the setting at installation (10 minutes by default), so changing the idle setting does not shorten that original deadline. Manual unloading is available during this grace period.

The primary "Усыпить вкладки" action defaults to the current window; its scope selector also supports all windows, selected tabs and a site. Manual unload ignores the recent working set and automatic deadlines, while active/pinned/audible/capture/protected/excluded tabs remain skipped. "Остановить" cancels a running queue between candidate operations.

Use "Защитить" beside a row or the tab context menu to protect a tab permanently or for 30/60 minutes. Site exclusions include subdomains. Private tabs are excluded. Camera, microphone and screen-sharing protection relies on Firefox's reported state. Unsaved forms/editors and silent playback cannot be detected; the listing, popup and settings warn users to protect those tabs manually.

Revisiting a tab within two minutes after a confirmed FireUp discard postpones its next automatic sleep. With a 10-minute idle setting, successive quick returns produce 20, 40, 80 and 120-minute delays. The switch "Увеличивать отсрочку после быстрого возврата" disables this feature.

The settings transfer section exports applied preferences and excluded domains as local JSON. Selecting an import file only previews it. "Применить импорт" revalidates and replaces preferences; "Отмена" leaves them unchanged. No tab URLs or per-tab protections are exported.

The background page is nonpersistent. Alarms continue the queue; storage.session retains its state only for the current browser run. Per-tab protections use Firefox's sessions API. The paused automatic sweep is removed rather than continuing to scan tabs.

## Validation evidence

44 Node policy/engine checks and 14 Chromium UI scenarios with mocked Firefox APIs passed. The project author separately reported successful use in real Firefox and memory being released. The exact native Firefox version and complete native test matrix were not supplied; we do not claim that the mocked tests verify native API compatibility or measured memory savings.
