const { execSync, spawnSync } = require('child_process');

console.log('[1/4] Staging all files...');
execSync('git add -A');

console.log('[2/4] Checking commit size...');
const stagedFiles = execSync('git diff --cached --name-only').toString().trim().split(/\r?\n/);
console.log(`Staged ${stagedFiles.length} files.`);

console.log('[3/4] Committing...');
const commitMsg = 'feat(growth): deploy programmatic SEO fleet, IndexNow fast-crawl engine, and viral WhatsApp referral loops';
const commitRes = spawnSync('git', ['commit', '-m', commitMsg], { stdio: 'inherit' });
if (commitRes.status !== 0) {
  console.error('Commit failed');
  process.exit(1);
}

console.log('[4/4] Pushing to remote origin main...');
const token = execSync('gh auth token').toString().trim();
const remoteUrl = `https://x-access-token:${token}@github.com/ajimatimati/stemulus-web-platform.git`;

const pushRes = spawnSync('git', ['push', '--progress', '--verbose', remoteUrl, 'main'], {
  stdio: 'inherit',
  timeout: 120000
});

console.log('Push exit code:', pushRes.status);
process.exit(pushRes.status || 0);
