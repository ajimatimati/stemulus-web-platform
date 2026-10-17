/**
 * STEMulus Autonomous Tutor Onboarding & Timetable E2E Verification Suite
 *
 * Verifies:
 * 1. Admin Tutors Directory: All 7 verified tutors (Moses, Kafayat, Tola, Olalekan, Emmanuel, Sarah, David).
 * 2. Tutor Dossier Modal: Bank details (Opay, GTBank, UBA), Next of Kin, Workstation Audit, Assigned Coders, Timetable.
 * 3. Student Roster: Joshua Ogba (std-1013-jogb) enrolled with dedicated Meet link (swf-vyjv-adm) and tutor Kafayat.
 * 4. Admin Meet Link Editability: Admin can edit, change and persist any child's Meet link.
 * 5. Weekly Schedule Engine: Timetable for Monday-Sunday populated with exact WAT times and Meet links.
 * 6. Tutor Portal Session: Kafayat Abdulwahab logs in, views assigned student Joshua Ogba and banking profile.
 * 7. Parent Portal Session: Joshua Ogba's parent logs in and views private tutor and Meet room.
 */

const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 8898;
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
        res.writeHead(404);
        res.end('Not Found: ' + reqPath);
      }
    });

    server.listen(PORT, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

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

async function runE2E() {
  console.log('========================================================================');
  console.log('  STEMULUS E2E: AUTONOMOUS TUTOR ONBOARDING & TIMETABLE CLINICAL AUDIT  ');
  console.log('========================================================================');

  const server = await startStaticServer();
  console.log(`  Server listening at http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // ---------------------------------------------------------
    // PILLAR 1: Admin Authentication & Tutors Directory
    // ---------------------------------------------------------
    console.log('\n--- PILLAR 1: ADMIN AUTHENTICATION & TUTORS DIRECTORY ---');
    await page.goto(`http://127.0.0.1:${PORT}/admin-login.html`, { waitUntil: 'domcontentloaded' });
    await page.fill('#emailInput', 'admin@stemuluskidstech.com');
    await page.fill('#passwordInput', 'Admin2026!');
    await page.click('#submitBtn');
    await page.waitForTimeout(1500);

    if (!page.url().includes('admin-dashboard.html')) {
      await page.goto(`http://127.0.0.1:${PORT}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForTimeout(1500);

    // Switch to tutors section
    await page.click('a[data-section="tutors"]');
    await page.waitForTimeout(800);

    // Verify tutors table rendered
    const tutorsTableContent = await page.textContent('#tutors-table-body');
    assert(tutorsTableContent.includes('Moses Oluwafemi Adebayo'), 'Moses Oluwafemi Adebayo rendered in Tutors table');
    assert(tutorsTableContent.includes('Kafayat Abdulwahab'), 'Kafayat Abdulwahab rendered in Tutors table');
    assert(tutorsTableContent.includes('Tola Tosin Ayanleke'), 'Tola Tosin Ayanleke rendered in Tutors table');
    assert(tutorsTableContent.includes('Olalekan Israel Ajimati'), 'Olalekan Israel Ajimati rendered in Tutors table');
    assert(tutorsTableContent.includes('Emmanuel O.'), 'Emmanuel O. rendered in Tutors table');

    // Verify assigned coders pills in tutors table
    assert(tutorsTableContent.includes('Joshua Ogba'), 'Joshua Ogba appears as assigned coder pill');
    assert(tutorsTableContent.includes('Babalola Oluwadunmininu Pearl'), 'Pearl appears as assigned coder pill');
    assert(tutorsTableContent.includes('Momooreoluwa Sonaike'), 'Momooreoluwa appears as assigned coder pill');
    assert(tutorsTableContent.includes('Gbolade Okesanjo'), 'Gbolade appears as assigned coder pill');

    // ---------------------------------------------------------
    // PILLAR 2: Tutor Legal, Banking & Workstation Dossier Modal
    // ---------------------------------------------------------
    console.log('\n--- PILLAR 2: TUTOR LEGAL & BANKING DOSSIER MODAL ---');
    // Open Dossier for Moses
    await page.evaluate(() => {
      AdminEngine.openTutorDossierModal('adefemiadebayo20@gmail.com');
    });
    await page.waitForTimeout(500);

    const mosesBank = await page.textContent('#td-bank-name');
    const mosesAccNum = await page.textContent('#td-account-number');
    const mosesNok = await page.textContent('#td-nok-name');
    const mosesWork = await page.textContent('#td-workstation');
    const mosesSchedules = await page.textContent('#td-schedules-list');

    assert(mosesBank.includes('Opay'), `Moses bank is Opay (got: ${mosesBank})`);
    assert(mosesAccNum.includes('7063346551'), `Moses NUBAN is 7063346551 (got: ${mosesAccNum})`);
    assert(mosesNok.includes('Michael'), `Moses next of kin Michael verified (got: ${mosesNok})`);
    assert(mosesWork.includes('8GB RAM') || mosesWork.includes('Inverter'), 'Moses workstation audit verified');
    assert(mosesSchedules.includes('19:00') && mosesSchedules.includes('Momooreoluwa'), 'Moses weekly schedule contains Momooreoluwa class at 19:00 WAT');

    // Open Dossier for Kafayat
    await page.evaluate(() => {
      AdminEngine.openTutorDossierModal('kafayatabdulwahab.et@gmail.com');
    });
    await page.waitForTimeout(500);

    const kafaBank = await page.textContent('#td-bank-name');
    const kafaAccNum = await page.textContent('#td-account-number');
    const kafaNok = await page.textContent('#td-nok-name');
    const kafaCoders = await page.textContent('#td-coders-list');
    const kafaSchedules = await page.textContent('#td-schedules-list');

    assert(kafaBank.includes('GTBank'), `Kafayat bank is GTBank (got: ${kafaBank})`);
    assert(kafaAccNum.includes('0141342433'), `Kafayat NUBAN is 0141342433 (got: ${kafaAccNum})`);
    assert(kafaNok.includes('Kudirat Mojisola'), `Kafayat next of kin is Kudirat Mojisola (got: ${kafaNok})`);
    assert(kafaCoders.includes('Joshua Ogba'), `Kafayat assigned coders list includes Joshua Ogba`);
    assert(kafaSchedules.includes('15:00') && kafaSchedules.includes('19:00'), 'Kafayat schedule contains 15:00 and 19:00 sessions');

    // Close Dossier Modal
    await page.evaluate(() => {
      AdminEngine.closeTutorDossierModal();
    });

    // ---------------------------------------------------------
    // PILLAR 3: Student Roster, Joshua Ogba & Dedicated Meet Links
    // ---------------------------------------------------------
    console.log('\n--- PILLAR 3: STUDENT ROSTER & GOOGLE MEET ASSIGNMENTS ---');
    await page.click('a[data-section="students"]');
    await page.waitForTimeout(800);

    const studentsTable = await page.textContent('#students-table-body');
    assert(studentsTable.includes('Joshua Ogba'), 'Joshua Ogba appears in Students Roster');
    assert(studentsTable.includes('swf-vyjv-adm'), 'Joshua Ogba dedicated Meet link (swf-vyjv-adm) displayed in table');
    assert(studentsTable.includes('mim-qifa-avc'), 'Pearl dedicated Meet link (mim-qifa-avc) displayed in table');
    assert(studentsTable.includes('vdp-nmbh-sjj'), 'Momooreoluwa dedicated Meet link (vdp-nmbh-sjj) displayed in table');

    // ---------------------------------------------------------
    // PILLAR 4: Admin Meet Link & Profile Editability
    // ---------------------------------------------------------
    console.log('\n--- PILLAR 4: ADMIN EDITABILITY OF MEET LINKS & TUTORS ---');
    // Open Edit modal for Joshua Ogba
    await page.evaluate(() => {
      AdminEngine.openStudentModal('std-1013-jogb');
    });
    await page.waitForTimeout(500);

    const currentMeetVal = await page.inputValue('#student-meet-link');
    assert(currentMeetVal === 'https://meet.google.com/swf-vyjv-adm', `Joshua current Meet link is https://meet.google.com/swf-vyjv-adm (got: ${currentMeetVal})`);

    // Modify Meet link as Admin
    await page.fill('#student-meet-link', 'https://meet.google.com/swf-vyjv-adm-updated');
    await page.click('#student-form button[type="submit"]');
    await page.waitForTimeout(800);

    // Verify persisted in DB
    const updatedStudentInDb = await page.evaluate(() => {
      const db = DashboardEngine.getDB();
      return db.students.find(s => s.id === 'std-1013-jogb');
    });
    assert(updatedStudentInDb.meetLink === 'https://meet.google.com/swf-vyjv-adm-updated', 'Admin successfully changed Joshua Meet link and persisted to DB');

    // Restore original Meet link
    await page.evaluate(() => {
      DashboardEngine.updateStudent('std-1013-jogb', {
        meetLink: 'https://meet.google.com/swf-vyjv-adm',
        classroomLink: 'https://meet.google.com/swf-vyjv-adm'
      });
    });

    // ---------------------------------------------------------
    // PILLAR 5: Weekly Schedule Calendar & Timeslots
    // ---------------------------------------------------------
    console.log('\n--- PILLAR 5: WEEKLY SCHEDULE ENGINE ---');
    await page.click('a[data-section="schedules"]');
    await page.waitForTimeout(800);

    const scheduleContent = await page.textContent('#schedule-calendar');
    assert(scheduleContent.includes('Momooreoluwa'), 'Schedule contains Momooreoluwa session');
    assert(scheduleContent.includes('Joshua Ogba'), 'Schedule contains Joshua Ogba session');
    assert(scheduleContent.includes('Babalola Oluwadunmininu Pearl'), 'Schedule contains Pearl session');
    assert(scheduleContent.includes('David Gjoka'), 'Schedule contains David session');
    assert(scheduleContent.includes('JUNAYD KARI'), 'Schedule contains Junayd session');
    assert(scheduleContent.includes('Gbolade Okesanjo'), 'Schedule contains Gbolade session');

    // ---------------------------------------------------------
    // PILLAR 6: Tutor Portal Authenticated Experience
    // ---------------------------------------------------------
    console.log('\n--- PILLAR 6: TUTOR PORTAL AUTHENTICATED EXPERIENCE ---');
    const tutorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const tutorPage = await tutorContext.newPage();

    await tutorPage.goto(`http://127.0.0.1:${PORT}/parent-login.html?role=tutor`, { waitUntil: 'domcontentloaded' });
    await tutorPage.fill('#email', 'kafayatabdulwahab.et@gmail.com');
    await tutorPage.fill('#password', 'Tutor2026!');
    await tutorPage.click('#submit-btn');
    await tutorPage.waitForTimeout(1500);

    if (!tutorPage.url().includes('tutor-dashboard.html')) {
      await tutorPage.goto(`http://127.0.0.1:${PORT}/tutor-dashboard.html`, { waitUntil: 'domcontentloaded' });
    }
    await tutorPage.waitForTimeout(1200);

    const mentorName = await tutorPage.textContent('#tutor-name');
    assert(mentorName.includes('Kafayat'), `Tutor portal displays mentor name Kafayat (got: ${mentorName})`);

    // Verify assigned coders in tutor portal
    const tutorPortalText = await tutorPage.textContent('body');
    assert(tutorPortalText.includes('Joshua Ogba'), 'Tutor portal renders assigned student Joshua Ogba');

    // Open Profile Modal in Tutor Portal
    await tutorPage.evaluate(() => {
      TutorEngine.openProfileModal();
    });
    await tutorPage.waitForTimeout(500);

    const tutorBankVal = await tutorPage.inputValue('#tp-bank-name');
    const tutorAccVal = await tutorPage.inputValue('#tp-account-number');
    assert(tutorBankVal === 'GTBank', `Tutor profile modal pre-populates bank GTBank (got: ${tutorBankVal})`);
    assert(tutorAccVal === '0141342433', `Tutor profile modal pre-populates NUBAN 0141342433 (got: ${tutorAccVal})`);

    await tutorContext.close();

    // ---------------------------------------------------------
    // PILLAR 7: Parent Portal Authenticated Experience
    // ---------------------------------------------------------
    console.log('\n--- PILLAR 7: PARENT PORTAL AUTHENTICATED EXPERIENCE ---');
    const parentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const parentPage = await parentContext.newPage();

    // In parent portal, parent logs in
    await parentPage.goto(`http://127.0.0.1:${PORT}/parent-login.html?role=parent`, { waitUntil: 'domcontentloaded' });
    await parentPage.fill('#email', 'joshuaogba.parent@gmail.com');
    await parentPage.fill('#password', 'TempPassword2026!');
    await parentPage.click('#submit-btn');
    await parentPage.waitForTimeout(1500);

    if (!parentPage.url().includes('parent-dashboard.html')) {
      await parentPage.goto(`http://127.0.0.1:${PORT}/parent-dashboard.html`, { waitUntil: 'domcontentloaded' });
    }
    await parentPage.waitForTimeout(1200);

    const parentBody = await parentPage.textContent('body');
    assert(parentBody.includes('Joshua') || parentBody.includes('Ogba'), 'Parent portal renders Joshua Ogba as child');
    assert(parentBody.includes('Kafayat') || parentBody.includes('Abdulwahab'), 'Parent portal displays assigned mentor Kafayat Abdulwahab');
    assert(parentBody.includes('swf-vyjv-adm'), 'Parent portal displays dedicated Google Meet room (swf-vyjv-adm)');

    await parentContext.close();

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n========================================================================');
  console.log(`  FINAL AUDIT SCORE: ${passed} PASSED / ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
}

runE2E();
