# FireUp 1.0.0 verification

FireUp 1.0.0 was built from a separate copy of 0.4.2. The extension ID, permissions, saved settings schema and export format remain compatible.

- All 81 Node tests passed. They include protection and queue regressions, settings format 1/2 imports, coverage for all eight bundled languages and registration of a temporary regional language. Localization tests cover locale matching, regional fallback, context menu labels, shortcut descriptions, settings transfer and rejection of a missing placeholder.
- Source syntax, version consistency, locale generation and local links passed validation.
- Headless Edge checked the real panel and settings markup with mocked Firefox APIs in English and Russian at 320 and 400 pixels. The checks exercised the overview, SVG icons, search candidates, the exact IDs submitted for unload, an empty site scope, an autosleep preset and language and theme selection.
- Another 48 page checks passed for the six added locales at 320 and 400 pixels in both themes. These exercised automatic locale selection, the candidate preview, layout with settings sections open, and saving a manual language choice.
- For the popup resize and settings save fixes, 64 page checks passed with mocked Firefox APIs in Edge. They covered all eight languages, 320 and 400 pixels, and both themes. One baseline popup measured 600 px while loading, about 402 px after loading, and 600 px with the list open. The updated popup held at 520 px through loading and toggling the list, preview and protection menu. Settings checks covered edits, reverts, save errors, successful saves and imports.
- The unsigned XPI was checked against its source files.
- The loaded and sleeping cards gave the list more space when it opened. In Edge, 32 popup checks covered eight languages, two themes and widths of 320 and 400 pixels. The checks used modeled Firefox APIs and verified that both counts stayed visible and the popup size stayed fixed.
- The maintainer reported that the final build worked in Firefox. That report did not specify the Firefox version or record an upgrade from 0.4.2.
- The release passed the Playwright suite in Chromium with modeled Firefox APIs. It covered 15 UI scenarios, six localization scenarios and 16 popup language and theme combinations.
- Mozilla lint reported zero errors, zero notices and zero blocking warnings. It reported one warning for the Android minimum version. The package targets desktop Firefox 140 or newer.

The existing Node session and protection tests exercise the modeled API. The native upgrade and preservation of per-tab protection on upgrade have yet to be recorded.

The [0.4.2 Firefox check](https://github.com/tyvor/fireup-optimize/pull/3) is recorded separately.
