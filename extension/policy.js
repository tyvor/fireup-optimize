(function (root) {
  'use strict';
  const DEFAULTS = Object.freeze({ enabled: true, keepRecent: 10, idleMinutes: 10, sites: [], theme: 'system', antiThrash: true, language: 'auto' });
  function host(value) {
    try { const u = new URL(value); return /^https?:$/.test(u.protocol) ? u.hostname.toLowerCase().replace(/\.$/, '') : ''; }
    catch { return ''; }
  }
  function site(value) {
    const text = String(value).trim();
    let u;
    try { u = new URL(text.includes('://') ? text : `https://${text}`); }
    catch { throw new Error('Enter a domain without a path or port, such as chatgpt.com.'); }
    if (text.includes('*') || /[%*]/.test(u.hostname) || !host(u.href) || u.hostname.length > 253 || u.username || u.password || u.port || u.pathname !== '/' || u.search || u.hash) {
      throw new Error('Enter a domain without a path or port, such as chatgpt.com.');
    }
    return host(u.href);
  }
  function settings(value = {}) {
    const v = value && typeof value === 'object' ? value : {};
    return {
      enabled: typeof v.enabled === 'boolean' ? v.enabled : true,
      keepRecent: Number.isInteger(v.keepRecent) && v.keepRecent >= 1 && v.keepRecent <= 100 ? v.keepRecent : 10,
      idleMinutes: Number.isInteger(v.idleMinutes) && v.idleMinutes >= 1 && v.idleMinutes <= 1440 ? v.idleMinutes : 10,
      theme: ['system', 'light', 'dark'].includes(v.theme) ? v.theme : 'system',
      language: ['auto', 'en', 'ru'].includes(v.language) ? v.language : 'auto',
      antiThrash: typeof v.antiThrash === 'boolean' ? v.antiThrash : true,
      sites: [...new Set((Array.isArray(v.sites) ? v.sites : []).flatMap(s => { try { return [site(s)]; } catch { return []; } }))].slice(0, 500)
    };
  }
  function access(tab, meta = {}) { return Math.max(tab.lastAccessed || 0, meta.userAccess || 0); }
  function protection(value, now) {
    if (value === true) return { mode: 'permanent', until: 0 };
    if (value?.mode === 'permanent') return { mode: 'permanent', until: 0 };
    if (value?.mode === 'timed' && Number.isFinite(value.until) && value.until > now) return { mode: 'timed', until: value.until };
    return null;
  }
  function reason(tab, config, protectedValue) {
    if (tab.incognito) return 'Private tab';
    if (tab.active) return 'Active tab';
    if (tab.pinned) return 'Pinned';
    if (tab.audible) return 'Playing audio';
    if (tab.sharingState && (tab.sharingState.camera || tab.sharingState.microphone || tab.sharingState.screen)) return 'Call or screen sharing';
    if (tab.status === 'loading') return 'Loading';
    if (!host(tab.url)) return 'Internal page';
    if (tab.autoDiscardable === false) return 'Protected by Firefox';
    if (protectedValue?.mode === 'unknown') return 'Could not verify protection';
    if (protectedValue) return protectedValue.mode === 'timed' ? 'Temporary protection' : 'Manual protection';
    const name = host(tab.url);
    if (config.sites.some(s => name === s || name.endsWith(`.${s}`))) return 'Excluded site';
    return '';
  }
  function recentIds(tabs, config, meta) {
    return new Set(tabs.filter(t => !t.incognito && !t.discarded && host(t.url))
      .sort((a, b) => access(b, meta[b.id]) - access(a, meta[a.id]) || b.id - a.id)
      .slice(0, config.keepRecent).map(t => t.id));
  }
  function deadline(tab, config, meta = {}, grace = 0) {
    const last = access(tab, meta);
    return last ? Math.max(last + config.idleMinutes * 60000, (meta.navAt || 0) + 30000, grace, config.antiThrash ? meta.holdUntil || 0 : 0) : Infinity;
  }
  function quickReturn(tab, config, meta, now) {
    const last = meta.lastUnload;
    if (!last) return false;
    delete meta.lastUnload;
    if (!config.antiThrash || !last.confirmed || tab.url !== last.url || now < last.at || now - last.at > 120000) return false;
    const consecutive = Number.isFinite(meta.lastQuickReturnAt) && now >= meta.lastQuickReturnAt && now - meta.lastQuickReturnAt <= 6 * 3600000;
    meta.returnCount = consecutive ? Math.min((meta.returnCount || 0) + 1, 4) : 1;
    meta.lastQuickReturnAt = now;
    meta.holdUntil = now + Math.min(config.idleMinutes * 2 ** meta.returnCount, 120) * 60000;
    return true;
  }
  function clearBackoff(meta) {
    delete meta.lastUnload; delete meta.holdUntil; delete meta.returnCount; delete meta.lastQuickReturnAt;
  }
  function inScope(tab, scope = { type: 'all' }) {
    switch (scope.type) {
      case 'all': return true;
      case 'window': return tab.windowId === scope.windowId;
      case 'site': return host(tab.url) === scope.host && Boolean(scope.host);
      case 'selected': return scope.ids.includes(tab.id);
      default: return false;
    }
  }
  const api = { DEFAULTS, host, site, settings, access, protection, reason, recentIds, deadline, quickReturn, clearBackoff, inScope };
  root.FireUpPolicy = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
