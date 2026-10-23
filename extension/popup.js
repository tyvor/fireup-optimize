'use strict';
const $ = id => document.getElementById(id);
const rows = new Map(), selected = new Set();
let shownRun = 0;
let state, currentWindow, working = false, refreshTimer, refreshPending = false, protectedId = null;
function message(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
function scope() {
  const value = $('scope').value;
  if (value === 'window') return { type: 'window', windowId: currentWindow };
  if (value === 'selected') return { type: 'selected', ids: [...selected] };
  if (value.startsWith('site:')) return { type: 'site', host: value.slice(5) };
  return { type: 'all' };
}
function scoped(tab) {
  const value = scope();
  return value.type === 'all' || (value.type === 'window' && tab.windowId === value.windowId)
    || (value.type === 'selected' && selected.has(tab.id)) || (value.type === 'site' && tab.host === value.host);
}
function note(tab) {
  if (tab.discarded) return 'Спит';
  if (tab.protection?.mode === 'timed') return `Защищена до ${new Date(tab.protection.until).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}${tab.reason && tab.reason !== 'Временная защита' ? ` · ${tab.reason}` : ''}`;
  if (!tab.note && tab.antiThrashUntil > Date.now()) return `Быстрый возврат · до сна около ${Math.max(1, Math.ceil((tab.deadline - Date.now()) / 60000))} мин`;
  if (tab.note) return tab.note;
  if (!tab.deadline) return 'Ожидает данных об активности';
  const minutes = Math.ceil((tab.deadline - Date.now()) / 60000);
  return minutes > 0 ? `До сна около ${minutes} мин` : 'Готова ко сну · ожидает очереди';
}
function footerStatus() {
  if (!state) return;
  const candidates = state.tabs.filter(t => t.canSleep && scoped(t));
  const q = state.queue;
  $('sleep').textContent = q ? `В очереди: ${q.processed} из ${q.total}` : `Усыпить вкладки: ${candidates.length}`;
  $('sleep').disabled = working || Boolean(q) || !candidates.length;
  $('cancel').hidden = !q; $('cancel').disabled = Boolean(q?.cancelled);
  $('pause').disabled = working;
  $('scope-note').textContent = q ? `Выгружено ${q.slept}, пропущено ${q.skipped}, ошибок ${q.failed}.` : 'Ручная команда затронет и недавние вкладки. Защищённые останутся.';
}
function row(tab) {
  const el = document.createElement('div'); el.className = 'tab-row'; el.dataset.id = tab.id;
  const choose = document.createElement('input'); choose.type = 'checkbox'; choose.className = 'choose'; choose.setAttribute('aria-label', `Выбрать: ${tab.title}`);
  choose.addEventListener('change', () => { choose.checked ? selected.add(tab.id) : selected.delete(tab.id); footerStatus(); });
  const icon = document.createElement('img'); icon.className = 'site-icon'; icon.alt = ''; icon.hidden = true;
  const letter = document.createElement('span'); letter.className = 'site-letter'; letter.setAttribute('aria-hidden', 'true');
  icon.addEventListener('error', () => { icon.hidden = true; letter.hidden = false; });
  const info = document.createElement('button'); info.className = 'tab-info'; info.type = 'button';
  const title = document.createElement('span'); title.className = 'tab-title';
  const detail = document.createElement('span'); detail.className = 'tab-note'; info.append(title, detail);
  info.addEventListener('click', () => act(async () => { await FireUpUI.send('focus', { id: tab.id }); window.close(); }));
  const protect = document.createElement('button'); protect.type = 'button'; protect.className = 'protect'; protect.setAttribute('aria-controls', 'protection-menu');
  protect.addEventListener('click', () => {
    for (const view of rows.values()) view.protect.setAttribute('aria-expanded', 'false');
    protectedId = tab.id;
    $('protection-title').textContent = `Защита: ${rows.get(tab.id).title.textContent}`;
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
  FireUpUI.theme(state.settings.theme);
  $('counts').textContent = `Загружено ${state.tabs.filter(t => !t.discarded).length} из ${state.tabs.length}`;
  $('auto').textContent = state.settings.enabled ? 'Автосон включён' : 'Автосон на паузе';
  $('pause').textContent = state.settings.enabled ? 'Приостановить' : 'Продолжить';
  $('pause').setAttribute('aria-pressed', String(!state.settings.enabled));
  const query = $('search').value.toLocaleLowerCase(), filter = $('filter').value;
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
    const matches = `${tab.title} ${tab.host}`.toLocaleLowerCase().includes(query)
      && (filter === 'all' || (filter === 'loaded' && !tab.discarded) || (filter === 'sleeping' && tab.discarded) || (filter === 'protected' && tab.reason));
    if (!matches && view.el.contains(document.activeElement)) $('search').focus();
    view.el.hidden = !matches; if (matches) visible++;
    view.el.classList.toggle('asleep', tab.discarded);
    view.title.textContent = tab.title; view.info.title = `${tab.title}\n${tab.host}`;
    view.detail.textContent = [tab.host, note(tab)].filter(Boolean).join(' · ');
    view.choose.checked = selected.has(tab.id); view.choose.disabled = !tab.canSleep;
    view.choose.setAttribute('aria-label', `Выбрать: ${tab.title}`);
    view.letter.textContent = tab.host ? tab.host[0].toUpperCase() : '·';
    if (tab.icon && view.icon.getAttribute('src') !== tab.icon) { view.icon.src = tab.icon; view.icon.hidden = false; view.letter.hidden = true; }
    if (!tab.icon) { view.icon.hidden = true; view.letter.hidden = false; }
    view.protect.textContent = tab.protection && tab.protection.mode !== 'unknown' ? 'Защита' : 'Защитить';
    view.protect.setAttribute('aria-pressed', String(Boolean(tab.protection && tab.protection.mode !== 'unknown')));
    view.protect.setAttribute('aria-label', `Настроить защиту: ${tab.title}`);
  }
  if (!visible) {
    const item = document.createElement('p'); item.className = 'empty';
    item.textContent = state.tabs.length ? 'Нет совпадений. Измените поиск или фильтр.' : 'Обычных вкладок пока нет.';
    $('tabs').append(item);
  }
  const prior = $('scope').value;
  const sites = [...new Set(state.tabs.map(t => t.host).filter(Boolean))].sort();
  for (const option of [...$('scope').options]) if (option.value.startsWith('site:') && !sites.includes(option.value.slice(5))) option.remove();
  for (const site of sites) if (![...$('scope').options].some(o => o.value === `site:${site}`)) {
    const option = document.createElement('option'); option.value = `site:${site}`; option.textContent = `Сайт: ${site}`; $('scope').append(option);
  }
  if ([...$('scope').options].some(o => o.value === prior)) $('scope').value = prior;
  if (state.lastRun && state.lastRun.at !== shownRun) {
    shownRun = state.lastRun.at;
    message(`Выгружено ${state.lastRun.slept}, пропущено ${state.lastRun.skipped}, ошибок ${state.lastRun.failed}.${state.lastRun.cancelled ? ' Очередь остановлена.' : ''}`);
  }
  footerStatus(); retry.hidden = true;
}
async function refresh() { state = await FireUpUI.send('state'); render(); }
function scheduleRefresh() {
  if (working) { refreshPending = true; return; }
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => refresh().catch(e => message(e.message, true)), 120);
}
async function act(fn) {
  if (working) return;
  working = true; if (state) footerStatus();
  try { await fn(); }
  catch (e) { message(e.message || 'Не удалось выполнить действие. Повторите попытку.', true); $('retry').hidden = false; }
  finally { working = false; if (state) footerStatus(); if (refreshPending) { refreshPending = false; scheduleRefresh(); } }
}
$('pause').addEventListener('click', () => act(async () => { await FireUpUI.send('settings', { value: { enabled: !state.settings.enabled } }); await refresh(); message(state.settings.enabled ? 'Автосон включён.' : 'Автосон приостановлен. Ручная выгрузка доступна.'); }));
$('sleep').addEventListener('click', () => act(async () => {
  const ids = state.tabs.filter(t => t.canSleep && scoped(t)).map(t => t.id);
  const result = await FireUpUI.send('sleep', { scope: scope(), ids });
  await refresh(); message(result.busy ? 'Очередь уже выполняется.' : `В очереди вкладок: ${result.queued}.`);
}));
$('cancel').addEventListener('click', async () => { try { await FireUpUI.send('cancel'); await refresh(); message('Очередь остановлена. Уже выгруженные вкладки остаются спящими.'); } catch (e) { message(e.message, true); } });
$('options').addEventListener('click', () => act(() => FireUpUI.send('options')));
$('refresh').addEventListener('click', () => act(async () => { await refresh(); message('Список обновлён.'); }));
$('retry').addEventListener('click', () => act(refresh));
$('search').addEventListener('input', () => { if (state) render(); });
$('filter').addEventListener('change', () => { if (state) render(); });
$('scope').addEventListener('change', footerStatus);
$('close-protection').addEventListener('click', closeProtection);
for (const button of document.querySelectorAll('[data-protect]')) button.addEventListener('click', () => act(async () => {
  await FireUpUI.send('protect', { id: protectedId, mode: button.dataset.protect });
  await refresh(); closeProtection(); message('Защита обновлена.');
}));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('protection-menu').hidden) { event.preventDefault(); closeProtection(); } });
browser.runtime.onMessage.addListener(event => { if (event?.type === 'changed') scheduleRefresh(); });
const clock = setInterval(() => { if (state && !document.hidden) for (const tab of state.tabs) { const view = rows.get(tab.id); if (view && !view.el.hidden) view.detail.textContent = [tab.host, note(tab)].filter(Boolean).join(' · '); } }, 30000);
window.addEventListener('unload', () => { clearInterval(clock); clearTimeout(refreshTimer); });
act(async () => { currentWindow = (await browser.windows.getCurrent()).id; await refresh(); });

