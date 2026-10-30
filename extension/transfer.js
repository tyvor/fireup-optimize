(function (root) {
  'use strict';
  const P = root.FireUpPolicy;
  const VERSION = '0.4.2', FORMAT_VERSION = 2, MAX_BYTES = 256 * 1024;
  const LEGACY_FIELDS = ['enabled', 'keepRecent', 'idleMinutes', 'sites', 'theme', 'antiThrash'];
  const FIELDS = [...LEGACY_FIELDS, 'language'];
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function keys(value, allowed, label) {
    if (!object(value) || Object.keys(value).some(k => !allowed.includes(k))) throw new Error(`Invalid structure: ${label}.`);
    if (allowed.some(k => !Object.hasOwn(value, k))) throw new Error(`Missing fields: ${label}.`);
  }
  function validateSettings(value, legacy = false) {
    keys(value, legacy ? LEGACY_FIELDS : FIELDS, 'settings');
    if (typeof value.enabled !== 'boolean' || typeof value.antiThrash !== 'boolean') throw new Error('Automatic sleep and quick-return delay must be true or false.');
    if (!Number.isInteger(value.keepRecent) || value.keepRecent < 1 || value.keepRecent > 100) throw new Error('The working set must be between 1 and 100.');
    if (!Number.isInteger(value.idleMinutes) || value.idleMinutes < 1 || value.idleMinutes > 1440) throw new Error('The timer must be between 1 and 1440 minutes.');
    if (!['system', 'light', 'dark'].includes(value.theme)) throw new Error('Unknown appearance setting.');
    if (!legacy && !['auto', 'en', 'ru'].includes(value.language)) throw new Error('Unknown language setting.');
    if (!Array.isArray(value.sites) || value.sites.length > 500 || value.sites.some(s => typeof s !== 'string' || s.length > 2048)) throw new Error('Use at most 500 excluded domains.');
    const sites = value.sites.map(P.site);
    return P.settings({ enabled: value.enabled, keepRecent: value.keepRecent, idleMinutes: value.idleMinutes, sites, theme: value.theme, antiThrash: value.antiThrash, language: legacy ? 'auto' : value.language });
  }
  function parse(text) {
    if (typeof text !== 'string' || new TextEncoder().encode(text).byteLength > MAX_BYTES) throw new Error('The settings file must be no larger than 256 KB.');
    let doc;
    try { doc = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw new Error('Could not read JSON. Choose a FireUp settings export.'); }
    keys(doc, ['application', 'formatVersion', 'appVersion', 'exportedAt', 'settings'], 'FireUp file');
    if (doc.application !== 'FireUp' || ![1, FORMAT_VERSION].includes(doc.formatVersion)) throw new Error('Unsupported FireUp settings format.');
    if (typeof doc.appVersion !== 'string' || doc.appVersion.length > 32 || typeof doc.exportedAt !== 'string' || doc.exportedAt.length > 40 || !Number.isFinite(Date.parse(doc.exportedAt))) throw new Error('Invalid export version or date.');
    return { application: 'FireUp', formatVersion: doc.formatVersion, appVersion: doc.appVersion, exportedAt: doc.exportedAt, settings: validateSettings(doc.settings, doc.formatVersion === 1) };
  }
  function serialize(value, now = Date.now()) {
    return JSON.stringify({ application: 'FireUp', formatVersion: FORMAT_VERSION, appVersion: VERSION, exportedAt: new Date(now).toISOString(), settings: validateSettings(P.settings(value)) }, null, 2) + '\n';
  }
  const api = { VERSION, FORMAT_VERSION, MAX_BYTES, parse, serialize, validateSettings };
  root.FireUpTransfer = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
