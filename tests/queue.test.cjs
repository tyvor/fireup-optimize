'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { harness } = require('./harness.cjs');
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }

for (const count of [100, 500, 1000]) test(`${count}-tab automatic queue uses one list query and keeps its working set`, async () => {
  const h = harness({ count, keepRecent: 10 });
  await h.engine.start(false); await h.drain();
  assert.equal(h.calls.query, 1); assert.equal(h.calls.queriedTabs, count);
  assert.equal(h.calls.discard, count - 10);
  assert.deepEqual(h.tabs.filter(t => !t.discarded).map(t => t.id), Array.from({ length: 10 }, (_, i) => count - 9 + i));
  assert.equal(h.session.queueItems, null);
});

test('unchanged snapshots do not clone and rewrite session state', async () => {
  const h = harness({ count: 100 }); await h.engine.snapshot(); h.resetCalls();
  for (let i = 0; i < 10; i++) await h.engine.snapshot();
  assert.equal(h.calls.stateWrites, 0); assert.equal(h.calls.sessionReads, 0);
});

test('queue items are saved once, progress checkpoints contain only queue status', async () => {
  const h = harness({ count: 100 }); await h.engine.start(false);
  assert.equal(h.session.queueItems.length, 99); assert(!Object.hasOwn(h.session.state.queue, 'items'));
  assert.equal(h.calls.queueItemWrites, 1);
  await h.engine.tick(); assert.equal(h.calls.queueItemWrites, 1);
  await h.drain(); assert.equal(h.calls.queueItemWrites, 2); assert.equal(h.session.queueItems, null);
});

test('automatic queue rebuilds once after wake and then uses targeted checks', async () => {
  const h = harness({ count: 100, keepRecent: 10 }); await h.engine.start(false); await h.engine.tick();
  const resumed = h.restart(); await resumed.initialize(); h.resetCalls(); await h.drain(resumed);
  assert.equal(h.calls.query, 1); assert.equal(h.tabs.filter(t => t.discarded).length, 90);
});

test('a 0.4.1 queue checkpoint migrates without dropping its remaining items', async () => {
  const h = harness({ count: 20 }); await h.engine.start(false); await h.engine.tick();
  h.session.state.queue.items = h.session.queueItems; delete h.session.queueItems;
  const resumed = h.restart(); await resumed.initialize(); await h.drain(resumed);
  assert.equal(h.session.state.lastRun.slept, 19); assert.equal(h.session.queueItems, null);
});

test('a checkpoint missing its queue items fails closed', async () => {
  const h = harness({ session: { state: { queue: { manual: false, cursor: 0 } } } });
  await h.engine.initialize(); await h.engine.tick(); assert.equal(h.calls.discard, 0);
  assert.equal((await h.engine.snapshot()).queue, null);
});

test('closing recent tabs during a candidate read protects their replacements in the same batch', async () => {
  const h = harness({ count: 4, keepRecent: 2 }); await h.engine.start(false);
  const get = h.browser.tabs.get;
  h.browser.tabs.get = async id => {
    if (id === 1) { h.tabs.splice(2, 2); await h.engine.removed(3); await h.engine.removed(4); }
    return get(id);
  };
  await h.drain(); assert.equal(h.calls.discard, 0); assert.equal(h.calls.query, 1);
});

test('discard and internal-page events immediately promote the next eligible tabs', async () => {
  const h = harness({ count: 4, keepRecent: 2 }); await h.engine.start(false);
  h.tabs[3].discarded = true; await h.engine.updated(4, { discarded: true }, h.tabs[3]);
  h.tabs[2].url = 'about:blank'; await h.engine.updated(3, { url: 'about:blank' }, h.tabs[2]);
  await h.drain(); assert.equal(h.calls.discard, 0); assert.equal(h.calls.query, 1);
});

test('restored and newly created tabs update the working set without another query', async () => {
  const h = harness({ count: 4, keepRecent: 1 }); await h.engine.start(false);
  h.tabs[0].lastAccessed = h.time(); await h.engine.updated(1, { discarded: false }, h.tabs[0]);
  const added = { ...h.tabs[0], id: 5, lastAccessed: h.time() + 1 }; h.tabs.push(added);
  await h.engine.activity(5, 'navigation', added);
  await h.drain();
  assert(!h.tabs[0].discarded); assert(!added.discarded); assert.equal(h.calls.query, 1);
});

test('events received during a full query override its older tab list', async () => {
  const h = harness({ count: 4, keepRecent: 1 }), entered = deferred(), response = deferred();
  const listed = structuredClone(h.tabs);
  h.browser.tabs.query = async () => { entered.resolve(); return response.promise; };
  const starting = h.engine.start(false); await entered.promise;
  h.tabs.splice(3, 1); await h.engine.removed(4);
  h.tabs[0].lastAccessed = h.time(); await h.engine.activity(1, 'user', h.tabs[0]);
  response.resolve(listed); await starting; await h.drain();
  assert(!h.tabs[0].discarded); assert.equal(h.calls.discard, 2);
});

test('unresolved activity blocks automatic discard until its working-set update is known', async () => {
  const h = harness({ count: 4, keepRecent: 1 }); await h.engine.start(false);
  const get = h.browser.tabs.get, response = deferred(), entered = deferred();
  h.browser.tabs.get = async id => { if (id === 4) { entered.resolve(); await response.promise; } return get(id); };
  const activating = h.engine.activity(4, 'user'); await entered.promise;
  await h.engine.tick(); assert.equal(h.calls.discard, 0); response.resolve(); await activating;
});

test('a failed checkpoint can be retried without losing the queue item list', async () => {
  const h = harness({ count: 20 }), set = h.browser.storage.session.set;
  h.browser.storage.session.set = async () => { throw Error('storage unavailable'); };
  const error = console.error; console.error = () => {};
  try { await assert.rejects(h.engine.start(false), /storage unavailable/); } finally { console.error = error; }
  h.browser.storage.session.set = set; await h.engine.snapshot();
  assert.equal(h.session.queueItems.length, 19); assert(!Object.hasOwn(h.session.state.queue, 'items'));
  await h.drain(); assert.equal(h.calls.discard, 19);
});

test('an activity read arriving after tab closure cannot repopulate the working set', async () => {
  const h = harness({ count: 4, keepRecent: 1 }), entered = deferred(), response = deferred();
  await h.engine.start(false);
  const get = h.browser.tabs.get, old = structuredClone(h.tabs[3]);
  h.browser.tabs.get = async id => { if (id === 4) { entered.resolve(); return response.promise; } return get(id); };
  const activating = h.engine.activity(4, 'user'); await entered.promise;
  h.tabs.splice(3, 1); await h.engine.removed(4); response.resolve(old); await activating;
  await h.drain(); assert(!h.tabs[2].discarded); assert.equal(h.calls.discard, 2);
  assert.equal(h.session.state.meta['4'], undefined);
});

test('a state change during a candidate read invalidates the candidate', async () => {
  const h = harness({ count: 3 }); await h.engine.start(false);
  const get = h.browser.tabs.get;
  h.browser.tabs.get = async id => {
    const tab = await get(id);
    if (id === 1) { h.tabs[0].audible = true; await h.engine.updated(1, { audible: true }, h.tabs[0]); }
    return tab;
  };
  await h.drain(); assert(!h.tabs[0].discarded);
});
