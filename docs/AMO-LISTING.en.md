# Text for the Mozilla listing

Use these sections when editing the existing FireUp listing. Publishing source on GitHub doesn't update the Mozilla version.

## Name

FireUp

## Summary

Unload idle Firefox tabs while keeping recent tabs, protected tabs and excluded sites loaded.

## Description

FireUp is for people who keep a lot of tabs open but only use a few at a time. It unloads idle tabs to reduce their memory use. The tabs stay in Firefox and reload when you return to them.

By default, your 10 most recently used tabs stay loaded. Other tabs can sleep after 10 minutes of inactivity. You can adjust both settings.

Active tabs in each window, pinned tabs and tabs playing audio are skipped. FireUp also skips calls and screen sharing when Firefox reports them. Private tabs are excluded.

Protect important tabs for 30 minutes, an hour, or until you remove protection. You can also exclude a whole site, including its subdomains. The first installation includes a grace period to set up protections.

Please protect unsaved forms, editors and silent playback yourself. FireUp doesn't read page contents and can't reliably detect all of them. Unloading a page may lose unsaved work.

The panel has search, filters and manual commands for the current window, all windows, selected tabs or a site. The button shows the scope and eligible count, and you can stop a running queue. Search and filters only change the displayed list; hidden tabs in the selected scope are still included. Choose Selected tabs to use only checked rows.

Manual commands skip the automatic waiting periods while still respecting protection and site exclusions. Alt+Shift+U applies across all windows. Pausing automatic sleep leaves manual commands available.

Returning quickly to a tab unloaded by FireUp delays its next automatic sleep. Choose light, dark or system appearance. The interface starts in English or Russian according to Firefox's language, with a manual override in settings.

Settings can be exported to a local JSON file and imported with a preview. The file contains preferences and excluded domains, not open tabs or per-tab protection.

Tab information stays in your Firefox profile. FireUp has no analytics, advertising or server component. The source is available under the MIT license, and bugs and suggestions are welcome on GitHub.

Requires desktop Firefox 140 or newer. Memory savings depend on the pages and Firefox.

## Other form fields

- License: MIT.
- Platform: desktop Firefox. Leave Android unselected; it hasn't been tested.
- Category: Tabs.
- Paid features or required services: none.
- Homepage: https://github.com/tyvor/fireup-optimize
- Support: https://github.com/tyvor/fireup-optimize/issues
- Privacy notice: https://github.com/tyvor/fireup-optimize/blob/main/PRIVACY.md

## Screenshot captions

1. `docs/images/popup-light.png`: Search tabs, protect important pages and choose what to unload.
2. `docs/images/popup-dark.png`: The same tab panel in the dark theme.
3. `docs/images/settings.png`: Adjust the recent-tab count, idle timer, site exclusions and language.
4. `docs/images/settings-transfer.png`: Review a settings file before applying it.

These screenshots use demonstration data and modeled Firefox APIs in Chromium. They show the interface, not measured memory savings. Captures from installed FireUp in Firefox can replace them.
