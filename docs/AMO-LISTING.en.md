# Mozilla listing: English

Prepared copy for the submission form. This document does not mean the add-on has been submitted or published on Mozilla.

## Name

FireUp

## Summary

Unload idle Firefox tabs with a recent working set, site exclusions and manual protection for important tabs.

## Description

FireUp unloads idle tabs to reduce their memory use. Tabs stay in Firefox and reload when you return to them.

Protect unsaved text, editors and silent playback before unloading. FireUp does not read page contents and cannot detect every such case. Unloading a page may lose unsaved data.

By default, your 10 most recently used tabs stay loaded and other tabs can sleep after 10 minutes of inactivity. Adjust both values in settings. The first installation includes a grace period to configure protections.

Active tabs in each window, pinned tabs and audible tabs are skipped. FireUp also skips camera, microphone and screen-sharing activity when Firefox reports that state. Private tabs are excluded.

Search and filter the tab list, then manually unload selected tabs, a window, all windows or a site. Preview the candidate count and stop a running queue. Manual unloading ignores the recent working set and automatic delays while respecting protections and site exclusions.

Protect a tab for 30 minutes, one hour or until protection is removed. A domain exclusion also covers subdomains. Returning quickly to a tab unloaded by FireUp delays its next automatic sleep.

Choose light, dark or system appearance. The interface supports English and Russian. It initially follows the Firefox interface language, with English as the fallback. You can save a manual language choice in settings.

Export preferences and excluded domains to a local JSON file. Import includes validation and a preview before replacing settings. Alt+Shift+U manually unloads unprotected background tabs in all windows.

FireUp processes tab information locally and does not send it to its developer. It contains no analytics, advertising or server component and does not read form text. Source code is available under MIT, with bug reports handled through GitHub Issues.

Requires desktop Firefox 140 or later. Memory savings depend on the pages and Firefox; no fixed reduction is promised.

## Submission fields

- License: MIT.
- Platform: desktop Firefox. Do not select Android without verification.
- Category: tab management, if available in the submission form.
- Paid features or required external services: none.
- Homepage: https://github.com/tyvor/fireup-optimize
- Support website: https://github.com/tyvor/fireup-optimize/issues
- Privacy notice: https://github.com/tyvor/fireup-optimize/blob/main/PRIVACY.md
- No support email has been assumed. The author must supply one if the form requires it.

## Screenshots

1. `docs/images/popup-light.png`: Tab search, protection and manual unloading. Demonstration data.
2. `docs/images/popup-dark.png`: The tab panel in the dark theme. Demonstration data.
3. `docs/images/settings.png`: Working set, timer, site exclusions and language selection. Demonstration data.
4. `docs/images/settings-transfer.png`: Settings import preview before application. Demonstration data.

Screenshots show the current interface with mocked Firefox APIs in Chromium. They do not show measured memory savings. They can be replaced with captures from installed FireUp in Firefox.
