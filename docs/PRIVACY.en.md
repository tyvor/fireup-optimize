# Privacy: FireUp 0.3.0

Updated October 24, 2026. This notice covers FireUp itself, not Firefox as a whole or the websites you visit.

FireUp processes tab metadata locally: URLs, titles, last access times, window IDs, and browser-reported loading, pinned, audible, discarded, camera, microphone and screen-sharing states. This information supports the tab list, exclusions and unloading decisions. Only supported browser-provided local favicon data is displayed; FireUp does not fetch favicons from websites.

The extension does not read page contents, form text, passwords or cookies. It has no content scripts, website-content host permissions or browsing-history API permission. Private tabs are excluded from processing.

Settings, excluded domains and the end of the first-install grace period are stored in Firefox's local extension storage. FireUp does not use sync storage. Per-open-tab activity, cached protections, the last queue result and pending queue live in session storage until the browser fully exits. The queue includes candidate URLs to detect navigation before unloading. Quick-return protection also keeps one marker per tab for its own discard, including the URL. FireUp does not build a browsing-history log. Closed-tab records are removed, and some expired records are pruned when the list is next read.

Per-tab protection is stored with Firefox's sessions API and may be restored with the tab. Users can remove it in the tab panel or context menu. Timed protection stops applying after its deadline.

FireUp does not transmit tab information, settings or diagnostics to its developer or third parties. It contains no analytics, advertising, remote code or server component. Its extension policy includes `connect-src 'none'`. Firefox makes its own connections to Mozilla for add-on services and updates. Revisiting a discarded tab reloads that website through Firefox; this is not a transmission to the FireUp developer.

Settings export creates a local JSON file containing preferences and domain exclusions, not open-tab URLs, queues or per-tab protections. Users choose whether to share that file. GitHub receives information only when users submit it themselves; issues are public. Remove private domains, URLs and account information before posting.

FireUp cannot detect all unsaved forms, editors or silent playback. Protect important tabs or domains manually before unloading. It does not guarantee preservation of unsaved page state.

Data-handling questions can be filed as a repository issue without including personal information.
