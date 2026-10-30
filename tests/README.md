# Running the tests

From the repository root, run `npm test` for policy, engine, protection and language checks. These use Node's built-in runner and don't need npm dependencies.

For interface checks, install the pinned dependencies and Chromium as described in [Build instructions](../BUILD-INSTRUCTIONS.md), then run `npm run test:ui`. Those checks use modeled Firefox APIs. [Testing](../docs/TESTING.md) explains the coverage and the remaining Firefox checks.
