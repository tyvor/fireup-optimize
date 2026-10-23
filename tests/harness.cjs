'use strict';
const P = require('../extension/policy.js');
require('../extension/transfer.js');
const create = require('../extension/engine.js');
function harness({ count = 6, enabled = true, keepRecent = 1, idleMinutes = 10, local: initialLocal = {}, session: initialSession = {}, tabs: initialTabs } = {}) {
  let time = 1800000000000;
  const tabs = initialTabs || Array.from({ length: count }, (_, i) => ({ id: i + 1, windowId: 1, url: `https://example.org/${i}`, title: `Page ${i}`, status: 'complete', lastAccessed: time - 3600000 + i, active: false, discarded: false }));
  const local = { settings: { enabled, keepRecent, idleMinutes, sites: [], theme: 'system' }, ...structuredClone(initialLocal) };
  const session = structuredClone(initialSession), values = new Map(), alarms = new Map(), changes = [];
  const calls = { query: 0, sessionReads: 0, sessionWrites: 0, get: 0, discard: 0 };
  const clone = v => structuredClone(v);
  const browser = {
    storage: { local: { get: async () => clone(local), set: async x => Object.assign(local, clone(x)) }, session: { get: async () => clone(session), set: async x => Object.assign(session, clone(x)) } },
    sessions: { getTabValue: async (id, key) => { calls.sessionReads++; return clone(values.get(`${id}:${key}`)); }, setTabValue: async (id, key, v) => { calls.sessionWrites++; values.set(`${id}:${key}`, clone(v)); } },
    tabs: {
      query: async () => { calls.query++; return clone(tabs); },
      get: async id => { calls.get++; const t = tabs.find(t => t.id === id); if (!t) throw Error('Missing tab'); return clone(t); },
      discard: async id => { calls.discard++; const t = tabs.find(t => t.id === id); if (!t || t.active) return; t.discarded = true; }
    },
    alarms: { get: async n => alarms.get(n), create: async (n, a) => alarms.set(n, a), clear: async n => alarms.delete(n) },
    browserAction: { setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {} },
    runtime: { sendMessage: async x => changes.push(x) }
  };
  const options = { now: () => time, wait: async () => {} };
  const engine = create(browser, options);
  return { engine, browser, calls, tabs, local, session, values, alarms, changes, advance: ms => { time += ms; }, time: () => time,
    restart: () => create(browser, options), resetCalls: () => { for (const k of Object.keys(calls)) calls[k] = 0; },
    drain: async (app = engine) => { for (let i = 0; i < 1000; i++) { const saved = session.state?.queue; if (!saved) return; await app.tick(); } throw Error('Queue did not finish'); }
  };
}
module.exports = { P, harness };
