const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('Testing event creation with recurrence, time, Meet, and language selection...');
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

  // Go to event create URL
  await page.goto('https://calendar.google.com/calendar/u/0/r/eventedit', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // 1. Enter Title
  console.log('Entering title: "King Myles\' Coding Quest"...');
  const titleInput = page.locator('input[aria-label*="title" i], input[placeholder*="title" i]').first();
  await titleInput.fill("King Myles' Coding Quest");
  await page.waitForTimeout(500);

  // 2. Set Start Date: Tuesday Oct 20, 2026
  console.log('Setting date and times...');
  const startDateInput = page.locator('input[aria-label*="start date" i]').first();
  if (await startDateInput.isVisible()) {
    await startDateInput.fill('20/10/2026');
    await page.keyboard.press('Tab');
  }

  // Set Start Time: 7:00pm
  const startTimeInput = page.locator('input[aria-label*="start time" i]').first();
  if (await startTimeInput.isVisible()) {
    await startTimeInput.fill('7:00pm');
    await page.keyboard.press('Tab');
  }

  // Set End Time: 8:00pm
  const endTimeInput = page.locator('input[aria-label*="end time" i]').first();
  if (await endTimeInput.isVisible()) {
    await endTimeInput.fill('8:00pm');
    await page.keyboard.press('Tab');
  }

  // 3. Set Recurrence: "Weekly on Tuesday"
  console.log('Setting recurrence...');
  const repeatDropdown = page.locator('[aria-label*="recurrence" i], [aria-label*="repeat" i], div[role="combobox"]:has-text("Does not repeat")').first();
  if (await repeatDropdown.isVisible()) {
    await repeatDropdown.click();
    await page.waitForTimeout(1000);
    const weeklyOption = page.locator('[role="option"]:has-text("Weekly"), [data-value*="WEEKLY"]').first();
    if (await weeklyOption.isVisible()) {
      await weeklyOption.click();
      console.log('Selected Weekly recurrence.');
    }
  }

  // 4. Add Google Meet
  console.log('Adding Google Meet conferencing...');
  const addMeetBtn = page.locator('button:has-text("Add Google Meet"), [aria-label*="Add Google Meet"]').first();
  if (await addMeetBtn.isVisible()) {
    await addMeetBtn.click();
    await page.waitForTimeout(4000);
  }

  // Read the generated Google Meet link
  const meetLinkText = await page.evaluate(() => {
    const meetAnchor = Array.from(document.querySelectorAll('a')).find(a => a.href && a.href.includes('meet.google.com/'));
    if (meetAnchor) return meetAnchor.href;
    const body = document.body.innerText;
    const m = body.match(/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/);
    return m ? `https://${m[0]}` : null;
  });
  console.log('Generated Google Meet link for Myles:', meetLinkText);

  // 5. Click Video call options gear
  console.log('Opening Video call options...');
  const gearBtn = page.locator('button[aria-label*="Video call options"], [aria-label*="Call options"]').first();
  await gearBtn.waitFor({ state: 'visible', timeout: 10000 });
  await gearBtn.click();
  await page.waitForTimeout(3000);

  // 6. Find Meet settings iframe
  const meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
  if (!meetFrame) {
    throw new Error('Google Meet options iframe not found');
  }

  // Click "Meeting records" tab
  const recordsBtn = meetFrame.getByText('Meeting records', { exact: false }).first();
  await recordsBtn.waitFor({ state: 'visible', timeout: 10000 });
  await recordsBtn.click();
  await page.waitForTimeout(2000);

  // Click Language Combobox
  console.log('Selecting English language...');
  const langCombobox = meetFrame.locator('div[role="combobox"][aria-label*="language" i]').first();
  await langCombobox.waitFor({ state: 'visible', timeout: 5000 });
  await langCombobox.click();
  await page.waitForTimeout(1000);

  // Select English
  await meetFrame.evaluate(() => {
    const enOption = document.querySelector('li[data-value="en-US"], li[role="option"][data-value*="en"]');
    if (enOption) {
      enOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      enOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      enOption.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
  await page.waitForTimeout(1000);

  // Ensure checkboxes are checked
  await meetFrame.evaluate(() => {
    const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    cbs.forEach(cb => {
      if (!cb.checked) cb.click();
    });
  });
  await page.waitForTimeout(1000);

  // Click Save in iframe modal
  console.log('Saving modal settings...');
  const saveModalBtn = meetFrame.locator('button:has-text("Save")').first();
  await saveModalBtn.click();
  await page.waitForTimeout(2000);

  // Dismiss overlay with Escape if still present
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);

  // Save Event on Main Calendar Page
  console.log('Saving Google Calendar event...');
  const saveEventBtn = page.locator('#xSaveBu, button:has-text("Save")').first();
  await saveEventBtn.click({ force: true });
  await page.waitForTimeout(4000);

  // Take screenshot of saved state
  await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'autorecord_audit', 'myles_created_verified.png') });
  console.log('Saved verification screenshot: tests/autorecord_audit/myles_created_verified.png');

  await context.close();
})();
