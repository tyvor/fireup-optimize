(function (root) {
  'use strict';
  const catalogs = typeof module !== 'undefined' ? require('./locales.generated.js') : root.FireUpLocales;
  let language;
  const supports = code => typeof code === 'string' && Object.hasOwn(catalogs, code);
  function* fallback(code) {
    while (code) {
      yield code;
      const separator = code.lastIndexOf('-');
      code = separator < 0 ? '' : code.slice(0, separator);
    }
  }
  function resolve(value = 'auto', browserLanguage) {
    if (supports(value)) return value;
    const detected = browserLanguage || root.browser?.i18n?.getUILanguage?.() || root.navigator?.language || 'en';
    try {
      for (const code of fallback(new Intl.Locale(detected.replaceAll('_', '-')).baseName)) {
        if (supports(code)) return code;
      }
    } catch {}
    return 'en';
  }
  function set(value = 'auto') { language = resolve(value); return language; }
  function t(key, values = {}) {
    let template = Object.hasOwn(catalogs.en.messages, key) ? catalogs.en.messages[key] : key;
    for (const code of fallback(language)) {
      const messages = catalogs[code]?.messages;
      if (messages && Object.hasOwn(messages, key)) { template = messages[key]; break; }
    }
    return template.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
  }
  function error(value) {
    const message = value?.message || String(value);
    for (const prefix of ['Invalid structure', 'Missing fields']) if (message.startsWith(prefix + ': ')) {
      return t(prefix + ': {name}.', { name: t(message.slice(prefix.length + 2, -1)) });
    }
    return t(message);
  }
  function apply(doc = root.document) {
    doc.documentElement.lang = language;
    doc.documentElement.dir = catalogs[language].direction;
    for (const el of doc.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const [attr, key] of [['placeholder', 'i18nPlaceholder'], ['aria-label', 'i18nAria'], ['title', 'i18nTitle']]) {
      for (const el of doc.querySelectorAll(`[data-${key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}]`)) el.setAttribute(attr, t(el.dataset[key]));
    }
    if (doc.documentElement.dataset.title) doc.title = t(doc.documentElement.dataset.title);
  }
  const languages = Object.entries(catalogs).map(([code, { name }]) => ({ code, name }));
  const languageName = code => supports(code) ? catalogs[code].name : t('Browser default');
  const messages = code => catalogs[code]?.messages;
  const api = { supports, languages, languageName, messages, resolve, set, t, error, apply, get language() { return language; } };
  root.FireUpI18n = api; set();
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
