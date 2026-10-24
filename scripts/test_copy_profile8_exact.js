const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const sourceUserData = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('[Setup] Source User Data:', sourceUserData);
  console.log('[Setup] Target User Data:', targetUserData);

  if (!fs.existsSync(targetUserData)) {
    fs.mkdirSync(targetUserData, { recursive: true });
  }

  // Copy Local State
  fs.copyFileSync(path.join(sourceUserData, 'Local State'), path.join(targetUserData, 'Local State'));

  // Sync entire Profile 8 directory
  const profile8Src = path.join(sourceUserData, 'Profile 8');
  const profile8Dest = path.join(targetUserData, 'Profile 8');
  if (!fs.existsSync(profile8Dest)) {
    fs.mkdirSync(profile8Dest, { recursive: true });
  }

  console.log('[Setup] Syncing entire Profile 8 directory with robocopy...');
  try {
    execSync(`robocopy "${profile8Src}" "${profile8Dest}" /E /R:1 /W:1 /XD "Cache" "Code Cache" "GPUCache" /NJH /NJS /NDL /NC /NS`, { stdio: 'ignore' });
  } catch (e) {}

  console.log('[Launch] Starting Chrome with exact Profile 8...');
  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: [
      '--profile-directory=Profile 8',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled'
    ],
    viewport: null
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  console.log('[Navigate] Opening Google Calendar...');
  await page.goto('https://calendar.google.com/calendar/u/0/r', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);

  const title = await page.title();
  const url = page.url();
  console.log('[Result] Page Title:', title);
  console.log('[Result] Page URL:', url);

  const screenshotPath = path.join(__dirname, '..', 'tests', 'calendar_exact_profile8.png');
  await page.screenshot({ path: screenshotPath });
  console.log('[Result] Screenshot saved to:', screenshotPath);

  await context.close();
  console.log('[Result] Success!');
})();
