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

  console.log('[UI Test] Navigating to Tuesday 20 October 2026...');
  await page.goto('https://calendar.google.com/calendar/u/0/r/day/2026/10/20', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // Find David's Coding Quest event chip
  console.log('[UI Test] Looking for David\'s Coding Quest chip...');
  const chip = await page.locator('[data-eventid]:has-text("David")').first();
  await chip.waitFor({ state: 'visible', timeout: 10000 });
  console.log('[UI Test] Found chip. Clicking chip...');
  await chip.click();
  await page.waitForTimeout(2000);

  const previewScreenshot = path.join(__dirname, '..', 'tests', 'david_event_preview.png');
  await page.screenshot({ path: previewScreenshot });
  console.log('[UI Test] Saved event popover preview screenshot to:', previewScreenshot);

  // Click edit pencil button
  console.log('[UI Test] Looking for Edit (pencil) button...');
  const editBtn = page.locator('button[aria-label*="Edit"], div[aria-label*="Edit"], [data-action="edit"]').first();
  await editBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('[UI Test] Clicking Edit button...');
  await editBtn.click();
  await page.waitForTimeout(4000);

  const editPageScreenshot = path.join(__dirname, '..', 'tests', 'david_event_edit_page.png');
  await page.screenshot({ path: editPageScreenshot });
  console.log('[UI Test] Saved edit page screenshot to:', editPageScreenshot);

  // Look for Video call options gear icon
  const gearBtn = page.locator('button[aria-label*="Video call options"], [aria-label*="call options"], button:has([data-icon="settings"])').first();
  const gearCount = await gearBtn.count();
  console.log('[UI Test] Video call options gear button count:', gearCount);

  if (gearCount > 0) {
    console.log('[UI Test] Clicking Video call options gear button...');
    await gearBtn.click();
    await page.waitForTimeout(2000);

    const dialogScreenshot = path.join(__dirname, '..', 'tests', 'video_call_options_dialog.png');
    await page.screenshot({ path: dialogScreenshot });
    console.log('[UI Test] Saved options dialog screenshot to:', dialogScreenshot);
  }

  await context.close();
  console.log('[UI Test] Completed UI inspection.');
})();
