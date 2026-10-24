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

  console.log('[Edit Test] Opening Tuesday 20 October 2026...');
  await page.goto('https://calendar.google.com/calendar/u/0/r/day/2026/10/20', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const chip = await page.locator('[data-eventid]:has-text("David")').first();
  await chip.click();
  await page.waitForTimeout(2000);

  // Click edit icon inside the event preview dialog
  console.log('[Edit Test] Clicking Edit button inside dialog...');
  const editBtn = page.locator('div[role="dialog"] button[aria-label*="Edit"], div[role="dialog"] [data-tooltip*="Edit"]').first();
  await editBtn.click();
  await page.waitForTimeout(5000);

  const editPageScreenshot = path.join(__dirname, '..', 'tests', 'david_edit_full_page.png');
  await page.screenshot({ path: editPageScreenshot });
  console.log('[Edit Test] Saved edit page screenshot to:', editPageScreenshot);

  // Look for Video call options gear icon
  const gearBtn = page.locator('button[aria-label*="Video call options"], [aria-label*="Call options"], button[data-tooltip*="Video call options"]').first();
  const gearVisible = await gearBtn.isVisible();
  console.log('[Edit Test] Video call options gear visible:', gearVisible);

  if (gearVisible) {
    await gearBtn.click();
    await page.waitForTimeout(2500);

    const dialogScreenshot = path.join(__dirname, '..', 'tests', 'video_call_options_modal.png');
    await page.screenshot({ path: dialogScreenshot });
    console.log('[Edit Test] Saved options modal screenshot to:', dialogScreenshot);
  }

  await context.close();
})();
