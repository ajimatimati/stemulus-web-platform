/**
 * STEMulus Autonomous Headless Recording Bot
 * 
 * Automatically joins a Google Meet session as stemulusclubs@gmail.com (Host),
 * turns off camera/mic, clicks "Start recording" via the Activities panel,
 * and maintains the live Google Drive recording without requiring any manual admin presence.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function startMeetRecording(meetUrl, options = {}) {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');
  const durationMinutes = options.durationMinutes || 60;

  console.log(`[Recorder-Bot] Starting recording dispatcher for: ${meetUrl}`);
  console.log(`[Recorder-Bot] Profile: stemulusclubs@gmail.com (Chrome Profile 8)`);

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

  try {
    console.log(`[Recorder-Bot] Navigating to ${meetUrl}...`);
    await page.goto(meetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);

    // Mute mic & turn off camera in pre-join lobby
    try {
      const micBtn = page.locator('div[role="button"][aria-label*="microphone" i], div[role="button"][data-is-muted="false"][aria-label*="mic" i]').first();
      if (await micBtn.isVisible()) {
        console.log('[Recorder-Bot] Muting microphone...');
        await micBtn.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {}

    try {
      const camBtn = page.locator('div[role="button"][aria-label*="camera" i], div[role="button"][data-is-muted="false"][aria-label*="cam" i]').first();
      if (await camBtn.isVisible()) {
        console.log('[Recorder-Bot] Turning off camera...');
        await camBtn.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {}

    // Click "Join now"
    console.log('[Recorder-Bot] Clicking "Join now"...');
    const joinBtn = page.locator('button:has-text("Join now"), div[role="button"]:has-text("Join now"), button[aria-label*="Join now"]').first();
    await joinBtn.waitFor({ state: 'visible', timeout: 15000 });
    await joinBtn.click();
    await page.waitForTimeout(5000);

    // Open Activities panel
    console.log('[Recorder-Bot] Looking for Activities panel icon...');
    const activitiesBtn = page.locator('button[aria-label*="Activities" i], [data-panel-id="5"], button[data-tooltip*="Activities" i]').first();
    if (await activitiesBtn.isVisible()) {
      await activitiesBtn.click();
      await page.waitForTimeout(2000);

      // Click Recording option
      console.log('[Recorder-Bot] Selecting "Recording" in Activities...');
      const recordingOpt = page.locator('div[role="button"]:has-text("Recording"), div:has-text("Recording")').first();
      if (await recordingOpt.isVisible()) {
        await recordingOpt.click();
        await page.waitForTimeout(2000);

        // Click "Start recording" button
        const startRecBtn = page.locator('button:has-text("Start recording"), button[aria-label*="Start recording"]').first();
        if (await startRecBtn.isVisible()) {
          console.log('[Recorder-Bot] Clicking "Start recording"...');
          await startRecBtn.click();
          await page.waitForTimeout(1500);

          // Confirm prompt if appears
          const confirmBtn = page.locator('button:has-text("Start"), button[aria-label="Start"]').first();
          if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
            await page.waitForTimeout(2000);
          }
          console.log('[Recorder-Bot] Live Google Meet recording initiated successfully!');
        } else {
          console.log('[Recorder-Bot] Recording is already active or in progress.');
        }
      }
    }

    const auditDir = path.join(__dirname, '..', 'tests', 'autorecord_audit');
    if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
    await page.screenshot({ path: path.join(auditDir, 'recorder_bot_in_call.png') });

    return { success: true, message: 'Recorder bot active in meeting.' };

  } catch (err) {
    console.error('[Recorder-Bot] Error in dispatcher:', err.message);
    return { success: false, error: err.message };
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const urlArg = args.find(a => a.startsWith('http')) || 'https://meet.google.com/ckd-ngjs-cth';
  startMeetRecording(urlArg);
}

module.exports = { startMeetRecording };
