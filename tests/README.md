# Running the tests

From the repository root, run `npm test` for policy, engine, protection and language checks. These use Node's built-in runner and don't need npm dependencies.

For interface checks, install the pinned dependencies and Chromium as described in [Build instructions](../BUILD-INSTRUCTIONS.md), then run `npm run test:ui`. Those checks use modeled Firefox APIs. [Testing](../docs/TESTING.md) explains the coverage and the remaining Firefox checks.

The queue tests check full-query counts and recovery at 100, 500 and 1000 tabs. The working-set test compares event updates with the original policy across a seeded sequence of changes. The popup-sizing test holds settings loading open while checking the CSS width bounds in each language and theme.

Run `npm run benchmark` for local model timings and copy sizes. [Performance](../docs/PERFORMANCE.md) explains how to compare a 0.4.1 checkout and why those results are not browser-memory measurements.
