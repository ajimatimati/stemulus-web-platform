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

  console.log('[Records Tab Test] Opening Tuesday 20 October 2026...');
  await page.goto('https://calendar.google.com/calendar/u/0/r/day/2026/10/20', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const chip = await page.locator('[data-eventid]:has-text("David")').first();
  await chip.click();
  await page.waitForTimeout(2000);

  const editBtn = page.locator('div[role="dialog"] button[aria-label*="Edit"], div[role="dialog"] [data-tooltip*="Edit"]').first();
  await editBtn.click();
  await page.waitForTimeout(4000);

  const gearBtn = page.locator('button[aria-label*="Video call options"], [aria-label*="Call options"], button[data-tooltip*="Video call options"]').first();
  await gearBtn.click();
  await page.waitForTimeout(4000);

  // Click "Meeting records" tab
  console.log('[Records Tab Test] Clicking "Meeting records" tab...');
  const recordsTab = page.locator('div[role="dialog"] [role="tab"]:has-text("Meeting records"), div[role="dialog"] span:has-text("Meeting records"), div[role="dialog"] div:has-text("Meeting records")').last();
  await recordsTab.click();
  await page.waitForTimeout(2000);

  const recordsScreenshot = path.join(__dirname, '..', 'tests', 'meeting_records_tab.png');
  await page.screenshot({ path: recordsScreenshot });
  console.log('[Records Tab Test] Saved meeting records screenshot to:', recordsScreenshot);

  // Also check Gemini tab
  console.log('[Records Tab Test] Clicking "Gemini" tab...');
  const geminiTab = page.locator('div[role="dialog"] [role="tab"]:has-text("Gemini"), div[role="dialog"] span:has-text("Gemini")').last();
  await geminiTab.click();
  await page.waitForTimeout(2000);

  const geminiScreenshot = path.join(__dirname, '..', 'tests', 'gemini_tab.png');
  await page.screenshot({ path: geminiScreenshot });
  console.log('[Records Tab Test] Saved gemini screenshot to:', geminiScreenshot);

  await context.close();
})();
