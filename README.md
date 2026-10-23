# FireUp

FireUp unloads idle Firefox tabs to reduce their memory use. Tabs stay in your browser and reload when you return to them.

By default, FireUp keeps your 10 most recently used tabs loaded and lets other tabs sleep after 10 minutes of inactivity. Both settings are adjustable. Requires desktop Firefox 140 or later. Android support has not been verified.

![FireUp tab panel in the light theme](docs/images/popup-light.png)

Screenshots use demonstration tabs. They show the interface, not measured memory savings.

## Protect important tabs first

Protect tabs containing unsaved text, editors or silent playback before unloading. Use **Protect**, the tab context menu, or a site exclusion in settings. FireUp does not read page contents and cannot detect every unsaved form or playback state. Unloading a page may lose unsaved data.

Active tabs in each window, pinned tabs, audible tabs and browser-reported camera, microphone or screen sharing are skipped. Private tabs and pages outside HTTP/HTTPS are excluded. The first installation includes a grace period to set up protections.

## Features

- Automatic unloading with a recent working set and idle timer.
- Manual unloading for the current window, all windows, selected tabs or a site. Preview the candidate count and stop a running queue.
- Per-tab protection for 30 minutes, one hour or until removed. Domain exclusions also protect subdomains.
- Longer automatic sleep delays after a quick return to a tab unloaded by FireUp.
- Search, filters, light, dark and system themes.
- Local settings export and import with validation and a preview before replacing settings.
- English and Russian interfaces, initially selected from the Firefox interface language.

Manual unloading ignores the working set and automatic delays while respecting tab protections and site exclusions. **Alt+Shift+U** applies to all windows; the popup defaults to the current window. Pausing automatic sleep leaves manual unloading available.

## Language

Open **Settings → Language** and choose **Browser default**, **English** or **Русский**. Browser default uses Firefox's interface language: Russian selects Russian; other unsupported languages fall back to English. A manual choice is saved locally and also applies to the tab context menu and shortcut description. Save settings to persist your choice.

Settings exports include the language preference. Version 0.4.0 writes format 2 and also accepts format 1 exports from 0.3.0; importing a legacy file restores Browser default. Version 0.3.0 cannot import format 2.

## Installation

A public Mozilla listing is not available yet. Unsigned XPI files are intended for Mozilla submission or development; regular Firefox requires Mozilla signing for permanent installation.

For development, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, then select `extension/manifest.json`. Temporary installations last until Firefox restarts. See [BUILD-INSTRUCTIONS.md](BUILD-INSTRUCTIONS.md) for packaging and [docs/PUBLISHING.md](docs/PUBLISHING.md) for release preparation.

## Data and permissions

FireUp processes tab metadata locally: URLs, titles, state and access times support its list, exclusions and unloading rules. It does not transmit this information to its developer. It has no analytics, advertising or server component and does not read page contents or form text.

Preferences and excluded domains stay in the Firefox profile. Temporary activity records and pending candidate URLs stay in session storage until the browser fully exits. Per-tab protections use Firefox's sessions API and may be restored with a tab. Exported settings include excluded domains, not open-tab URLs or per-tab protections.

Read [PRIVACY.md](PRIVACY.md) and the [permission explanations](docs/PERMISSIONS.md).

## Bugs and suggestions

Use [GitHub Issues](https://github.com/tyvor/fireup-optimize/issues). Bug reports ask for Firefox, FireUp and OS versions, reproduction steps, expected and actual behavior. A separate form is available for feature requests. Reports may be written in English or Russian.

Issues and attachments are public. Do not post Firefox profiles, cookies, tokens, browsing history or private URLs. Redact screenshots and remove private domains from settings exports before sharing. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Runtime sources are in `extension/`. There is no JavaScript build step or runtime npm dependency. Use Node.js 22 or later for the policy, engine and localization tests:

```sh
npm test
```

Optional UI checks use Playwright with Chromium and mocked Firefox APIs:

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
npm run test:ui
```

These checks do not replace testing native Firefox APIs. See [docs/TESTING.md](docs/TESTING.md) for coverage and limitations.

## Limits and license

FireUp uses `tabs.discard`; it does not close tabs or terminate processes. Memory savings depend on the pages and Firefox. No fixed number of megabytes or percentage reduction is promised. Firefox can decline an unload request, and displayed sleep deadlines are approximate.

Source code is available under the [MIT license](LICENSE).
