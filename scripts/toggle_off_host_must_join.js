const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('[Toggle] Launching Chrome Profile 8 to disable "Host must join before anyone else"...');
  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: [
      '--profile-directory=Profile 8',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled'
    ],
    viewport: { width: 1280, height: 800 }
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  const searchQuery = "David's Coding Quest";
  const searchUrl = `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(searchQuery)}`;
  console.log('[Toggle] Searching event:', searchUrl);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  const row = page.locator(`div[role="row"]:has-text("${searchQuery}"), tr:has-text("${searchQuery}"), div[role="button"]:has-text("${searchQuery}")`).first();
  await row.click();
  await page.waitForTimeout(2000);

  const editBtn = page.locator('div[role="dialog"] button[aria-label*="Edit"], div[role="dialog"] [data-tooltip*="Edit"]').first();
  await editBtn.click();
  await page.waitForTimeout(4000);

  const gearBtn = page.locator('button[aria-label*="Video call options"], [aria-label*="Call options"], button[data-tooltip*="Video call options"]').first();
  await gearBtn.waitFor({ state: 'visible', timeout: 15000 });
  await gearBtn.click();
  await page.waitForTimeout(3000);

  const meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
  if (!meetFrame) {
    throw new Error('meetFrame not found');
  }

  // Click Host controls tab
  console.log('[Toggle] Clicking Host controls tab...');
  const hostTab = meetFrame.getByText('Host controls', { exact: false }).first();
  await hostTab.click();
  await page.waitForTimeout(2000);

  // Toggle "Host must join before anyone else" switch to false
  const result = await meetFrame.evaluate(() => {
    const switches = Array.from(document.querySelectorAll('button[role="switch"], [role="switch"]'));
    const hostJoinSwitch = switches.find(s => {
      const label = (s.getAttribute('aria-label') || '').toLowerCase();
      return label.includes('host must join before anyone else');
    });

    if (hostJoinSwitch) {
      const isChecked = hostJoinSwitch.getAttribute('aria-checked') === 'true';
      if (isChecked) {
        hostJoinSwitch.click();
        return { success: true, wasChecked: true, nowChecked: false };
      }
      return { success: true, wasChecked: false, nowChecked: false, alreadyOff: true };
    }
    return { success: false, error: 'Switch not found' };
  });

  console.log('[Toggle] Switch toggle result:', result);
  await page.waitForTimeout(1500);

  // Click Save inside iframe
  console.log('[Toggle] Clicking Save button in modal...');
  await meetFrame.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Save');
    if (saveBtn) saveBtn.click();
  });
  await page.waitForTimeout(2500);

  // Close iframe with Escape if still open
  const iframeOpen = await page.evaluate(() => !!document.querySelector('iframe[src*="meet.google.com/calendarsettings"]'));
  if (iframeOpen) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
  }

  // Click Google Calendar event Save button
  console.log('[Toggle] Clicking main event Save button...');
  const mainSaveBtn = page.locator('div[role="main"] button:has-text("Save"), div#xSavB:visible, button:has-text("Save")').first();
  await mainSaveBtn.click();
  await page.waitForTimeout(2500);

  // If recurring prompt appears ("This event" vs "This and following events" vs "All events")
  const recurringDialog = page.locator('div[role="dialog"]:has-text("Edit recurring event"), div[role="dialog"]:has-text("following events"), div[role="dialog"]:has-text("All events")');
  if (await recurringDialog.isVisible()) {
    console.log('[Toggle] Recurring dialog appeared. Selecting "This and following events"...');
    const followingRadio = page.locator('label:has-text("This and following events"), label:has-text("All events")').first();
    await followingRadio.click();
    await page.waitForTimeout(500);
    const okBtn = page.locator('div[role="dialog"] button:has-text("OK"), div[role="dialog"] button:has-text("Save")').first();
    await okBtn.click();
    await page.waitForTimeout(3000);
  }

  console.log('[Toggle] Successfully updated David\'s Coding Quest to allow joining without host!');
  await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'autorecord_audit', 'david_host_not_required_saved.png') });

  await context.close();
})();
