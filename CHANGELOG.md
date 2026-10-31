# Changelog

## 0.4.2

- Automatic unloading now keeps the recent working set up to date from tab events. It no longer requests and sorts the full tab list before every batch. Each candidate still gets its own final check, and the index is rebuilt after the background page wakes.
- Queue entries are saved once per operation, with smaller progress checkpoints afterward. Refreshing an unchanged panel no longer rewrites session state.
- Added a 320-pixel minimum popup width to prevent the layout from collapsing during startup.
- Removed repeated site-option scans and repeated scope construction while updating the panel.
- Added queue, working-set and startup-sizing tests, plus a repeatable model benchmark for 100, 500 and 1000 tabs. See [Performance](docs/PERFORMANCE.md) for results and limits.

## 0.4.1

- Fixed two timing bugs that could remove or hide a tab's newly assigned protection. A late read can no longer overwrite a newer change, and an old timer can't remove protection that has just been renewed.
- The unload button now names the selected scope. Searching or filtering also shows a reminder that hidden tabs in that scope are included.
- Added 11 protection regression tests. Nine fail on 0.4.0; all 11 pass on 0.4.1.
- Added UI tests, source and local-link checks, and pinned Mozilla validation to CI. UI tests now create their temporary directories themselves.

The intermittent narrow panel on first opening was fixed in 0.4.2.

## 0.4.0

- Added English and Russian, with the initial language taken from Firefox and a saved override in settings.
- Translated the panel, settings, errors, tab context menu and shortcut description.
- Settings export format 2 now includes language. Imports from 0.3.0 still work and choose the browser's default language.
- Added English documentation and Mozilla listing text.

## 0.3.0

- Returning quickly to an unloaded tab now delays its next automatic sleep.
- Added local settings export and import, with a preview before applying a file.

## 0.2.0

- Added activity and navigation checks before unloading, a queue that survives background-page suspension, and queue cancellation.
- Added timed and permanent protection and manual unload scopes.
- Reworked the panel into a compact tab list with search, filters and light and dark themes.

## 0.1.0

- First version: automatic unloading, a recent working set, an idle timer, site exclusions and manual protection.

GitHub source updates and Mozilla releases are separate. Check the [Mozilla listing](https://addons.mozilla.org/firefox/addon/fireup-optimize/) for the version available to install.
