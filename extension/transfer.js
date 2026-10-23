(function (root) {
  'use strict';
  const P = root.FireUpPolicy;
  const VERSION = '0.3.0', MAX_BYTES = 256 * 1024;
  const FIELDS = ['enabled', 'keepRecent', 'idleMinutes', 'sites', 'theme', 'antiThrash'];
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function keys(value, allowed, label) {
    if (!object(value) || Object.keys(value).some(k => !allowed.includes(k))) throw new Error(`Неверная структура: ${label}.`);
    if (allowed.some(k => !Object.hasOwn(value, k))) throw new Error(`В файле не хватает полей: ${label}.`);
  }
  function validateSettings(value) {
    keys(value, FIELDS, 'настройки');
    if (typeof value.enabled !== 'boolean' || typeof value.antiThrash !== 'boolean') throw new Error('Режим автосна и защита от повторного сна должны иметь значение true или false.');
    if (!Number.isInteger(value.keepRecent) || value.keepRecent < 1 || value.keepRecent > 100) throw new Error('Рабочий набор должен быть от 1 до 100.');
    if (!Number.isInteger(value.idleMinutes) || value.idleMinutes < 1 || value.idleMinutes > 1440) throw new Error('Таймер должен быть от 1 до 1440 минут.');
    if (!['system', 'light', 'dark'].includes(value.theme)) throw new Error('Неизвестная тема оформления.');
    if (!Array.isArray(value.sites) || value.sites.length > 500 || value.sites.some(s => typeof s !== 'string' || s.length > 2048)) throw new Error('В исключениях должно быть не больше 500 доменов.');
    const sites = value.sites.map(P.site);
    return P.settings({ enabled: value.enabled, keepRecent: value.keepRecent, idleMinutes: value.idleMinutes, sites, theme: value.theme, antiThrash: value.antiThrash });
  }
  function parse(text) {
    if (typeof text !== 'string' || new TextEncoder().encode(text).byteLength > MAX_BYTES) throw new Error('Файл настроек должен быть не больше 256 КБ.');
    let doc;
    try { doc = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw new Error('Не удалось прочитать JSON. Выберите файл экспорта FireUp.'); }
    keys(doc, ['application', 'formatVersion', 'appVersion', 'exportedAt', 'settings'], 'файл FireUp');
    if (doc.application !== 'FireUp' || doc.formatVersion !== 1) throw new Error('Это не поддерживаемый файл настроек FireUp (формат 1).');
    if (typeof doc.appVersion !== 'string' || doc.appVersion.length > 32 || typeof doc.exportedAt !== 'string' || doc.exportedAt.length > 40 || !Number.isFinite(Date.parse(doc.exportedAt))) throw new Error('Неверная версия или дата экспорта.');
    return { application: 'FireUp', formatVersion: 1, appVersion: doc.appVersion, exportedAt: doc.exportedAt, settings: validateSettings(doc.settings) };
  }
  function serialize(value, now = Date.now()) {
    return JSON.stringify({ application: 'FireUp', formatVersion: 1, appVersion: VERSION, exportedAt: new Date(now).toISOString(), settings: validateSettings(P.settings(value)) }, null, 2) + '\n';
  }
  const api = { VERSION, MAX_BYTES, parse, serialize, validateSettings };
  root.FireUpTransfer = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
