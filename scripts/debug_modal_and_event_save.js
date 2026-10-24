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
  await page.goto('https://calendar.google.com/calendar/u/0/r/eventedit', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Title
  await page.locator('input[aria-label*="title" i]').first().fill("Test Event Myles");
  await page.waitForTimeout(500);

  // Add Meet
  await page.locator('button:has-text("Add Google Meet")').first().click();
  await page.waitForTimeout(4000);

  // Click Gear
  await page.locator('button[aria-label*="Video call options"]').first().click();
  await page.waitForTimeout(3000);

  const meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
  console.log('Frame found:', !!meetFrame);

  // Meeting records tab
  await meetFrame.getByText('Meeting records', { exact: false }).first().click();
  await page.waitForTimeout(2000);

  // Combobox
  await meetFrame.locator('div[role="combobox"][aria-label*="language" i]').first().click();
  await page.waitForTimeout(1000);

  // Click English
  await meetFrame.evaluate(() => {
    const enOption = document.querySelector('li[data-value="en-US"]');
    enOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    enOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    enOption.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await page.waitForTimeout(1500);

  // Check checkboxes
  await meetFrame.evaluate(() => {
    document.querySelectorAll('input[type="checkbox"]').forEach(c => { if (!c.checked) c.click(); });
  });
  await page.waitForTimeout(1500);

  // Inspect Save button details
  const saveBtnInfo = await meetFrame.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Save');
    return {
      exists: !!saveBtn,
      disabled: saveBtn.disabled,
      outerHTML: saveBtn.outerHTML,
      ariaDisabled: saveBtn.getAttribute('aria-disabled')
    };
  });
  console.log('Save button info:', saveBtnInfo);

  // Click the save button using meetFrame.locator
  console.log('Clicking Save button in frame...');
  const saveBtn = meetFrame.locator('button:has-text("Save")').first();
  await saveBtn.click();
  console.log('Clicked Save button.');

  // Wait 3 seconds and check if frame is still in DOM or if dialog closed
  await page.waitForTimeout(3000);
  const isModalStillVisible = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[src*="meet.google.com/calendarsettings"]');
    return {
      iframeExists: !!iframe,
      dialogs: Array.from(document.querySelectorAll('div[role="dialog"]')).map(d => d.innerText.substring(0, 100))
    };
  });
  console.log('After clicking Save:', isModalStillVisible);

  await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'autorecord_audit', 'debug_after_modal_save.png') });

  // If iframe still exists, what happens if we click close button or Escape?
  // Check what buttons exist on the main page dialog
  const mainDialogButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.innerText.trim(),
      ariaLabel: b.getAttribute('aria-label'),
      id: b.id
    })).filter(b => b.text || b.ariaLabel);
  });
  console.log('Main page buttons:', mainDialogButtons.filter(b => b.text === 'Save' || b.ariaLabel?.includes('Save') || b.id === 'xSaveBu'));

  // Click main Save button
  const mainSaveBtn = page.locator('#xSaveBu').first();
  if (await mainSaveBtn.isVisible()) {
    console.log('Main #xSaveBu is visible! Clicking it...');
    await mainSaveBtn.click();
    await page.waitForTimeout(4000);
  } else {
    console.log('Main #xSaveBu is NOT visible directly. Trying force click...');
    await mainSaveBtn.click({ force: true });
    await page.waitForTimeout(4000);
  }

  const finalUrl = page.url();
  console.log('Final page URL after saving event:', finalUrl);
  await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'autorecord_audit', 'debug_final_after_event_save.png') });

  await context.close();
})();
