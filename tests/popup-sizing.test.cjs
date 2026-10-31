'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '..'), temp = path.join(root, 'work/browser-temp');
  fs.mkdirSync(temp, { recursive: true }); fs.mkdirSync(path.join(root, 'checks'), { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.FIREUP_BROWSER ? { executablePath: process.env.FIREUP_BROWSER } : {}), env: { ...process.env, TEMP: temp, TMP: temp } });
  const evidence = [];
  try {
    // A tiny viewport exercises the CSS lower bound, not Firefox's popup-sizing algorithm.
    for (const language of ['en', 'ru']) for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width: 16, height: 600 }, colorScheme: theme });
      await page.addInitScript(lang => {
        window.browser = { i18n: { getUILanguage: () => lang }, storage: { local: { get: () => new Promise(() => {}) } }, runtime: { onMessage: { addListener() {} }, sendMessage: () => new Promise(() => {}) }, windows: { getCurrent: async () => ({ id: 1 }) } };
      }, language);
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto('file:///' + path.join(root, 'extension/popup.html').replaceAll('\\', '/'));
      const initial = await page.evaluate(() => ({ width: document.body.getBoundingClientRect().width, height: document.body.getBoundingClientRect().height, min: getComputedStyle(document.body).minWidth, title: document.querySelector('h1').textContent }));
      assert.equal(initial.width, 320); assert.equal(initial.height, 600); assert.equal(initial.min, '320px'); assert.equal(initial.title, 'FireUp');
      for (const width of [320, 400, 800]) {
        await page.setViewportSize({ width, height: 600 });
        const size = await page.evaluate(() => ({ body: document.body.getBoundingClientRect().width, scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.equal(size.body, Math.min(width, 400)); assert(size.scroll <= size.viewport, JSON.stringify(size));
      }
      for (let opening = 0; opening < 3; opening++) {
        await page.reload(); assert.equal(await page.locator('body').evaluate(el => el.getBoundingClientRect().width), 400);
      }
      assert.deepEqual(errors, []);
      evidence.push({ language, theme, initial, repeatedLoads: 3, apiResponse: 'intentionally unresolved' });
      if (language === 'en' && theme === 'light') await page.screenshot({ path: path.join(root, 'checks/popup-loading.png') });
      await page.close();
    }
    fs.writeFileSync(path.join(root, 'checks/popup-sizing.json'), JSON.stringify({ engine: 'Chromium', nativeFirefoxConfirmed: false, evidence }, null, 2));
    console.log(`Popup lower bound and delayed startup: ${evidence.length} language/theme combinations pass.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
