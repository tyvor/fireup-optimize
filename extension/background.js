'use strict';
const app = createFireUp(browser);
const run = promise => promise.catch(app.report);
let menuTail = Promise.resolve(), menuLanguage;
function menus() {
  const task = menuTail.catch(() => {}).then(async () => {
    const settings = await app.getSettings();
    const language = FireUpI18n.set(settings.language);
    if (menuLanguage === language) return;
    await browser.menus.removeAll();
    for (const [id, title] of [['permanent', 'Protect tab'], ['30', 'Protect for 30 minutes'], ['60', 'Protect for one hour'], ['none', 'Remove protection']]) {
      browser.menus.create({ id: `protect-${id}`, title: `FireUp: ${FireUpI18n.t(title)}`, contexts: ['tab'] });
    }
    browser.menus.create({ id: 'sleep-window', title: `FireUp: ${FireUpI18n.t('Unload background tabs in this window')}`, contexts: ['tab'] });
    if (browser.commands.update) await browser.commands.update({ name: 'sleep-extra', description: FireUpI18n.t('Unload unprotected background tabs in all windows') });
    menuLanguage = language;
  });
  menuTail = task;
  return task;
}
browser.runtime.onMessage.addListener((message, sender) => {
  if (sender.id !== browser.runtime.id || !message || message.type === 'changed') return undefined;
  switch (message.type) {
    case 'state': return app.snapshot();
    case 'get-settings': return app.getSettings();
    case 'export-settings': return app.exportSettings();
    case 'preview-import': return app.previewImport(message.text);
    case 'import-settings': return (async () => { const settings = await app.importSettings(message.text); await menus(); return settings; })();
    case 'settings': return (async () => { const settings = await app.saveSettings(message.value); await menus(); return settings; })();
    case 'protect': return app.setProtection(message.id, message.mode);
    case 'sleep': return app.start(true, message.scope, message.ids);
    case 'cancel': return app.cancel();
    case 'focus': return (async () => {
      const tab = await browser.tabs.get(message.id);
      if (tab.incognito) throw new Error('Private tab.');
      await browser.windows.update(tab.windowId, { focused: true });
      await browser.tabs.update(tab.id, { active: true });
    })();
    case 'options': return browser.runtime.openOptionsPage();
    default: return undefined;
  }
});
browser.alarms.onAlarm.addListener(alarm => run(app.alarm(alarm.name)));
browser.tabs.onActivated.addListener(info => run(app.activity(info.tabId, 'user')));
browser.tabs.onCreated.addListener(tab => run(app.activity(tab.id, tab.active ? 'user' : 'navigation', tab)));
browser.tabs.onRemoved.addListener(id => run(app.removed(id)));
browser.tabs.onUpdated.addListener((id, change, tab) => run(app.updated(id, change, tab)), {
  properties: ['url', 'status', 'discarded', 'pinned', 'audible', 'sharingState']
});
browser.commands.onCommand.addListener(command => {
  if (command === 'sleep-extra') run(app.start(true));
});
browser.menus.onClicked.addListener((info, tab) => {
  if (!tab || tab.incognito) return;
  if (String(info.menuItemId).startsWith('protect-')) run(app.setProtection(tab.id, info.menuItemId.slice(8)));
  if (info.menuItemId === 'sleep-window') run(app.start(true, { type: 'window', windowId: tab.windowId }));
});
browser.runtime.onInstalled.addListener(() => run(Promise.all([app.installed(), menus()])));
browser.runtime.onStartup.addListener(() => run(menus()));
run(app.initialize().then(menus));
