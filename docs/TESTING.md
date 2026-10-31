# Testing FireUp 0.4.2

## Automated checks

The Node tests cover policy, protection, queue recovery, settings transfer and language behavior. New queue checks use 100, 500 and 1000 tabs, including working-set changes during a batch, stale list queries, delayed activity, tab closure and checkpoint failures. A seeded sequence compares the incremental index with the original policy across 4000 changes.

The 11 protection regressions from 0.4.1 remain. The same file passed 2 tests and failed 9 against 0.4.0; all 11 passed after the protection fixes.

Playwright 1.62.1 runs 15 general UI scenarios and 6 language scenarios in Chromium with modeled Firefox APIs. The startup test adds four language/theme combinations with an intentionally unresolved settings response. At a 16-pixel viewport, the popup body stays at 320 pixels; at 320, 400 and 800 pixels, it fits its intended width. Reloads keep the same bounds. This checks CSS and page startup, not Firefox's popup-sizing algorithm.

The source check parses JavaScript and JSON, checks versions and follows local Markdown links. Mozilla lint uses web-ext 10.8.0. It allows one Android-only minimum-version warning when there is no gecko_android entry; all other warnings, errors and notices fail. Android must stay unselected in AMO.

## Run it yourself

Use Node.js 22 or newer from the repository root:

```sh
npm ci
npm run check:source
npm test
npx playwright install chromium
npm run test:ui
npm run lint:addon
npm run benchmark
```

The Node tests need no installed npm dependencies. The benchmark writes its model results to checks/queue-benchmark.json; see [Performance](PERFORMANCE.md) for a comparison command and measurement limits.

The [GitHub workflow](https://github.com/tyvor/fireup-optimize/actions) runs the checks and packages an unsigned XPI on Windows. It does not sign or submit the add-on. Benchmarks run locally rather than serving as timing thresholds in CI.

## Native Firefox checks

A basic manual check passed for 0.4.1. The maintainer then checked 0.4.2 in Firefox and confirmed that the panel opens normally after the width change. The previously reported narrow strip did not recur in that manual check.

This is a maintainer-reported manual result, separate from the modeled API tests above. The exact Firefox and OS versions, number of cold starts, display configurations and full scenario log were not recorded. There are no measured Firefox RAM or CPU results.

Use disposable pages in a separate profile:

- Extend the popup check across both languages, both themes, display scaling and a narrow browser window. For a repeatable compatibility record, log cold openings separately from warm openings and openings after background-page idle.
- During an automatic queue, switch tabs, close recent tabs, create a tab and restore an unloaded tab. Newly recent tabs must stay loaded.
- Check queue recovery after the background page sleeps, all manual scopes and cancellation.
- Check active tabs in two windows, pinned tabs, audio, loading pages, calls and screen sharing.
- Renew protection near expiry, switch to permanent, and restore protected tabs after restarting Firefox.
- Check private tabs, import preview and cancellation, export, pause, language changes and keyboard focus.
- Protect disposable unsaved forms before unloading. Preservation of unprotected input is not promised.

Run this on minimum-declared Firefox 140 and a current supported version. If the popup narrows, inspect its document and record innerWidth, body bounds, computed width/min-width/max-width, and console errors. Check whether the toolbar button is in an overflow menu. [MDN describes Firefox's popup sizing](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Popups#popup_resizing); a normal browser page does not reproduce that process.
