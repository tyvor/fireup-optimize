# Release status

This source update is 0.4.2. It reduces repeated work in the automatic unload queue and adds a minimum width to the popup. It also includes the protection fixes from 0.4.1.

The maintainer has completed a manual popup check in Firefox and is preparing the Mozilla submission. GitHub source updates do not update installed copies from the [Mozilla listing](https://addons.mozilla.org/firefox/addon/fireup-optimize/). The prepared texts are in [Mozilla submission](AMO-SUBMISSION.en.md); this document does not confirm that Mozilla has received or published 0.4.2.

[Testing](TESTING.md) describes the checks and the remaining Firefox work. [Performance](PERFORMANCE.md) has the model benchmark and its limits.

## Popup confirmation

The CSS now keeps the body at least 320 pixels wide, including while settings and tab data are still loading. The small-viewport tests pass in Chromium. After trying 0.4.2 in Firefox, the maintainer reported that the panel opens normally and that the previous narrow-strip problem was no longer occurring in the manual check.

## Remaining work

Record the native Firefox matrix and real RAM/CPU measurements before making performance claims for browser workloads. The working-set index uses extra memory to avoid repeated scans, and activity metadata is still copied at queue checkpoints. Those costs are included in the model comparison.

Search-results scope and preview, quick site exclusion, timed pause and a small local diagnostic log remain possible later additions. None is part of 0.4.2.
