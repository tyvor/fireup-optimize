'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const P = require('../extension/policy.js');
const create = require('../extension/working-set.js');

test('incremental working set matches the policy through ties, removals, restores and size changes', () => {
  const tabs = new Map(), meta = {}, index = create(10);
  let seed = 5917, limit = 10;
  const random = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  for (let step = 0; step < 4000; step++) {
    const id = random(150) + 1;
    if (step % 17 === 0) { limit = random(100) + 1; index.resize(limit); }
    if (step % 7 === 0) { tabs.delete(id); index.remove(id); }
    else {
      const tab = { id, lastAccessed: random(50), discarded: !random(5), incognito: !random(11), url: random(9) ? 'https://example.org' : 'about:blank' };
      meta[id] = { userAccess: random(50) };
      tabs.set(id, tab); index.update(tab, P.access(tab, meta[id]));
    }
    const expected = P.recentIds([...tabs.values()], { keepRecent: limit }, meta);
    for (let candidate = 1; candidate <= 150; candidate++) assert.equal(index.has(candidate), expected.has(candidate), `step ${step}, tab ${candidate}`);
  }
});

test('a rebuild replaces stale entries and uses restored user activity', () => {
  const index = create(1);
  index.update({ id: 99, url: 'https://example.org' }, 900);
  index.reset([{ id: 1, url: 'https://example.org', lastAccessed: 10 }, { id: 2, url: 'https://example.org', lastAccessed: 20 }], 1, { 1: { userAccess: 30 } });
  assert(index.has(1)); assert(!index.has(2)); assert(!index.has(99));
  index.remove(1); assert(index.has(2));
});
