# Build instructions

FireUp runs from the files in `extension/`. There is no compiler, bundler or minifier, and the installed extension has no npm dependencies. The compact CSS is the source itself, not generated output.

## Make an XPI

On Windows, run this from the repository root:

```powershell
powershell -NoProfile -File .\Build.ps1
```

PowerShell 7 works too:

```sh
pwsh -NoProfile -File ./Build.ps1
```

The script puts `FireUp-<version>-unsigned.xpi` in `dist/`. It only ZIPs the source files and doesn't use the network.

You can make the same package with any ZIP tool. Archive the contents of `extension/`, so `manifest.json` is at the archive root, then use `.xpi` as the extension. Leave out the docs, tests and repository files.

ZIP tools can produce different timestamps and compression. To compare two packages, compare their extracted files rather than their archive hashes.

An unsigned XPI is for development or submission to Mozilla. Release and beta Firefox require Mozilla's signature for permanent installation. For ordinary use, [install FireUp from Firefox Add-ons](https://addons.mozilla.org/firefox/addon/fireup-optimize/). See [Publishing](docs/PUBLISHING.md) for signing and update instructions.

## Run the checks

The logic tests use Node's built-in test runner. With Node.js 22 or newer, run:

```sh
npm test
```

UI tests and Mozilla validation need the development dependencies pinned in `package-lock.json`:

```sh
npm ci
npx playwright install chromium
npm run check:source
npm run test:ui
npm run lint:addon
```

Set `FIREUP_BROWSER` if you want the UI tests to use an existing Chromium executable. The tests create their temporary directories and write previews and reports beside the source; those generated files are ignored by Git.

The UI checks run in Chromium with modeled Firefox APIs. [Testing](docs/TESTING.md) describes their coverage and the checks in Firefox.

## Source layout

The background scripts load localization, policy rules, settings transfer, the working-set index, the engine, then browser event listeners. Firefox can suspend the background page; alarms wake it when work is due. The recent-tab index is rebuilt on the first automatic batch after a wake, not saved to storage.

`storage.local` holds settings and the first-install grace deadline. `storage.session` holds the queue and temporary activity records for the current browser run. Stable queue entries use a separate `queueItems` key, written with the initial checkpoint and cleared when the operation ends. Progress remains in `state`; checkpoints from 0.4.1 with inline items also restore. Per-tab protection uses `sessions.setTabValue`. Queue entries and quick-return markers include tab URLs so FireUp can check whether a page changed.

The English and Russian strings are in `i18n.js`. Manifest translations are in `_locales/en` and `_locales/ru`. Settings exports use format 2; imports also accept format 1 from 0.3.0.

No content scripts or website-content permissions are needed. JSON imports are checked as data and never evaluated as code. [PRIVACY.md](PRIVACY.md) covers local storage in more detail.
