const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const sourceUserData = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('[Setup] Syncing Profile 8 to target directory...');
  if (!fs.existsSync(targetUserData)) fs.mkdirSync(targetUserData, { recursive: true });

  try {
    fs.copyFileSync(path.join(sourceUserData, 'Local State'), path.join(targetUserData, 'Local State'));
  } catch (e) {}

  const profile8Src = path.join(sourceUserData, 'Profile 8');
  const profile8Dest = path.join(targetUserData, 'Profile 8');
  if (!fs.existsSync(profile8Dest)) fs.mkdirSync(profile8Dest, { recursive: true });

  try {
    // Copy cookies and essential storage
    execSync(`robocopy "${profile8Src}" "${profile8Dest}" /E /R:1 /W:1 /XD "Cache" "Code Cache" "GPUCache" /NJH /NJS /NDL /NC /NS`, { stdio: 'ignore' });
  } catch (e) {}

  console.log('[Launch] Starting Chrome with Profile 8...');
  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: [
      '--profile-directory=Profile 8',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled'
    ],
    viewport: { width: 1440, height: 900 }
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  console.log('[Navigate] Opening Google Search Console...');
  await page.goto('https://search.google.com/search-console', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(6000);

  console.log('[Current URL]:', page.url());
  console.log('[Title]:', await page.title());

  const screenshotDir = path.join(__dirname, '..', 'data', 'gsc_inspection');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const initialShot = path.join(screenshotDir, '01_initial_gsc.png');
  await page.screenshot({ path: initialShot, fullPage: true });
  console.log('[Screenshot] Saved initial view to:', initialShot);

  // Keep context open for next commands or inspect DOM
  await page.waitForTimeout(3000);
  await context.close();
  console.log('[Done] Initial probe complete.');
})();
