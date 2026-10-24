const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('[Test Ready] Testing ready state on David\'s Meet link...');
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });
  const context = await browser.newContext({
    permissions: ['camera', 'microphone']
  });
  const page = await context.newPage();

  const meetUrl = 'https://meet.google.com/ckd-ngjs-cth';
  console.log('[Test Ready] Navigating to:', meetUrl);
  await page.goto(meetUrl, { waitUntil: 'domcontentloaded' });
  
  // Wait up to 15s for the name field or join buttons
  try {
    await page.waitForSelector('button:has-text("Ask to join"), button:has-text("Join now"), input[aria-label*="name"], input[placeholder*="name"]', { timeout: 20000 });
  } catch (e) {
    console.log('Timeout waiting for selector, capturing current state...');
  }
  await page.waitForTimeout(3000);

  const screenshotPath = path.join(__dirname, '..', 'tests', 'autorecord_audit', 'david_unauth_ready_state.png');
  await page.screenshot({ path: screenshotPath });
  console.log('[Test Ready] Saved screenshot:', screenshotPath);

  const dump = await page.evaluate(() => {
    return {
      text: document.body.innerText.substring(0, 600),
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean),
      inputs: Array.from(document.querySelectorAll('input')).map(i => i.placeholder || i.getAttribute('aria-label'))
    };
  });
  console.log('[Test Ready] Dump:', JSON.stringify(dump, null, 2));

  await browser.close();
})();
