'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { P, harness } = require('./harness.cjs');
test('settings migrate old preferences, normalize domains and reject wildcards', () => {
  assert.deepEqual(P.settings({ keepRecent: 8, idleMinutes: 20, sites: ['EXAMPLE.com'] }), { enabled: true, keepRecent: 8, idleMinutes: 20, sites: ['example.com'], theme: 'system', antiThrash: true, language: 'auto' });
  assert.equal(P.settings(null).keepRecent, 10);
  for (const value of ['*.example.com', 'example.com/path', 'https://u:p@example.com', 'example.com:4433', 'file:///a']) assert.throws(() => P.site(value));
});
test('never unloads active, pinned, audible, capture, loading, private and service tabs', () => {
  const c = P.settings(), base = { id: 1, url: 'https://example.org', status: 'complete' };
  for (const patch of [{ active: true }, { pinned: true }, { audible: true }, { sharingState: { camera: true } }, { sharingState: { microphone: true } }, { sharingState: { screen: 'Screen' } }, { status: 'loading' }, { incognito: true }, { url: 'about:config' }, { autoDiscardable: false }]) assert(P.reason({ ...base, ...patch }, c, null));
  assert.equal(P.reason({ ...base, url: 'https://youtube.com/watch?v=1', audible: false }, c, null), '');
});
test('domain exceptions include subdomains without matching suffix impostors', () => {
  const c = P.settings({ sites: ['example.com'] });
  assert.equal(P.reason({ url: 'https://mail.example.com' }, c, null), 'Excluded site');
  assert.equal(P.reason({ url: 'https://evilexample.com' }, c, null), '');
});
test('manual queue skips tabs accessed after initial selection, even after returning to background', async () => {
  const h = harness(); await h.engine.start(true); h.advance(100);
  await h.engine.activity(1, 'user');
  await h.drain(); assert.equal(h.tabs[0].discarded, false); assert.equal(h.session.state.lastRun.skipped, 1);
});
test('navigation generation skips same-URL reload and navigation back', async () => {
  const h = harness(); await h.engine.start(true); h.advance(100);
  await h.engine.updated(1, { status: 'loading' }, h.tabs[0]);
  await h.drain(); assert.equal(h.tabs[0].discarded, false);
});
test('URL changes are checked even without a delivered event', async () => {
  const h = harness(); await h.engine.start(true); h.tabs[0].url = 'https://example.org/new-editor';
  await h.drain(); assert.equal(h.tabs[0].discarded, false);
});
test('background navigation does not enter user working set', async () => {
  const h = harness({ count: 2 }); const before = await h.engine.snapshot();
  await h.engine.updated(1, { status: 'loading' }, h.tabs[0]);
  const after = await h.engine.snapshot();
  assert.equal(before.tabs.find(t => t.recent).id, 2); assert.equal(after.tabs.find(t => t.recent).id, 2);
});
test('paused startup and alarm perform no tab scans or protection reads', async () => {
  const h = harness({ count: 200, enabled: false }); await h.engine.initialize(); await h.engine.alarm('fireup-sweep');
  assert.equal(h.calls.query, 0); assert.equal(h.calls.sessionReads, 0); assert.equal(h.alarms.has('fireup-sweep'), false);
});
test('pause clears automatic alarm and cancels automatic queue', async () => {
  const h = harness(); await h.engine.initialize(); await h.engine.start(false);
  await h.engine.saveSettings({ enabled: false }); await h.drain();
  assert.equal(h.calls.discard, 0); assert.equal(h.alarms.has('fireup-sweep'), false);
  await h.engine.saveSettings({ enabled: true }); assert(h.alarms.has('fireup-sweep'));
});
test('500-tab manual pass uses one complete list scan, then targeted checks', async () => {
  const h = harness({ count: 500 }); await h.engine.snapshot(); h.resetCalls();
  await h.engine.start(true); await h.drain();
  assert.equal(h.calls.query, 1); assert.equal(h.calls.sessionReads, 0); assert.equal(h.calls.discard, 500); assert.equal(h.calls.get, 1000);
});
test('manual queue supports cancellation between small batches', async () => {
  const h = harness({ count: 30 }); await h.engine.start(true); await h.engine.tick();
  assert.equal(h.calls.discard, 8); await h.engine.cancel(); await h.drain();
  assert.equal(h.calls.discard, 8); assert.equal(h.session.state.lastRun.cancelled, true);
});
test('cancellation while checking a candidate prevents its discard', async () => {
  const h = harness({ count: 2 }); await h.engine.start(true);
  const get = h.browser.tabs.get;
  h.browser.tabs.get = async id => { await h.engine.cancel(); return get(id); };
  await h.engine.tick(); assert.equal(h.calls.discard, 0);
});
test('explicit concurrent protection commands produce deterministic final state', async () => {
  const h = harness(); await Promise.all([h.engine.setProtection(1, 'permanent'), h.engine.setProtection(1, 'none')]);
  const state = await h.engine.snapshot(); assert.equal(state.tabs[0].protection, null);
});
test('new protection invalidates pending queue entry', async () => {
  const h = harness(); await h.engine.start(true); await h.engine.setProtection(1, 'permanent');
  await h.drain(); assert.equal(h.tabs[0].discarded, false);
});
test('temporary protection expires and uses one nearest alarm', async () => {
  const h = harness(); await h.engine.setProtection(1, '30'); await h.engine.setProtection(2, '60');
  assert.equal(h.alarms.get('fireup-expiry').when, h.time() + 30 * 60000);
  h.advance(31 * 60000); await h.engine.alarm('fireup-expiry');
  const state = await h.engine.snapshot(); assert.equal(state.tabs[0].protection, null); assert.equal(state.tabs[1].protection.mode, 'timed');
});
test('queue and activity survive event-page restart', async () => {
  const h = harness({ count: 20 }); await h.engine.start(true); await h.engine.tick();
  const resumed = h.restart(); await resumed.initialize(); await h.drain(resumed);
  assert.equal(h.calls.discard, 20); assert.equal(h.session.state.lastRun.slept, 20);
});
test('legacy boolean tab protection migrates without losing it', async () => {
  const h = harness(); h.values.set('1:fireup-protected', true);
  const state = await h.engine.snapshot(); assert.equal(state.tabs[0].protection.mode, 'permanent');
});
test('private activity and state do not read or write tab session values', async () => {
  const h = harness({ count: 1 }); h.tabs[0].incognito = true;
  await h.engine.snapshot(); await h.engine.activity(1, 'user'); await h.engine.updated(1, { status: 'loading' }, h.tabs[0]);
  await assert.rejects(h.engine.setProtection(1, '30'));
  assert.equal(h.calls.sessionReads, 0); assert.equal(h.calls.sessionWrites, 0); assert.equal(h.session.state.meta['1'], undefined);
});
test('no-op discard is counted as skipped rather than a fake success or error', async () => {
  const h = harness({ count: 1 }); h.browser.tabs.discard = async () => {};
  await h.engine.start(true); await h.drain();
  assert.equal(h.session.state.lastRun.slept, 0); assert.equal(h.session.state.lastRun.skipped, 1); assert.equal(h.session.state.lastRun.failed, 0);
});
test('one failed discard does not stop later tabs', async () => {
  const h = harness({ count: 2 }), discard = h.browser.tabs.discard;
  h.browser.tabs.discard = async id => { if (id === 1) throw Error('refused'); return discard(id); };
  await h.engine.start(true); await h.drain(); assert.equal(h.session.state.lastRun.failed, 1); assert.equal(h.session.state.lastRun.slept, 1);
});
test('failed protection lookup fails closed', async () => {
  const h = harness(); h.browser.sessions.getTabValue = async () => { throw Error('unavailable'); };
  await h.engine.start(true); await h.drain(); assert.equal(h.calls.discard, 0);
});
test('first installation gives grace which is not restarted on event-page wake', async () => {
  const h = harness(); await h.engine.installed(); const deadline = h.local.firstRunUntil;
  await h.engine.start(false); assert.equal(h.calls.query, 0);
  h.advance(60000); await h.restart().installed(); assert.equal(h.local.firstRunUntil, deadline);
});
test('scope and approved list exclude unseen, other-window and other-site tabs', async () => {
  const h = harness({ count: 4 }); h.tabs[1].windowId = 2; h.tabs[2].url = 'https://other.org';
  await h.engine.start(true, { type: 'window', windowId: 1 }, [1, 2]); await h.drain();
  assert.deepEqual(h.tabs.filter(t => t.discarded).map(t => t.id), [1]);
  await h.engine.start(true, { type: 'site', host: 'other.org' }); await h.drain(); assert(h.tabs[2].discarded);
});
test('deadline and recent set keep eligible grace and actual user access separate', () => {
  const h = harness({ count: 2 });
  assert.equal(P.deadline(h.tabs[0], P.settings(), { navAt: h.time() }), h.time() + 30000);
  assert.equal(P.deadline({ lastAccessed: 0 }, P.settings()), Infinity);
});
test('automatic queue reevaluates the working set after recent tabs close', async () => {
  const h = harness({ count: 4, keepRecent: 2 }); await h.engine.start(false);
  h.tabs.splice(2, 2); await h.engine.removed(3); await h.engine.removed(4);
  await h.drain(); assert.equal(h.calls.discard, 0);
});
test('activation tracking does not scan all tabs or write durable tab metadata', async () => {
  const h = harness(); await h.engine.activity(1, 'user'); await h.engine.activity(2, 'user');
  assert.equal(h.calls.query, 0); assert.equal(h.calls.sessionWrites, 0);
});
test('empty automatic selection does not schedule a second wake-up', async () => {
  const h = harness({ count: 2, keepRecent: 10 }); await h.engine.start(false);
  assert.equal(h.session.state.queue, null); assert.equal(h.alarms.has('fireup-queue'), false);
});
