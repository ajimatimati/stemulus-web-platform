const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('Launching browser to inspect Google Meet settings modal...');
  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: [
      '--profile-directory=Profile 8',
      '--no-first-run',
      '--no-default-browser-check'
    ],
    viewport: { width: 1280, height: 800 }
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  // Go to Tuesday Oct 20 (David's event)
  await page.goto('https://calendar.google.com/calendar/u/0/r/day/2026/10/20', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Click David's event
  const chip = page.locator('[data-eventid]:has-text("David")').first();
  await chip.waitFor({ state: 'visible', timeout: 10000 });
  await chip.click();
  await page.waitForTimeout(2000);

  // Click Edit
  const editBtn = page.locator('div[role="dialog"] button[aria-label*="Edit"], div[role="dialog"] [data-tooltip*="Edit"]').first();
  await editBtn.click();
  await page.waitForTimeout(4000);

  // Click Video call options gear
  const gearBtn = page.locator('button[aria-label*="Video call options"], [aria-label*="Call options"]').first();
  await gearBtn.waitFor({ state: 'visible', timeout: 10000 });
  await gearBtn.click();
  await page.waitForTimeout(3000);

  // Find the iframe
  const meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
  if (!meetFrame) {
    console.error('Frame not found!');
    await context.close();
    return;
  }

  console.log('Found frame:', meetFrame.url());

  // Click Meeting records tab
  const recordsBtn = meetFrame.getByText('Meeting records', { exact: false }).first();
  await recordsBtn.waitFor({ state: 'visible', timeout: 10000 });
  await recordsBtn.click();
  await page.waitForTimeout(2000);

  // Inspect the language dropdown DOM in the frame
  const langDomInfo = await meetFrame.evaluate(() => {
    // Find elements with "Select a language"
    const els = Array.from(document.querySelectorAll('*')).filter(el => 
      el.children.length === 0 && el.innerText && el.innerText.includes('Select a language')
    );

    // Also look for combobox, select, or dropdown triggers
    const comboboxes = Array.from(document.querySelectorAll('[role="combobox"], [role="listbox"], [aria-haspopup]')).map(el => ({
      tagName: el.tagName,
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      ariaExpanded: el.getAttribute('aria-expanded'),
      className: el.className,
      outerHTML: el.outerHTML.substring(0, 200)
    }));

    return {
      textElements: els.map(e => ({ tag: e.tagName, text: e.innerText, parentTag: e.parentElement?.tagName, parentClass: e.parentElement?.className })),
      comboboxes
    };
  });

  console.log('Language DOM info:', JSON.stringify(langDomInfo, null, 2));

  // Specifically target the language combobox
  console.log('Clicking the language combobox...');
  const langCombobox = meetFrame.locator('div[role="combobox"][aria-label*="language" i]').first();
  await langCombobox.waitFor({ state: 'visible', timeout: 5000 });
  await langCombobox.click();
  await page.waitForTimeout(1000);

  // Check if English option is available and click it
  console.log('Selecting English option...');
  const clicked = await meetFrame.evaluate(() => {
    const enOption = document.querySelector('li[data-value="en-US"], li[role="option"][data-value*="en"]');
    if (enOption) {
      enOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      enOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      enOption.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return { success: true, text: enOption.innerText, value: enOption.getAttribute('data-value') };
    }
    return { success: false };
  });
  console.log('English click result:', clicked);
  await page.waitForTimeout(1500);

  // Check the Save button state
  const saveBtnState = await meetFrame.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Save');
    return saveBtn ? { exists: true, disabled: saveBtn.disabled, className: saveBtn.className } : { exists: false };
  });

  console.log('Save button state after selecting English:', saveBtnState);

  // Take screenshot of frame
  await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'autorecord_audit', 'debug_language_selected.png') });
  console.log('Saved debug screenshot: tests/autorecord_audit/debug_language_selected.png');

  await context.close();
})();
