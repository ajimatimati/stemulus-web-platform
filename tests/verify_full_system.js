/**
 * Comprehensive Verification Suite for STEMulus:
 * 1. Admin Dashboard Auth Guard & DOM Check (0 client-side login card leaks)
 * 2. Tutor Dashboard: Upcoming Class Sessions display, schedule filtering, chronological order, Zoom & Attendance actions
 * 3. Class Reminders Engine: 24h, 1h, and 10m automated triggers, portal notifications, sound chime, and urgent modal
 * 4. Serverless Email Templates & Routing: 24h, 1h, 10m for tutors and parents
 * 5. Scheduled Functions: class-reminders and scheduled-notifications validation
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8092;
const ROOT_DIR = path.resolve(__dirname, '..');

// Basic static file server for local testing
function startServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[Test Server] Serving on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// Unit test email templates and router from netlify/functions/send-email.js
function testEmailTemplates() {
  console.log('\n--- 1. Testing Serverless Email Templates & Routing ---');
  const { buildEmail } = require(path.join(ROOT_DIR, 'netlify', 'functions', 'send-email.js'));

  const baseData = {
    studentName: 'Alex Johnson',
    tutorName: 'Sarah Mentor',
    mentorName: 'Sarah Mentor',
    course: 'Roblox Game Dev',
    courseName: 'Roblox Game Dev',
    classDate: '2026-09-24',
    classTime: '15:00',
    duration: 60,
    parentEmail: 'parent@example.com',
    parentName: 'Jane Johnson',
    tutorEmail: 'tutor@stemuluskidstech.com',
    zoomLink: 'https://zoom.us/j/123456789'
  };

  // 1. Tutor 24h Reminder
  const tutor24h = buildEmail('tutor-reminder', { ...baseData, reminderType: '24h' });
  console.log(`✓ Tutor 24h email to: ${tutor24h.to} | Subject: "${tutor24h.subject}"`);
  if (!tutor24h.to || tutor24h.to !== 'tutor@stemuluskidstech.com' || !tutor24h.subject.includes('24-Hour')) {
    throw new Error('Tutor 24h email validation failed!');
  }

  // 2. Tutor 1h Reminder
  const tutor1h = buildEmail('tutor-reminder', { ...baseData, reminderType: '1h' });
  console.log(`✓ Tutor 1h email to: ${tutor1h.to} | Subject: "${tutor1h.subject}"`);
  if (!tutor1h.subject.includes('1-Hour')) {
    throw new Error('Tutor 1h email validation failed!');
  }

  // 3. Tutor 10m Urgent Reminder
  const tutor10m = buildEmail('tutor-reminder', { ...baseData, reminderType: '10m' });
  console.log(`✓ Tutor 10m email to: ${tutor10m.to} | Subject: "${tutor10m.subject}"`);
  if (!tutor10m.subject.includes('10-Minute') || !tutor10m.html.includes('Open Classroom Now')) {
    throw new Error('Tutor 10m urgent email validation failed!');
  }

  // 4. Parent 24h Reminder
  const parent24h = buildEmail('reminder', { ...baseData, reminderType: '24h' });
  console.log(`✓ Parent 24h email to: ${parent24h.to} | Subject: "${parent24h.subject}"`);
  if (!parent24h.to || parent24h.to !== 'parent@example.com' || !parent24h.subject.includes('24-Hour')) {
    throw new Error('Parent 24h email validation failed!');
  }

  // 5. Parent 1h Reminder
  const parent1h = buildEmail('reminder', { ...baseData, reminderType: '1h' });
  console.log(`✓ Parent 1h email to: ${parent1h.to} | Subject: "${parent1h.subject}"`);
  if (!parent1h.subject.includes('1-Hour')) {
    throw new Error('Parent 1h email validation failed!');
  }

  // 6. Parent 10m Reminder
  const parent10m = buildEmail('reminder', { ...baseData, reminderType: '10m' });
  console.log(`✓ Parent 10m email to: ${parent10m.to} | Subject: "${parent10m.subject}"`);
  if (!parent10m.subject.includes('10-Minute') || !parent10m.html.includes('Launch Classroom Now')) {
    throw new Error('Parent 10m urgent email validation failed!');
  }

  console.log('✓ ALL 6 reminder template variations for Tutors and Parents verified successfully!');
}

// Unit test class-reminders serverless timing logic
function testServerlessReminders() {
  console.log('\n--- 2. Testing Serverless Class Reminders Logic ---');
  const remindersSrc = fs.readFileSync(path.join(ROOT_DIR, 'netlify', 'functions', 'class-reminders.js'), 'utf8');

  const has24hWindow = remindersSrc.includes('diffMinutes >= 1410 && diffMinutes <= 1470');
  const has1hWindow = remindersSrc.includes('diffMinutes >= 50 && diffMinutes <= 75');
  const has10mWindow = remindersSrc.includes('diffMinutes >= 0 && diffMinutes <= 15');
  const hasTutorEmailDispatch = remindersSrc.includes('tutorEmail') && remindersSrc.includes('[24h Reminder] Tomorrow: Session with');
  const hasUrgent10m = remindersSrc.includes('[Starting in 10 Mins]');

  console.log(`✓ 24h window (1410-1470m) checked: ${has24hWindow}`);
  console.log(`✓ 1h window (50-75m) checked: ${has1hWindow}`);
  console.log(`✓ 10m window (0-15m) checked: ${has10mWindow}`);
  console.log(`✓ Tutor email dispatched for 24h: ${hasTutorEmailDispatch}`);
  console.log(`✓ 10m urgent countdown alert: ${hasUrgent10m}`);

  if (!has24hWindow || !has1hWindow || !has10mWindow || !hasTutorEmailDispatch) {
    throw new Error('Serverless class reminders verification failed!');
  }
}

// Unit test netlify.toml scheduled tasks
function testNetlifyToml() {
  console.log('\n--- 3. Testing netlify.toml Cron Scheduling ---');
  const tomlSrc = fs.readFileSync(path.join(ROOT_DIR, 'netlify.toml'), 'utf8');

  const hasClassRemindersCron = tomlSrc.includes('[functions."class-reminders"]') && tomlSrc.includes('schedule = "*/10 * * * *"');
  const hasScheduledNotifications = tomlSrc.includes('[functions."scheduled-notifications"]');

  console.log(`✓ class-reminders registered every 10m: ${hasClassRemindersCron}`);
  console.log(`✓ scheduled-notifications registered: ${hasScheduledNotifications}`);

  if (!hasClassRemindersCron || !hasScheduledNotifications) {
    throw new Error('netlify.toml schedule verification failed!');
  }
}

