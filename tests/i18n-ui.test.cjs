'use strict';
const { chromium } = require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const { harness }=require('./harness.cjs');
(async()=>{
  const h=harness({count:3,keepRecent:1});h.tabs[0].active=true;h.tabs[0].title='Active example';
  fs.mkdirSync(path.resolve('work/browser-temp'),{recursive:true});fs.mkdirSync(path.resolve('work/browser-downloads'),{recursive:true});
  const b=await chromium.launch({headless:true,downloadsPath:path.resolve('work/browser-downloads'),...(process.env.FIREUP_BROWSER?{executablePath:process.env.FIREUP_BROWSER}:{}),env:{...process.env,TEMP:path.resolve('work/browser-temp'),TMP:path.resolve('work/browser-temp')}});
  const evidence=[],errors=[];
  const file=name=>'file:///'+path.resolve(__dirname,'../extension',name).replace(/\\/g,'/');
  async function pageFor(language,name='popup.html'){
    const page=await b.newPage({viewport:{width:400,height:600},locale:'en-US'});
    page.on('pageerror',e=>errors.push(e.message));
    await page.exposeFunction('fireupCommand',async m=>{
      switch(m.type){case 'local':return h.local;case 'state':return h.engine.snapshot();case 'get-settings':return h.engine.getSettings();case 'settings':return h.engine.saveSettings(m.value);case 'preview-import':return h.engine.previewImport(m.text);case 'import-settings':return h.engine.importSettings(m.text);case 'export-settings':return h.engine.exportSettings();case 'options':return true;}
    });
    await page.addInitScript(lang=>{window.browser={i18n:{getUILanguage:()=>lang},runtime:{sendMessage:m=>window.fireupCommand(m),onMessage:{addListener(){}}},storage:{local:{get:()=>window.fireupCommand({type:'local'})}},windows:{getCurrent:async()=>({id:1})}};},language);
    await page.goto(file(name));await page.locator(name==='popup.html'?'.tab-row':'#settings').first().waitFor({state:'visible'});return page;
  }
  try{
    for(const [code,language,label]of [['en-US','en','Settings'],['ru-RU','ru','Настройки'],['fr-FR','en','Settings']]){
      const page=await pageFor(code);assert.equal(await page.locator('html').getAttribute('lang'),language);assert.equal(await page.locator('#options').textContent(),label);assert.match(await page.locator('.tab-row').first().innerText(),language==='en'?/Active tab/:/Текущая вкладка/);await page.close();
    }
    evidence.push('browser UI language selects English or Russian; unsupported language falls back to English');
    const options=await pageFor('ru-RU','options.html');assert.equal(await options.locator('#language').inputValue(),'auto');
    await options.locator('#language').selectOption('en');assert.equal(await options.locator('html').getAttribute('lang'),'en');assert.equal(await options.locator('#import-file').getAttribute('accept'),'.json,application/json');
    await options.getByRole('button',{name:'Save settings',exact:true}).click();await options.waitForFunction(()=>document.querySelector('#saved').textContent==='Settings saved.');assert.equal(h.local.settings.language,'en');
    const popup=await pageFor('ru-RU');assert.equal(await popup.locator('#options').textContent(),'Settings');await popup.close();
    evidence.push('manual English overrides Russian browser and persists after reopening');
    await options.locator('#language').selectOption('ru');await options.getByRole('button',{name:'Сохранить настройки',exact:true}).click();await options.waitForFunction(()=>document.querySelector('#saved').textContent==='Настройки сохранены.');
    const reopened=await pageFor('en-US');assert.equal(await reopened.locator('html').getAttribute('lang'),'ru');await reopened.close();
    evidence.push('manual Russian overrides English browser and translates settings controls');
    await options.locator('#sites').fill('*.example.org');await options.getByRole('button',{name:'Сохранить настройки',exact:true}).click();await options.waitForFunction(()=>document.querySelector('#saved').className==='error');assert.match(await options.locator('#saved').textContent(),/Введите домен/);
    await options.locator('#import-file').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{')});await options.waitForFunction(()=>document.querySelector('#transfer-status').classList.contains('error'));assert.match(await options.locator('#transfer-status').textContent(),/Не удалось прочитать/);
    await options.locator('#language').selectOption('en');assert.match(await options.locator('#transfer-status').textContent(),/Could not read JSON/);
    evidence.push('validation and import errors translate without leaking the previous language');
    const legacy=JSON.parse(await h.engine.exportSettings());legacy.formatVersion=1;legacy.appVersion='0.3.0';delete legacy.settings.language;
    await options.locator('#import-file').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});await options.locator('#import-preview').waitFor({state:'visible'});assert.match(await options.locator('#import-summary').textContent(),/Language: Browser default/);
    await options.locator('#apply-import').click();await options.waitForFunction(()=>document.querySelector('#transfer-status').textContent==='Настройки из файла применены.');assert.equal(h.local.settings.language,'auto');assert.equal(await options.locator('html').getAttribute('lang'),'ru');
    evidence.push('legacy export preview is read-only and applying it restores browser-default language');
    for(const language of ['en','ru']){
      await options.locator('#language').selectOption(language);
      for(const width of [320,800]){await options.setViewportSize({width,height:700});assert(await options.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
      assert.equal(await options.locator('#language').getAttribute('id'),'language');
      await options.locator('#language').focus();await options.keyboard.press('Tab');assert(await options.evaluate(()=>document.activeElement.matches('button[type="submit"]')));
    }
    evidence.push('language selector has a label, keyboard navigation and no horizontal overflow in either language');
    await options.screenshot({path:path.resolve(__dirname,'../preview-russian-settings.png'),fullPage:true});await options.close();
    assert.deepEqual(errors,[]);fs.writeFileSync(path.resolve(__dirname,'../i18n-ui-checks.json'),JSON.stringify({evidence,errors},null,2));console.log(JSON.stringify({passed:evidence.length,evidence},null,2));
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
