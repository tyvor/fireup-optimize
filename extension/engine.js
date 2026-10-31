(function (root) {
  'use strict';
  function createFireUp(browser, options = {}) {
    const P = root.FireUpPolicy;
    const T = root.FireUpTransfer;
    const now = options.now || Date.now;
    const wait = options.wait || (ms => new Promise(resolve => setTimeout(resolve, ms)));
    const KEY = 'fireup-protected';
    const AUTO = 'fireup-sweep', CONTINUE = 'fireup-queue', EXPIRY = 'fireup-expiry';
    let config = P.settings(), graceUntil = 0;
    let data = { meta: {}, protections: {}, known: {}, queue: null, lastRun: null };
    let writing = Promise.resolve(), settingsTail = Promise.resolve();
    const locks = new Map(), pendingProtections = new Set(), protectionEpochs = new Map();
    let ticking = false, starting = false, flushTimer, badgeTimer;
    let revision = 1, savedRevision = 0, queueItemsDirty = false, recentReady = false;
    const recent = root.createFireUpWorkingSet(config.keepRecent);
    const scans = new Set(), pendingActivity = new Map(), tabEpochs = new Map();
    const ready = Promise.all([browser.storage.local.get(['settings', 'firstRunUntil']), browser.storage.session.get(['state', 'queueItems'])]).then(([local, session]) => {
      config = P.settings(local.settings);
      graceUntil = Number(local.firstRunUntil) || 0;
      if (session.state) data = { ...data, ...session.state };
      if (data.queue) {
        queueItemsDirty = Array.isArray(data.queue.items);
        const items = data.queue.items || session.queueItems;
        data.queue = Array.isArray(items) ? { ...data.queue, items } : null;
      }
      recent.resize(config.keepRecent);
    });
    const report = e => console.error('FireUp:', e);
    function persist(force = true) {
      if (force) revision++;
      const task = writing.then(async () => {
        if (savedRevision === revision) return;
        const checkpoint = revision, itemsChanged = queueItemsDirty, items = data.queue?.items || null;
        const queue = data.queue ? { ...data.queue } : null;
        if (queue) delete queue.items;
        const payload = { state: { ...data, queue } };
        if (itemsChanged) payload.queueItems = items;
        await browser.storage.session.set(structuredClone(payload));
        savedRevision = checkpoint;
        if (itemsChanged && (data.queue?.items || null) === items) queueItemsDirty = false;
      });
      writing = task.catch(report);
      return task;
    }
    function changed() { browser.runtime.sendMessage({ type: 'changed' }).catch(() => {}); }
    function scheduleFlush() {
      revision++;
      clearTimeout(flushTimer);
      flushTimer = setTimeout(() => { persist(false).catch(report); }, 80);
    }
    function meta(id) { return data.meta[id] || (data.meta[id] = { userAccess: 0, navAt: 0, revision: 0 }); }
    function remember(tab) {
      if (tab.incognito) return;
      const discarded = Boolean(tab.discarded);
      if (data.known[tab.id] !== discarded) { data.known[tab.id] = discarded; revision++; }
    }
    function track(tab, event = false) {
      recent.update(tab, P.access(tab, data.meta[tab.id]));
      if (event) {
        tabEpochs.set(tab.id, Symbol());
        for (const scan of scans) scan.set(tab.id, tab.incognito ? null : tab);
      }
    }
    async function badge() {
      const count = Object.values(data.known).filter(Boolean).length;
      await browser.browserAction.setBadgeText({ text: config.enabled ? (count ? String(count) : '') : 'Ⅱ' });
      await browser.browserAction.setBadgeBackgroundColor({ color: '#52525e' });
    }
    function scheduleBadge() {
      clearTimeout(badgeTimer);
      badgeTimer = setTimeout(() => { badge().catch(report); }, 100);
    }
    function serial(id, fn) {
      const task = (locks.get(id) || Promise.resolve()).catch(() => {}).then(fn);
      locks.set(id, task);
      task.finally(() => { if (locks.get(id) === task) locks.delete(id); }).catch(() => {});
      return task;
    }
    async function getProtection(tab) {
      if (tab.incognito) return null;
      if (pendingProtections.has(tab.id)) return { mode: 'unknown' };
      if (!Object.hasOwn(data.protections, tab.id)) {
        if (!protectionEpochs.has(tab.id)) protectionEpochs.set(tab.id, Symbol());
        const epoch = protectionEpochs.get(tab.id);
        try {
          const stored = await browser.sessions.getTabValue(tab.id, KEY);
          if (protectionEpochs.get(tab.id) === epoch && !Object.hasOwn(data.protections, tab.id)) {
            data.protections[tab.id] = P.protection(stored, now());
            revision++;
          }
        }
        catch { return { mode: 'unknown' }; }
        if (pendingProtections.has(tab.id) || !Object.hasOwn(data.protections, tab.id)) return { mode: 'unknown' };
      }
      const value = P.protection(data.protections[tab.id], now());
      if (!value && data.protections[tab.id]) { delete data.protections[tab.id]; revision++; return getProtection(tab); }
      return value;
    }
    async function protectionMap(tabs) {
      const result = new Map();
      let index = 0;
      await Promise.all(Array.from({ length: Math.min(8, tabs.length) }, async () => {
        while (index < tabs.length) {
          const tab = tabs[index++];
          if (!tab.incognito) result.set(tab.id, await getProtection(tab));
        }
      }));
      return result;
    }
    async function expiryAlarm() {
      const untils = Object.values(data.protections).filter(p => p?.mode === 'timed' && p.until > now()).map(p => p.until);
      if (untils.length) await browser.alarms.create(EXPIRY, { when: Math.min(...untils) });
      else await browser.alarms.clear(EXPIRY);
    }
    async function autoAlarm() {
      if (config.enabled) {
        if (!(await browser.alarms.get(AUTO))) await browser.alarms.create(AUTO, { periodInMinutes: 1 });
      } else await browser.alarms.clear(AUTO);
    }
    async function getTabs() {
      const updates = new Map(); scans.add(updates);
      let listed;
      try { listed = await browser.tabs.query({}); } finally { scans.delete(updates); }
      const byId = new Map(listed.filter(t => !t.incognito).map(tab => [tab.id, tab]));
      // Events delivered during the query are newer than its returned snapshot.
      for (const [id, tab] of updates) { if (tab) byId.set(id, tab); else byId.delete(id); }
      const tabs = [...byId.values()];
      recent.reset(tabs, config.keepRecent, data.meta); recentReady = true;
      const ids = new Set(tabs.map(t => String(t.id)));
      for (const key of Object.keys(data.known)) if (!ids.has(key)) {
        delete data.known[key]; delete data.meta[key]; delete data.protections[key];
        protectionEpochs.delete(Number(key)); tabEpochs.delete(Number(key)); revision++;
      }
      for (const tab of tabs) {
        remember(tab);
        const entry = data.meta[tab.id];
        if (entry?.lastUnload && now() - entry.lastUnload.at > 120000) { delete entry.lastUnload; revision++; }
        if (entry?.holdUntil && entry.holdUntil <= now()) { delete entry.holdUntil; revision++; }
        if (entry?.lastQuickReturnAt && now() - entry.lastQuickReturnAt > 6 * 3600000) { P.clearBackoff(entry); revision++; }
      }
      return tabs;
    }
    async function snapshot() {
      await ready;
      const tabs = await getTabs(), values = await protectionMap(tabs);
      const result = tabs.map(t => {
        const protection = values.get(t.id), reason = P.reason(t, config, protection);
        const due = P.deadline(t, config, data.meta[t.id], graceUntil);
        const note = reason || (!config.enabled ? 'Automatic sleep paused' : recent.has(t.id) ? 'In working set' : graceUntil > now() ? 'First-install grace period' : '');
        return { antiThrashUntil: config.antiThrash ? data.meta[t.id]?.holdUntil || 0 : 0, id: t.id, windowId: t.windowId, title: t.title || P.host(t.url) || 'Untitled tab', host: P.host(t.url),
          icon: typeof t.favIconUrl === 'string' && /^(data:image\/(?:png|jpeg|gif|webp|x-icon|vnd.microsoft.icon);base64,|moz-annotation:)/i.test(t.favIconUrl) ? t.favIconUrl : '',
          active: t.active, discarded: Boolean(t.discarded), protection, reason, note,
          recent: recent.has(t.id), deadline: Number.isFinite(due) ? due : null, canSleep: !t.discarded && !reason };
      });
      await persist(false); await expiryAlarm(); await badge();
      return { settings: config, tabs: result, queue: queueStatus(), lastRun: data.lastRun, graceUntil, now: now() };
    }
    function queueStatus() {
      const q = data.queue;
      return q ? { total: q.items.length, processed: q.cursor, slept: q.slept, skipped: q.skipped, failed: q.failed, manual: q.manual, cancelled: q.cancelled } : null;
    }
    function scope(input) {
      if (!input || input.type === 'all') return { type: 'all' };
      if (input.type === 'window' && Number.isInteger(input.windowId)) return { type: 'window', windowId: input.windowId };
      if (input.type === 'site' && P.host(`https://${input.host}`) === input.host) return { type: 'site', host: input.host };
      if (input.type === 'selected' && Array.isArray(input.ids) && input.ids.every(Number.isInteger)) return { type: 'selected', ids: input.ids };
      throw new Error('Unknown unload scope.');
    }
    async function start(manual, input = { type: 'all' }, approvedIds) {
      await ready;
      if (starting || data.queue) return { busy: true, queue: queueStatus() };
      if (!manual && (!config.enabled || graceUntil > now())) return { paused: true };
      starting = true;
      try {
        const selectedScope = scope(input), tabs = await getTabs();
        const values = await protectionMap(tabs);
        const approved = Array.isArray(approvedIds) ? new Set(approvedIds.filter(Number.isInteger)) : null;
        const selected = tabs.filter(t => !t.discarded && P.inScope(t, selectedScope) && (!approved || approved.has(t.id)) && !P.reason(t, config, values.get(t.id))
          && (manual || (!recent.has(t.id) && P.deadline(t, config, data.meta[t.id], graceUntil) <= now())))
          .sort((a, b) => P.access(a, data.meta[a.id]) - P.access(b, data.meta[b.id]));
        if (!manual && !config.enabled) return { paused: true };
        if (!selected.length) { await persist(false); await badge(); return { queued: 0 }; }
        // Capture a generation as well as URL; navigating back to the same URL is still a change.
        data.queue = { manual, items: selected.map(t => ({ id: t.id, url: t.url, access: P.access(t, data.meta[t.id]), revision: meta(t.id).revision })),
          cursor: 0, slept: 0, skipped: 0, failed: 0, cancelled: false, started: now() };
        queueItemsDirty = true;
        await persist();
        await browser.alarms.create(CONTINUE, { when: now() + 100 });
        changed();
        return { queued: selected.length, queue: queueStatus() };
      } finally { starting = false; }
    }
    async function tick() {
      await ready;
      if (ticking || !data.queue) return;
      ticking = true;
      const q = data.queue, begun = now();
      try {
        if (!q.manual && !q.cancelled && config.enabled && !recentReady) await getTabs();
        let count = 0;
        while (q.cursor < q.items.length && !q.cancelled && (q.manual || config.enabled) && count < 8 && now() - begun < 1200) {
          const candidate = q.items[q.cursor++]; count++;
          try {
            if (!tabEpochs.has(candidate.id)) tabEpochs.set(candidate.id, Symbol());
            const epoch = tabEpochs.get(candidate.id);
            const tab = await browser.tabs.get(candidate.id);
            if (tabEpochs.get(candidate.id) !== epoch) { q.skipped++; continue; }
            track(tab);
            const value = await getProtection(tab);
            if (tab.incognito) { q.skipped++; continue; }
            const current = meta(tab.id);
            const changedSinceStart = tab.url !== candidate.url || P.access(tab, current) !== candidate.access || current.revision !== candidate.revision;
            if (q.cancelled || (!q.manual && !config.enabled) || tab.incognito || tab.discarded || changedSinceStart || tabEpochs.get(tab.id) !== epoch || pendingActivity.has(tab.id) || pendingProtections.has(tab.id)
              || (!q.manual && (pendingActivity.size || recent.has(tab.id))) || P.reason(tab, config, value)) { q.skipped++; continue; }
            if (!q.manual && P.deadline(tab, config, current, graceUntil) > now()) { q.skipped++; continue; }
            const marker = config.antiThrash ? { at: now(), url: tab.url, confirmed: false } : null;
            if (marker) current.lastUnload = marker;
            try {
              await browser.tabs.discard(tab.id);
              const afterEpoch = tabEpochs.get(tab.id);
              const after = await browser.tabs.get(tab.id); remember(after);
              if (tabEpochs.get(tab.id) === afterEpoch) track(after);
              if (after.discarded) {
                if (marker && current.lastUnload === marker) marker.confirmed = true;
                q.slept++;
              } else {
                if (marker && current.lastUnload === marker && !marker.confirmed) delete current.lastUnload;
                q.skipped++;
              }
            } catch (error) {
              if (marker && current.lastUnload === marker && !marker.confirmed) delete current.lastUnload;
              throw error;
            }
          } catch { q.failed++; }
          await wait(40);
        }
        if (q.cancelled || (!q.manual && !config.enabled) || q.cursor >= q.items.length) {
          data.lastRun = { slept: q.slept, skipped: q.skipped, failed: q.failed, cancelled: q.cancelled || (!q.manual && !config.enabled), at: now() };
          data.queue = null;
          queueItemsDirty = true;
          await browser.alarms.clear(CONTINUE);
        } else await browser.alarms.create(CONTINUE, { when: now() + 1000 });
        await persist(); await badge(); changed();
      } finally { ticking = false; }
    }
    async function cancel() {
      await ready;
      if (!data.queue) return;
      data.queue.cancelled = true;
      await persist();
      if (!ticking) await tick();
      changed();
    }
    function protectionChange(id, fn) {
      protectionEpochs.set(id, Symbol());
      pendingProtections.add(id);
      return serial(id, fn).finally(() => { if (!locks.has(id)) pendingProtections.delete(id); });
    }
    async function writeProtection(id, value) {
      const tab = await browser.tabs.get(id);
      if (tab.incognito) throw new Error('Private tabs are not processed.');
      meta(id).revision++;
      await browser.sessions.setTabValue(id, KEY, value || false);
      data.protections[id] = value;
      await persist(); await expiryAlarm(); changed();
      return value;
    }
    function setProtection(id, mode) {
      if (!Number.isInteger(id) || !['none', 'permanent', '30', '60'].includes(mode)) return Promise.reject(new Error('Invalid protection mode.'));
      return protectionChange(id, async () => {
        await ready;
        const value = mode === 'none' ? null : mode === 'permanent' ? { mode: 'permanent', until: 0 } : { mode: 'timed', until: now() + Number(mode) * 60000 };
        return writeProtection(id, value);
      });
    }
    function saveSettings(value) {
      const task = settingsTail.catch(() => {}).then(async () => {
        await ready;
        const next = P.settings({ ...config, ...value });
        await browser.storage.local.set({ settings: next }); config = next; recent.resize(config.keepRecent);
        if (!config.antiThrash) {
          for (const entry of Object.values(data.meta)) P.clearBackoff(entry);
          await persist();
        }
        if (data.queue && !data.queue.manual) await cancel();
        await autoAlarm(); await badge(); changed();
        return config;
      });
      settingsTail = task; return task;
    }
    async function getSettings() {
      await ready; await settingsTail.catch(() => {});
      return structuredClone(config);
    }
    async function exportSettings() { return T.serialize(await getSettings(), now()); }
    function previewImport(text) { return Promise.resolve().then(() => T.parse(text)); }
    async function importSettings(text) {
      const doc = T.parse(text);
      return saveSettings(doc.settings);
    }
    async function expire() {
      await ready;
      for (const [id, value] of Object.entries(data.protections)) {
        if (value?.mode === 'timed' && value.until <= now()) {
          await protectionChange(Number(id), async () => {
            const current = data.protections[id];
            if (current?.mode !== 'timed' || current.until !== value.until || current.until > now()) return;
            await writeProtection(Number(id), null);
          }).catch(report);
        }
      }
      await persist(); await expiryAlarm(); changed();
    }
    async function activity(id, kind, supplied) {
      const token = Symbol(); pendingActivity.set(id, token);
      try {
        await ready;
        if (!tabEpochs.has(id)) tabEpochs.set(id, Symbol());
        const epoch = tabEpochs.get(id);
        const tab = supplied || await browser.tabs.get(id);
        if (tab.incognito || tabEpochs.get(id) !== epoch) return;
        const value = meta(id); value.revision++;
        if (kind === 'user') {
          P.quickReturn(tab, config, value, now());
          value.userAccess = now();
        } else {
          value.navAt = now();
          if (value.lastUnload && value.lastUnload.url !== tab.url) delete value.lastUnload;
        }
        remember(tab); track(tab, true); scheduleFlush();
      } finally { if (pendingActivity.get(id) === token) pendingActivity.delete(id); }
    }
    async function updated(id, change, tab) {
      await ready;
      if (tab.incognito) return;
      track(tab, true);
      if (change.url || change.status === 'loading' || change.discarded === false) await activity(id, 'navigation', tab);
      if (change.discarded === true) {
        const marker = data.meta[id]?.lastUnload;
        if (marker && marker.url === tab.url && now() >= marker.at && now() - marker.at <= 120000) marker.confirmed = true;
      }
      if (change.discarded !== undefined) { remember(tab); scheduleFlush(); scheduleBadge(); changed(); }
      else if (change.pinned !== undefined || change.audible !== undefined || change.sharingState !== undefined) changed();
    }
    async function installed() {
      await ready;
      if (!graceUntil) { graceUntil = now() + config.idleMinutes * 60000; await browser.storage.local.set({ firstRunUntil: graceUntil }); }
      await autoAlarm(); changed();
    }
    async function initialize() {
      await ready; await autoAlarm(); await expiryAlarm();
      if (data.queue) await browser.alarms.create(CONTINUE, { when: now() + 1000 });
      await badge();
    }
    async function removed(id) {
      await ready; delete data.meta[id]; delete data.protections[id]; delete data.known[id]; protectionEpochs.delete(id);
      recent.remove(id); tabEpochs.delete(id);
      for (const scan of scans) scan.set(id, null);
      scheduleFlush(); scheduleBadge();
    }
    async function alarm(name) {
      if (name === AUTO) return start(false);
      if (name === CONTINUE) return tick();
      if (name === EXPIRY) return expire();
    }
    return { ready, initialize, snapshot, start, tick, cancel, setProtection, saveSettings, getSettings, exportSettings, previewImport, importSettings, activity, updated, removed, installed, alarm, report };
  }
  root.createFireUp = createFireUp;
  if (typeof module !== 'undefined') module.exports = createFireUp;
})(globalThis);
