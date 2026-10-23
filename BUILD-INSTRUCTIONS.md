# Build instructions

The add-on is plain WebExtension source. No transpilation, bundling, minification, npm installation or compilation is needed. JavaScript is human-readable. The compact CSS is authored directly and has no separate generated input. The extension has no runtime package dependencies.

## Package

ZIP the CONTENTS of `extension/` with `manifest.json` at the archive root. Use `.xpi` as the filename extension. Only files under `extension/` belong in the add-on package; repository documentation, screenshots and tests do not.

On Windows, run:

```powershell
powershell -NoProfile -File .\Build.ps1
```

PowerShell 7 can also run `pwsh -NoProfile -File ./Build.ps1`. The script uses the standard .NET ZIP implementation and writes `dist/FireUp-<manifest version>-unsigned.xpi`. It performs no network operations. ZIP metadata and compression can differ between builds; compare uncompressed file contents rather than archive hashes.

Unsigned archives are for Mozilla submission or development. Regular Firefox requires Mozilla signing for permanent installation.

## Tests

Node.js 22 or newer:

```sh
npm test
```

These engine, policy and localization tests use Node's built-in runner and mocked Firefox APIs. They require no installed npm dependencies.

Optional UI tests use Playwright 1.62.1 with Chromium:

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
npm run test:ui
```

`FIREUP_BROWSER` can point to a Chromium executable. The script writes test output to `work/`, root `preview-*.png` and `ui-checks.json`; these are ignored by Git. This test does not run native Firefox APIs. See [docs/TESTING.md](docs/TESTING.md) for coverage and native checks.

## Language

English and Russian interface strings are packaged in i18n.js. Native manifest messages live in _locales/en and _locales/ru. Browser-default language uses browser.i18n.getUILanguage(); a saved local preference can override it. Settings transfer format 2 includes that preference; format 1 from 0.3.0 migrates to auto.

## Reviewer architecture notes

Background scripts load in order: policy, settings transfer, engine, event listeners. The background page is nonpersistent. Alarms wake queued work. `storage.session` carries the pending queue and short-lived metadata between background-page lifetimes; it resets after the browser fully exits. `storage.local` holds settings and the install-grace deadline. `sessions.setTabValue` holds manual per-tab protections.

No remote code, content scripts, server component, analytics, or website requests are used by the extension. Optional JSON import uses strict schema validation and never evaluates input. Export includes settings and excluded domains, not open-tab URLs. Pending queues and quick-return markers do retain tab URLs locally during a browser session. See [PRIVACY.md](PRIVACY.md).
