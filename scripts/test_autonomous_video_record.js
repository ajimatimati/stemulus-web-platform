const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const recordingsDir = path.join(__dirname, '..', 'recordings');
  if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });

  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');
  const meetUrl = 'https://meet.google.com/ckd-ngjs-cth';

  console.log('[Auto-Record Test] Launching autonomous recorder with native recordVideo...');
  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1280, height: 720 }
    },
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

  console.log(`[Auto-Record Test] Navigating to ${meetUrl}...`);
  await page.goto(meetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(6000);

  // Mute mic & cam
  try {
    const micBtn = page.locator('div[role="button"][aria-label*="microphone" i], div[role="button"][data-is-muted="false"][aria-label*="mic" i]').first();
    if (await micBtn.isVisible()) await micBtn.click();
  } catch (e) {}

  try {
    const camBtn = page.locator('div[role="button"][aria-label*="camera" i], div[role="button"][data-is-muted="false"][aria-label*="cam" i]').first();
    if (await camBtn.isVisible()) await camBtn.click();
  } catch (e) {}

  // Click "Join now"
  console.log('[Auto-Record Test] Clicking "Join now"...');
  const joinBtn = page.locator('button:has-text("Join now"), div[role="button"]:has-text("Join now")').first();
  await joinBtn.waitFor({ state: 'attached', timeout: 15000 });
  await joinBtn.click({ force: true });
  console.log('[Auto-Record Test] Successfully joined meeting! Recording video automatically...');

  // Stay for 10 seconds to record live video frames
  await page.waitForTimeout(10000);

  const video = page.video();
  const videoPath = video ? await video.path() : null;
  console.log('[Auto-Record Test] Recording active at temp path:', videoPath);

  // Leave call cleanly
  try {
    const leaveBtn = page.locator('button[aria-label*="Leave call" i], button[data-tooltip*="Leave call" i]').first();
    if (await leaveBtn.isVisible()) {
      console.log('[Auto-Record Test] Leaving call...');
      await leaveBtn.click();
      await page.waitForTimeout(2000);
    }
  } catch(e) {}

  // Closing context finalizes and flushes the video file to disk
  await context.close();

  if (videoPath && fs.existsSync(videoPath)) {
    const stat = fs.statSync(videoPath);
    console.log(`[Auto-Record Test] SUCCESS! Finalized video file: ${videoPath} (${stat.size} bytes)`);
    
    // Rename to clean descriptive filename
    const finalName = path.join(recordingsDir, `Autorecord_David_Coding_Quest_${Date.now()}.webm`);
    fs.renameSync(videoPath, finalName);
    console.log(`[Auto-Record Test] Renamed to: ${finalName}`);
  } else {
    console.warn('[Auto-Record Test] Video path not found or empty.');
  }
})();
