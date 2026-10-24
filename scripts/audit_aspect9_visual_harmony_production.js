/**
 * ASPECT 9 AUDIT: Cross-Portal Visual Harmony, Performance & Production Build
 * Comprehensive Playwright & Build Pipeline Verification Suite
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PORT = 8139;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/__prime') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html><html><head><script src="assets/js/stemulus-security.min.js"></script></head><body></body></html>`);
    return;
  }
  if (reqPath === '/favicon.ico') {
    const icoPath = path.join(ROOT_DIR, 'favicon.png');
    if (fs.existsSync(icoPath)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      fs.createReadStream(icoPath).pipe(res);
      return;
    } else {
      res.writeHead(204);
      res.end();
      return;
    }
  }
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT_DIR, reqPath);

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + reqPath);
  }
});

let testCount = 0;
let passCount = 0;
let failCount = 0;

function report(name, ok, details = '') {
  testCount++;
  if (ok) {
    passCount++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    failCount++;
    console.error(`  ❌ [FAIL] ${name} - ${details}`);
  }
}

async function primeAuth(page, role, email, name) {
  await page.goto(`http://localhost:${PORT}/__prime`, { waitUntil: 'domcontentloaded' });
  const dbData = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data', 'stemulus_db_latest.json'), 'utf8'));
  
  await page.evaluate(({ role, email, name, dbData }) => {
    const sessionObj = {
      role: role,
      email: email,
      name: name,
      issuedAt: Date.now()
    };
    if (typeof StemulusSecurity !== 'undefined') {
      StemulusSecurity.saveSecureSession(sessionObj);
    }
    sessionStorage.setItem('stemulus_session_raw', JSON.stringify(sessionObj));
    localStorage.setItem('user', JSON.stringify(sessionObj));
    localStorage.setItem('role', role);
    localStorage.setItem('stemulus_auth_role', role);
    localStorage.setItem('stemulus_user_email', email);
    localStorage.setItem('stemulus_auth_token', 'aspect9_verified_token');
    localStorage.setItem('stemulus_db', JSON.stringify(dbData));
  }, { role, email, name, dbData });
}

async function runAudit() {
  console.log('================================================================');
  console.log('ASPECT 9 AUDIT: Cross-Portal Visual Harmony, Performance & Build');
  console.log('================================================================\n');

  // --- STAGE 1: PRODUCTION ASSETS & BUILD PIPELINE VERIFICATION ---
  console.log('[STAGE 1] Validating Minified Bundles and Build Artifacts...');

  const requiredMinJs = [
    'assets/js/bilingual-classroom-engine.min.js',
    'assets/js/billing-engine.min.js',
    'assets/js/classroom-rejoin-beacon.min.js',
    'assets/js/classroom-recorder-engine.min.js',
    'assets/js/dashboard-engine.min.js',
    'assets/js/faculty-chat-engine.min.js',
    'assets/js/parent-engine.min.js',
    'assets/js/reschedule-concierge-engine.min.js',
    'assets/js/stemulus-security.min.js',
    'assets/js/tutor-attendance-engine.min.js',
    'assets/js/tutor-engine.min.js'
  ];

  requiredMinJs.forEach(relPath => {
    const absPath = path.join(ROOT_DIR, relPath);
    const exists = fs.existsSync(absPath);
    const size = exists ? fs.statSync(absPath).size : 0;
    report(`Minified JS Bundle: ${relPath}`, exists && size > 500, `${size} bytes`);
  });

  const requiredCss = [
    'style.min.css',
    'dist/combined.css',
    'assets/css/tailwind-output.css',
    'assets/css/portal-design-system.css'
  ];

  requiredCss.forEach(relPath => {
    const absPath = path.join(ROOT_DIR, relPath);
    const exists = fs.existsSync(absPath);
    const size = exists ? fs.statSync(absPath).size : 0;
    report(`Production CSS Bundle: ${relPath}`, exists && size > 1000, `${size} bytes`);
  });

  // --- STAGE 2: DESIGN SYSTEM TOKENS & VISUAL HARMONY ---
  console.log('\n[STAGE 2] Auditing Design System Tokens & Double-Bezel Hierarchy...');

  const pdsContent = fs.readFileSync(path.join(ROOT_DIR, 'assets/css/portal-design-system.css'), 'utf8');
  report('Design System defines --brand-orange: #F4600C', pdsContent.includes('--brand-orange: #F4600C'));
  report('Design System defines --brand-indigo: #4B49AC', pdsContent.includes('--brand-indigo: #4B49AC'));
  report('Design System defines Double-Bezel radius (--radius-shell: 32px)', pdsContent.includes('--radius-shell: 32px'));
  report('Design System defines specular shell shadow (--shadow-shell)', pdsContent.includes('--shadow-shell'));
  report('Design System defines desktop compact scaling (~80% density)', pdsContent.includes('DESKTOP COMPACT SCALING') && pdsContent.includes('font-size: 13.5px'));

  // --- STAGE 3: RUNTIME PORTAL HARMONY ACROSS ALL 7 DASHBOARDS ---
  console.log('\n[STAGE 3] Running Multi-Page Playwright Scans Across All Dashboards...');

  await new Promise(resolve => server.listen(PORT, resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }

  const pagesToAudit = [
    { name: "Coders' Classroom", url: '/join-class.html?test=1&student=std-1001', role: 'student', email: 'parent@example.com', nameProp: 'Daniel M.' },
    { name: "Coders' Portfolio & Passport", url: '/parent-progress.html?id=std-1001', role: 'parent', email: 'parent@example.com', nameProp: 'Parent User' },
    { name: "Tutors' Command Center", url: '/tutor-dashboard.html', role: 'tutor', email: 'tutor@stemulus.com', nameProp: 'Sarah Jane' },
    { name: "Tutors' Attendance Ledger", url: '/tutor-attendance.html', role: 'tutor', email: 'tutor@stemulus.com', nameProp: 'Sarah Jane' },
    { name: "Tutors' Attendance Create", url: '/tutor-attendance-create.html', role: 'tutor', email: 'tutor@stemulus.com', nameProp: 'Sarah Jane' },
    { name: "Tutors' Monthly Report", url: '/tutor-monthly-report.html', role: 'tutor', email: 'tutor@stemulus.com', nameProp: 'Sarah Jane' },
    { name: "Parents' Command Center & Billing Vault", url: '/parent-dashboard.html', role: 'parent', email: 'parent@example.com', nameProp: 'Parent User' }
  ];

  for (const pageCfg of pagesToAudit) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    const consoleErrors = [];
    const missingAssets = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const txt = msg.text();
        if (!txt.includes('favicon') && !txt.includes('net::ERR_ABORTED') && !txt.includes('8099') && !txt.includes('ERR_CONNECTION_REFUSED') && !txt.includes('firestore')) {
          consoleErrors.push(txt);
        }
      }
    });

    page.on('requestfailed', req => {
      const url = req.url();
      const failure = req.failure() ? req.failure().errorText : '';
      if (!failure.includes('ERR_ABORTED') && !url.includes('favicon') && !url.includes('google-analytics') && !url.includes('8099') && !url.includes('firestore')) {
        missingAssets.push(`${url}: ${failure}`);
      }
    });

    page.on('response', resp => {
      if (resp.status() >= 400 && !resp.url().includes('favicon') && !resp.url().includes('8099') && !resp.url().includes('firestore')) {
        missingAssets.push(`${resp.url()} [HTTP ${resp.status()}]`);
      }
    });

    await primeAuth(page, pageCfg.role, pageCfg.email, pageCfg.nameProp);
    await page.goto(`http://localhost:${PORT}${pageCfg.url}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // 1. Mobile 375px Horizontal Overflow Audit
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(400);

    const overflowCheck = await page.evaluate(() => {
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      };
    });
    const noOverflow = overflowCheck.scrollWidth <= overflowCheck.clientWidth + 2;
    report(`${pageCfg.name}: Mobile 375px Zero Horizontal Overflow`, noOverflow, `client: ${overflowCheck.clientWidth}, scroll: ${overflowCheck.scrollWidth}`);

    // 2. Touch Target Compliance
    const touchCheck = await page.evaluate(() => {
      const interactive = Array.from(document.querySelectorAll('button, a, input, select'));
      let nonCompliant = 0;
      let samples = [];
      interactive.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.top + rect.height > 0) && (rect.left + rect.width > 0)) {
          const compStyle = window.getComputedStyle(el);
          if (compStyle.display !== 'none' && compStyle.visibility !== 'hidden' && compStyle.opacity !== '0') {
            if (rect.height < 34 || rect.width < 34) {
              nonCompliant++;
              samples.push({
                tag: el.tagName,
                id: el.id,
                class: (el.className || '').toString().slice(0, 40),
                text: (el.textContent || '').trim().slice(0, 25),
                w: Math.round(rect.width),
                h: Math.round(rect.height)
              });
            }
          }
        }
      });
      return { nonCompliant, samples };
    });
    if (touchCheck.nonCompliant > 0) {
      console.log(`    ⚠️ Non-compliant on ${pageCfg.name}:`, JSON.stringify(touchCheck.samples));
    }
    report(`${pageCfg.name}: WCAG 2.1 AA Touch Targets >= 34px`, touchCheck.nonCompliant === 0, `${touchCheck.nonCompliant} elements < 34px`);

    // 3. Clean Console & Zero 404s
    if (consoleErrors.length > 0) {
      console.log(`    ⚠️ Console Errors on ${pageCfg.name}:`, consoleErrors);
    }
    report(`${pageCfg.name}: Zero Console Errors`, consoleErrors.length === 0, consoleErrors.join(', '));
    report(`${pageCfg.name}: Zero Missing Assets (404s)`, missingAssets.length === 0, missingAssets.join(', '));

    await context.close();
  }

  // --- STAGE 4: MISSION-CRITICAL INVARIANTS ---
  console.log('\n[STAGE 4] Auditing Mission-Critical Platform Invariants...');

  const DE = require('../assets/js/dashboard-engine.js');
  const catalog = DE.COURSE_ASSIGNMENTS_CATALOG;
  const courseKeys = Object.keys(catalog);
  report('10 Suites & 12 Courses catalog defined in DashboardEngine', courseKeys.length >= 10);

  courseKeys.forEach(k => {
    const course = catalog[k];
    const assignmentsList = Array.isArray(course) ? course : (course && course.assignments ? course.assignments : []);
    const hasAssignments = assignmentsList.length >= 8;
    assert(hasAssignments, `Course ${k} must have at least 8 drafted assignments for lessons (found ${assignmentsList.length})`);
  });
  report('All courses have full drafted lesson assignments catalog (>= 8 assignments each)', true);

  const sampleProvision = DE.provisionCoderClassroomAndMeet({
    firstName: 'Zainab',
    lastName: 'Balogun',
    program: 'Python Programming Foundations'
  }, 8);

  report('Google Meet pro links enforce hostNotRequired = true', sampleProvision.hostNotRequired === true);
  report('Google Meet pro links enforce autoRecord = true', sampleProvision.autoRecord === true);
  report('Google Classroom assigns valid studentInviteLink', typeof sampleProvision.classroomLink === 'string' && sampleProvision.classroomLink.includes('classroom.google.com'));

  await browser.close();
  server.close();

  console.log('\n================================================================');
  console.log(`ASPECT 9 SUMMARY: ${passCount}/${testCount} Tests Passed (${failCount} Failures)`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
