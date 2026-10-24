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

  console.log('[Modal Test] Opening Tuesday 20 October 2026...');
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

  console.log('[Modal Test] Waiting for modal to finish loading...');
  // Wait for spinner to disappear and content to appear
  await page.waitForTimeout(5000);

  const modalScreenshot = path.join(__dirname, '..', 'tests', 'modal_loaded_content.png');
  await page.screenshot({ path: modalScreenshot });
  console.log('[Modal Test] Saved modal loaded screenshot to:', modalScreenshot);

  // Extract all tabs and checkboxes in the modal
  const modalText = await page.$$eval('div[role="dialog"]', dialogs => {
    return dialogs.map(d => d.innerText.replace(/\n+/g, ' | ').trim());
  });
  console.log('[Modal Test] Dialog text:', modalText);

  const tabs = await page.$$eval('div[role="dialog"] [role="tab"], div[role="dialog"] button', els => {
    return els.map(e => e.innerText.trim()).filter(Boolean);
  });
  console.log('[Modal Test] Buttons and Tabs in modal:', tabs);

  await context.close();
})();
