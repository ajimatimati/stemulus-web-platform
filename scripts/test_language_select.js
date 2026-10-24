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

  console.log('[Lang Test] Opening Tuesday 20 October 2026...');
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

    // Click "Select a language" dropdown
    console.log('[Lang Test] Clicking "Select a language" dropdown...');
    const langDropdown = meetFrame.locator('[aria-label*="language" i], [aria-haspopup="listbox"], div:has-text("Select a language")').last();
    await langDropdown.click();
    await page.waitForTimeout(1000);

    // Pick English option
    console.log('[Lang Test] Picking English...');
    const englishOption = meetFrame.locator('[role="option"]:has-text("English"), li:has-text("English"), div:has-text("English (UK)"), div:has-text("English (US)")').first();
    await englishOption.click();
    await page.waitForTimeout(1000);

    // Check Take notes
    console.log('[Lang Test] Toggling Take notes with Gemini...');
    const takeNotesLabel = meetFrame.getByText('Take notes with Gemini', { exact: false }).first();
    await takeNotesLabel.click();
    await page.waitForTimeout(1000);

    // Check Transcribe
    console.log('[Lang Test] Toggling Transcribe the meeting...');
    const transcribeLabel = meetFrame.getByText('Transcribe the meeting', { exact: false }).first();
    if (await transcribeLabel.isVisible()) {
      await transcribeLabel.click();
      await page.waitForTimeout(1000);
    }

    const modalReadyScreenshot = path.join(__dirname, '..', 'tests', 'modal_language_selected_ready.png');
    await page.screenshot({ path: modalReadyScreenshot });
    console.log('[Lang Test] Saved ready screenshot to:', modalReadyScreenshot);

    // Check if Save button is now enabled
    const saveBtn = meetFrame.locator('button:has-text("Save")').first();
    const isDisabled = await saveBtn.getAttribute('disabled');
    console.log('[Lang Test] Is Save button disabled?', isDisabled !== null);

    await saveBtn.click();
    await page.waitForTimeout(2000);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);

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

    await page.waitForTimeout(3000);
    const finalScreenshot = path.join(__dirname, '..', 'tests', 'david_final_persisted.png');
    await page.screenshot({ path: finalScreenshot });
    console.log('[Lang Test] Final persisted screenshot saved to:', finalScreenshot);
  }

  await context.close();
  console.log('[Lang Test] Success!');
})();
