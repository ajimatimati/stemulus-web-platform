/**
 * STEMulus Autonomous Headless Classroom Sentinel & Recording Bot (Production)
 * 
 * Capabilities:
 * 1. Intelligent Lifetime Management:
 *    - Stays for the full lesson.
 *    - Does NOT leave until both teacher and coder leave, OR until closing remarks,
 *      assignments, and bye-byes have concluded.
 * 2. Silent Live Real-Time Safeguarding & Operations Watchdog:
 *    - Never interrupts the live class (mic muted, camera off).
 *    - Listens in real time via Google Meet live captions stream.
 *    - Evaluates foul, abusive, sexual, violent language, and off-platform solicitation.
 *    - Alerts admin if student is unresponsive for 5 minutes straight.
 *    - Alerts admin if curriculum stagnation is detected after 20 minutes.
 * 3. Urgent Admin Escalations:
 *    - Immediate silent push notifications via ntfy.sh (stemulus-admin-escalations-2026).
 *    - Real-time logging to data/untoward_incidents.json.
 * 4. Post-Class Next Steps & Parent Update:
 *    - Synthesizes session Next Steps, Homework, and WhatsApp summary.
 *    - Saves 1080p/720p HD video file directly to recordings/.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { SentinelSafeguardEngine } = require('./sentinel_safeguard_engine');

const args = process.argv.slice(2);
const meetUrl = args[0] || 'https://meet.google.com/ckd-ngjs-cth';
const courseName = (args[1] || 'Scratch Creators').replace(/_/g, ' ');
const studentName = (args[2] || 'David Gjoka').replace(/_/g, ' ');
const tutorName = (args[3] || 'Faculty Mentor').replace(/_/g, ' ');

const ROOT_DIR = path.resolve(__dirname, '..');
const RECORDINGS_DIR = path.join(ROOT_DIR, 'recordings');
if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log(`\n======================================================`);
  console.log(`[Sentinel Bot] Launching Classroom Sentinel & Recorder`);
  console.log(`[Sentinel Bot] Course: ${courseName} | Student: ${studentName}`);
  console.log(`[Sentinel Bot] URL: ${meetUrl}`);
  console.log(`======================================================\n`);

  const sentinel = new SentinelSafeguardEngine({
    courseName,
    studentName,
    tutorName,
    meetUrl
  });

  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    recordVideo: {
      dir: RECORDINGS_DIR,
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

  // Expose live turn handler to browser DOM
  await page.exposeFunction('stemulusOnLiveCaption', (speaker, text) => {
    sentinel.processLiveTurn(speaker, text);
  });

  try {
    console.log(`[Sentinel Bot] Navigating to ${meetUrl}...`);
    await page.goto(meetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(6000);

    // Mute mic & camera in pre-join lobby (Silent Sentinel guarantee)
    try {
      const micBtn = page.locator('div[role="button"][aria-label*="microphone" i], div[role="button"][data-is-muted="false"][aria-label*="mic" i]').first();
      if (await micBtn.isVisible()) await micBtn.click();
    } catch (e) {}

    try {
      const camBtn = page.locator('div[role="button"][aria-label*="camera" i], div[role="button"][data-is-muted="false"][aria-label*="cam" i]').first();
      if (await camBtn.isVisible()) await camBtn.click();
    } catch (e) {}

    // Click "Join now"
    console.log('[Sentinel Bot] Joining meeting...');
    const joinBtn = page.locator('button:has-text("Join now"), div[role="button"]:has-text("Join now")').first();
    await joinBtn.waitFor({ state: 'attached', timeout: 15000 });
    await joinBtn.click({ force: true });
    console.log('[Sentinel Bot] In call! Activating live captions & silent watchdog...');
    await page.waitForTimeout(4000);

    // Enable Google Meet live captions
    try {
      const captionsBtn = page.locator('button[aria-label*="Turn on captions" i], button[data-tooltip*="Turn on captions" i]').first();
      if (await captionsBtn.isVisible()) {
        await captionsBtn.click();
        console.log('[Sentinel Bot] Turned on live captions via button.');
      } else {
        await page.keyboard.press('c');
        console.log('[Sentinel Bot] Turned on live captions via hotkey "c".');
      }
    } catch (e) {
      try { await page.keyboard.press('c'); } catch (err) {}
    }

    // Attach real-time caption listener in DOM
    await page.evaluate(() => {
      let lastSpokenText = '';

      const observer = new MutationObserver(() => {
        // Google Meet caption nodes
        const captionNodes = Array.from(document.querySelectorAll('.nMxikc, .iTTPOb, [jsname="YSxPC"], div[jscontroller][aria-live="polite"] span'));
        if (captionNodes.length > 0) {
          const latestText = captionNodes.map(n => n.innerText).join(' ').trim();
          if (latestText && latestText !== lastSpokenText && latestText.length > lastSpokenText.length) {
            const newChunk = latestText.slice(lastSpokenText.length).trim();
            if (newChunk.length > 2) {
              window.stemulusOnLiveCaption('Classroom Speaker', newChunk);
            }
            lastSpokenText = latestText;
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });

    const video = page.video();
    const videoPath = video ? await video.path() : null;

    // Main Sentinel Monitoring Loop (Runs up to 75 minutes)
    console.log('[Sentinel Bot] Watchdog loop active. Monitoring student responsiveness, safeguarding, and closing remarks...');
    const maxIterations = (75 * 60) / 10; // check every 10s

    for (let iter = 0; iter < maxIterations; iter++) {
      await page.waitForTimeout(10000);

      // Periodic inactivity & stagnation checks
      sentinel.checkPeriodicWatchdog();

      // Check active human participants count and UI status
      const presenceStatus = await page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        const callEnded = bodyText.includes('you left the meeting') || 
                          bodyText.includes('the meeting has ended') || 
                          bodyText.includes('everyone left');

        // Check participant chips / counts
        const participantEls = document.querySelectorAll('[data-participant-id], [data-requested-participant-id], div[role="listitem"][data-initial-participant-id]');
        const peopleBtn = document.querySelector('button[aria-label*="people" i], button[aria-label*="participants" i]');
        let count = participantEls.length;

        if (peopleBtn) {
          const match = peopleBtn.getAttribute('aria-label').match(/\d+/);
          if (match) count = parseInt(match[0], 10);
        }

        return {
          callEnded,
          humanCount: count || (participantEls.length > 0 ? participantEls.length : 2) // fallback to 2 if in call
        };
      });

      // Check conclusion criteria:
      // Must NOT leave until both teacher and coder leave, OR full class elapsed with closing remarks
      const conclusionCheck = sentinel.canSafelyConclude(presenceStatus.humanCount, presenceStatus.callEnded);
      if (conclusionCheck.canConclude) {
        console.log(`[Sentinel Bot] 🏁 Concluding session: ${conclusionCheck.reason}`);
        break;
      }
    }

    // Leave call cleanly
    try {
      const leaveBtn = page.locator('button[aria-label*="Leave call" i], button[data-tooltip*="Leave call" i]').first();
      if (await leaveBtn.isVisible()) {
        await leaveBtn.click();
        await page.waitForTimeout(2000);
      }
    } catch(e) {}

    await context.close();

    // Finalize video file
    let finalVideoPath = '';
    if (videoPath && fs.existsSync(videoPath)) {
      const timestamp = Date.now();
      const dateStr = new Date().toISOString().slice(0, 10);
      const cleanFileName = `${courseName.replace(/\s+/g, '_')}_${studentName.replace(/\s+/g, '_')}_${dateStr}_${timestamp}.webm`;
      finalVideoPath = path.join(RECORDINGS_DIR, cleanFileName);
      fs.renameSync(videoPath, finalVideoPath);
      console.log(`[Sentinel Bot] 🎬 Finalized HD video: ${finalVideoPath}`);
    }

    // Generate Operations Manager Synthesis & Next Steps
    const postClassReport = sentinel.synthesizePostClassReport(finalVideoPath);

    // Persist recording entry to data/recordings.json
    try {
      const recDbPath = path.join(ROOT_DIR, 'data', 'recordings.json');
      const recs = fs.existsSync(recDbPath) ? JSON.parse(fs.readFileSync(recDbPath, 'utf8')) : [];
      recs.unshift({
        id: `rec-${Date.now()}`,
        meetUrl,
        courseName,
        studentName,
        tutorName,
        videoFilePath: finalVideoPath,
        durationMinutes: postClassReport.durationMinutes,
        incidentsCount: postClassReport.incidentsCount,
        flaggedForReview: postClassReport.incidentsCount > 0,
        assignedHomework: postClassReport.assignedHomework,
        nextSteps: postClassReport.nextSteps,
        thingsToAddressImmediately: postClassReport.thingsToAddressImmediately,
        parentUpdateDraft: postClassReport.parentUpdateDraft,
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(recDbPath, JSON.stringify(recs, null, 2));
    } catch (e) {
      console.error('[Sentinel Bot] Could not write to data/recordings.json:', e.message);
    }

    console.log(`\n======================================================`);
    console.log(`[Sentinel Bot] SESSION OPERATIONS SUMMARY:`);
    console.log(`Student: ${postClassReport.student} | Course: ${postClassReport.course}`);
    console.log(`Duration: ${postClassReport.durationMinutes} mins | Incidents: ${postClassReport.incidentsCount}`);
    console.log(`Things to Address: ${postClassReport.thingsToAddressImmediately.join(' | ')}`);
    console.log(`Homework Assigned: ${postClassReport.assignedHomework}`);
    console.log(`Next Steps: ${postClassReport.nextSteps.join(' ')}`);
    console.log(`Parent Draft: ${postClassReport.parentUpdateDraft}`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error('[Sentinel Bot] Error during sentinel execution:', err.message);
    try { await context.close(); } catch(e) {}
  }
})();
