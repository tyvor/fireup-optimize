# Queue performance

The automatic queue used to request every tab before each batch of up to eight candidates. With many tabs, most of those records were repeats. Version 0.4.2 maintains the recent working set from activation, creation, closure, navigation and discard events. It rebuilds the index after a background-page wake and still checks each candidate directly before unloading.

The index stores tab IDs and access times, not page contents or another copy of every tab title and URL. Two indexed heaps keep the most recently used tabs separate from the rest. An update or removal takes logarithmic work; checking membership takes constant time. Full queries still happen when selecting a new operation or refreshing the panel, so an open panel adds queries beyond the background-only benchmark below.

## Model comparison

These are local Node.js 24.21.0 measurements on Windows x64 with modeled Firefox APIs, a working set of 10 tabs and five trials after one warm-up. Each row shows medians. They exclude real pages, browser IPC, alarm waits and the 40 ms pacing between candidates.

| Tabs | Full list queries, 0.4.1 → 0.4.2 | Returned tab records | Serialized writes per pass | Model work time |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 13 → 1 | 1300 → 100 | 214843 → 138735 bytes | 8.5 → 5.7 ms |
| 500 | 63 → 1 | 31500 → 500 | 5796691 → 3448092 bytes | 162.0 → 86.2 ms |
| 1000 | 125 → 1 | 125000 → 1000 | 23292209 → 13697986 bytes | 2598.0 → 1352.5 ms |

Both versions unloaded the same number of tabs: 90, 490 and 990. The final candidate reads remain in place. Each pass still writes a progress checkpoint per batch, but the stable queue entries are written only at the start and cleared at completion. Ten unchanged snapshots caused ten session writes on 0.4.1 and none on 0.4.2.

At 1000 tabs, measured engine-side cloning fell from about 670 to 450 ms and the model storage clone from about 707 to 444 ms. Serialization and cloning are instrumented work in this benchmark, so these times are not estimates of Firefox CPU use. JSON byte counts describe data passed to storage, not its actual memory allocation.

The index has a memory cost. The retained Node heap increase after queuing was about 486 KB on 0.4.1 and 587 KB on 0.4.2 at 1000 tabs. This is a noisy GC-based observation, not peak memory or browser RAM. The tradeoff is a small retained index for fewer full scans and temporary copies. Metadata is still copied at checkpoints; that cost has not been eliminated.

## Reproduce it

For the current version:

```sh
npm run benchmark
```

For a before/after comparison, keep an unmodified 0.4.1 checkout next to this one and run:

```sh
node --expose-gc tests/benchmark.cjs ../fireup-0.4.1
```

The script uses the same harness and workload for both engines and writes environment details and clone measurements to `checks/queue-benchmark.json`. Timing and heap values will vary across machines. Query counts, outcomes and storage-write behavior are also covered by regression tests.

Real Firefox RAM, idle CPU and reload latency still need a separate-profile test with fixed pages, repeated runs and identical waits. No measured browser-memory saving is claimed here.
