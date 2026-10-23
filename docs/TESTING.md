# Testing 0.4.0

## Recorded checks

The 50 Node policy, engine and localization checks cover tab protection, navigation and activation races, queue cancellation and persistence, quick returns, settings transfer, language detection, saved overrides, old-format migration and translated native menu descriptions.

The 14 general UI scenarios and 6 localization scenarios use Chromium, Playwright and mocked Firefox APIs. They cover search, scopes, protection, queue handling, keyboard focus, themes, settings transfer, both languages, browser-language fallback, persisted choices, translated errors and legacy import. These are interface checks, not native Firefox automation.

The project author reported successful use in real Firefox and memory release for the preceding 0.3.0 behavior. Exact Firefox and OS versions and a complete scenario log were not supplied. The 0.4.0 localization changes have not been independently verified in native Firefox in this environment. No full compatibility matrix or measured memory reduction is claimed.

## Native checks for release and browser API changes

Use expendable pages in a separate test profile:

- Check automatic unloading outside the working set, manual scopes and queue cancellation.
- Check active tabs in multiple windows, pinning, audio and browser-reported camera, microphone and screen sharing.
- Revisit unloaded tabs, restart Firefox and restore the session; verify per-tab protections.
- Confirm that private tabs are not processed.
- Protect an editor containing disposable unsaved text before unloading. Preservation without protection is not promised.
- Check export, import preview and cancellation, pause, themes and keyboard navigation.
- Switch Language between Browser default, English and Russian. Save and reopen the panel, then check the tab context menu and shortcut description.
- Check a large set of test tabs and switching to a candidate before its turn in the queue.

Record Firefox, FireUp and OS versions, actions and results. Do not substitute mocked API results for native checks.

## GitHub Actions

The workflow runs the Node checks and packages an unsigned XPI on Windows. It does not sign, publish, run UI checks or automate native Firefox. The first 0.3.0 workflow passed; the updated version's result is visible in the repository's Actions tab.
