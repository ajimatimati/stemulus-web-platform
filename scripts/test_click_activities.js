const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');
  const meetUrl = 'https://meet.google.com/ckd-ngjs-cth';

  console.log('[Test-Activities] Launching Chrome Profile 8...');
  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: [
      '--profile-directory=Profile 8',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required'
    ],
    viewport: { width: 1280, height: 720 }
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  console.log(`[Test-Activities] Navigating to ${meetUrl}...`);
  await page.goto(meetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  // Mute mic & turn off camera in pre-join lobby
  try {
    const micBtn = page.locator('div[role="button"][aria-label*="microphone" i], div[role="button"][data-is-muted="false"][aria-label*="mic" i]').first();
    if (await micBtn.isVisible()) await micBtn.click();
  } catch (e) {}

  try {
    const camBtn = page.locator('div[role="button"][aria-label*="camera" i], div[role="button"][data-is-muted="false"][aria-label*="cam" i]').first();
    if (await camBtn.isVisible()) await camBtn.click();
  } catch (e) {}

  // Click "Join now"
  console.log('[Test-Activities] Joining call...');
  const joinBtn = page.locator('button:has-text("Join now"), div[role="button"]:has-text("Join now"), button[aria-label*="Join now"]').first();
  await joinBtn.waitFor({ state: 'visible', timeout: 15000 });
  await joinBtn.click();
  await page.waitForTimeout(5000);

  // Dump all visible buttons and their aria-labels
  const buttonsInfo = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, div[role="button"]')).map(b => ({
      text: b.innerText.trim(),
      ariaLabel: b.getAttribute('aria-label') || '',
      tooltip: b.getAttribute('data-tooltip') || '',
      jsname: b.getAttribute('jsname') || '',
      classes: b.className
    })).filter(b => b.ariaLabel || b.text);
  });

  console.log('[Test-Activities] Visible buttons count:', buttonsInfo.length);
  const relevantButtons = buttonsInfo.filter(b => 
    b.ariaLabel.toLowerCase().includes('activities') || 
    b.ariaLabel.toLowerCase().includes('chat') || 
    b.ariaLabel.toLowerCase().includes('host') ||
    b.ariaLabel.toLowerCase().includes('record') ||
    b.text.toLowerCase().includes('record')
  );
  console.log('[Test-Activities] Relevant buttons:', JSON.stringify(relevantButtons, null, 2));

  // Find the activities button
  const activitiesLocator = page.locator('button[aria-label*="Activities" i], [aria-label*="Activities" i], button[data-panel-id="5"]').first();
  if (await activitiesLocator.isVisible()) {
    console.log('[Test-Activities] Found Activities button! Clicking it...');
    await activitiesLocator.click();
    await page.waitForTimeout(3000);

    const panelItems = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div[role="button"], button')).map(el => ({
        text: el.innerText.trim(),
        ariaLabel: el.getAttribute('aria-label') || ''
      })).filter(el => el.text.toLowerCase().includes('record') || el.ariaLabel.toLowerCase().includes('record'));
    });

    console.log('[Test-Activities] Panel recording items:', JSON.stringify(panelItems, null, 2));

    const recItem = page.locator('div[role="button"]:has-text("Recording"), div:has-text("Recording")').first();
    if (await recItem.isVisible()) {
      console.log('[Test-Activities] Clicking Recording panel option...');
      await recItem.click();
      await page.waitForTimeout(2000);

      const startRecBtn = page.locator('button:has-text("Start recording"), button[aria-label*="Start recording"]').first();
      if (await startRecBtn.isVisible()) {
        console.log('[Test-Activities] Start Recording button is VISIBLE!');
      }
    }
  } else {
    console.log('[Test-Activities] Activities button not directly matched. Trying by selector or index...');
    // Try clicking the button next to chat or bottom right buttons
    const bottomButtons = page.locator('div[jscontroller] button[aria-label]');
    const count = await bottomButtons.count();
    console.log('[Test-Activities] Bottom buttons total count:', count);
    for (let i = 0; i < count; i++) {
      const lbl = await bottomButtons.nth(i).getAttribute('aria-label');
      console.log(`  Button ${i}: ${lbl}`);
    }
  }

  const auditDir = path.join(__dirname, '..', 'tests', 'autorecord_audit');
  await page.screenshot({ path: path.join(auditDir, 'test_activities_panel.png') });
  console.log('[Test-Activities] Saved screenshot.');

  // Leave call cleanly
  try {
    const leaveBtn = page.locator('button[aria-label*="Leave call" i], button[data-tooltip*="Leave call" i]').first();
    if (await leaveBtn.isVisible()) {
      await leaveBtn.click();
      await page.waitForTimeout(2000);
    }
  } catch(e) {}

  await context.close();
})();
