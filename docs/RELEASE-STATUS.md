# Release status

This source release is 0.4.1. It fixes the two reproduced protection races and makes the manual unload scope clearer. On October 30, 2026, the [Mozilla listing](https://addons.mozilla.org/firefox/addon/fireup-optimize/) was serving 0.4.0. This GitHub update doesn't submit 0.4.1 to Mozilla.

The checks and their limits are in [Testing](TESTING.md). A basic manual check in Firefox passed, but the full native test matrix and memory measurements are still missing.

## Still open

The panel can reportedly appear as a narrow strip on its first opening. The cause hasn't been reproduced, and 0.4.1 doesn't claim to fix it. Collect cold-start and background-wake measurements before changing the sizing CSS.

## Next

The proposed 0.4.2 work is to stop rescanning every tab for each automatic queue batch. It needs event-driven updates to the recent working set while keeping the final checks immediately before unloading. Measure state-copy and storage costs too, then test 100, 500 and 1000 tabs, working-set changes and background-page wake-up.

Later ideas for 0.5.0 are a search-results scope and preview, quick site exclusion, timed pause and a small local diagnostic log. None of those features is included in 0.4.1.
