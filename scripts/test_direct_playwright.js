const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const userDataDir = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data');

  console.log('[Direct Test] Chrome Executable:', chromePath);
  console.log('[Direct Test] User Data Directory:', userDataDir);

  if (!fs.existsSync(chromePath)) {
    console.error('Chrome executable not found!');
    process.exit(1);
  }

  try {
    console.log('[Direct Test] Launching persistent context with Profile 8...');
    const context = await chromium.launchPersistentContext(userDataDir, {
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

    console.log('[Direct Test] Persistent context launched successfully!');
    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

    console.log('[Direct Test] Navigating to Google Calendar...');
    await page.goto('https://calendar.google.com/calendar/u/0/r', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const title = await page.title();
    const url = page.url();
    console.log('[Direct Test] Title:', title);
    console.log('[Direct Test] URL:', url);

    const screenshotPath = path.join(__dirname, '..', 'tests', 'test_direct_calendar.png');
    await page.screenshot({ path: screenshotPath });
    console.log('[Direct Test] Saved screenshot to:', screenshotPath);

    await context.close();
    console.log('[Direct Test] ALL DONE SUCCESS!');
  } catch (err) {
    console.error('[Direct Test] Error:', err);
  }
})();
