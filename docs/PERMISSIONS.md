# Why FireUp needs these permissions

| Permission | What it's used for |
| --- | --- |
| `tabs` | Show open-tab titles and URLs, match site exclusions and check whether a page changed before unloading it. |
| `storage` | Save your settings and keep temporary queue and activity data for the current browser run. |
| `alarms` | Run automatic checks, continue a queue and expire temporary protection. |
| `menus` | Add protection and unload commands to a tab's context menu. |
| `sessions` | Keep protection attached to an individual tab through Firefox's sessions API. |

`tabs` gives FireUp access to sensitive tab metadata. The extension handles it locally; [Privacy](../PRIVACY.md) explains what is stored and for how long.

FireUp doesn't request website-content host permissions, browsing history, cookies or `webRequest`. It doesn't inject scripts into websites.

The manifest says `data_collection_permissions.required: ["none"]` because the developer doesn't collect or receive your data. FireUp still needs to read tab information locally to do its job.

Reading Firefox's UI language needs no extra permission. The English and Russian translations are included with the extension, so language selection doesn't contact a service.
