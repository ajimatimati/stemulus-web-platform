const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const userDataDir = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data');
  console.log('[Probe] Using User Data Directory:', userDataDir);

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',
    headless: false,
    args: [
      '--profile-directory=Profile 8',
      '--no-first-run',
      '--no-default-browser-check'
    ],
    viewport: null
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  console.log('[Probe] Navigating to Google Calendar...');
  await page.goto('https://calendar.google.com/calendar/u/0/r', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  const title = await page.title();
  const url = page.url();
  console.log('[Probe] Page Title:', title);
  console.log('[Probe] Page URL:', url);

  const screenshotPath = path.join(__dirname, '..', 'tests', 'probe_calendar.png');
  await page.screenshot({ path: screenshotPath });
  console.log('[Probe] Saved screenshot to:', screenshotPath);

  await context.close();
  console.log('[Probe] Finished successfully!');
})();
