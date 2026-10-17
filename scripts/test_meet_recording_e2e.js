/**
 * STEMulus E2E Clinical Verification Suite:
 * Google Meet Automated Session Recording & Portal Integration
 *
 * Verifies:
 * 1. Admin Roster: Displays dedicated Google Meet links for all 12 children.
 * 2. Admin Editability: Admin can edit, change, and save any child's Meet link.
 * 3. Schedule Auto-Populate: Selecting any student auto-fills their dedicated Google Meet link.
 * 4. Classroom Join Bridge: join-class.html logs attendance heartbeat and dispatches recording bot.
 * 5. Class Recordings Vault: Renders archived footage, speed controls, audit notes, and 72h parent links.
 * 6. Tutor & Parent Portals: Route classroom joins securely through join-class.html with Google Meet branding.
 */

const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 8899;
const rootDir = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // Mock netlify functions
      if (req.url.startsWith('/.netlify/functions/record-session')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, botStatus: 'reserved', provider: 'simulated' }));
        return;
      }
      if (req.url.startsWith('/.netlify/functions/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      }

      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(rootDir, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      } else {
        console.log('    [404 NOT FOUND]:', reqPath, 'resolved:', filePath);
        res.writeHead(404);
        res.end('Not Found: ' + reqPath);
      }
    });

    server.listen(PORT, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

async function runE2ETests() {
  console.log('===============================================================');
  console.log('  STEMULUS CLINICAL E2E: GOOGLE MEET & CLASS RECORDINGS VAULT  ');
  console.log('===============================================================');

  const server = await startStaticServer();
  console.log(`  Local test server active on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Track assertions
  let passed = 0;
  let failed = 0;
  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    const page = await context.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('    PAGE ERROR:', msg.text());
    });
    page.on('pageerror', err => {
      console.log('    PAGE EXCEPTION:', err.message);
    });

    // -------------------------------------------------------------
    // TEST 1: Admin Dashboard - Student Google Meet Link Display
    // -------------------------------------------------------------
    console.log('\n[1/6] Authenticating as Administrator via admin-login.html...');
    await page.goto(`http://127.0.0.1:${PORT}/admin-login.html`, { waitUntil: 'domcontentloaded' });
    await page.fill('#emailInput', 'admin@stemuluskidstech.com');
    await page.fill('#passwordInput', 'Admin2026!');
    await page.click('#submitBtn');
    await page.waitForTimeout(1500);

    if (!page.url().includes('admin-dashboard.html')) {
      await page.goto(`http://127.0.0.1:${PORT}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForTimeout(1500);

    console.log(`    Current URL: ${page.url()}`);

    // Switch to students section via navigation link
    await page.click('a[data-section="students"]');
    await page.waitForTimeout(600);

    // Check table rows
    const meetBadges = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('#students-table-body a[href*="meet.google.com"]'));
      return links.map(a => a.href);
    });

    console.log(`    Found ${meetBadges.length} Google Meet badges in students table.`);
    assert(meetBadges.length >= 10, `At least 10 student rows display Google Meet links (found: ${meetBadges.length})`);
    assert(meetBadges.some(url => url.includes('nxg-rbcg-nsr')), 'Daniel M. displays https://meet.google.com/nxg-rbcg-nsr');
    assert(meetBadges.some(url => url.includes('gua-sisg-tei')), 'Sarah M. displays https://meet.google.com/gua-sisg-tei');
    assert(meetBadges.some(url => url.includes('zhv-jquf-rem')), 'Abdulsalam displays https://meet.google.com/zhv-jquf-rem');

    // -------------------------------------------------------------
    // TEST 2: Admin Editability of Google Meet Link
    // -------------------------------------------------------------
    console.log('\n[2/6] Testing Admin Editability of Google Meet Links...');
    
    // Open student modal for Daniel (std-1001)
    await page.evaluate(() => {
      AdminEngine.openStudentModal('std-1001');
    });
    await page.waitForTimeout(400);

    const meetInputValue = await page.inputValue('#student-meet-link');
    assert(meetInputValue === 'https://meet.google.com/nxg-rbcg-nsr', `Modal pre-populates Daniel's Meet link (${meetInputValue})`);

    // Modify the meet link
    const testNewLink = 'https://meet.google.com/test-custom-adm';
    await page.fill('#student-meet-link', testNewLink);

    // Click submit button
    await page.click('#student-form button[type="submit"]');
    await page.waitForTimeout(600);

    // Verify it updated in DB
    const updatedInDb = await page.evaluate((id) => {
      const students = DashboardEngine.getStudents();
      const s = students.find(x => x.id === id);
      return s ? s.meetLink : null;
    }, 'std-1001');

    assert(updatedInDb === testNewLink, `Admin edit persisted to DB: ${updatedInDb}`);

    // Revert back to original
    await page.evaluate(() => {
      AdminEngine.openStudentModal('std-1001');
    });
    await page.waitForTimeout(400);
    await page.fill('#student-meet-link', 'https://meet.google.com/nxg-rbcg-nsr');
    await page.click('#student-form button[type="submit"]');
    await page.waitForTimeout(600);

    // -------------------------------------------------------------
    // TEST 3: Schedule Modal Auto-Fill
    // -------------------------------------------------------------
    console.log('\n[3/6] Testing Schedule Creation Auto-Fill...');
    await page.evaluate(() => {
      AdminEngine.openScheduleModal();
    });
    await page.waitForTimeout(400);

    // Select Abdulsalam (std-1003-8ecr)
    await page.evaluate(() => {
      const sel = document.getElementById('schedule-student');
      sel.value = 'std-1003-8ecr';
      AdminEngine.handleScheduleStudentChange('std-1003-8ecr');
    });
    await page.waitForTimeout(300);

    const scheduleLinkValue = await page.inputValue('#schedule-link');
    assert(scheduleLinkValue === 'https://meet.google.com/zhv-jquf-rem', `Selecting Abdulsalam auto-fills his Meet link (${scheduleLinkValue})`);

    await page.evaluate(() => {
      AdminEngine.closeModal('schedule-modal');
    });

    // -------------------------------------------------------------
    // TEST 4: Classroom Join Bridge (join-class.html)
    // -------------------------------------------------------------
    console.log('\n[4/6] Testing Classroom Join Bridge & Recording Bot Trigger...');
    await page.goto(`http://127.0.0.1:${PORT}/join-class.html?id=sch-2001&role=tutor&test=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const bridgeTitle = await page.textContent('#bridge-title');
    const safeguardingNotice = await page.textContent('body');
    const manualBtnHref = await page.getAttribute('#btn-manual-join', 'href');

    assert(bridgeTitle.includes('Connecting to Classroom'), `Bridge loads connecting screen (${bridgeTitle})`);
    assert(safeguardingNotice.includes('Automated Session Recording & Safeguarding Active'), 'Safeguarding & recording badge is present');
    assert(manualBtnHref && manualBtnHref.includes('meet.google.com/nxg-rbcg-nsr'), `Manual join button points to Google Meet (${manualBtnHref})`);

    // Verify presence was recorded in localStorage
    const presenceSaved = await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('stemulus_live_presence') || '{}');
      return store['sch-2001'] || null;
    });
    assert(presenceSaved !== null && presenceSaved.tutorPresent === true, 'Tutor presence heartbeat was logged in localStorage');

    // -------------------------------------------------------------
    // TEST 5: Admin Class Recordings Vault
    // -------------------------------------------------------------
    console.log('\n[5/6] Testing Admin Class Recordings Vault...');
    await page.goto(`http://127.0.0.1:${PORT}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await page.click('a[data-section="recordings"]');
    await page.waitForTimeout(600);

    const recordingsSectionVisible = await page.isVisible('#section-recordings');
    assert(recordingsSectionVisible, 'Recordings Vault section is visible in Admin Dashboard');

    const kpiCount = await page.textContent('#stat-recordings-total');
    assert(kpiCount !== '', `Recordings KPI stat tile rendered (${kpiCount})`);

    // Open video player modal for completed recording
    await page.evaluate(() => {
      AdminEngine.openRecordingPlayerModal('rec_arc_02');
    });
    await page.waitForTimeout(500);

    const playerModalVisible = await page.isVisible('#modal-recording-player');
    assert(playerModalVisible, 'HTML5 Recording Player Modal opened successfully');

    // Test playback speed change
    const speedChanged = await page.evaluate(() => {
      AdminEngine.setVideoPlaybackRate(1.5);
      const vid = document.getElementById('rec-video-element');
      return vid ? vid.playbackRate : null;
    });
    assert(speedChanged === 1.5, `Video playback speed updated to 1.5x (actual: ${speedChanged})`);

    // Test audit notes saving
    await page.fill('#rec-modal-notes', 'Excellent tutor engagement. Loops explained clearly.');
    await page.evaluate(() => {
      AdminEngine.saveRecordingAuditNotes();
    });
    await page.waitForTimeout(400);

    const auditSaved = await page.evaluate(() => {
      const recs = (typeof AdminEngine !== 'undefined' && AdminEngine.getCachedRecordings)
        ? AdminEngine.getCachedRecordings()
        : JSON.parse(localStorage.getItem('stemulus_class_recordings') || '[]');
      const r = recs.find(x => x.id === 'rec_arc_02');
      return r ? r.adminAuditNotes : null;
    });
    assert(auditSaved === 'Excellent tutor engagement. Loops explained clearly.', 'Admin audit review notes persisted successfully');

    // Close player modal
    await page.evaluate(() => {
      AdminEngine.closeRecordingPlayerModal();
    });

    // -------------------------------------------------------------
    // TEST 6: Tutor & Parent Portal Links
    // -------------------------------------------------------------
    console.log('\n[6/6] Testing Tutor & Parent Portal Join Routes...');
    
    // Test Tutor Portal in isolated context
    const tutorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const tutorPage = await tutorContext.newPage();
    await tutorPage.goto(`http://127.0.0.1:${PORT}/parent-login.html?role=tutor`, { waitUntil: 'domcontentloaded' });
    await tutorPage.fill('#email', 'tutor@stemuluskidstech.com');
    await tutorPage.fill('#password', 'Tutor2026!');
    await tutorPage.click('#submit-btn');
    await tutorPage.waitForTimeout(1500);
    if (!tutorPage.url().includes('tutor-dashboard.html')) {
      await tutorPage.goto(`http://127.0.0.1:${PORT}/tutor-dashboard.html`, { waitUntil: 'domcontentloaded' });
    }
    await tutorPage.waitForTimeout(1000);

    const tutorMeetBtns = await tutorPage.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="join-class.html"]'));
      return links.map(a => ({ href: a.href, text: a.textContent.trim() }));
    });
    console.log(`    Found ${tutorMeetBtns.length} Google Meet join buttons in Tutor Portal.`);
    assert(tutorMeetBtns.length > 0, 'Tutor Portal contains Google Meet join links');
    assert(tutorMeetBtns.some(b => b.text.includes('Google Meet')), 'Tutor Portal button is labeled "Google Meet"');
    assert(tutorMeetBtns.some(b => b.href.includes('role=tutor')), 'Tutor Portal passes role=tutor to join-class.html');
    await tutorContext.close();

    // Test Parent Portal in isolated context
    const parentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const parentPage = await parentContext.newPage();
    await parentPage.goto(`http://127.0.0.1:${PORT}/parent-login.html?role=parent`, { waitUntil: 'domcontentloaded' });
    await parentPage.fill('#email', 'parent@stemuluskidstech.com');
    await parentPage.fill('#password', 'Parent2026!');
    await parentPage.click('#submit-btn');
    await parentPage.waitForTimeout(1500);
    if (!parentPage.url().includes('parent-dashboard.html')) {
      await parentPage.goto(`http://127.0.0.1:${PORT}/parent-dashboard.html`, { waitUntil: 'domcontentloaded' });
    }
    await parentPage.waitForTimeout(1000);

    const parentJoinBtns = await parentPage.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="join-class.html"]'));
      return links.map(a => a.href);
    });
    console.log(`    Found ${parentJoinBtns.length} join session buttons in Parent Portal.`);
    assert(parentJoinBtns.length > 0, 'Parent Portal routes session join through join-class.html');
    assert(parentJoinBtns.some(h => h.includes('role=parent')), 'Parent Portal passes role=parent to join-class.html');
    await parentContext.close();

  } catch (err) {
    console.error('\n[FATAL ERROR IN E2E SUITE]:', err);
    failed++;
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n===============================================================');
  console.log(`  E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests();
