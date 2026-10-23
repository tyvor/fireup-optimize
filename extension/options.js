'use strict';
const $ = id => document.getElementById(id);
let busy = false, pendingImport = null, importGeneration = 0, exportUrl = null;
function transferStatus(text, error = false) {
  $('transfer-status').textContent = text; $('transfer-status').classList.toggle('error', error);
}
function setBusy(value) {
  busy = value;
  for (const button of [$('settings').querySelector('button[type=submit]'), $('export'), $('apply-import'), $('cancel-import')]) button.disabled = value;
  $('import-file').disabled = value;
}
function setForm(settings) {
  $('keep').value = settings.keepRecent; $('idle').value = settings.idleMinutes;
  $('sites').value = settings.sites.join('\n'); $('theme').value = settings.theme;
  $('anti-thrash').checked = settings.antiThrash; FireUpUI.theme(settings.theme);
}
function clearPreview() {
  importGeneration++; pendingImport = null; $('import-preview').hidden = true;
  $('import-file').value = ''; $('import-sites').value = ''; $('import-summary').textContent = '';
}
async function load() {
  $('loading').hidden = false; $('loading').textContent = 'Загружаю настройки…'; $('retry').hidden = true;
  try {
    setForm(await FireUpUI.send('get-settings'));
    $('settings').hidden = false; $('transfer').hidden = false; $('loading').hidden = true;
  } catch (e) { $('loading').textContent = `Не удалось получить настройки: ${e.message}`; $('retry').hidden = false; }
}
$('retry').addEventListener('click', load);
$('theme').addEventListener('change', () => FireUpUI.theme($('theme').value));
$('settings').addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return; setBusy(true);
  try {
    const sites = $('sites').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(FireUpPolicy.site);
    if (sites.length > 500) throw new Error('Можно сохранить не больше 500 доменов.');
    await FireUpUI.send('settings', { value: { keepRecent: Number($('keep').value), idleMinutes: Number($('idle').value), sites, theme: $('theme').value, antiThrash: $('anti-thrash').checked } });
    $('saved').textContent = 'Настройки сохранены.'; $('saved').className = '';
  } catch (e) { $('saved').textContent = e.message; $('saved').className = 'error'; }
  finally { setBusy(false); }
});
$('export').addEventListener('click', async () => {
  if (busy) return; setBusy(true);
  try {
    const text = await FireUpUI.send('export-settings');
    if (exportUrl) URL.revokeObjectURL(exportUrl);
    exportUrl = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = exportUrl; link.download = 'fireup-settings.json'; link.hidden = true;
    document.body.append(link); link.click(); link.remove();
    transferStatus('Файл fireup-settings.json передан браузеру для сохранения.');
  } catch (e) { transferStatus(e.message, true); }
  finally { setBusy(false); }
});
$('import-file').addEventListener('change', async () => {
  const generation = ++importGeneration, file = $('import-file').files[0];
  pendingImport = null; $('import-preview').hidden = true;
  if (!file) { transferStatus(''); return; }
  transferStatus('Читаю файл настроек…');
  try {
    if (file.size > FireUpTransfer.MAX_BYTES) throw new Error('Файл настроек должен быть не больше 256 КБ.');
    const text = await file.text();
    const doc = await FireUpUI.send('preview-import', { text });
    if (generation !== importGeneration) return;
    const value = doc.settings;
    $('import-summary').textContent = `Автосон: ${value.enabled ? 'включён' : 'на паузе'}. Рабочий набор: ${value.keepRecent}. Таймер: ${value.idleMinutes} мин. Защита от повторного сна: ${value.antiThrash ? 'включена' : 'выключена'}. Тема: ${{ system: 'системная', light: 'светлая', dark: 'тёмная' }[value.theme]}. Сайтов: ${value.sites.length}.`;
    $('import-sites').value = value.sites.join('\n'); $('import-sites').placeholder = value.sites.length ? '' : 'Исключений сайтов нет';
    pendingImport = { text }; $('import-preview').hidden = false;
    transferStatus('Файл проверен. Просмотрите настройки перед применением.');
    $('apply-import').focus();
  } catch (e) { if (generation === importGeneration) transferStatus(e.message, true); }
});
$('apply-import').addEventListener('click', async () => {
  if (busy || !pendingImport) return; const candidate = pendingImport; setBusy(true);
  try {
    const settings = await FireUpUI.send('import-settings', { text: candidate.text });
    setForm(settings); clearPreview(); $('saved').textContent = ''; transferStatus('Настройки из файла применены.');
    $('export').focus();
  } catch (e) { transferStatus(e.message, true); }
  finally { setBusy(false); $('export').focus(); }
});
$('cancel-import').addEventListener('click', () => { if (!busy) { clearPreview(); transferStatus('Импорт отменён.'); $('import-file').focus(); } });
window.addEventListener('unload', () => { if (exportUrl) URL.revokeObjectURL(exportUrl); });
load();
