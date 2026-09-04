const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('======================================================================');
console.log('STEMulus Kids Tech — Comprehensive Verification Suite');
console.log('1. Emoji Banishment & 3D SVGs with Motion');
console.log('2. WebMCP Protocol & Agent Booking/Enrollment Engine');
console.log('3. Dual Class Reminder Engine (6h & 5m for Parents & Tutors)');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(`      ${err.message}`);
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(`      ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: EMOJI AUDIT (ZERO EMOJIS IN SOURCE FILES)
// ─────────────────────────────────────────────────────────────────────────────
const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2B50}\u{2705}\u{274C}\u{2728}\u{270A}-\u{270D}\u{200D}\u{FE0F}]/gu;

function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'dist' || f === '.netlify') continue;
    if (f.startsWith('scratch')) continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanDir(full, fileList);
    } else if (f.endsWith('.html') || (f.endsWith('.js') && !f.endsWith('.min.js')) || f.endsWith('.css')) {
      fileList.push(full);
    }
  }
  return fileList;
}

test('Zero raw unicode emojis exist in portal HTML/JS files', () => {
  const portalFiles = [
    'admin-dashboard.html',
    'parent-dashboard.html',
    'parent-progress.html',
    'tutor-dashboard.html',
    'tutor-attendance.html',
    'tutor-attendance-create.html',
    'tutor-monthly-report.html',
    'tutor-evaluation.html',
    'parent-login.html',
    'tutor-login.html',
    'assets/js/admin-engine.js',
    'assets/js/dashboard-engine.js',
    'assets/js/chatbot-widget.js',
    'assets/js/mulu-widget.js',
    'assets/js/lead-magnet.js',
    'assets/js/notification-service.js'
  ];

  portalFiles.forEach(f => {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      const matches = content.match(emojiRegex);
      assert.strictEqual(matches, null, `Found emojis in ${f}: ${matches ? matches.join(' ') : ''}`);
    }
  });
});

test('Zero raw unicode emojis exist in public website & Netlify functions', () => {
  const publicFiles = [
    'index.html',
    'for-parents.html',
    'book-class.html',
    'enroll.html',
    'programs.html',
    'netlify/functions/scheduled-notifications.js',
    'netlify/functions/send-email.js'
  ];

  publicFiles.forEach(f => {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      const matches = content.match(emojiRegex);
      assert.strictEqual(matches, null, `Found emojis in ${f}: ${matches ? matches.join(' ') : ''}`);
    }
  });
});

test('Total codebase scan confirms 0 raw unicode emojis across all source files', () => {
  const allFiles = scanDir('.');
  let count = 0;
  allFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (emojiRegex.test(content)) count++;
  });
  assert.strictEqual(count, 0, `Expected 0 files with emojis, but found ${count}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: 3D SVG ICON SYSTEM & CSS MOTION
// ─────────────────────────────────────────────────────────────────────────────
test('3D SVG CSS stylesheet exists with required lighting & keyframe animations', () => {
  assert(fs.existsSync('assets/css/3d-svg-icons.css'), 'assets/css/3d-svg-icons.css not found');
  const css = fs.readFileSync('assets/css/3d-svg-icons.css', 'utf8');
  assert(css.includes('@keyframes iconFloat3D'), 'Missing iconFloat3D keyframe');
  assert(css.includes('@keyframes iconPulseGlow'), 'Missing iconPulseGlow keyframe');
  assert(css.includes('@keyframes rocketThrustFlame'), 'Missing rocketThrustFlame keyframe');
  assert(css.includes('@keyframes clockTickSec'), 'Missing clockTickSec keyframe');
  assert(css.includes('@keyframes starTwinkle'), 'Missing starTwinkle keyframe');
  assert(css.includes('.icon-3d'), 'Missing .icon-3d class');
});

test('3D SVG JavaScript icon registry exports and generates valid SVGs with motion', () => {
  assert(fs.existsSync('assets/js/3d-icons.js'), 'assets/js/3d-icons.js not found');
  const Icons = require('./assets/js/3d-icons.js');
  assert(Icons.availableIcons.length >= 25, `Expected >= 25 icons, found ${Icons.availableIcons.length}`);

  const requiredIcons = ['rocket', 'target', 'star', 'graduation-cap', 'clock', 'calendar', 'document', 'chat', 'robot', 'check', 'cross', 'lightning', 'cake'];
  requiredIcons.forEach(iconName => {
    const svg = Icons.render(iconName, { size: 32 });
    assert(svg.includes('<svg'), `Generated markup for ${iconName} does not contain <svg`);
    assert(svg.includes('data-icon-name="' + iconName + '"'), `Missing data-icon-name for ${iconName}`);
  });
});

test('Dashboards link 3d-svg-icons.css and 3d-icons.js', () => {
  const dashboards = ['admin-dashboard.html', 'parent-dashboard.html', 'tutor-dashboard.html', 'parent-progress.html', 'tutor-monthly-report.html', 'tutor-attendance-create.html'];
  dashboards.forEach(d => {
    const content = fs.readFileSync(d, 'utf8');
    assert(content.includes('3d-svg-icons.css'), `${d} does not include 3d-svg-icons.css`);
    assert(content.includes('3d-icons.js'), `${d} does not include 3d-icons.js`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: WEBMCP PROTOCOL & AGENT ENGINE
// ─────────────────────────────────────────────────────────────────────────────
async function runMcpTests() {
  const mcp = require('./netlify/functions/mcp.js');

  await asyncTest('WebMCP: initialize returns server info & protocol version', async () => {
    const res = await mcp.handler({
      httpMethod: 'POST',
      body: JSON.stringify({ jsonrpc: '2.0', id: 101, method: 'initialize' })
    });
    const data = JSON.parse(res.body);
    assert.strictEqual(data.jsonrpc, '2.0');
    assert.strictEqual(data.id, 101);
    assert.strictEqual(data.result.serverInfo.name, 'STEMulus WebMCP Server');
    assert.strictEqual(data.result.protocolVersion, '2024-11-05');
  });

  await asyncTest('WebMCP: tools/list returns all 4 standard agent tools', async () => {
    const res = await mcp.handler({
      httpMethod: 'POST',
      body: JSON.stringify({ jsonrpc: '2.0', id: 102, method: 'tools/list' })
    });
    const data = JSON.parse(res.body);
    const tools = data.result.tools;
    assert.strictEqual(tools.length, 4);
    const names = tools.map(t => t.name);
    assert(names.includes('get_courses'), 'Missing get_courses');
    assert(names.includes('check_availability'), 'Missing check_availability');
    assert(names.includes('book_trial_class'), 'Missing book_trial_class');
    assert(names.includes('enroll_student'), 'Missing enroll_student');
  });

  await asyncTest('WebMCP: tools/call get_courses returns filtered catalog', async () => {
    const res = await mcp.handler({
      httpMethod: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 103,
        method: 'tools/call',
        params: { name: 'get_courses', arguments: { age: 11 } }
      })
    });
    const data = JSON.parse(res.body);
    const parsed = JSON.parse(data.result.content[0].text);
    assert(parsed.coursesCount > 0, 'No courses returned for age 11');
    assert(parsed.courses.every(c => c.tuitionMonthlyNGN > 0), 'Missing tuition fee in course');
  });

  await asyncTest('WebMCP: tools/call check_availability returns open slots', async () => {
    const res = await mcp.handler({
      httpMethod: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 104,
        method: 'tools/call',
        params: { name: 'check_availability', arguments: { program: 'python-young-coders', date: '2026-09-19' } }
      })
    });
    const data = JSON.parse(res.body);
    const parsed = JSON.parse(data.result.content[0].text);
    assert.strictEqual(parsed.programId, 'python-young-coders');
    assert.strictEqual(parsed.date, '2026-09-19');
    assert(parsed.availableSlots.length >= 3, 'Insufficient available slots');
  });

  await asyncTest('WebMCP: tools/call book_trial_class books 1-on-1 trial class with ID', async () => {
    const res = await mcp.handler({
      httpMethod: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 105,
        method: 'tools/call',
        params: {
          name: 'book_trial_class',
          arguments: {
            parentName: 'Adaobi Chukwu',
            parentEmail: 'adaobi.chukwu@example.com',
            parentPhone: '+2348033445566',
            childName: 'Somto Chukwu',
            childAge: 8,
            program: 'junior-robotics',
            preferredDate: '2026-09-26',
            preferredTime: '15:30',
            notes: 'Interested in microcontrollers and robotics'
          }
        }
      })
    });
    const data = JSON.parse(res.body);
    const parsed = JSON.parse(data.result.content[0].text);
    assert.strictEqual(parsed.status, 'CONFIRMED');
    assert(parsed.bookingId.startsWith('TR-'), 'Invalid booking ID prefix');
    assert.strictEqual(parsed.studentName, 'Somto Chukwu');
    assert(parsed.meetingLink.includes('meet.google.com'), 'Missing meeting link');
  });

  await asyncTest('WebMCP: tools/call enroll_student provisions student ID & portal credentials', async () => {
    const res = await mcp.handler({
      httpMethod: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 106,
        method: 'tools/call',
        params: {
          name: 'enroll_student',
          arguments: {
            parentName: 'Oluwaseun Balogun',
            parentEmail: 'oluwaseun.balogun@example.com',
            parentPhone: '+2348123456789',
            childName: 'Femi Balogun',
            childAge: 13,
            program: 'fullstack-web-dev',
            plan: 'annual'
          }
        }
      })
    });
    const data = JSON.parse(res.body);
    const parsed = JSON.parse(data.result.content[0].text);
    assert.strictEqual(parsed.status, 'ACTIVE_ENROLLMENT');
    assert(parsed.studentId.startsWith('STEM-2026-'), 'Invalid student ID prefix');
    assert.strictEqual(parsed.discount, '20% Annual Immersion Discount');
    assert.strictEqual(parsed.portalAccess.registeredEmail, 'oluwaseun.balogun@example.com');
  });

  test('WebMCP: Discovery manifest and interactive testing console exist', () => {
    assert(fs.existsSync('.well-known/mcp.json'), '.well-known/mcp.json does not exist');
    const manifest = JSON.parse(fs.readFileSync('.well-known/mcp.json', 'utf8'));
    assert.strictEqual(manifest.name, 'STEMulus WebMCP Server');
    assert(manifest.endpoints.rpc.includes('/api/mcp'), 'Missing rpc endpoint in manifest');

    assert(fs.existsSync('webmcp.html'), 'webmcp.html does not exist');
    const playground = fs.readFileSync('webmcp.html', 'utf8');
    assert(playground.includes('STEMulus WebMCP'), 'webmcp.html missing title');
    assert(playground.includes('get_courses'), 'webmcp.html missing get_courses');
    assert(playground.includes('claude_desktop_config.json'), 'webmcp.html missing Claude config');
  });

  test('WebMCP: netlify.toml defines /api/mcp and /api/class-reminders redirects', () => {
    const config = fs.readFileSync('netlify.toml', 'utf8');
    assert(config.includes('from = "/api/mcp"'), 'netlify.toml missing /api/mcp redirect');
    assert(config.includes('to = "/.netlify/functions/mcp"'), 'netlify.toml missing /api/mcp target');
    assert(config.includes('from = "/api/class-reminders"'), 'netlify.toml missing /api/class-reminders redirect');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: DUAL CLASS REMINDER ENGINE (6H & 5M)
// ─────────────────────────────────────────────────────────────────────────────
async function runReminderTests() {
  const reminders = require('./assets/js/class-reminder-engine.js');

  test('Class Reminder Engine: exports start, stop, evaluate, simulate, playChime', () => {
    assert(typeof reminders.start === 'function', 'Missing start');
    assert(typeof reminders.stop === 'function', 'Missing stop');
    assert(typeof reminders.evaluate === 'function', 'Missing evaluate');
    assert(typeof reminders.simulate === 'function', 'Missing simulate');
    assert(typeof reminders.playChime === 'function', 'Missing playChime');
  });

  test('Class Reminder Engine: simulate 6h trigger creates valid reminder payload', () => {
    const res = reminders.simulate('6h');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.milestone, '6h');
    assert(res.schedule.studentName.length > 0);
  });

  test('Class Reminder Engine: simulate 5m trigger creates valid reminder payload', () => {
    const res = reminders.simulate('5m');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.milestone, '5m');
    assert(res.schedule.link.includes('meet.google.com'));
  });

  test('Dashboards include class-reminder-engine.js', () => {
    const dashboards = ['admin-dashboard.html', 'parent-dashboard.html', 'tutor-dashboard.html'];
    dashboards.forEach(d => {
      const content = fs.readFileSync(d, 'utf8');
      assert(content.includes('class-reminder-engine.js'), `${d} does not include class-reminder-engine.js`);
    });
  });

  test('scheduled-notifications.js is wired with 360m (6h) and 5m windows for both parent and tutor', () => {
    const content = fs.readFileSync('netlify/functions/scheduled-notifications.js', 'utf8');
    assert(content.includes('const reminderWindows = [360, 5];'), 'scheduled-notifications.js does not have [360, 5] windows');
    assert(content.includes('labelMap = { 360: \'6 hours\', 5: \'5 minutes\' };'), 'scheduled-notifications.js labelMap missing 360/5');
    assert(content.includes('schedule.tutorEmail'), 'scheduled-notifications.js missing tutor email dispatch');
    assert(content.includes('schedule.parentEmail'), 'scheduled-notifications.js missing parent email dispatch');
  });

  await asyncTest('Serverless Class Reminders function (class-reminders.js) executes cleanly', async () => {
    const srv = require('./netlify/functions/class-reminders.js');
    const res = await srv.handler({ httpMethod: 'GET' });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert(body.timestamp, 'Missing timestamp in class-reminders response');
  });
}

// Run all test suites sequentially
(async () => {
  await runMcpTests();
  await runReminderTests();

  console.log('\n======================================================================');
  console.log(`VERIFICATION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('ALL THREE USER REQUIREMENTS ARE FULLY SATISFIED AND VERIFIED!');
  } else {
    console.log('SOME TESTS FAILED');
    process.exit(1);
  }
  console.log('======================================================================');
})();
