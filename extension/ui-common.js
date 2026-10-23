'use strict';
const FireUpUI = {
  send(type, fields = {}) { return browser.runtime.sendMessage({ type, ...fields }); },
  theme(value) {
    if (value === 'light' || value === 'dark') document.documentElement.dataset.theme = value;
    else delete document.documentElement.dataset.theme;
  },
  configure(settings) {
    this.theme(settings.theme);
    const language = FireUpI18n.set(settings.language);
    if (document.documentElement.lang !== language) FireUpI18n.apply();
  },
  async initialize() {
    FireUpI18n.apply();
    try { const data = await browser.storage.local.get('settings'); this.configure(data.settings || {}); } catch {}
  }
};
FireUpUI.ready = FireUpUI.initialize();
