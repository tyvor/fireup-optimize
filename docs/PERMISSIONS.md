# Permissions

| Permission | How FireUp uses it |
| --- | --- |
| `tabs` | Reads open-tab titles and URLs for the panel, domain exclusions and navigation checks before unloading. |
| `storage` | Stores preferences locally and temporary working state for the current browser run. |
| `alarms` | Schedules automatic checks, queue continuation and expiration of temporary protection. |
| `menus` | Adds protection and unloading commands to the tab context menu. |
| `sessions` | Saves protection associated with an individual tab through Firefox's sessions API. |

The `tabs` permission exposes sensitive tab metadata. FireUp processes it locally as described in [PRIVACY.md](../PRIVACY.md). It does not request website-content host permissions, `history`, `cookies` or `webRequest`.

The manifest declares `data_collection_permissions.required: ["none"]`. This describes the absence of data collection by the developer; tab URLs are still processed locally to provide the extension's features.

Language detection uses `browser.i18n.getUILanguage()` without adding a permission. English and Russian strings are packaged with the extension; no translation service is contacted.
