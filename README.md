# FireUp

Reduce Firefox's memory use by unloading idle tabs. Keep recent tabs and the sites you choose loaded.

Unloaded tabs stay in the tab bar and reload when you return to them.

[Install from Firefox Add-ons](https://addons.mozilla.org/firefox/addon/fireup-optimize/) · [Report a bug](https://github.com/tyvor/fireup-optimize/issues)

Requires desktop Firefox 140 or newer. The source on GitHub may be ahead of the version available on Mozilla.

![The FireUp tab panel in the light theme](docs/images/popup-light.png)

The screenshot uses demonstration tabs.

## How it works

By default, your 10 most recently used tabs stay loaded. Other tabs can sleep after 10 minutes of inactivity. You can change both values in settings. Protection can keep more than 10 tabs loaded.

Active tabs in each window, pinned tabs and tabs playing audio stay loaded. FireUp also skips calls and screen sharing when Firefox reports them. Private tabs and internal pages such as `about:settings` are excluded.

Use **Protect** to keep a tab loaded for 30 minutes, an hour, or until you remove protection. Site exclusions cover subdomains too. On first installation, a grace period gives you time to set these up before automatic unloading starts.

Protect editors, forms with unsaved text and silent playback yourself. FireUp doesn't read page contents, so it can't reliably recognize all of these. Unloading a page can lose unsaved work.

## Using the panel

Search and filter the tab list, protect tabs, or unload the current window, all windows, selected tabs or a site. The button shows what the command affects and how many tabs are eligible. **Stop** cancels the rest of a running queue.

Search and filters only change what you see in the list. Hidden tabs in the chosen scope are still included in an unload command. Choose **Selected tabs** to act only on checked rows.

A manual command can unload recent tabs and skips automatic waiting periods. It still respects protection and site exclusions. **Alt+Shift+U** runs that command across all windows. Pausing automatic sleep leaves manual commands available.

If you return to a tab within two minutes of FireUp unloading it, its next automatic sleep is delayed. Repeated quick returns increase that delay, up to two hours. You can turn this off in settings.

## Settings and language

Choose a light, dark or system theme. The interface starts in Russian if Firefox uses Russian, and English otherwise. Change and save **Settings → Language** to use your preferred language throughout the extension.

Export settings to a local JSON file or preview an import before applying it. Exports contain preferences, language and excluded domains, without open tabs or per-tab protection. Files from 0.3.0 also import, with the language set to **Browser default**.

## Privacy

Tab information is processed locally and isn't sent to the developer. There are no analytics, ads or external services. Read the [privacy notice](PRIVACY.md) for storage details and [Permissions](docs/PERMISSIONS.md) for the browser access FireUp needs.

## Development

To try the source, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on** and select `extension/manifest.json`. Firefox removes temporary add-ons when it restarts.

The extension runs directly from `extension/`. The logic tests use Node.js 22 or newer and need no npm dependencies:

```sh
npm test
```

See [Build instructions](BUILD-INSTRUCTIONS.md) for packaging and setup, [Testing](docs/TESTING.md) for all checks, and [Performance](docs/PERFORMANCE.md) for the queue benchmark. [Publishing](docs/PUBLISHING.md) covers signed updates through Mozilla.

## Bugs and contributions

[Open an issue](https://github.com/tyvor/fireup-optimize/issues) with your FireUp, Firefox and OS versions and the steps that reproduce the problem. English and Russian reports are welcome. Please redact private tab titles, URLs and domains before attaching files or screenshots. [Contributing](CONTRIBUTING.md) has details for code changes.

Memory savings depend on the pages and Firefox. FireUp uses Firefox's tab-unloading API; it doesn't close tabs or kill processes. Firefox can decline an unload request, and the sleep times shown in the panel are approximate.

FireUp is open source under the [MIT license](LICENSE).
