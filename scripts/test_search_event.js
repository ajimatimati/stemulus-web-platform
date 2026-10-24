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
  console.log('[Search Test] Opening Google Calendar...');
  await page.goto('https://calendar.google.com/calendar/u/0/r', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // Press '/' or click search button
  console.log('[Search Test] Clicking search button or pressing "/"...');
  const searchBtn = await page.$('button[aria-label="Search"], div[aria-label="Search"], [data-action="search"]');
  if (searchBtn) {
    await searchBtn.click();
  } else {
    await page.keyboard.press('/');
  }

  await page.waitForTimeout(1000);
  const searchInput = await page.$('input[aria-label*="Search"], input[type="text"]');
  if (searchInput) {
    console.log('[Search Test] Found search input. Typing "Myles"...');
    await searchInput.fill('Myles');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000);

    const screenshotPath = path.join(__dirname, '..', 'tests', 'search_results_myles.png');
    await page.screenshot({ path: screenshotPath });
    console.log('[Search Test] Screenshot saved to:', screenshotPath);
  } else {
    console.error('[Search Test] Could not find search input!');
  }

  await context.close();
})();
