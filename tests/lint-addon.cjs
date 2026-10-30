'use strict';
const fs = require('node:fs'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const manifest = require('../extension/manifest.json');
const result = spawnSync(process.execPath, [path.join(root, 'node_modules/web-ext/bin/web-ext.js'), 'lint', '--source-dir', path.join(root, 'extension'), '--output', 'json', '--no-config-discovery'], {
  cwd: root, encoding: 'utf8', env: { ...process.env, NO_UPDATE_NOTIFIER: '1' }
});
if (result.error) throw result.error;
if (result.status !== 0) { process.stderr.write(result.stderr || result.stdout); process.exit(result.status || 1); }
const report = JSON.parse(result.stdout);
const desktopOnly = !Object.hasOwn(manifest.browser_specific_settings, 'gecko_android');
const waived = [], blocking = [];
for (const warning of report.warnings || []) {
  if (desktopOnly && warning.code === 'KEY_FIREFOX_ANDROID_UNSUPPORTED_BY_MIN_VERSION') waived.push(warning);
  else blocking.push(warning);
}
const evidence = { errors: report.errors || [], notices: report.notices || [], blockingWarnings: blocking, waivedWarnings: waived,
  waiverReason: 'Desktop-only release: no gecko_android entry and Android must remain unselected in AMO. The Android 140 data-collection compatibility warning does not apply to the supported desktop target.' };
fs.mkdirSync(path.join(root, 'checks'), { recursive: true });
fs.writeFileSync(path.join(root, 'checks/addon-lint.json'), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
if (evidence.errors.length || blocking.length || evidence.notices.length) process.exitCode = 1;
