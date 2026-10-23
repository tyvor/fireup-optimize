'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { P, harness } = require('./harness.cjs');
const T = require('../extension/transfer.js');
async function sleepOne(h, app = h.engine) { await app.start(true, { type: 'selected', ids: [1] }); await h.drain(app); }
async function returnOne(h, app = h.engine) { h.advance(30000); h.tabs[0].discarded = false; h.tabs[0].lastAccessed = h.time(); await app.activity(1, 'user'); }
test('quick return after an owned successful discard doubles automatic delay', async () => {
  const h = harness(); await sleepOne(h); await returnOne(h); const state = await h.engine.snapshot(), t = state.tabs[0];
  assert.equal(t.antiThrashUntil, h.time() + 20 * 60000); assert.equal(t.deadline, t.antiThrashUntil);
  h.advance(11 * 60000); await h.engine.activity(6, 'user');
  await h.engine.start(false); await h.drain(); assert.equal(h.tabs[0].discarded, false);
});
test('explicit manual sleep bypasses the backoff', async () => {
  const h = harness(); await sleepOne(h); await returnOne(h); await sleepOne(h); assert(h.tabs[0].discarded);
});
test('repeated quick returns increase delay and cap it at two hours', async () => {
  const h = harness();
  for (const minutes of [20, 40, 80, 120, 120]) { await sleepOne(h); await returnOne(h); const state = await h.engine.snapshot(); assert.equal(state.tabs[0].antiThrashUntil, h.time() + minutes * 60000); }
});
test('a gap longer than six hours resets the series', async () => {
  const h = harness(); await sleepOne(h); await returnOne(h); h.advance(7 * 3600000); await sleepOne(h); await returnOne(h);
  assert.equal((await h.engine.snapshot()).tabs[0].antiThrashUntil, h.time() + 20 * 60000);
});
test('late return, unrelated discard and background reload do not grant a hold', async () => {
  const late = harness(); await sleepOne(late); late.advance(121000); late.tabs[0].discarded = false; await late.engine.activity(1, 'user'); assert.equal((await late.engine.snapshot()).tabs[0].antiThrashUntil, 0);
  const other = harness(); other.tabs[0].discarded = true; await other.engine.updated(1, { discarded: true }, other.tabs[0]); other.tabs[0].discarded = false; await other.engine.activity(1, 'user'); assert.equal((await other.engine.snapshot()).tabs[0].antiThrashUntil, 0);
  const background = harness(); await sleepOne(background); background.tabs[0].discarded = false; await background.engine.updated(1, { discarded: false }, background.tabs[0]); assert.equal((await background.engine.snapshot()).tabs[0].antiThrashUntil, 0);
});
test('a no-op discard cannot create an owned return marker', async () => {
  const h = harness(); h.browser.tabs.discard = async () => {}; await sleepOne(h); await returnOne(h); assert.equal((await h.engine.snapshot()).tabs[0].antiThrashUntil, 0);
});
test('reload at another address cannot give the old page a hold', async () => {
  const h = harness(); await sleepOne(h); h.tabs[0].url = 'https://elsewhere.org/editor'; await returnOne(h); assert.equal((await h.engine.snapshot()).tabs[0].antiThrashUntil, 0);
});
test('return marker is consumed once per discard', async () => {
  const h = harness(); await sleepOne(h); await returnOne(h); const first = (await h.engine.snapshot()).tabs[0].antiThrashUntil;
  h.advance(10000); await h.engine.activity(1, 'user'); assert.equal((await h.engine.snapshot()).tabs[0].antiThrashUntil, first);
});
test('backoff survives event-page suspension and disappears when disabled', async () => {
  const h = harness(); await sleepOne(h); await returnOne(h); await h.engine.snapshot(); const next = h.restart();
  assert((await next.snapshot()).tabs[0].antiThrashUntil > h.time());
  await next.saveSettings({ antiThrash: false }); assert.equal((await next.snapshot()).tabs[0].antiThrashUntil, 0);
  await next.saveSettings({ antiThrash: true }); assert.equal((await next.snapshot()).tabs[0].antiThrashUntil, 0);
});
test('return arriving before post-discard inspection is still recognized after confirmed event', async () => {
  const h = harness(), discard = h.browser.tabs.discard;
  h.browser.tabs.discard = async id => { await discard(id); await h.engine.updated(id, { discarded: true }, h.tabs[0]); h.advance(1000); h.tabs[0].discarded = false; await h.engine.activity(id, 'user'); };
  await sleepOne(h); assert((await h.engine.snapshot()).tabs[0].antiThrashUntil > h.time());
});
test('export/import round trip contains settings only and preserves fields', async () => {
  const h = harness(); await h.engine.saveSettings({ enabled: false, theme: 'dark', antiThrash: false, sites: ['EXAMPLE.org'] }); await h.engine.setProtection(1, 'permanent');
  const text = await h.engine.exportSettings(), doc = T.parse(text);
  assert.equal(doc.formatVersion, 2); assert.equal(doc.settings.sites[0], 'example.org');
  assert.equal(doc.settings.antiThrash, false); assert.equal(text.includes('https://'), false);
  assert.deepEqual(Object.keys(doc.settings).sort(), ['antiThrash', 'enabled', 'idleMinutes', 'keepRecent', 'language', 'sites', 'theme']);
  const next = harness(); await next.engine.importSettings(text); assert.deepEqual(await next.engine.getSettings(), doc.settings);
});
test('preview is read-only and settings operations do not scan tabs', async () => {
  const h = harness({ count: 500 }), text = T.serialize(P.settings({ keepRecent: 7 }));
  await h.engine.getSettings(); await h.engine.exportSettings(); await h.engine.previewImport(text);
  assert.equal((await h.engine.getSettings()).keepRecent, 1); assert.equal(h.calls.query, 0); assert.equal(h.calls.sessionReads, 0);
});
test('invalid schema, types, bounds, sites and unsupported formats are rejected without mutation', async () => {
  const h = harness(), good = JSON.parse(await h.engine.exportSettings()); const before = await h.engine.getSettings();
  const mutations = [d => d.application = 'Other', d => d.formatVersion = 3, d => d.settings.keepRecent = 0, d => d.settings.keepRecent = '10', d => d.settings.idleMinutes = 1441, d => d.settings.enabled = 1, d => d.settings.antiThrash = 'true', d => d.settings.theme = 'auto', d => d.settings.sites = ['*.example.org'], d => d.settings.sites = ['https://example.org/path'], d => d.settings.sites = Array(501).fill('example.org'), d => d.settings.unknown = true, d => delete d.settings.enabled, d => d.tabs = [{ url: 'https://example.org' }], d => d.exportedAt = 'garbage'];
  for (const mutate of mutations) { const bad = structuredClone(good); mutate(bad); await assert.rejects(h.engine.importSettings(JSON.stringify(bad))); assert.deepEqual(await h.engine.getSettings(), before); }
  for (const raw of ['null', '[]', '{}', '{', JSON.stringify(good).replace('"settings":', '"__proto__":{},"settings":')]) await assert.rejects(h.engine.importSettings(raw));
});
test('large and multibyte oversized files are rejected by UTF-8 byte limit', () => {
  assert.throws(() => T.parse(' '.repeat(T.MAX_BYTES + 1)), /256/);
  assert.throws(() => T.parse('я'.repeat(T.MAX_BYTES / 2 + 1)), /256/);
});
test('BOM is accepted and domains normalize and deduplicate', () => {
  const doc = JSON.parse(T.serialize(P.settings())); doc.settings.sites = ['EXAMPLE.org', 'https://example.org/'];
  assert.deepEqual(T.parse('\uFEFF' + JSON.stringify(doc)).settings.sites, ['example.org']);
});
test('failed local write preserves active settings during import', async () => {
  const h = harness(), old = await h.engine.getSettings(); h.browser.storage.local.set = async () => { throw Error('storage unavailable'); };
  await assert.rejects(h.engine.importSettings(T.serialize(P.settings({ keepRecent: 9 })))); assert.deepEqual(await h.engine.getSettings(), old);
});
test('expired tracking data is pruned during existing snapshots without extra timers', async () => {
  const h = harness(); await sleepOne(h); h.advance(121000); await h.engine.snapshot(); assert.equal(h.session.state.meta['1'].lastUnload, undefined);
  h.tabs[0].discarded = false; await h.engine.activity(1, 'user'); await sleepOne(h); await returnOne(h);
  assert((await h.engine.snapshot()).tabs[0].antiThrashUntil > h.time()); h.advance(7 * 3600000); await h.engine.snapshot();
  assert.equal(h.session.state.meta['1'].holdUntil, undefined); assert.equal(h.session.state.meta['1'].returnCount, undefined);
});
