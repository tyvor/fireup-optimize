'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const I=require('../extension/i18n.js'),P=require('../extension/policy.js'),T=require('../extension/transfer.js');
const {harness}=require('./harness.cjs');
const {execFileSync}=require('node:child_process');
const os=require('node:os');
test('browser interface language resolves the configured region or base language and falls back to English',()=>{
  for(const code of ['ru','ru-RU','RU-ru','ru_BY'])assert.equal(I.resolve('auto',code),'ru');
  for (const [code, expected] of [
    ['de-DE','de'], ['de-AT','de'], ['ja-JP','ja'], ['es','es'], ['es-ES','es'],
    ['es-MX','es-MX'], ['es_MX','es-MX'], ['pt-PT','pt'], ['pt','pt'], ['pt-BR','pt-BR'], ['PT_br','pt-BR']
  ]) assert.equal(I.resolve('auto', code), expected);
  for(const code of ['en','en-US','fr-FR','russian','uk-UA'])assert.equal(I.resolve('auto',code),'en');
  assert.equal(I.resolve('en','ru-RU'),'en');assert.equal(I.resolve('ru','en-US'),'ru');
});
test('language preferences migrate, persist and survive background recreation',async()=>{
  assert.equal(P.settings().language,'auto');assert.equal(P.settings({language:'fr'}).language,'auto');
  const h=harness();await h.engine.saveSettings({language:'ru'});assert.equal((await h.restart().getSettings()).language,'ru');
  await h.engine.saveSettings({language:'auto'});assert.equal(h.local.settings.language,'auto');
});
test('settings transfer retains manual language and upgrades format 1 to browser default',async()=>{
  const doc=JSON.parse(T.serialize(P.settings({language:'ru'})));
  assert.equal(doc.formatVersion,2);assert.equal(T.parse(JSON.stringify(doc)).settings.language,'ru');
  const legacy=structuredClone(doc);legacy.formatVersion=1;legacy.appVersion='0.3.0';delete legacy.settings.language;
  assert.equal(T.parse(JSON.stringify(legacy)).settings.language,'auto');
  for(const language of ['fr',null,4,{}]){const invalid=structuredClone(doc);invalid.settings.language=language;assert.throws(()=>T.parse(JSON.stringify(invalid)));}
  const invalid=structuredClone(doc);delete invalid.settings.language;assert.throws(()=>T.parse(JSON.stringify(invalid)));
  const h=harness();await h.engine.importSettings(JSON.stringify(doc));assert.equal((await h.engine.getSettings()).language,'ru');
});
test('translated errors and templates preserve parameters',()=>{
  I.set('ru');assert.equal(I.t('Loaded {loaded} of {total}',{loaded:2,total:5}),'Загружено 2 из 5');
  assert.equal(I.error(Error('Invalid structure: settings.')),'Неверная структура: настройки.');
  assert.equal(I.error(Error('Unknown language setting.')),'Неизвестный язык интерфейса.');
  I.set('en');assert.equal(I.t('Settings'),'Settings');assert.equal(I.error(Error('Unknown language setting.')),'Unknown language setting.');
});
test('every catalog covers the English message set, including inherited regional translations',()=>{
  const root=path.resolve(__dirname,'../extension');const keys=new Set();
  for(const name of ['popup.html','options.html'])for(const m of fs.readFileSync(path.join(root,name),'utf8').matchAll(/data-i18n(?:-placeholder|-aria|-title)?="([^"]+)"/g))keys.add(m[1]);
  for(const name of ['popup.js','options.js','background.js'])for(const m of fs.readFileSync(path.join(root,name),'utf8').matchAll(/\bt\('([^']+)'/g))keys.add(m[1]);
  for (const key of keys) assert(Object.hasOwn(I.messages('en'), key), key);
  for (const { code } of I.languages) {
    const base = code.split('-')[0];
    for (const key of Object.keys(I.messages('en'))) {
      assert(Object.hasOwn(I.messages(code), key) || Object.hasOwn(I.messages(base) || {}, key), `${code}: ${key}`);
    }
  }
});
test('regional languages use their own wording, inherit other phrases and round-trip through settings',()=>{
  const pairs = [
    ['es', 'es-MX', 'Ajustes', 'Configuración', 'All windows'],
    ['pt', 'pt-BR', 'Definições', 'Configurações', 'All windows']
  ];
  try {
    for (const [base, regional, baseSettings, regionalSettings, inheritedKey] of pairs) {
      I.set(base);
      assert.equal(I.t('Settings'), baseSettings);
      const inherited = I.t(inheritedKey);
      I.set(regional);
      assert.equal(I.t('Settings'), regionalSettings);
      assert.equal(I.t(inheritedKey), inherited);
      assert.equal(T.parse(T.serialize(P.settings({language:regional}))).settings.language, regional);
    }
  } finally { I.set('en'); }
});
test('one new catalog is enough to select a regional language, validate settings and generate Firefox metadata', t => {
  const source = path.resolve(__dirname, '..');
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'fireup-locale-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  fs.mkdirSync(path.join(fixture, 'scripts'));
  fs.cpSync(path.join(source, 'locales'), path.join(fixture, 'locales'), { recursive: true });
  const compiler = path.join(fixture, 'scripts', 'build-locales.cjs');
  fs.copyFileSync(path.join(source, 'scripts', 'build-locales.cjs'), compiler);
  const catalog = { name: 'Français (Canada)', direction: 'ltr', description: 'Catalogue de test', messages: { Settings: 'Paramètres' } };
  const file = path.join(fixture, 'locales', 'fr-CA.json');
  fs.writeFileSync(file, JSON.stringify(catalog));
  execFileSync(process.execPath, [compiler]);
  const context = vm.createContext({ TextEncoder });
  for (const script of ['locales.generated.js', 'i18n.js', 'policy.js', 'transfer.js']) {
    const from = script === 'locales.generated.js' ? fixture : source;
    vm.runInContext(fs.readFileSync(path.join(from, 'extension', script), 'utf8'), context);
  }
  const i18n = context.FireUpI18n;
  assert.equal(i18n.resolve('auto', 'fr-CA-u-nu-latn'), 'fr-CA');
  assert.equal(i18n.languageName('fr-CA'), catalog.name);
  i18n.set('fr-CA');
  assert.equal(i18n.t('Settings'), 'Paramètres');
  assert.equal(i18n.t('Pause'), 'Pause');
  const settings = context.FireUpPolicy.settings({ language: 'fr-CA' });
  const transfer = context.FireUpTransfer;
  assert.equal(transfer.parse(transfer.serialize(settings)).settings.language, 'fr-CA');
  const native = JSON.parse(fs.readFileSync(path.join(fixture, 'extension/_locales/fr_CA/messages.json'), 'utf8'));
  assert.equal(native.extensionDescription.message, catalog.description);
  catalog.messages['Show candidates ({count})'] = 'Afficher les onglets';
  fs.writeFileSync(file, JSON.stringify(catalog));
  assert.throws(() => execFileSync(process.execPath, [compiler], { stdio: 'pipe' }), /check the text and placeholders/);
});
test('native menus and shortcut descriptions follow saved language and serialized changes',async()=>{
  const h=harness();let handler;const menu=new Map(),commands=[];
  const event={addListener(){}};
  const browser={...h.browser,i18n:{getUILanguage:()=> 'ru-RU'},runtime:{...h.browser.runtime,id:'fireup-test',onMessage:{addListener(fn){handler=fn;}},onInstalled:event,onStartup:event},
    tabs:{...h.browser.tabs,onActivated:event,onCreated:event,onRemoved:event,onUpdated:event},
    alarms:{...h.browser.alarms,onAlarm:event},menus:{removeAll:async()=>menu.clear(),create:item=>menu.set(item.id,item),onClicked:event},
    commands:{update:async item=>commands.push(item),onCommand:event}};
  const context=vm.createContext({browser,console,createFireUp:()=>h.engine});
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../extension/locales.generated.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../extension/i18n.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../extension/background.js'),'utf8'),context);
  const send=value=>handler({type:'settings',value},{id:'fireup-test'});
  await send({language:'en'});assert.equal(menu.get('protect-permanent').title,'FireUp: Protect tab');assert.match(commands.at(-1).description,/Unload/);
  await Promise.all([send({language:'en'}),send({language:'ru'})]);assert.equal(menu.get('protect-permanent').title,'FireUp: Защитить вкладку');assert.match(commands.at(-1).description,/Усыпить/);
  await send({language:'auto'});assert.equal(menu.get('protect-permanent').title,'FireUp: Защитить вкладку');
  for (const { code } of I.languages) {
    const set = await send({language:code});
    assert.equal(set.language, code);
    const protect = I.messages(code)['Protect tab'] ?? I.messages(code.split('-')[0])['Protect tab'];
    assert.equal(menu.get('protect-permanent').title, 'FireUp: ' + protect);
    const native = require(`../extension/_locales/${code.replaceAll('-', '_')}/messages.json`);
    assert.equal(commands.at(-1).description, native.unloadCommand.message);
  }
});
