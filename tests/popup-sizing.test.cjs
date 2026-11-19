'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { languages } = require('../extension/i18n.js');
(async () => {
  const root = path.resolve(__dirname, '..'), temp = path.join(root, 'work/browser-temp');
  fs.mkdirSync(temp, { recursive: true }); fs.mkdirSync(path.join(root, 'checks'), { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.FIREUP_BROWSER ? { executablePath: process.env.FIREUP_BROWSER } : {}), env: { ...process.env, TEMP: temp, TMP: temp } });
  const evidence = [];
  try {
    // A tiny viewport exercises the CSS lower bound, not Firefox's popup-sizing algorithm.
    for (const { code: language } of languages) for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width: 16, height: 600 }, colorScheme: theme });
      await page.addInitScript(lang => {
        const settings = { theme: 'system', language: 'auto', enabled: true };
        let resolveSettings;
        const pending = new Promise(resolve => { resolveSettings = resolve; });
        window.finishLoading = () => resolveSettings({ settings });
        window.browser = {
          i18n: { getUILanguage: () => lang },
          storage: { local: { get: () => pending } },
          runtime: {
            onMessage: { addListener() {} },
            sendMessage: async () => ({
              settings,
              tabs: [{ id: 1, windowId: 1, title: 'Example tab', host: 'example.org', canSleep: true, note: 'In working set' }]
            })
          },
          windows: { getCurrent: async () => ({ id: 1 }) }
        };
      }, language);
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto('file:///' + path.join(root, 'extension/popup.html').replaceAll('\\', '/'));
      const initial = await page.evaluate(() => ({ width: document.body.getBoundingClientRect().width, height: document.body.getBoundingClientRect().height, min: getComputedStyle(document.body).minWidth, title: document.querySelector('h1').textContent }));
      assert.equal(initial.width, 320); assert.equal(initial.height, 520); assert.equal(initial.min, '320px'); assert.equal(initial.title, 'FireUp');
      if (language === 'en' && theme === 'light') await page.screenshot({ path: path.join(root, 'checks/popup-loading.png') });
      for (const width of [320, 400, 800]) {
        await page.setViewportSize({ width, height: 600 });
        const size = await page.evaluate(() => ({ body: document.body.getBoundingClientRect().width, scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.equal(size.body, Math.min(width, 400)); assert(size.scroll <= size.viewport, JSON.stringify(size));
      }
      await page.setViewportSize({ width: 320, height: 520 });
      const geometry = () => page.evaluate(() => ({
        width: document.body.getBoundingClientRect().width,
        height: document.body.getBoundingClientRect().height,
        scrollHeight: document.documentElement.scrollHeight
      }));
      const loadingSize = await geometry();
      await page.evaluate(() => window.finishLoading());
      await page.waitForFunction(() => !document.getElementById('scope').disabled);
      assert.deepEqual(await geometry(), loadingSize);
      const metrics = page.locator('.metrics');
      const listArea = page.locator('.popup-main');
      const expandedMetrics = (await metrics.boundingBox()).height;
      const collapsedListArea = (await listArea.boundingBox()).height;
      for (const id of ['tab-list', 'candidate-preview', 'candidate-preview', 'tab-list']) {
        await page.locator(`#${id} > summary`).click();
        assert.deepEqual(await geometry(), loadingSize, `${language}/${theme}: #${id}`);
        if (id !== 'tab-list') continue;
        const listOpen = await page.locator('#tab-list').evaluate(details => details.open);
        const metricsHeight = (await metrics.boundingBox()).height;
        if (listOpen) {
          assert(metricsHeight < expandedMetrics, `${language}/${theme}: cards should shrink`);
          assert((await listArea.boundingBox()).height > collapsedListArea, `${language}/${theme}: list should gain space`);
        } else {
          assert.equal(metricsHeight, expandedMetrics, `${language}/${theme}: cards should return to full size`);
        }
      }
      await page.setViewportSize({ width: 800, height: 600 });
      for (let opening = 0; opening < 3; opening++) {
        await page.reload(); assert.equal(await page.locator('body').evaluate(el => el.getBoundingClientRect().width), 400);
      }
      assert.deepEqual(errors, []);
      evidence.push({ language, theme, initial, repeatedLoads: 3, stableAfterLoadingAndToggles: true });
      await page.close();
    }
    fs.writeFileSync(path.join(root, 'checks/popup-sizing.json'), JSON.stringify({ engine: 'Chromium', nativeFirefoxConfirmed: false, evidence }, null, 2));
    console.log(`Popup startup and stable geometry: ${evidence.length} language/theme combinations pass.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
