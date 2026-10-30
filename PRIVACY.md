# Privacy

Updated October 30, 2026, for FireUp 0.4.1. This update fixes tab protection and doesn't change the data FireUp uses or its permissions.

FireUp handles tab information inside your Firefox profile. It doesn't send that information to the developer or a third party, and it has no analytics, advertising, remote code or server component.

## What FireUp can see

FireUp uses open-tab titles, URLs, last access times and window IDs. It also reads the states Firefox reports for loading, pinned, audible and unloaded tabs, and for camera, microphone and screen-sharing activity. These let it display the tab list, apply site exclusions and decide which tabs can sleep.

It displays only supported favicon data already supplied by Firefox. It doesn't fetch icons from websites.

FireUp doesn't read page contents, form text, passwords or cookies. It has no content scripts, website-content host permissions or browsing-history permission. Private tabs are excluded from processing.

## What it stores

Preferences, excluded domains, language choice and the first-install grace deadline go in local extension storage. FireUp doesn't use Firefox sync storage.

Temporary activity records, cached protections, the pending queue and the last queue result go in session storage. Queue entries include URLs to detect a page change before unloading. A quick-return marker also keeps the URL of the tab FireUp unloaded. These records last for the current browser run. Records for closed tabs are removed, and some expired records are cleaned up when the list is next read. FireUp doesn't keep a browsing-history log.

Per-tab protection uses Firefox's sessions API and may come back when Firefox restores a tab. You can remove protection from the panel or the tab context menu. Timed protection stops applying at its deadline.

The initial language comes from Firefox's interface language. FireUp doesn't contact a translation service.

## Connections

The extension's content security policy includes `connect-src 'none'`. FireUp doesn't transmit tab information, preferences or diagnostics.

Firefox still makes its own connections, including add-on updates from Mozilla. When you return to an unloaded tab, Firefox reloads that website. Those connections are separate from FireUp's local processing.

## Exports and support

A settings export is a local JSON file with your preferences and excluded domains. It doesn't contain open-tab URLs, queues or per-tab protections. You choose where to save it and whether to share it.

[GitHub Issues](https://github.com/tyvor/fireup-optimize/issues) and attachments are public. Remove private domains, URLs, names and account information before posting. You can ask a data-handling question without including personal information.

Because FireUp doesn't read page contents, it can't reliably detect all unsaved forms, editors or silent playback. Protect those tabs or sites before unloading; unsaved page state may otherwise be lost.
