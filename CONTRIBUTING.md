# Contributing

Found a bug or have an idea? [Open an issue](https://github.com/tyvor/fireup-optimize/issues). Reports in English or Russian are welcome.

For a bug, include your FireUp, Firefox and OS versions, what you did, what you expected and what happened. If it's about unloading, also include the approximate tab count, working-set size, timer and protection settings. A short reproducible example is more useful than a large browser dump.

Issues and attachments are public. Redact private URLs, tab titles and domains. Please don't upload a Firefox profile, cookies, tokens or browsing history. Settings exports can contain private domain names too.

## Code changes

Small fixes can go straight into a pull request. For a larger change, open an issue first so the problem and approach can be discussed before you spend time on it.

Explain what behavior changes and how you checked it. Run `npm test`; if the change affects the interface, also run `npm run test:ui`. Changes to browser API behavior need a check in real Firefox as well. [Build instructions](BUILD-INSTRUCTIONS.md) cover setup, and [Testing](docs/TESTING.md) lists the checks.

Keep processing local and permissions limited to what the feature needs. Take particular care with tab protection: a successful protection command must not be undone by a stale read or an old expiry timer.

New interface text needs English and Russian translations. English stays the fallback. Check browser-default language selection and the saved override.

Leave browser profiles, personal exports, logs and generated packages out of commits. Contributions use the project's [MIT license](LICENSE).
