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
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ],
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();
  console.log('Navigating to King Myles new Meet link: https://meet.google.com/miz-dthg-pmt');
  await page.goto('https://meet.google.com/miz-dthg-pmt', { waitUntil: 'domcontentloaded' });
  
  // Wait for Join now button or Ready state
  try {
    const joinBtn = page.locator('button:has-text("Join now"), button:has-text("Ask to join")').first();
    await joinBtn.waitFor({ state: 'visible', timeout: 20000 });
    console.log('Join button is now visible!');
  } catch (e) {
    console.log('Wait for join button timed out, proceeding to capture...');
  }
  await page.waitForTimeout(3000);

  // Take screenshot of Myles lobby
  const mylesScreenshotPath = path.join(__dirname, '..', 'tests', 'autorecord_audit', 'myles_meet_lobby_verified.png');
  await page.screenshot({ path: mylesScreenshotPath });
  console.log('Saved Myles lobby screenshot to:', mylesScreenshotPath);

  // Navigate to Pearl's meeting link
  console.log('Navigating to Pearl Meet link: https://meet.google.com/bbx-ocde-ytw');
  await page.goto('https://meet.google.com/bbx-ocde-ytw', { waitUntil: 'domcontentloaded' });
  try {
    const joinBtn = page.locator('button:has-text("Join now"), button:has-text("Ask to join")').first();
    await joinBtn.waitFor({ state: 'visible', timeout: 20000 });
    console.log('Pearl Join button visible!');
  } catch (e) {
    console.log('Wait for Pearl join timed out, proceeding...');
  }
  await page.waitForTimeout(3000);

  const pearlScreenshotPath = path.join(__dirname, '..', 'tests', 'autorecord_audit', 'pearl_meet_lobby_verified.png');
  await page.screenshot({ path: pearlScreenshotPath });
  console.log('Saved Pearl lobby screenshot to:', pearlScreenshotPath);

  // Check lobby text content for recording / notes / event title
  const lobbyText = await page.evaluate(() => document.body.innerText);
  console.log('Lobby includes "King Myles":', lobbyText.includes('King Myles') || lobbyText.includes('Coding Quest'));
  console.log('Lobby includes "record":', lobbyText.toLowerCase().includes('record'));
  console.log('Lobby includes "notes":', lobbyText.toLowerCase().includes('notes'));
  console.log('Lobby preview:\n', lobbyText.substring(0, 400));

  await context.close();
})();
