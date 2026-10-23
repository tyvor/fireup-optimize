# Contributing

Use [GitHub Issues](https://github.com/tyvor/fireup-optimize/issues) for bugs and suggestions. Choose **Bug report** or **Feature request**. English and Russian reports are welcome.

For a bug, include FireUp, Firefox and OS versions, exact steps, expected and actual behavior. For unloading problems, include the tab count, working-set size, timer and protection state. Mention a domain only if you can disclose it publicly.

Issues and attachments are public. Do not upload Firefox profiles, cookies, tokens, browsing history or account data. Remove private domains from settings exports and redact tab titles and URLs in screenshots.

## Code changes

For a large change, describe the problem in an issue first. Small fixes can be submitted as pull requests. Explain the behavior change and how you verified it. Preserve local data processing, minimal permissions and explicit protection for important tabs.

Run `npm test` for policy, engine and localization checks. `npm run test:ui` runs UI checks with Chromium and mocked APIs after installing Playwright. Changes involving browser APIs also need testing in real Firefox. See [BUILD-INSTRUCTIONS.md](BUILD-INSTRUCTIONS.md).

Do not commit personal exports, browser profiles, logs or generated packages from `dist/`. New interface text needs English and Russian translations. Keep English as the fallback and test both browser-default and manual language selection.

Contributions use the project's [MIT license](LICENSE).
