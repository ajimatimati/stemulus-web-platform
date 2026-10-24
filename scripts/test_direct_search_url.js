const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

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
  console.log('[Search URL Test] Navigating directly to search for Myles...');
  await page.goto('https://calendar.google.com/calendar/u/0/r/search?q=Myles', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);

  const title = await page.title();
  const url = page.url();
  console.log('[Search URL Test] Title:', title);
  console.log('[Search URL Test] URL:', url);

  const screenshotPath = path.join(__dirname, '..', 'tests', 'search_myles_direct.png');
  await page.screenshot({ path: screenshotPath });
  console.log('[Search URL Test] Screenshot saved to:', screenshotPath);

  // Inspect matching event elements
  const eventRows = await page.$$('[role="row"], [data-eventid], div[role="main"] div[jslog]');
  console.log('[Search URL Test] Found potential event rows:', eventRows.length);

  await context.close();
})();
