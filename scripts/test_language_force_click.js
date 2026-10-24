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

  console.log('[Force Click Test] Opening Tuesday 20 October 2026...');
  await page.goto('https://calendar.google.com/calendar/u/0/r/day/2026/10/20', { waitUntil: 'domcontentloaded', timeout: 45000 });
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

  const meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
  if (meetFrame) {
    const recordsBtn = meetFrame.getByText('Meeting records', { exact: false }).first();
    await recordsBtn.click();
    await page.waitForTimeout(2000);

    console.log('[Force Click Test] Clicking language option [data-value="en-US"] with force: true...');
    const langOption = meetFrame.locator('[data-value="en-US"], [data-value="en-GB"], [data-value="en"]').first();
    await langOption.click({ force: true });
    await page.waitForTimeout(1000);

    console.log('[Force Click Test] Toggling Take notes with Gemini with force: true...');
    const takeNotesInput = meetFrame.locator('input[type="checkbox"]').first();
    await takeNotesInput.check({ force: true });
    await page.waitForTimeout(1500);

    const screenshot = path.join(__dirname, '..', 'tests', 'language_forced_verified.png');
    await page.screenshot({ path: screenshot });
    console.log('[Force Click Test] Screenshot saved to:', screenshot);

    const saveBtn = meetFrame.locator('button:has-text("Save")').first();
    const disabledAttr = await saveBtn.getAttribute('disabled');
    console.log('[Force Click Test] Save button disabled?', disabledAttr !== null);

    if (disabledAttr === null) {
      console.log('[Force Click Test] Clicking Save in modal...');
      await saveBtn.click();
      await page.waitForTimeout(2000);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(1500);

      console.log('[Force Click Test] Clicking Save on main event page...');
      const savePageBtn = page.locator('#xSaveBu, button:has-text("Save"), [aria-label*="Save"]').first();
      await savePageBtn.click({ force: true });
      await page.waitForTimeout(2000);

      // Recurrence
      const recDialog = page.locator('div[role="dialog"]:has-text("Edit recurring event"), div[role="dialog"]:has-text("recurring")');
      if (await recDialog.count() > 0) {
        const followingRadio = page.locator('label:has-text("This and following"), label:has-text("All events")').first();
        if (await followingRadio.count() > 0) await followingRadio.click();
        const okBtn = page.locator('button:has-text("OK"), button:has-text("Save")').first();
        await okBtn.click({ force: true });
      }

      await page.waitForTimeout(4000);
      const finalSaved = path.join(__dirname, '..', 'tests', 'david_completely_saved.png');
      await page.screenshot({ path: finalSaved });
      console.log('[Force Click Test] SUCCESS! Saved final screenshot to:', finalSaved);
    }
  }

  await context.close();
  console.log('[Force Click Test] Finished!');
})();
