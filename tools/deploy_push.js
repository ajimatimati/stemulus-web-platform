const { execSync } = require('child_process');

try {
  const token = execSync('gh auth token').toString().trim();
  const remoteUrl = `https://x-access-token:${token}@github.com/ajimatimati/stemulus-web-platform.git`;
  
  console.log('Pushing to GitHub main branch...');
  const out = execSync(`git push "${remoteUrl}" main`, { encoding: 'utf8', stdio: 'pipe' });
  console.log('>>> DEPLOYMENT PUSH SUCCESSFUL! <<<');
  console.log(out || 'Everything up-to-date.');
} catch (err) {
  console.error('Push error:', err.message);
  if (err.stderr) console.error('Stderr:', err.stderr);
  process.exit(1);
}
