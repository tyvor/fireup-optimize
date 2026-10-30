# Testing FireUp 0.4.1

## What passes

61 Node tests cover policy rules, the engine, localization and protection. The 11 new protection tests control the order of asynchronous operations: stale reads, explicit removal, expiry during permanent or timed renewal, pending writes, failed writes and tab closure. The same file passes 2 tests and fails 9 on 0.4.0; all 11 pass on 0.4.1.

15 general UI scenarios and 6 language scenarios pass with Playwright 1.62.1 and Chromium. They cover scopes, the search warning, protection, cancellation, focus, themes, error recovery and settings transfer. They also check browser language selection, saved overrides and translated errors. Firefox APIs are modeled in these tests.

The source check parses JavaScript and JSON, checks version consistency and follows local Markdown links. Mozilla lint uses web-ext 10.8.0. It reports no errors or notices. The wrapper allows exactly one Android-only minimum-version warning when there is no `gecko_android` entry; any other warning fails. Android must stay unselected in AMO.

## Run it yourself

Use Node.js 22 or newer from the repository root:

```sh
npm ci
npm run check:source
npm test
npx playwright install chromium
npm run test:ui
npm run lint:addon
```

For just the new protection checks, run `node --test tests/protection.test.cjs`. They need no installed npm dependencies. The prepared local bundle also contains the before/after output and matching test-file hashes under `checks/`.

The GitHub workflow runs these checks and packages an unsigned XPI on Windows. Its actual results are on the [Actions page](https://github.com/tyvor/fireup-optimize/actions). It doesn't sign or publish releases.

## What still needs checking in Firefox

A basic manual check of the temporary 0.4.1 copy passed for protection, manual unloading and the scope explanation. The exact Firefox and OS versions and a full scenario log weren't recorded. Automated checks against native Firefox APIs haven't been completed. There are no RAM or CPU measurements.

The narrow strip reported on the first popup opening is still open. An ordinary successful opening doesn't establish that cold startup and background wake-up work reliably.

Use disposable pages in a separate profile for the remaining checks:

- Open the panel after starting Firefox and after the background page has been idle. Repeat with both languages, both themes, display scaling and a narrow browser window.
- Try automatic unloading outside the recent working set, every manual scope and queue cancellation.
- Check active tabs in two windows, pinned tabs, audio, loading pages, calls and screen sharing.
- Renew timed protection near expiry, switch it to permanent, and check restoration after restarting Firefox.
- Check private tabs, background-page suspension and queue resumption.
- Use disposable unsaved forms with and without `beforeunload`. Protect them before unloading; preservation without protection isn't promised.
- Check import preview and cancellation, export, pause, language changes and keyboard navigation.

Run the matrix on minimum-declared Firefox 140 and a current supported version. Record the versions and what happened. For a narrow-popup failure, also record `innerWidth`, body bounds, computed width limits and console errors.
