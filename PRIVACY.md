# Privacy: FireUp 0.4.0

Updated October 24, 2026. This notice covers FireUp itself, not Firefox as a whole or the websites you visit.

## Local processing

FireUp processes tab URLs, titles, last access times, window IDs and browser-reported loading, pinned, audible, discarded, camera, microphone and screen-sharing states. This information supports the tab list, exclusions and unloading decisions. Only supported browser-provided local favicon data is displayed; FireUp does not fetch favicons from websites.

The extension does not read page contents, form text, passwords or cookies. It has no content scripts, website-content host permissions or browsing-history API permission. Private tabs are excluded from processing.

## Storage

- Local extension storage holds preferences, excluded domains and the end of the first-install grace period. Preferences include the language choice. FireUp does not use sync storage.
- Session storage holds per-open-tab activity, cached protections, the last queue result and the pending queue until the browser fully exits. The queue includes candidate URLs to detect navigation before unloading. Quick-return protection also keeps one marker per tab for its own discard, including the URL. Closed-tab records are removed; some expired records are pruned when the list is next read. FireUp does not build a browsing-history log.
- Per-tab protection is stored through Firefox's sessions API and may be restored with the tab. Users can remove it in the panel or tab context menu. Timed protection stops applying after its deadline.

Browser-default language uses Firefox's interface language through the i18n API. No language information is sent to a server.

## Transmission

FireUp does not transmit tab information, preferences or diagnostics to its developer or third parties. It contains no analytics, advertising, remote code or server component. Its extension policy includes `connect-src 'none'`.

Firefox makes its own connections to Mozilla for add-on services and updates. Revisiting a discarded tab reloads that website through Firefox; this is not a transmission to the FireUp developer.

## Export and support

Settings export creates a local JSON file containing preferences and excluded domains, not open-tab URLs, queues or per-tab protections. Users choose where to store the file and whether to share it.

GitHub receives information only when users submit it themselves. [Issues](https://github.com/tyvor/fireup-optimize/issues) and attachments are public. Remove private domains, URLs, names and account information before posting. Data-handling questions can be filed without personal information.

## Unsaved input

FireUp cannot detect every unsaved form, editor or silent playback state. Protect important tabs or domains manually before unloading. It does not guarantee preservation of unsaved page state.
