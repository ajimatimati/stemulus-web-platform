const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: ['--profile-directory=Profile 8']
  });

  const page = await context.newPage();
  await page.goto('https://calendar.google.com/calendar/u/0/r/search?q=David%27s%20Coding%20Quest', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Find result row
  const row = page.locator('div[role="row"]:has-text("David\'s Coding Quest"), tr:has-text("David\'s Coding Quest"), div[role="button"]:has-text("David\'s Coding Quest")').first();
  console.log('Row visible:', await row.isVisible());
  await row.click();
  await page.waitForTimeout(2000);

  console.log('URL after click:', page.url());
  const editBtn = page.locator('div[role="dialog"] button[aria-label*="Edit"], div[role="dialog"] [data-tooltip*="Edit"]').first();
  if (await editBtn.isVisible()) {
    console.log('Edit pencil is visible, clicking it...');
    await editBtn.click();
    await page.waitForTimeout(3000);
    console.log('URL after Edit click:', page.url());
  }

  await context.close();
})();
