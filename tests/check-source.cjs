'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', '.git', 'work', 'dist'].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}
let scripts = 0, json = 0, links = 0;
for (const file of files(root)) {
  const extension = path.extname(file);
  if (['.js', '.cjs'].includes(extension)) { new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file }); scripts++; }
  if (extension === '.json') { JSON.parse(fs.readFileSync(file, 'utf8')); json++; }
  if (extension === '.md') for (const match of fs.readFileSync(file, 'utf8').matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const href = match[1];
    if (/^(?:[a-z][a-z\d+.-]*:|#|\/)/i.test(href)) continue;
    const target = decodeURIComponent(href.split('#')[0]);
    if (!target) continue;
    assert(fs.existsSync(path.resolve(path.dirname(file), target)), `Broken local link in ${path.relative(root, file)}: ${href}`); links++;
  }
}
const manifest = require('../extension/manifest.json');
assert.equal(manifest.version, require('../package.json').version);
require('../extension/policy.js');
assert.equal(manifest.version, require('../extension/transfer.js').VERSION);
assert(fs.readFileSync(path.join(root, 'extension/options.html'), 'utf8').includes(`>${manifest.version}</span>`), 'Settings page version differs from manifest');
for (const name of [...manifest.background.scripts, manifest.browser_action.default_popup, ...Object.values(manifest.icons)]) {
  assert(fs.existsSync(path.join(root, 'extension', name)), `Missing manifest source: ${name}`);
}
console.log(JSON.stringify({ scripts, json, localLinks: links, version: manifest.version }));
