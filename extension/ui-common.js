'use strict';
const FireUpUI = {
  send(type, fields = {}) { return browser.runtime.sendMessage({ type, ...fields }); },
  theme(value) {
    if (value === 'light' || value === 'dark') document.documentElement.dataset.theme = value;
    else delete document.documentElement.dataset.theme;
  },
  async initialTheme() {
    try { const data = await browser.storage.local.get('settings'); this.theme(data.settings?.theme || 'system'); } catch {}
  }
};
FireUpUI.initialTheme();
