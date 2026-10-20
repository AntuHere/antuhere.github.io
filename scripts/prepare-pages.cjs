// Keep the portfolio's generated GitHub profile when deploying a fresh checkout.
// This is public site content; it does not fetch or log any API credentials.
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const target = path.join(root, 'public', 'profile.json');
if (!fs.existsSync(target)) {
  execFileSync('git', ['fetch', 'origin', 'gh-pages'], {cwd: root, stdio: 'inherit'});
  const files = execFileSync('git', ['ls-tree', '--name-only', 'FETCH_HEAD'], {cwd: root, encoding: 'utf8'}).split('\n');
  if (files.includes('profile.json')) {
    const contents = execFileSync('git', ['show', 'FETCH_HEAD:profile.json'], {cwd: root});
    const profile = JSON.parse(contents.toString('utf8'));
    if (!profile.data || !profile.data.user) throw Error('Published profile data has an unexpected format. Deployment stopped.');
    fs.writeFileSync(target, contents, {flag: 'wx'});
    console.log('Preserved published GitHub profile data.');
  }
}
