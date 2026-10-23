'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const I=require('../extension/i18n.js'),P=require('../extension/policy.js'),T=require('../extension/transfer.js');
const {harness}=require('./harness.cjs');
test('browser interface language selects Russian and defaults other languages to English',()=>{
  for(const code of ['ru','ru-RU','RU-ru','ru_BY'])assert.equal(I.resolve('auto',code),'ru');
  for(const code of ['en','en-US','fr-FR','de','russian','uk-UA'])assert.equal(I.resolve('auto',code),'en');
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
test('Russian catalog covers static UI and literal runtime translations with matching parameters',()=>{
  const root=path.resolve(__dirname,'../extension');const keys=new Set();
  for(const name of ['popup.html','options.html'])for(const m of fs.readFileSync(path.join(root,name),'utf8').matchAll(/data-i18n(?:-placeholder|-aria|-title)?="([^"]+)"/g))keys.add(m[1]);
  for(const name of ['popup.js','options.js','background.js'])for(const m of fs.readFileSync(path.join(root,name),'utf8').matchAll(/\bt\('([^']+)'/g))keys.add(m[1]);
  for(const key of keys)assert(Object.hasOwn(I.ru,key),key);
  for(const [en,ru]of Object.entries(I.ru))assert.deepEqual([...en.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),[...ru.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),en);
});
test('native menus and shortcut descriptions follow saved language and serialized changes',async()=>{
  const h=harness();let handler;const menu=new Map(),commands=[];
  const event={addListener(){}};
  const browser={...h.browser,i18n:{getUILanguage:()=> 'ru-RU'},runtime:{...h.browser.runtime,id:'fireup-test',onMessage:{addListener(fn){handler=fn;}},onInstalled:event,onStartup:event},
    tabs:{...h.browser.tabs,onActivated:event,onCreated:event,onRemoved:event,onUpdated:event},
    alarms:{...h.browser.alarms,onAlarm:event},menus:{removeAll:async()=>menu.clear(),create:item=>menu.set(item.id,item),onClicked:event},
    commands:{update:async item=>commands.push(item),onCommand:event}};
  const context=vm.createContext({browser,console,createFireUp:()=>h.engine});
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../extension/i18n.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../extension/background.js'),'utf8'),context);
  const send=value=>handler({type:'settings',value},{id:'fireup-test'});
  await send({language:'en'});assert.equal(menu.get('protect-permanent').title,'FireUp: Protect tab');assert.match(commands.at(-1).description,/Unload/);
  await Promise.all([send({language:'en'}),send({language:'ru'})]);assert.equal(menu.get('protect-permanent').title,'FireUp: Защитить вкладку');assert.match(commands.at(-1).description,/Усыпить/);
  await send({language:'auto'});assert.equal(menu.get('protect-permanent').title,'FireUp: Защитить вкладку');
});
