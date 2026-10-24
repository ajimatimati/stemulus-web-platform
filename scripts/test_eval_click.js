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

  console.log('[Eval Test] Opening Tuesday 20 October 2026...');
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

    console.log('[Eval Test] Evaluating language selection and checkbox enabling via DOM...');
    const result = await meetFrame.evaluate(() => {
      // Pick English option
      const opt = document.querySelector('[data-value="en-US"], [data-value="en-GB"], [data-value="en"]');
      if (opt) {
        opt.click();
      }

      // Check all checkboxes in Meeting records
      const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      cbs.forEach(c => {
        if (!c.checked) {
          c.checked = true;
          c.dispatchEvent(new Event('change', { bubbles: true }));
          c.dispatchEvent(new Event('input', { bubbles: true }));
          c.click();
        }
      });

      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Save');
      return {
        optionFound: !!opt,
        checkboxCount: cbs.length,
        saveBtnDisabled: saveBtn ? saveBtn.disabled || saveBtn.hasAttribute('disabled') : 'not found'
      };
    });

    console.log('[Eval Test] DOM evaluation result:', result);
    await page.waitForTimeout(1500);

    const screenshot = path.join(__dirname, '..', 'tests', 'eval_language_result.png');
    await page.screenshot({ path: screenshot });
    console.log('[Eval Test] Screenshot saved to:', screenshot);

    // If Save button is enabled, click it!
    const saveBtn = meetFrame.locator('button:has-text("Save")').first();
    const isDisabled = await saveBtn.getAttribute('disabled');
    console.log('[Eval Test] Playwright sees Save disabled?', isDisabled !== null);

    if (isDisabled === null) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1500);

      const savePageBtn = page.locator('#xSaveBu, button:has-text("Save"), [aria-label*="Save"]').first();
      await savePageBtn.click({ force: true });
      await page.waitForTimeout(2000);

      const recDialog = page.locator('div[role="dialog"]:has-text("Edit recurring event"), div[role="dialog"]:has-text("recurring")');
      if (await recDialog.count() > 0) {
        const followingRadio = page.locator('label:has-text("This and following"), label:has-text("All events")').first();
        if (await followingRadio.count() > 0) await followingRadio.click();
        const okBtn = page.locator('button:has-text("OK"), button:has-text("Save")').first();
        await okBtn.click({ force: true });
      }

      await page.waitForTimeout(4000);
      console.log('[Eval Test] Event successfully saved!');
    }
  }

  await context.close();
})();
