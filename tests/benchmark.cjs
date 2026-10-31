'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const { harness, P } = require('./harness.cjs');
const T = require('../extension/transfer.js'), workingSet = require('../extension/working-set.js');
const root = path.resolve(__dirname, '..'), baseline = process.argv[2] && path.resolve(process.argv[2]);
const repeats = 5, median = values => [...values].sort((a, b) => a - b)[values.length >> 1];
function factory(source, copies) {
  const context = { FireUpPolicy: P, FireUpTransfer: T, createFireUpWorkingSet: workingSet, console, setTimeout, clearTimeout,
    structuredClone(value) {
      copies.bytes += Buffer.byteLength(JSON.stringify(value)); copies.count++;
      const begun = performance.now(), result = structuredClone(value); copies.ms += performance.now() - begun; return result;
    }
  };
  vm.runInNewContext(fs.readFileSync(source, 'utf8'), context, { filename: source });
  return context.createFireUp;
}
async function trial(source, count) {
  const copies = { count: 0, bytes: 0, ms: 0 }, h = harness({ count, keepRecent: 10, createEngine: factory(source, copies) });
  await h.engine.ready; global.gc?.(); const beforeHeap = process.memoryUsage().heapUsed;
  const begun = performance.now(); await h.engine.start(false); const queuedAt = performance.now();
  global.gc?.(); const queuedHeapDelta = process.memoryUsage().heapUsed - beforeHeap;
  const resumedAt = performance.now(); await h.drain(); const elapsed = queuedAt - begun + performance.now() - resumedAt;
  assert.equal(h.calls.discard, count - 10);
  const queue = { ...h.calls }, queueCopies = { ...copies }; h.resetCalls();
  await h.engine.snapshot(); h.resetCalls();
  for (let i = 0; i < 10; i++) await h.engine.snapshot();
  return { listQueries: queue.query, queriedTabs: queue.queriedTabs, discarded: queue.discard, targetedReads: queue.get,
    stateWrites: queue.stateWrites, serializedWriteBytes: queue.stateBytes, storageCloneMs: queue.storageCloneMs,
    engineCloneCount: queueCopies.count, engineCloneBytes: queueCopies.bytes, engineCloneMs: queueCopies.ms,
    modelElapsedMs: elapsed, queuedHeapDeltaBytes: queuedHeapDelta, tenUnchangedSnapshotWrites: h.calls.stateWrites };
}
(async () => {
  const variants = [...(baseline ? [['0.4.1', path.join(baseline, 'extension/engine.js')]] : []), ['0.4.2', path.join(root, 'extension/engine.js')]];
  const rows = [];
  for (const count of [100, 500, 1000]) for (const [version, source] of variants) {
    await trial(source, count);
    const trials = [];
    for (let i = 0; i < repeats; i++) trials.push(await trial(source, count));
    const row = { version, tabs: count, keepRecent: 10, repeats };
    for (const key of Object.keys(trials[0])) row[key] = median(trials.map(result => result[key]));
    rows.push(row);
  }
  const report = { environment: { node: process.version, platform: process.platform, architecture: process.arch, explicitGC: Boolean(global.gc) },
    method: 'Five in-process model trials after one warm-up; median per metric. Timed work excludes explicit GC. Storage serializes and clones plain data in memory. No real tab pages, Firefox processes, IPC, alarm delays or 40 ms throttle. Heap delta is retained Node heap after queuing, not peak browser RAM. Byte counts are UTF-8 JSON proxy sizes, not Firefox storage allocation.', rows };
  fs.mkdirSync(path.join(root, 'checks'), { recursive: true });
  fs.writeFileSync(path.join(root, 'checks/queue-benchmark.json'), JSON.stringify(report, null, 2));
  console.table(rows);
})().catch(error => { console.error(error); process.exitCode = 1; });
