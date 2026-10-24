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
  await page.goto('https://calendar.google.com/calendar/u/0/r', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const testEvent = page.locator('[data-eventid]:has-text("Test Event Myles")').first();
  if (await testEvent.count() > 0) {
    await testEvent.click();
    await page.waitForTimeout(1500);
    const deleteBtn = page.locator('div[role="dialog"] button[aria-label*="Delete"], div[role="dialog"] [data-tooltip*="Delete"]').first();
    await deleteBtn.click();
    await page.waitForTimeout(2000);
    console.log('Deleted test event.');
  }

  await context.close();
})();
