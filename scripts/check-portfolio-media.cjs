const fs = require('node:fs');
const path = require('node:path');
const media = require('../src/data/portfolioMedia.json');
const root = path.resolve(__dirname, '../public');
const missing = [];
const deferred = [];
for (const [key, asset] of Object.entries(media)) {
  if (asset.required === false && !asset.src) {
    deferred.push(key);
    continue;
  }
  const file = asset.src && path.resolve(root, '.' + asset.src);
  if (!file || !file.startsWith(root + path.sep) || !fs.existsSync(file)) {
    missing.push(`${key}: ${asset.filename}`);
  }
  if (asset.credit && (!asset.credit.url || !asset.credit.text || !asset.credit.license)) {
    missing.push(`${key}: complete attribution and license metadata`);
  }
}
if (missing.length) {
  console.error('Required portfolio image assets are missing; deployment is blocked.');
  for (const item of missing) console.error(' - ' + item);
  process.exitCode = 1;
} else {
  console.log('All required local portfolio images and declared credits are present.');
  if (deferred.length) console.log(`${deferred.length} optional research photographs deferred by the owner.`);
}
