'use strict';
const $ = id => document.getElementById(id);
const t = (key, values) => FireUpI18n.t(key, values);
let busy = false, pendingImport = null, importGeneration = 0, exportUrl = null, statusKey = '', statusError = false;
function transferStatus(key, error = false) {
  statusKey = key; statusError = error;
  $('transfer-status').textContent = error ? FireUpI18n.error(key) : t(key);
  $('transfer-status').classList.toggle('error', error);
}
function setBusy(value) {
  busy = value;
  for (const button of [$('settings').querySelector('button[type=submit]'), $('export'), $('apply-import'), $('cancel-import')]) button.disabled = value;
  $('import-file').disabled = value; $('language').disabled = value;
}
function importSummary(value) {
  $('import-summary').textContent = t('Automatic sleep: {enabled}. Working set: {keep}. Timer: {idle} min. Quick-return delay: {anti}. Theme: {theme}. Language: {language}. Sites: {sites}.', {
    enabled: t(value.enabled ? 'On' : 'Paused'), keep: value.keepRecent, idle: value.idleMinutes,
    anti: t(value.antiThrash ? 'Enabled' : 'Disabled'), theme: t({ system: 'System', light: 'Light', dark: 'Dark' }[value.theme]),
    language: value.language === 'auto' ? t('Browser default') : value.language === 'en' ? 'English' : 'Русский', sites: value.sites.length
  });
  $('import-sites').value = value.sites.join('\n'); $('import-sites').placeholder = value.sites.length ? '' : t('No site exclusions');
}
function configure() {
  FireUpUI.configure({ theme: $('theme').value, language: $('language').value });
  if (pendingImport) importSummary(pendingImport.settings);
  transferStatus(statusKey, statusError); $('saved').textContent = '';
}
function setForm(settings) {
  $('keep').value = settings.keepRecent; $('idle').value = settings.idleMinutes;
  $('sites').value = settings.sites.join('\n'); $('theme').value = settings.theme;
  $('language').value = settings.language || 'auto'; $('anti-thrash').checked = settings.antiThrash;
  configure();
}
function clearPreview() {
  importGeneration++; pendingImport = null; $('import-preview').hidden = true;
  $('import-file').value = ''; $('import-sites').value = ''; $('import-summary').textContent = '';
}
async function load() {
  await FireUpUI.ready;
  $('loading').hidden = false; $('loading').textContent = t('Loading settings…'); $('retry').hidden = true;
  try {
    setForm(await FireUpUI.send('get-settings'));
    $('settings').hidden = false; $('transfer').hidden = false; $('loading').hidden = true;
  } catch (e) { $('loading').textContent = t('Could not load settings: {error}', { error: FireUpI18n.error(e) }); $('retry').hidden = false; }
}
$('retry').addEventListener('click', load);
$('theme').addEventListener('change', () => FireUpUI.theme($('theme').value));
$('language').addEventListener('change', configure);
$('settings').addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return; setBusy(true);
  try {
    const sites = $('sites').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(FireUpPolicy.site);
    if (sites.length > 500) throw new Error('Use at most 500 excluded domains.');
    const settings = await FireUpUI.send('settings', { value: { keepRecent: Number($('keep').value), idleMinutes: Number($('idle').value), sites, theme: $('theme').value, antiThrash: $('anti-thrash').checked, language: $('language').value } });
    FireUpUI.configure(settings);
    $('saved').textContent = t('Settings saved.'); $('saved').className = '';
  } catch (e) { $('saved').textContent = FireUpI18n.error(e); $('saved').className = 'error'; }
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
    transferStatus('The browser received fireup-settings.json for saving.');
  } catch (e) { transferStatus(e.message, true); }
  finally { setBusy(false); }
});
$('import-file').addEventListener('change', async () => {
  const generation = ++importGeneration, file = $('import-file').files[0];
  pendingImport = null; $('import-preview').hidden = true;
  if (!file) { transferStatus(''); return; }
  transferStatus('Reading settings file…');
  try {
    if (file.size > FireUpTransfer.MAX_BYTES) throw new Error('The settings file must be no larger than 256 KB.');
    const text = await file.text();
    const doc = await FireUpUI.send('preview-import', { text });
    if (generation !== importGeneration) return;
    pendingImport = { text, settings: doc.settings }; importSummary(doc.settings); $('import-preview').hidden = false;
    transferStatus('File validated. Review the settings before applying.'); $('apply-import').focus();
  } catch (e) { if (generation === importGeneration) transferStatus(e.message, true); }
});
$('apply-import').addEventListener('click', async () => {
  if (busy || !pendingImport) return; const candidate = pendingImport; setBusy(true);
  try {
    const settings = await FireUpUI.send('import-settings', { text: candidate.text });
    clearPreview(); setForm(settings); transferStatus('Imported settings applied.');
  } catch (e) { transferStatus(e.message, true); }
  finally { setBusy(false); $('export').focus(); }
});
$('cancel-import').addEventListener('click', () => { if (!busy) { clearPreview(); transferStatus('Import cancelled.'); $('import-file').focus(); } });
window.addEventListener('unload', () => { if (exportUrl) URL.revokeObjectURL(exportUrl); });
load();
