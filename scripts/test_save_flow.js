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
  await page.locator('input[aria-label*="title" i]').first().fill("Test Event Myles 2");
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

  // Click Save in iframe
  console.log('Clicking Save button in frame via evaluate and pointer events...');
  await meetFrame.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Save');
    if (saveBtn) {
      saveBtn.focus();
      saveBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      saveBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
  await page.waitForTimeout(2000);

  // Check if dialog closed or if Escape closes it
  let iframePresent = await page.evaluate(() => !!document.querySelector('iframe[src*="meet.google.com/calendarsettings"]'));
  console.log('Is iframe still present after iframe Save click?', iframePresent);

  if (iframePresent) {
    console.log('Pressing Escape to close modal dialog...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);
    iframePresent = await page.evaluate(() => !!document.querySelector('iframe[src*="meet.google.com/calendarsettings"]'));
    console.log('Is iframe present after Escape?', iframePresent);
  }

  // If still present, let's see what backdrop or close button exists on the main page
  if (iframePresent) {
    console.log('Trying clicking backdrop or close button...');
    await page.evaluate(() => {
      // Find modal close button or click backdrop
      const closeBtn = document.querySelector('div[role="dialog"] [aria-label*="Close"], div[role="dialog"] button[aria-label*="close" i]');
      if (closeBtn) closeBtn.click();
      else {
        const backdrop = document.querySelector('.uW2Fw-IE5DDf');
        if (backdrop) backdrop.click();
      }
    });
    await page.waitForTimeout(2000);
    iframePresent = await page.evaluate(() => !!document.querySelector('iframe[src*="meet.google.com/calendarsettings"]'));
    console.log('Is iframe present after backdrop click?', iframePresent);
  }

  // Now click the main calendar Save button
  console.log('Clicking main page Save button (#xSaveBu)...');
  await page.locator('#xSaveBu').first().click();
  await page.waitForTimeout(4000);

  console.log('Current URL after main Save:', page.url());
  const savedSuccess = !page.url().includes('eventedit');
  console.log('Did it navigate away from eventedit (success)?', savedSuccess);

  await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'autorecord_audit', 'debug_event_save_result.png') });

  await context.close();
})();
