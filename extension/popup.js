'use strict';
const $ = id => document.getElementById(id);
const t = (key, values) => FireUpI18n.t(key, values);
const rows = new Map(), selected = new Set();
let shownRun = 0;
let state, currentWindow, working = false, refreshTimer, refreshPending = false, protectedId = null;
function message(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
function scope() {
  const value = $('scope').value;
  if (value === 'window') return { type: 'window', windowId: currentWindow };
  if (value === 'search') return { type: 'search' };
  if (value === 'selected') return { type: 'selected', ids: [...selected] };
  if (value.startsWith('site:')) return { type: 'site', host: value.slice(5) };
  return { type: value === 'all' ? 'all' : 'none' };
}
function scoped(tab, value) {
  return value.type === 'all' || (value.type === 'window' && tab.windowId === value.windowId)
    || (value.type === 'search' && rows.get(tab.id)?.el.hidden === false)
    || (value.type === 'selected' && selected.has(tab.id)) || (value.type === 'site' && tab.host === value.host);
}
function candidatesFor(selectedScope) {
  return state.tabs.filter(tab => tab.canSleep && scoped(tab, selectedScope));
}
function renderPreview(candidates) {
  $('preview-label').textContent = t('Show candidates ({count})', { count: candidates.length });
  if (!$('candidate-preview').open) return;
  const list = document.createDocumentFragment();
  for (const tab of candidates.slice(0, 80)) {
    const item = document.createElement('li');
    item.textContent = tab.title;
    if (tab.host && tab.title !== tab.host) {
      const domain = document.createElement('span');
      domain.className = 'muted';
      domain.textContent = ' · ' + tab.host;
      item.append(domain);
    }
    list.append(item);
  }
  if (candidates.length > 80) {
    const item = document.createElement('li');
    item.textContent = t('And {count} more', { count: candidates.length - 80 });
    list.append(item);
  }
  $('candidates').replaceChildren(list);
}
function note(tab) {
  if (tab.discarded) return t('Asleep');
  if (tab.protection?.mode === 'timed') return t('Protected until {time}', { time: new Date(tab.protection.until).toLocaleTimeString(FireUpI18n.language, { hour: '2-digit', minute: '2-digit' }) }) + (tab.reason && tab.reason !== 'Temporary protection' ? ` · ${t(tab.reason)}` : '');
  if (!tab.note && tab.antiThrashUntil > Date.now()) return t('Quick return · sleep in about {minutes} min', { minutes: Math.max(1, Math.ceil((tab.deadline - Date.now()) / 60000)) });
  if (tab.note) return t(tab.note);
  if (!tab.deadline) return t('Waiting for activity data');
  const minutes = Math.ceil((tab.deadline - Date.now()) / 60000);
  return minutes > 0 ? t('Sleep in about {minutes} min', { minutes }) : t('Ready to sleep · waiting for queue');
}
function footerStatus() {
  if (!state) return;
  const selectedScope = scope();
  const candidates = candidatesFor(selectedScope);
  const q = state.queue;
  const label = selectedScope.type === 'window' ? t('Unload tabs in this window: {count}', { count: candidates.length })
    : selectedScope.type === 'selected' ? t('Unload selected tabs: {count}', { count: candidates.length })
    : selectedScope.type === 'site' ? t('Unload tabs from this site: {count}', { count: candidates.length })
    : selectedScope.type === 'search' ? t('Unload search results: {count}', { count: candidates.length })
    : t('Unload tabs in all windows: {count}', { count: candidates.length });
  $('sleep-label').textContent = q ? t('Queue: {processed} of {total}', q) : label;
  $('sleep').disabled = working || Boolean(q) || !candidates.length;
  $('cancel').hidden = !q; $('cancel').disabled = Boolean(q?.cancelled);
  $('pause').disabled = working;
  const hiddenCount = candidates.filter(tab => rows.get(tab.id)?.el.hidden).length;
  $('candidate-preview').hidden = Boolean(q) || !candidates.length;
  if (!$('candidate-preview').hidden) renderPreview(candidates);
  $('scope-note').textContent = q ? t('Unloaded {slept}, skipped {skipped}, failed {failed}.', q)
    : !candidates.length ? t('No tabs can be unloaded in this scope.')
    : hiddenCount ? t('Hidden candidates: {count}', { count: hiddenCount }) : '';
}
function row(tab) {
  const el = document.createElement('div'); el.className = 'tab-row'; el.dataset.id = tab.id;
  const choose = document.createElement('input'); choose.type = 'checkbox'; choose.className = 'choose'; choose.setAttribute('aria-label', t('Select: {title}', { title: tab.title }));
  choose.addEventListener('change', () => { choose.checked ? selected.add(tab.id) : selected.delete(tab.id); footerStatus(); });
  const icon = document.createElement('img'); icon.className = 'site-icon'; icon.alt = ''; icon.hidden = true;
  const letter = document.createElement('span'); letter.className = 'site-letter'; letter.setAttribute('aria-hidden', 'true');
  icon.addEventListener('error', () => { icon.hidden = true; letter.hidden = false; });
  const info = document.createElement('button'); info.className = 'tab-info'; info.type = 'button';
  const title = document.createElement('span'); title.className = 'tab-title';
  const detail = document.createElement('span'); detail.className = 'tab-note'; info.append(title, detail);
  info.addEventListener('click', () => act(async () => { await FireUpUI.send('focus', { id: tab.id }); window.close(); }));
  const protect = document.createElement('button'); protect.type = 'button'; protect.className = 'protect'; protect.setAttribute('aria-controls', 'protection-menu');
  protect.setAttribute('aria-expanded', 'false');
  protect.addEventListener('click', () => {
    for (const view of rows.values()) view.protect.setAttribute('aria-expanded', 'false');
    protectedId = tab.id;
    $('protection-title').textContent = t('Protection: {title}', { title: rows.get(tab.id).title.textContent });
    $('protection-menu').hidden = false; $('protection-menu').open = true;
    protect.setAttribute('aria-expanded', 'true');
    $('protection-menu').querySelector('button').focus();
  });
  el.append(choose, icon, letter, info, protect);
  return { el, choose, icon, letter, info, title, detail, protect };
}
function closeProtection() {
  const previous = rows.get(protectedId)?.protect;
  $('protection-menu').hidden = true; $('protection-menu').open = false;
  previous?.setAttribute('aria-expanded', 'false');
  if (previous?.getClientRects().length) previous.focus(); else $('search').focus();
  protectedId = null;
}
function render() {
  const oldLanguage = FireUpI18n.language;
  FireUpUI.configure(state.settings);
  if (oldLanguage !== FireUpI18n.language) { message(''); shownRun = 0; }
  const total = state.tabs.length, loaded = state.tabs.filter(tab => !tab.discarded).length;
  const numbers = new Intl.NumberFormat(FireUpI18n.language);
  $('counts').textContent = t('Loaded {loaded} of {total}', { loaded: numbers.format(loaded), total: numbers.format(total) });
  $('loaded-count').textContent = numbers.format(loaded);
  $('sleeping-count').textContent = numbers.format(total - loaded);
  $('scope').disabled = false;
  $('auto').textContent = state.settings.enabled ? t('Automatic sleep on') : t('Automatic sleep paused');
  $('pause-label').textContent = state.settings.enabled ? t('Pause') : t('Resume');
  $('pause-glyph').setAttribute('href', state.settings.enabled ? 'icons/ui.svg#pause' : 'icons/ui.svg#play');
  $('pause').setAttribute('aria-pressed', String(!state.settings.enabled));
  const query = $('search').value.trim().toLocaleLowerCase(FireUpI18n.language), filter = $('filter').value;
  const ids = new Set(state.tabs.map(t => t.id));
  for (const [id, view] of rows) if (!ids.has(id)) {
    const hadFocus = view.el.contains(document.activeElement);
    view.el.remove(); rows.delete(id); selected.delete(id);
    if (hadFocus) $('search').focus();
  }
  const empty = $('tabs').querySelector('.empty'); if (empty) empty.remove();
  let visible = 0;
  for (const tab of state.tabs) {
    if (!rows.has(tab.id)) { const view = row(tab); rows.set(tab.id, view); $('tabs').append(view.el); }
    const view = rows.get(tab.id);
    const matches = `${tab.title} ${tab.host}`.toLocaleLowerCase(FireUpI18n.language).includes(query)
      && (filter === 'all' || (filter === 'loaded' && !tab.discarded) || (filter === 'sleeping' && tab.discarded) || (filter === 'protected' && tab.reason));
    if (!matches && view.el.contains(document.activeElement)) $('search').focus();
    view.el.hidden = !matches; if (matches) visible++;
    view.el.classList.toggle('asleep', tab.discarded);
    view.title.textContent = tab.title === 'Untitled tab' ? t('Untitled tab') : tab.title; view.info.title = `${tab.title}\n${tab.host}`;
    view.detail.textContent = note(tab);
    view.detail.title = tab.host;
    view.choose.checked = selected.has(tab.id); view.choose.disabled = !tab.canSleep;
    view.choose.setAttribute('aria-label', t('Select: {title}', { title: tab.title }));
    view.letter.textContent = tab.host ? tab.host[0].toUpperCase() : '·';
    if (tab.icon && view.icon.getAttribute('src') !== tab.icon) { view.icon.src = tab.icon; view.icon.hidden = false; view.letter.hidden = true; }
    if (!tab.icon) { view.icon.hidden = true; view.letter.hidden = false; }
    view.protect.textContent = tab.protection && tab.protection.mode !== 'unknown' ? t('Protection') : t('Protect');
    view.protect.setAttribute('aria-pressed', String(Boolean(tab.protection && tab.protection.mode !== 'unknown')));
    view.protect.setAttribute('aria-label', t('Configure protection: {title}', { title: tab.title }));
  }
  if (!visible) {
    const item = document.createElement('p'); item.className = 'empty';
    item.textContent = state.tabs.length ? t('No matches. Change your search or filter.') : t('No regular tabs yet.');
    $('tabs').append(item);
  }
  const prior = $('scope').value;
  const sites = [...new Set(state.tabs.map(t => t.host).filter(Boolean))].sort();
  const availableSites = new Set(sites), existingSites = new Set();
  for (const option of [...$('scope').options]) if (option.value.startsWith('site:')) {
    if (option.value !== prior && !availableSites.has(option.value.slice(5))) option.remove();
    else existingSites.add(option.value.slice(5));
  }
  for (const site of sites) if (!existingSites.has(site)) {
    const option = document.createElement('option'); option.value = `site:${site}`; option.textContent = t('Site: {site}', { site }); $('scope').append(option);
  }
  for (const option of $('scope').options) if (option.value.startsWith('site:')) option.textContent = t('Site: {site}', { site: option.value.slice(5) });
  if (protectedId && rows.has(protectedId)) $('protection-title').textContent = t('Protection: {title}', { title: rows.get(protectedId).title.textContent });
  else if (protectedId) closeProtection();
  if ([...$('scope').options].some(o => o.value === prior)) $('scope').value = prior;
  if (state.lastRun && state.lastRun.at !== shownRun) {
    shownRun = state.lastRun.at;
    message(t('Unloaded {slept}, skipped {skipped}, failed {failed}.', state.lastRun) + (state.lastRun.cancelled ? ' ' + t('Queue stopped.') : ''));
  }
  footerStatus(); $('retry').hidden = true;
}
async function refresh() {
  if (!Number.isInteger(currentWindow)) currentWindow = (await browser.windows.getCurrent()).id;
  state = await FireUpUI.send('state');
  render();
}
function scheduleRefresh() {
  if (working) { refreshPending = true; return; }
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => refresh().catch(e => message(FireUpI18n.error(e), true)), 120);
}
async function act(fn) {
  if (working) return;
  working = true; if (state) footerStatus();
  try { await fn(); }
  catch (e) { message(e.message ? FireUpI18n.error(e) : t('The action failed. Try again.'), true); $('retry').hidden = false; }
  finally { working = false; if (state) footerStatus(); if (refreshPending) { refreshPending = false; scheduleRefresh(); } }
}
$('pause').addEventListener('click', () => act(async () => { await FireUpUI.send('settings', { value: { enabled: !state.settings.enabled } }); await refresh(); message(state.settings.enabled ? t('Automatic sleep enabled.') : t('Automatic sleep paused. Manual unloading is available.')); }));
$('sleep').addEventListener('click', () => act(async () => {
  const selectedScope = scope();
  const ids = candidatesFor(selectedScope).map(tab => tab.id);
  if (!ids.length) return;
  const approvedScope = selectedScope.type === 'search' ? { type: 'selected', ids } : selectedScope;
  const result = await FireUpUI.send('sleep', { scope: approvedScope, ids });
  await refresh(); message(result.busy ? t('A queue is already running.') : t('Tabs queued: {count}.', { count: result.queued }));
}));
$('cancel').addEventListener('click', async () => { try { await FireUpUI.send('cancel'); await refresh(); message(t('Queue stopped. Tabs already unloaded remain asleep.')); } catch (e) { message(FireUpI18n.error(e), true); } });
$('options').addEventListener('click', () => act(() => FireUpUI.send('options')));
$('refresh').addEventListener('click', () => act(async () => { await refresh(); message(t('List refreshed.')); }));
$('retry').addEventListener('click', () => act(refresh));
$('search').addEventListener('input', () => { if (state) render(); });
$('filter').addEventListener('change', () => { if (state) render(); });
$('scope').addEventListener('change', () => {
  if ($('scope').value === 'search') $('tab-list').open = true;
  footerStatus();
});
$('candidate-preview').addEventListener('toggle', () => {
  if (state && $('candidate-preview').open) renderPreview(candidatesFor(scope()));
});
$('close-protection').addEventListener('click', closeProtection);
for (const button of document.querySelectorAll('[data-protect]')) button.addEventListener('click', () => act(async () => {
  await FireUpUI.send('protect', { id: protectedId, mode: button.dataset.protect });
  await refresh(); closeProtection(); message(t('Protection updated.'));
}));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('protection-menu').hidden) { event.preventDefault(); closeProtection(); } });
browser.runtime.onMessage.addListener(event => { if (event?.type === 'changed') scheduleRefresh(); });
browser.tabs?.onRemoved?.addListener(scheduleRefresh);
const clock = setInterval(() => { if (state && !document.hidden) for (const tab of state.tabs) { const view = rows.get(tab.id); if (view && !view.el.hidden) view.detail.textContent = note(tab); } }, 30000);
window.addEventListener('unload', () => { clearInterval(clock); clearTimeout(refreshTimer); });
act(async () => { await FireUpUI.ready; await refresh(); });
