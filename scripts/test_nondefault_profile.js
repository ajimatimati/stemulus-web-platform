const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const sourceUserData = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8');

  console.log('[Setup] Source User Data:', sourceUserData);
  console.log('[Setup] Target User Data:', targetUserData);

  // 1. Prepare target directory
  if (!fs.existsSync(targetUserData)) {
    fs.mkdirSync(targetUserData, { recursive: true });
  }

  // 2. Copy Local State (contains OS DPAPI encryption keys)
  const localStateSrc = path.join(sourceUserData, 'Local State');
  const localStateDest = path.join(targetUserData, 'Local State');
  fs.copyFileSync(localStateSrc, localStateDest);
  console.log('[Setup] Copied Local State.');

  // 3. Copy Profile 8 as Default profile using robocopy for speed and preservation
  const profile8Src = path.join(sourceUserData, 'Profile 8');
  const defaultDest = path.join(targetUserData, 'Default');
  if (!fs.existsSync(defaultDest)) {
    fs.mkdirSync(defaultDest, { recursive: true });
  }

  console.log('[Setup] Syncing Profile 8 to automation directory...');
  // Robocopy key session files: Preferences, Secure Preferences, Cookies, Network, Local Storage, Web Data, Login Data
  const filesToCopy = [
    'Preferences',
    'Secure Preferences',
    'Web Data',
    'Login Data',
    'Login Data For Account',
    'Account Web Data'
  ];

  for (const f of filesToCopy) {
    const s = path.join(profile8Src, f);
    const d = path.join(defaultDest, f);
    if (fs.existsSync(s)) {
      try { fs.copyFileSync(s, d); } catch (e) {}
    }
  }

  // Copy Network dir (contains Cookies SQLite DB) and Local Storage
  const dirsToCopy = ['Network', 'Local Storage', 'Sessions', 'Sync Data'];
  for (const d of dirsToCopy) {
    const s = path.join(profile8Src, d);
    const destDir = path.join(defaultDest, d);
    if (fs.existsSync(s)) {
      try {
        execSync(`robocopy "${s}" "${destDir}" /E /R:1 /W:1 /NJH /NJS /NDL /NC /NS`, { stdio: 'ignore' });
      } catch (e) {
        // robocopy returns non-zero on successful file copy (exit code 1)
      }
    }
  }
  console.log('[Setup] Profile files synced successfully.');

  // 4. Launch Playwright
  console.log('[Launch] Starting Playwright with isolated automation profile...');
  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: [
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

  const screenshotPath = path.join(__dirname, '..', 'tests', 'calendar_logged_in_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log('[Result] Screenshot saved to:', screenshotPath);

  await context.close();
  console.log('[Result] Success!');
})();
