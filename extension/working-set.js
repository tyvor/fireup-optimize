(function (root) {
  'use strict';
  const newer = (a, b) => a.access > b.access || (a.access === b.access && a.id > b.id);
  function heap(before) {
    const items = [];
    function swap(a, b) {
      [items[a], items[b]] = [items[b], items[a]];
      items[a].index = a; items[b].index = b;
    }
    function up(index) {
      while (index > 0) {
        const parent = (index - 1) >> 1;
        if (!before(items[index], items[parent])) break;
        swap(index, parent); index = parent;
      }
      return index;
    }
    function down(index) {
      for (;;) {
        let next = index, left = 2 * index + 1, right = left + 1;
        if (left < items.length && before(items[left], items[next])) next = left;
        if (right < items.length && before(items[right], items[next])) next = right;
        if (next === index) return;
        swap(index, next); index = next;
      }
    }
    const result = {
      get size() { return items.length; },
      get first() { return items[0]; },
      add(entry) { entry.owner = result; entry.index = items.length; items.push(entry); up(entry.index); },
      remove(entry) {
        const index = entry.index, last = items.pop();
        entry.owner = null;
        if (index < items.length) { items[index] = last; last.index = index; down(up(index)); }
      }
    };
    return result;
  }
  function createWorkingSet(limit) {
    const entries = new Map();
    let recent, other;
    function balance() {
      while (recent.size > limit) { const entry = recent.first; recent.remove(entry); other.add(entry); }
      while (recent.size < limit && other.size) { const entry = other.first; other.remove(entry); recent.add(entry); }
      while (recent.size && other.size && newer(other.first, recent.first)) {
        const incoming = other.first, outgoing = recent.first;
        other.remove(incoming); recent.remove(outgoing); recent.add(incoming); other.add(outgoing);
      }
    }
    function remove(id) {
      const entry = entries.get(id);
      if (!entry) return;
      entry.owner.remove(entry); entries.delete(id); balance();
    }
    function update(tab, access) {
      if (tab.incognito || tab.discarded || !root.FireUpPolicy.host(tab.url)) { remove(tab.id); return; }
      let entry = entries.get(tab.id);
      if (entry && entry.access === access) return;
      if (entry) entry.owner.remove(entry);
      else { entry = { id: tab.id }; entries.set(tab.id, entry); }
      entry.access = access; other.add(entry); balance();
    }
    function reset(tabs, count, meta) {
      limit = count; entries.clear();
      // The oldest kept tab and newest waiting tab are the only boundary entries needed.
      recent = heap((a, b) => newer(b, a)); other = heap(newer);
      for (const tab of tabs) update(tab, root.FireUpPolicy.access(tab, meta[tab.id]));
    }
    reset([], limit, {});
    return { update, remove, reset, resize(count) { limit = count; balance(); }, has(id) { return entries.get(id)?.owner === recent; } };
  }
  root.createFireUpWorkingSet = createWorkingSet;
  if (typeof module !== 'undefined') module.exports = createWorkingSet;
})(globalThis);
