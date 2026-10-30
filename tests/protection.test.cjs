'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { harness } = require('./harness.cjs');
const key = '1:fireup-protected';
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }

test('a delayed unprotected read cannot overwrite an acknowledged permanent protection', async () => {
  const h = harness({ count: 1 }), entered = deferred(), response = deferred();
  h.browser.sessions.getTabValue = async () => { entered.resolve(); return response.promise; };
  const reading = h.engine.snapshot(); await entered.promise;
  await h.engine.setProtection(1, 'permanent'); response.resolve(undefined);
  assert.equal((await reading).tabs[0].protection.mode, 'permanent');
  assert.equal(h.values.get(key).mode, 'permanent');
  await h.engine.start(true); await h.drain(); assert.equal(h.calls.discard, 0);
});

test('a delayed protected read cannot restore protection after explicit removal', async () => {
  const h = harness({ count: 1 }), entered = deferred(), response = deferred();
  h.browser.sessions.getTabValue = async () => { entered.resolve(); return response.promise; };
  const reading = h.engine.snapshot(); await entered.promise;
  await h.engine.setProtection(1, 'none'); response.resolve({ mode: 'permanent', until: 0 });
  assert.equal((await reading).tabs[0].protection, null);
  assert.equal(h.values.get(key), false);
});

for (const renewal of ['permanent', '30', '60']) for (const renewalFirst of [true, false]) {
  test(`old expiry preserves ${renewal} renewal (${renewalFirst ? 'renewal' : 'expiry'} queued first)`, async () => {
    const h = harness({ count: 1 }); await h.engine.setProtection(1, '30'); h.advance(31 * 60000);
    const renew = () => h.engine.setProtection(1, renewal), expire = () => h.engine.alarm('fireup-expiry');
    await Promise.all(renewalFirst ? [renew(), expire()] : [expire(), renew()]);
    const stored = h.values.get(key), state = await h.engine.snapshot();
    assert.equal(stored.mode, renewal === 'permanent' ? 'permanent' : 'timed');
    if (renewal !== 'permanent') assert.equal(stored.until, h.time() + Number(renewal) * 60000);
    assert.deepEqual(state.tabs[0].protection, stored);
    await h.engine.start(true); await h.drain(); assert.equal(h.calls.discard, 0);
  });
}

test('a pending protection prevents discard while its session write is unresolved', async () => {
  const h = harness({ count: 1 }), entered = deferred(), response = deferred();
  await h.engine.start(true);
  const write = h.browser.sessions.setTabValue;
  h.browser.sessions.setTabValue = async (...args) => { entered.resolve(); await response.promise; return write(...args); };
  const protecting = h.engine.setProtection(1, 'permanent'); await entered.promise;
  await h.engine.tick(); assert.equal(h.calls.discard, 0);
  response.resolve(); await protecting;
  assert.equal((await h.engine.snapshot()).tabs[0].protection.mode, 'permanent');
});

test('a failed protection write releases the lock and a later retry succeeds', async () => {
  const h = harness({ count: 1 }), write = h.browser.sessions.setTabValue;
  h.browser.sessions.setTabValue = async () => { throw Error('session unavailable'); };
  await assert.rejects(h.engine.setProtection(1, 'permanent'), /session unavailable/);
  h.browser.sessions.setTabValue = write;
  await h.engine.setProtection(1, '60');
  assert.equal((await h.engine.snapshot()).tabs[0].protection.mode, 'timed');
  await h.engine.start(true); await h.drain(); assert.equal(h.calls.discard, 0);
});

test('an in-flight read does not repopulate session cache after its tab closes', async () => {
  const h = harness({ count: 1 }), entered = deferred(), response = deferred();
  h.browser.sessions.getTabValue = async () => { entered.resolve(); return response.promise; };
  const reading = h.engine.snapshot(); await entered.promise;
  await h.engine.removed(1); response.resolve({ mode: 'permanent', until: 0 }); await reading;
  assert.equal(Object.hasOwn(h.session.state.protections, '1'), false);
});