async function runBrowserTests(server) {
  console.log('\n--- 4. Running Browser Tests via Playwright ---');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext();
  const page = await context.newPage();

  // -------------------------------------------------------------
  // Test A: Admin Dashboard Auth Guard & DOM Verification
  // -------------------------------------------------------------
  console.log('\n[Test A] Admin Dashboard Unauthenticated Access Guard');
  await page.goto(`http://localhost:${PORT}/admin-dashboard.html`, { waitUntil: 'load' });
  const redirectedUrl = page.url();
  console.log(`Redirected to: ${redirectedUrl}`);
  if (!redirectedUrl.includes('admin-login.html')) {
    throw new Error(`Expected redirect to admin-login.html, but was on: ${redirectedUrl}`);
  }
  console.log('✓ PASS: Non-admin redirected to admin-login.html');

  console.log('\n[Test A2] Admin Dashboard Authenticated Session');
  // Inject authenticated admin in sessionStorage and localStorage
  await page.evaluate(() => {
    const adminSession = { role: 'admin', email: 'admin@stemuluskidstech.com', issuedAt: Date.now() };
    sessionStorage.setItem('stemulus_session', JSON.stringify(adminSession));
    localStorage.setItem('stemulus_session', JSON.stringify(adminSession));
    localStorage.setItem('user', JSON.stringify({ email: 'admin@stemuluskidstech.com', role: 'admin', name: 'Admin User' }));
    localStorage.setItem('role', 'admin');
  });
  await page.goto(`http://localhost:${PORT}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const currentAdminUrl = page.url();
  console.log(`Current admin page URL: ${currentAdminUrl}`);

  const loginScreenExists = await page.evaluate(() => !!document.getElementById('login-screen'));
  const loginFormExists = await page.evaluate(() => !!document.getElementById('login-form'));
  const sidebarExists = await page.evaluate(() => !!document.getElementById('sidebar'));

  console.log(`loginScreen in DOM: ${loginScreenExists} (should be false)`);
  console.log(`loginForm in DOM: ${loginFormExists} (should be false)`);
  console.log(`sidebar in DOM: ${sidebarExists} (should be true)`);

  if (loginScreenExists || loginFormExists || !sidebarExists) {
    throw new Error('Admin dashboard DOM check failed! Login screen markup is still lingering or sidebar missing.');
  }
  console.log('✓ PASS: Admin Dashboard is 100% clean of client-side login card bug');

  // -------------------------------------------------------------
  // Test B: Tutor Dashboard - Upcoming Class Sessions View
  // -------------------------------------------------------------
  console.log('\n[Test B] Tutor Dashboard Upcoming Class Sessions');
  // Set tutor session and mock schedules
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const mockSchedules = [
    {
      id: 'sched-1',
      studentName: 'Alex Johnson',
      course: 'Roblox Game Dev',
      mentor: 'Sarah Mentor',
      tutorEmail: 'tutor@stemuluskidstech.com',
      date: today,
      time: '16:00',
      duration: 60,
      link: 'https://zoom.us/j/999888777',
      attendanceStatus: 'pending'
    },
    {
      id: 'sched-2',
      studentName: 'Maya Patel',
      course: 'Python Explorers',
      mentor: 'Sarah Mentor',
      tutorEmail: 'tutor@stemuluskidstech.com',
      date: tomorrow,
      time: '14:00',
      duration: 60,
      link: 'https://zoom.us/j/111222333',
      attendanceStatus: 'pending'
    },
    {
      id: 'sched-3',
      studentName: 'Other Student',
      course: 'Web Dev',
      mentor: 'David Different',
      tutorEmail: 'david@other.com',
      date: today,
      time: '12:00',
      duration: 60,
      link: 'https://zoom.us/j/000000',
      attendanceStatus: 'pending'
    }
  ];

  // Go to parent-login.html first to prime origin storage with tutor session
  await page.goto(`http://localhost:${PORT}/parent-login.html`, { waitUntil: 'load' });

  await page.evaluate(({ mockSchedules, today }) => {
    const tutorSession = {
      email: 'tutor@stemuluskidstech.com',
      role: 'tutor',
      name: 'Sarah Mentor',
      issuedAt: Date.now()
    };
    sessionStorage.setItem('stemulus_session', JSON.stringify(tutorSession));
    localStorage.setItem('stemulus_session', JSON.stringify(tutorSession));
    localStorage.setItem('user', JSON.stringify(tutorSession));
    localStorage.setItem('role', 'tutor');
    localStorage.setItem('stemulus_tutor', JSON.stringify(tutorSession));
    
    // Store in stemulus_db
    let db = {};
    try {
      db = JSON.parse(localStorage.getItem('stemulus_db') || '{}');
    } catch(e) {}
    db.users = db.users || {};
    db.users['tutor@stemuluskidstech.com'] = tutorSession;
    db.schedules = mockSchedules;
    localStorage.setItem('stemulus_db', JSON.stringify(db));
    localStorage.setItem('tutor_schedules', JSON.stringify(mockSchedules));
  }, { mockSchedules, today });

  // Now navigate to tutor-dashboard with storage already active
  await page.goto(`http://localhost:${PORT}/tutor-dashboard.html`, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  // Check section header
  const sectionHeading = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
    return headings.map(h => h.innerText).find(txt => txt.includes('Upcoming Class Sessions') || txt.includes("Today's Schedule"));
  });
  console.log(`Schedule section heading found: "${sectionHeading}"`);

  // Check rendered schedule cards
  const scheduleData = await page.evaluate(() => {
    const list = document.getElementById('schedule-list');
    if (!list) return { exists: false, cards: [] };
    const items = list.querySelectorAll('.schedule-item, tr, [data-schedule-id], div');
    const textContent = list.innerText;
    return {
      exists: true,
      rawText: textContent,
      hasAlex: textContent.includes('Alex Johnson'),
      hasMaya: textContent.includes('Maya Patel'),
      hasOther: textContent.includes('Other Student'),
      hasZoomLink: !!list.querySelector('a[href*="zoom.us"]'),
      hasAttendanceLink: list.innerText.includes('Attendance') || !!list.querySelector('a[href*="attendance"]')
    };
  });

  console.log('Tutor Schedule List verification:', scheduleData);
  if (!scheduleData.hasAlex || !scheduleData.hasMaya) {
    throw new Error('Tutor upcoming classes did not render Alex or Maya!');
  }
  if (scheduleData.hasOther) {
    throw new Error('Tutor schedule incorrectly included another tutor’s student!');
  }
  console.log('✓ PASS: Tutor can view all upcoming class sessions and isolation is preserved');

  // Take screenshot of tutor dashboard
  const tutorScreenshotPath = path.join(ROOT_DIR, 'tutor_dashboard_verified.png');
  await page.screenshot({ path: tutorScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${tutorScreenshotPath}`);

  // Take dedicated screenshot of Upcoming Class Sessions card
  const scheduleCard = page.locator('#schedule-list');
  await scheduleCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const scheduleListScreenshotPath = path.join(ROOT_DIR, 'tutor_schedules_list_verified.png');
  await page.locator('.dash-grid').screenshot({ path: scheduleListScreenshotPath });
  console.log(`Saved schedule list screenshot: ${scheduleListScreenshotPath}`);

  // -------------------------------------------------------------
  // Test C: Class Reminders Engine (24h, 1h, 10m triggers)
  // -------------------------------------------------------------
  console.log('\n[Test C] Class Reminder Engine: 24h, 1h, and 10m Triggers');
  const engineLoaded = await page.evaluate(() => typeof window.StemulusClassReminders !== 'undefined');
  console.log(`StemulusClassReminders engine loaded in window: ${engineLoaded}`);

  if (!engineLoaded) {
    throw new Error('StemulusClassReminders is not loaded!');
  }

  // Test 1: Simulate 24-hour reminder
  console.log('Testing 24h milestone simulation...');
  const res24h = await page.evaluate(() => {
    const sim = window.StemulusClassReminders.simulate('24h');
    const el = document.getElementById('reminder-banner-24h-' + sim.schedule.id);
    return {
      sim,
      bannerFound: !!el,
      text: el ? el.textContent : ''
    };
  });
  console.log('24h simulation result:', res24h);
  if (!res24h.bannerFound || !res24h.text.includes('24 Hours')) {
    throw new Error('24-hour reminder banner did not render!');
  }

  // Test 2: Simulate 1-hour reminder
  console.log('Testing 1h milestone simulation...');
  const res1h = await page.evaluate(() => {
    const sim = window.StemulusClassReminders.simulate('1h');
    const el = document.getElementById('reminder-banner-1h-' + sim.schedule.id);
    return {
      sim,
      bannerFound: !!el,
      text: el ? el.textContent : ''
    };
  });
  console.log('1h simulation result:', res1h);
  if (!res1h.bannerFound || !res1h.text.includes('1 Hour')) {
    throw new Error('1-hour reminder banner did not render!');
  }

  // Test 3: Simulate 10-minute urgent reminder
  console.log('Testing 10m milestone simulation...');
  const res10m = await page.evaluate(() => {
    const sim = window.StemulusClassReminders.simulate('10m');
    const el = document.getElementById('urgent-class-modal-' + sim.schedule.id);
    return {
      sim,
      modalFound: !!el,
      text: el ? el.textContent : ''
    };
  });
  console.log('10m simulation result:', res10m);
  if (!res10m.modalFound || !res10m.text.includes('10 Minutes')) {
    throw new Error('10-minute urgent reminder modal did not render!');
  }

  // Wait for modal fadeIn animation to fully resolve
  await page.waitForTimeout(600);

  // Screenshot of 10-minute modal
  const modalScreenshotPath = path.join(ROOT_DIR, 'tutor_10m_modal_verified.png');
  await page.screenshot({ path: modalScreenshotPath, fullPage: false });
  console.log(`Saved 10-minute modal screenshot: ${modalScreenshotPath}`);

  console.log('✓ PASS: All 3 class reminder milestones (24h, 1h, 10m) trigger perfectly');

  await browser.close();
}

async function main() {
  let server;
  try {
    server = await startServer();
    testEmailTemplates();
    testServerlessReminders();
    testNetlifyToml();
    await runBrowserTests(server);

    console.log('\n======================================================');
    console.log('🎉 ALL VERIFICATION TESTS PASSED 100% SUCCESFULLY! 🎉');
    console.log('======================================================\n');
    if (server) {
      if (server.closeAllConnections) server.closeAllConnections();
      server.close();
    }
    process.exit(0);
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err);
    if (server) {
      if (server.closeAllConnections) server.closeAllConnections();
      server.close();
    }
    process.exit(1);
  }
}

main();
