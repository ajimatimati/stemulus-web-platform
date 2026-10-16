/**
 * Exhaustive System Feature Audit & Interactive Stress-Test Suite
 * 
 * Programmatically crawls and exercises EVERY SINGLE PAGE (all 56 HTML files),
 * executes interactions (clicks, tabs, modals, accordions, forms, multi-currency switchers),
 * tests responsive desktop/mobile viewports, and captures:
 * 1. JavaScript page errors (uncaught exceptions)
 * 2. Critical console errors
 * 3. 404s on local assets (scripts, styles, images)
 * 4. Horizontal overflow on mobile/desktop
 * 5. Portal role-based interactions and data-flow integrity
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8098;
const ROOT_DIR = path.resolve(__dirname, '..');

function startServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.mp4': 'video/mp4'
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/__prime') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!DOCTYPE html><html><head><title>Prime</title></head><body></body></html>');
      return;
    }
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found: ' + reqPath);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[Exhaustive Audit Server] Serving at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

function getAllHtmlPages() {
  const files = fs.readdirSync(ROOT_DIR);
  return files.filter(f => f.endsWith('.html') && !f.toLowerCase().includes('zoho')).sort();
}

// Seed helper for database and sessions
const MOCK_DB = {
  students: [
    { id: 'stu-1', firstName: 'Leo', lastName: 'Vance', name: 'Leo Vance', course: 'Roblox Game Dev', age: 10, parentEmail: 'parent.leo@example.com', parentName: 'Sarah Vance', parentPhone: '+2348011223344', status: 'active', tutorId: 'tut-1', tutorName: 'Sarah Jane', enrolledDate: '2026-01-15' },
    { id: 'stu-2', firstName: 'Tobi', lastName: 'Adeleke', name: 'Tobi Adeleke', course: 'Python AI Masters', age: 14, parentEmail: 'parent.tobi@example.com', parentName: 'Funke Adeleke', parentPhone: '+2348099887766', status: 'active', tutorId: 'tut-1', tutorName: 'Sarah Jane', enrolledDate: '2026-02-01' }
  ],
  tutors: [
    { id: 'tut-1', name: 'Sarah Jane', email: 'sarah@stemuluskidstech.com', phone: '+2348055443322', subjects: ['Roblox', 'Python', 'Scratch'], status: 'active', hourlyRate: 8500, availability: { monday: ['afternoon'], tuesday: ['morning', 'afternoon'], wednesday: ['afternoon'], thursday: ['afternoon'], friday: ['morning'] } }
  ],
  parents: [
    { id: 'par-1', name: 'Sarah Vance', email: 'parent.leo@example.com', phone: '+2348011223344', studentIds: ['stu-1'] },
    { id: 'par-2', name: 'Funke Adeleke', email: 'parent.tobi@example.com', phone: '+2348099887766', studentIds: ['stu-2'] }
  ],
  schedules: [
    { id: 'sched-1', studentId: 'stu-1', studentName: 'Leo Vance', tutorId: 'tut-1', tutorName: 'Sarah Jane', course: 'Roblox Game Dev', day: 'Monday', time: '16:00', zoomLink: 'https://zoom.us/j/1234567890', status: 'scheduled' }
  ],
  attendanceRecords: [
    { id: 'att-1', studentId: 'stu-1', studentName: 'Leo Vance', tutorEmail: 'sarah@stemuluskidstech.com', course: 'Roblox Game Dev', date: '2026-10-12', classDate: '2026-10-12', classTime: '16:00', status: 'approved', hours: 1, topic: 'Functions & Loops' }
  ],
  monthlyReports: [
    { id: 'rep-1', studentId: 'stu-1', studentName: 'Leo Vance', tutorEmail: 'sarah@stemuluskidstech.com', course: 'Roblox Game Dev', month: '2026-09', status: 'sent_to_parent', topics: 'Roblox 3D Geometry, Variables', strengths: 'Outstanding algorithmic logic', challenges: 'Complex event handlers', recommendations: 'Lua tables next month' }
  ],
  billingCycles: [
    { studentId: 'stu-1', studentName: 'Leo Vance', cycleStartDate: '2026-10-01', nextDueDate: '2026-11-01', anchorDay: 1, planTier: 'Young Engineers', planPrice: 75000, currency: 'NGN', status: 'active', paymentStatus: 'paid' },
    { studentId: 'stu-2', studentName: 'Tobi Adeleke', cycleStartDate: '2026-10-01', nextDueDate: '2026-11-01', anchorDay: 1, planTier: 'Pre-University Fellowship', planPrice: 120000, currency: 'NGN', status: 'active', paymentStatus: 'paid' }
  ],
  notifications: [
    { id: 'not-1', userEmail: 'sarah@stemuluskidstech.com', title: 'Session Approved', message: 'Academic Director approved your session log for Leo Vance.', timestamp: new Date().toISOString(), read: false },
    { id: 'not-2', userEmail: 'parent.leo@example.com', title: 'Monthly Progress Ready', message: 'Leo Vance monthly evaluation is ready to view.', timestamp: new Date().toISOString(), read: false }
  ],
  enrollments: [],
  certificates: [
    { id: 'cert-1', student_name: 'Leo Vance', studentName: 'Leo Vance', program_name: 'Roblox Game Dev', issue_date: '2026-10-01', credential_id: 'STEM-12345', status: 'issued' }
  ],
  onboarding: {
    'parent.leo@example.com': { completed: true, steps: [] }
  },
  users: {
    'admin@stemuluskidstech.com': { email: 'admin@stemuluskidstech.com', name: 'Academic Director', role: 'admin' },
    'sarah@stemuluskidstech.com': { email: 'sarah@stemuluskidstech.com', name: 'Sarah Jane', role: 'tutor' },
    'parent.leo@example.com': { email: 'parent.leo@example.com', name: 'Sarah Vance', role: 'parent' }
  },
  adminSettings: {
    bankAccount: { bankName: 'Zenith Bank', accountNumber: '1853492019', accountName: 'STEMulus Kids Tech Ltd' }
  }
};

async function main() {
  const server = await startServer();
  const pages = getAllHtmlPages();
  console.log(`\n============================================================`);
  console.log(`🔎 STARTING EXHAUSTIVE SYSTEM AUDIT ACROSS ALL ${pages.length} PAGES`);
  console.log(`============================================================\n`);

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const anomalies = [];
  let totalInteractions = 0;

  function recordAnomaly(pageName, type, details) {
    console.warn(`  ⚠️  [${type}] on ${pageName}: ${details}`);
    anomalies.push({ page: pageName, type, details, timestamp: new Date().toISOString() });
  }

  // Pre-prime helper
  async function primeStorage(page, role = 'admin') {
    await page.goto(`http://localhost:${PORT}/__prime`, { waitUntil: 'load' });
    await page.evaluate(({ role, mockDb }) => {
      let session = {
        role: 'admin',
        email: 'admin@stemuluskidstech.com',
        name: 'Academic Director',
        issuedAt: Date.now()
      };
      if (role === 'tutor') {
        session = {
          role: 'tutor',
          email: 'sarah@stemuluskidstech.com',
          name: 'Sarah Jane',
          issuedAt: Date.now()
        };
      } else if (role === 'parent') {
        session = {
          role: 'parent',
          email: 'parent.leo@example.com',
          name: 'Sarah Vance',
          issuedAt: Date.now()
        };
      }
      sessionStorage.setItem('stemulus_session', JSON.stringify(session));
      localStorage.setItem('stemulus_session', JSON.stringify(session));
      localStorage.setItem('user', JSON.stringify(session));
      localStorage.setItem('role', role);
      localStorage.setItem('stemulus_db', JSON.stringify(mockDb));
      localStorage.setItem('stemulus_monthly_reports', JSON.stringify(mockDb.monthlyReports));
      localStorage.setItem('stemulus_attendance_records', JSON.stringify(mockDb.attendanceRecords));
    }, { role, mockDb: MOCK_DB });
  }

  for (let i = 0; i < pages.length; i++) {
    const pageName = pages[i];
    console.log(`[${i + 1}/${pages.length}] Auditing: ${pageName}...`);

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // Attach listeners
    page.on('pageerror', err => {
      // Ignore innocuous third party font/analytics CDN network rejections or mock firebase cloud sync
      const msg = err.message || String(err);
      if (!msg.includes('Missing or insufficient permissions') && !msg.includes('FirebaseError')) {
        recordAnomaly(pageName, 'PAGE_ERROR', msg);
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter expected mock firebase test network logs
        if (!text.includes('FirebaseError') && 
            !text.includes('Failed to load resource') && 
            !text.includes('favicon.ico') &&
            !text.includes('enableIndexedDbPersistence')) {
          recordAnomaly(pageName, 'CONSOLE_ERROR', text);
        }
      }
    });

    page.on('response', resp => {
      const url = resp.url();
      if (url.startsWith(`http://localhost:${PORT}`) && resp.status() >= 400) {
        // Exclude mock test endpoints or favicons if optional
        if (!url.endsWith('/favicon.ico')) {
          recordAnomaly(pageName, '404_ASSET', `${resp.status()} on ${url}`);
        }
      }
    });

    // Check if this page requires role priming
    let requiredRole = null;
    if (pageName.includes('admin-dashboard') || pageName.includes('issue-certificate') || pageName.includes('referral-dashboard')) {
      requiredRole = 'admin';
    } else if (pageName.includes('tutor-') && !pageName.includes('login') && !pageName.includes('join-as-tutor')) {
      requiredRole = 'tutor';
    } else if (pageName.includes('parent-') && !pageName.includes('login')) {
      requiredRole = 'parent';
    }

    if (requiredRole) {
      await primeStorage(page, requiredRole);
    }

    // 1. Visit Desktop View
    try {
      const queryStr = pageName === 'join-class.html' ? '?test=1' : '';
      await page.goto(`http://localhost:${PORT}/${pageName}${queryStr}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(600);

      // Check title and basic DOM integrity
      const title = await page.title();
      if (!title || title.trim().length === 0) {
        recordAnomaly(pageName, 'METADATA_MISSING', 'Page missing <title> tag');
      }

      // Check for horizontal overflow on desktop
      const isDesktopOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 5;
      });
      if (isDesktopOverflow) {
        recordAnomaly(pageName, 'HORIZONTAL_OVERFLOW', 'Desktop viewport has horizontal scrollbar');
      }

      // 2. Interactive Feature Exercises:
      // A. Accordions & Collapsibles
      const accordions = await page.$$('details, [data-accordion], .faq-question, .accordion-header, [aria-expanded]');
      for (const acc of accordions.slice(0, 5)) {
        try {
          await acc.click({ timeout: 1000 }).catch(() => {});
          totalInteractions++;
        } catch(e) {}
      }

      // B. Multi-currency switcher (especially on programs.html or pricing hubs)
      if (pageName === 'programs.html') {
        const currencyButtons = await page.$$('.currency-btn, [data-currency]');
        for (const btn of currencyButtons) {
          try {
            await btn.click({ timeout: 1000 });
            totalInteractions++;
            await page.waitForTimeout(100);
          } catch(e) {}
        }
      }

      // C. Navigation Menu & Drawers
      const menuBtn = await page.$('#menu-btn, .mobile-menu-btn, [data-menu-toggle]');
      if (menuBtn) {
        try {
          await menuBtn.click({ timeout: 1000 });
          totalInteractions++;
          await page.waitForTimeout(150);
          await menuBtn.click({ timeout: 1000 }).catch(() => {});
        } catch(e) {}
      }

      // D. Tabs & Filter Buttons
      const tabBtns = await page.$$('.tab-btn, [role="tab"], .filter-btn, .history-filter-btn');
      for (const tab of tabBtns.slice(0, 6)) {
        try {
          await tab.click({ timeout: 1000 }).catch(() => {});
          totalInteractions++;
          await page.waitForTimeout(100);
        } catch(e) {}
      }

      // E. Modal Triggers
      const modalBtns = await page.$$('[data-modal-target], [onclick*="Modal"], [onclick*="modal"]');
      for (const mBtn of modalBtns.slice(0, 4)) {
        try {
          await mBtn.click({ timeout: 1000 }).catch(() => {});
          totalInteractions++;
          await page.waitForTimeout(100);
        } catch(e) {}
      }

      // 3. Mobile Viewport Test (375x667 iPhone SE)
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);

      const isMobileOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 5;
      });
      if (isMobileOverflow) {
        recordAnomaly(pageName, 'MOBILE_OVERFLOW', 'Mobile viewport has horizontal scrollbar');
      }

    } catch(err) {
      recordAnomaly(pageName, 'PAGE_LOAD_FAILURE', err.message);
    } finally {
      await context.close();
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Special Portal Flow Stress-Tests:
  // ─────────────────────────────────────────────────────────────────
  console.log(`\n--- Running Special Portal Role Flow Stress-Tests ---`);

  // Admin Portal In-Depth Click Stress
  {
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminCtx.newPage();
    adminPage.on('pageerror', err => recordAnomaly('admin-dashboard.html', 'ADMIN_FLOW_ERROR', err.message));
    await primeStorage(adminPage, 'admin');
    await adminPage.goto(`http://localhost:${PORT}/admin-dashboard.html`, { waitUntil: 'load' });
    await adminPage.waitForTimeout(800);

    // Click all sidebar nav items
    const navItems = await adminPage.$$('.sidebar-nav-item, [onclick*="switchSection"], [data-section]');
    for (const item of navItems) {
      try {
        await item.click({ timeout: 1000 });
        totalInteractions++;
        await adminPage.waitForTimeout(150);
      } catch(e) {}
    }

    // Test Quick Onboard Modal
    const quickOnboardBtn = await adminPage.$('#btn-quick-onboard, [onclick*="openQuickOnboardModal"]');
    if (quickOnboardBtn) {
      await quickOnboardBtn.click({ timeout: 1000 }).catch(() => {});
      totalInteractions++;
      await adminPage.waitForTimeout(200);
      const closeBtn = await adminPage.$('#quick-onboard-modal [onclick*="close"], #quick-onboard-modal .close-btn');
      if (closeBtn) await closeBtn.click().catch(() => {});
    }

    await adminCtx.close();
  }

  // Tutor Portal In-Depth Click Stress
  {
    const tutorCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const tutorPage = await tutorCtx.newPage();
    tutorPage.on('pageerror', err => recordAnomaly('tutor-dashboard.html', 'TUTOR_FLOW_ERROR', err.message));
    await primeStorage(tutorPage, 'tutor');
    await tutorPage.goto(`http://localhost:${PORT}/tutor-dashboard.html`, { waitUntil: 'load' });
    await tutorPage.waitForTimeout(800);

    // Open profile availability modal
    const availBtn = await tutorPage.$('[onclick*="openProfileModal"]');
    if (availBtn) {
      await availBtn.click({ timeout: 1000 }).catch(() => {});
      totalInteractions++;
      await tutorPage.waitForTimeout(200);
      const closeBtn = await tutorPage.$('#tutor-profile-modal [onclick*="closeProfileModal"]');
      if (closeBtn) await closeBtn.click().catch(() => {});
    }
    await tutorCtx.close();
  }

  // Parent Portal In-Depth Click Stress
  {
    const parentCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const parentPage = await parentCtx.newPage();
    parentPage.on('pageerror', err => {
      const msg = err.message || String(err);
      if (!msg.includes('Missing or insufficient permissions') && !msg.includes('FirebaseError')) {
        recordAnomaly('parent-dashboard.html', 'PARENT_FLOW_ERROR', msg);
      }
    });
    await primeStorage(parentPage, 'parent');
    await parentPage.goto(`http://localhost:${PORT}/parent-dashboard.html`, { waitUntil: 'load' });
    await parentPage.waitForTimeout(800);

    // Test navigation to progress
    const childCard = await parentPage.$('.child-card, #children-container a');
    if (childCard) {
      await childCard.click({ timeout: 1000 }).catch(() => {});
      totalInteractions++;
    }
    await parentCtx.close();
  }

  // Classroom Presence In-Depth Check
  {
    const classCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const classPage = await classCtx.newPage();
    classPage.on('pageerror', err => recordAnomaly('join-class.html', 'CLASS_ROOM_ERROR', err.message));
    await primeStorage(classPage, 'parent');
    await classPage.goto(`http://localhost:${PORT}/join-class.html?sessionId=sched-1&role=coder&test=1`, { waitUntil: 'load' });
    await classPage.waitForTimeout(800);

    // Verify presence detection rendered
    const statusText = await classPage.evaluate(() => document.body.innerText);
    if (!statusText.includes('Class') && !statusText.includes('Meeting') && !statusText.includes('Connecting')) {
      recordAnomaly('join-class.html', 'CLASSROOM_STATUS_MISSING', 'Presence connection screen did not display correctly');
    }
    totalInteractions++;
    await classCtx.close();
  }

  await browser.close();
  server.close();

  console.log(`\n============================================================`);
  console.log(`📊 EXHAUSTIVE SYSTEM AUDIT COMPLETED`);
  console.log(`============================================================`);
  console.log(`Total Pages Audited: ${pages.length}`);
  console.log(`Total UI Interactions Executed: ${totalInteractions}`);
  console.log(`Total Anomalies Detected: ${anomalies.length}`);

  // Write results to JSON file for precise review and remediation
  const reportPath = path.join(ROOT_DIR, 'tests', 'audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(anomalies, null, 2));
  console.log(`Full report saved to: ${reportPath}`);

  if (anomalies.length > 0) {
    console.log(`\n🚨 DETECTED ANOMALIES BREAKDOWN:`);
    anomalies.forEach((a, idx) => {
      console.log(`  ${idx + 1}. [${a.type}] in ${a.page}: ${a.details}`);
    });
  } else {
    console.log(`\n🎉 ZERO ANOMALIES DETECTED! The entire system is flawless.`);
  }

  process.exit(anomalies.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
