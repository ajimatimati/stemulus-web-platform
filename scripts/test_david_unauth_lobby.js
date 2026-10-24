const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('[Test Lobby] Testing unauthenticated entry into David\'s Meet link...');
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
  console.log('[Test Lobby] Navigating to:', meetUrl);
  await page.goto(meetUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);

  const screenshotPath = path.join(__dirname, '..', 'tests', 'autorecord_audit', 'david_unauth_lobby_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log('[Test Lobby] Saved screenshot:', screenshotPath);

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('[Test Lobby] Page text excerpt:\n', pageText.substring(0, 500));

  const hasWaitingForHost = pageText.toLowerCase().includes('waiting for the host') || 
                            pageText.toLowerCase().includes('host must join') ||
                            pageText.toLowerCase().includes('waiting for host') ||
                            pageText.toLowerCase().includes('wait until the host arrives');

  const hasAskToJoin = pageText.toLowerCase().includes('ask to join');
  const hasJoinNow = pageText.toLowerCase().includes('join now');

  console.log('[Test Lobby] Has "Waiting for host":', hasWaitingForHost);
  console.log('[Test Lobby] Has "Ask to join":', hasAskToJoin);
  console.log('[Test Lobby] Has "Join now":', hasJoinNow);

  await browser.close();
})();
