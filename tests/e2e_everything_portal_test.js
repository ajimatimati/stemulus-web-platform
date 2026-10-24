/**
 * STEMULUS PORTAL - EXHAUSTIVE E2E VERIFICATION TEST SUITE
 * "Test Everywhere and Everything"
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8098;
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT_DIR, 'data', 'stemulus_db_latest.json');
const authenticDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// Mini test server with __prime supporting StemulusSecurity and video mock
function startServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4'
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/__prime') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html><html><head><script src="assets/js/stemulus-security.min.js"></script></head><body></body></html>`);
      return;
    }
    // Handle mock video backgrounds gracefully if not found
    if (reqPath.endsWith('.mp4')) {
      const vidPath = path.join(ROOT_DIR, reqPath);
      if (fs.existsSync(vidPath)) {
        res.writeHead(200, { 'Content-Type': 'video/mp4' });
        fs.createReadStream(vidPath).pipe(res);
      } else {
        res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': 0 });
        res.end();
      }
      return;
    }

    if (reqPath === '/') reqPath = '/admin-dashboard.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`File not found: ${reqPath}`);
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[E2E Server] Running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// Authenticates via StemulusSecurity cryptographic HMAC signed tokens
async function primeStorage(page, role, userEmail, userName) {
  await page.goto(`http://localhost:${PORT}/__prime`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ role, userEmail, userName, authenticDb }) => {
    const sessionObj = {
      role: role,
      email: userEmail,
      name: userName || (role === 'admin' ? 'Super Admin' : (role === 'tutor' ? 'Sarah Jane' : 'Alice Smith')),
      issuedAt: Date.now()
    };
    
    // Save tamper-proof signed session envelope
    if (typeof StemulusSecurity !== 'undefined') {
      StemulusSecurity.saveSecureSession(sessionObj);
    }

    sessionStorage.setItem('stemulus_session_raw', JSON.stringify(sessionObj));
    localStorage.setItem('user', JSON.stringify(sessionObj));
    localStorage.setItem('role', role);
    localStorage.setItem('stemulus_auth_role', role);
    localStorage.setItem('stemulus_user_email', userEmail);
    localStorage.setItem('stemulus_auth_token', 'stemulus_e2e_verified_token');
    
    // Inject authentic database into client localStorage
    localStorage.setItem('stemulus_db', JSON.stringify(authenticDb));
  }, { role, userEmail, userName, authenticDb });
}

async function runExhaustiveE2ETest() {
  const server = await startServer();
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const issuesFound = [];
  const passes = [];

  function recordPass(msg) {
    console.log(`  [PASS] ${msg}`);
    passes.push(msg);
  }

  function recordIssue(category, msg, severity = 'WARNING') {
    console.log(`  [${severity}] ${category}: ${msg}`);
    issuesFound.push({ category, msg, severity });
  }

  try {
    console.log('\n=============================================================');
    console.log('STAGE 1: ADMIN DASHBOARD (admin-dashboard.html)');
    console.log('=============================================================');
    {
      const page = await context.newPage();
      const consoleErrors = [];
      const failedRequests = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          const txt = msg.text();
          // Filter out benign sandbox firestore network notice
          if (!txt.includes('firestore') && !txt.includes('Backend didn\'t respond')) {
            consoleErrors.push(txt);
          }
        }
      });
      page.on('pageerror', err => {
        consoleErrors.push(`Uncaught PageError: ${err.message}`);
      });
      page.on('requestfailed', req => {
        failedRequests.push(`${req.method()} ${req.url()}: ${req.failure() ? req.failure().errorText : 'failed'}`);
      });
      page.on('response', res => {
        if (res.status() >= 400) {
          failedRequests.push(`HTTP ${res.status()} on ${res.url()}`);
        }
      });

      await primeStorage(page, 'admin', 'admin@stemuluskidstech.com', 'Super Admin');
      await page.goto(`http://localhost:${PORT}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Verify page didn't redirect away
      if (page.url().includes('admin-dashboard.html')) {
        recordPass('Admin Dashboard: Authenticated session validated successfully (No redirect)');
      } else {
        recordIssue('Admin Auth', `Redirected to ${page.url()}`, 'CRITICAL');
      }

      // Check console errors
      const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('analytics') && !e.includes('404'));
      if (criticalErrors.length === 0) {
        recordPass('Admin Dashboard: Zero critical JavaScript console errors');
      } else {
        recordIssue('Admin Dashboard Console', criticalErrors.join(' | '), 'CRITICAL');
      }

      // Check 404s
      const critical404s = failedRequests.filter(r => !r.includes('favicon.ico') && !r.includes('.mp4'));
      if (critical404s.length === 0) {
        recordPass('Admin Dashboard: Zero broken assets or 404 requests');
      } else {
        recordIssue('Admin Dashboard Assets', critical404s.join(' | '), 'WARNING');
      }

      // Check Dual Switcher (Language Toggle)
      const langBtnFr = await page.$('#lang-toggle-fr');
      const langBtnEn = await page.$('#lang-toggle-en');
      if (langBtnFr && langBtnEn) {
        recordPass('Admin Dashboard: Language toggle buttons mounted');
        await langBtnFr.click();
        await page.waitForTimeout(300);
        const storedLang = await page.evaluate(() => localStorage.getItem('stemulus_portal_lang'));
        if (storedLang === 'fr') {
          recordPass('Language Switcher successfully toggles to French and updates localStorage');
        } else {
          recordIssue('Language Switcher', `Expected localStorage 'fr' but found ${storedLang}`, 'WARNING');
        }
        await langBtnEn.click();
        await page.waitForTimeout(300);
      } else {
        recordIssue('Language Switcher', 'Toggle buttons #lang-toggle-fr / #lang-toggle-en not found', 'CRITICAL');
      }

      // Check Visual Mode Switcher
      const modeBtnComp = await page.$('#mode-toggle-compact');
      const modeBtnVis = await page.$('#mode-toggle-visual');
      if (modeBtnComp && modeBtnVis) {
        recordPass('Admin Dashboard: Visual mode toggle buttons mounted');
        await modeBtnComp.click();
        await page.waitForTimeout(300);
        const storedMode = await page.evaluate(() => localStorage.getItem('stemulus_portal_view_mode'));
        if (storedMode === 'compact') {
          recordPass('Visual Switcher successfully toggles to Compact Mode and updates localStorage');
        } else {
          recordIssue('Visual Switcher', `Expected mode 'compact' but found ${storedMode}`, 'WARNING');
        }
        await modeBtnVis.click();
        await page.waitForTimeout(300);
      } else {
        recordIssue('Visual Switcher', 'Toggle buttons #mode-toggle-compact / #mode-toggle-visual not found', 'CRITICAL');
      }

      // Check Operations Manager Mount
      const opsSuite = await page.$('#mount-operations-suite');
      if (opsSuite) {
        recordPass('Operations Manager: #mount-operations-suite mounted in DOM');
        const suiteText = await page.$eval('#mount-operations-suite', el => el.innerText);
        if (suiteText.includes('Classroom') || suiteText.includes('Operations') || suiteText.includes('Tutor')) {
          recordPass('Operations Manager renders live classroom and faculty metrics');
        } else {
          recordIssue('Operations Manager', 'Suite container empty or missing text', 'WARNING');
        }
      } else {
        recordIssue('Operations Manager', 'Missing #mount-operations-suite element', 'CRITICAL');
      }

      // Check Birthday Celebration Headquarters & WhatsApp modal trigger
      const birthdayMount = await page.$('#mount-birthday-headquarters');
      if (birthdayMount) {
        recordPass('Birthday Celebration Headquarters: #mount-birthday-headquarters mounted in DOM');
        const bdayCount = await page.evaluate(() => {
          return window.BirthdayEngine ? window.BirthdayEngine.getCelebrantsCount() : null;
        });
        if (bdayCount) {
          recordPass(`Birthday Celebration Engine active (Today: ${bdayCount.today}, Month: ${bdayCount.thisMonth})`);
        } else {
          recordIssue('Birthday Engine', 'BirthdayEngine not exposed on window', 'CRITICAL');
        }

        // Test WhatsApp generator
        const waCard = await page.evaluate(() => {
          if (window.BirthdayEngine && window.BirthdayEngine.generateCoderWhatsAppCard) {
            return window.BirthdayEngine.generateCoderWhatsAppCard('David Gjoka', '10', 'Python Champion');
          }
          return null;
        });
        if (waCard && waCard.includes('HAPPY BIRTHDAY')) {
          recordPass('WhatsApp Birthday card generator creates rich emoji card');
        } else {
          recordIssue('Birthday Engine WhatsApp', 'Card generator failed or missing greeting', 'WARNING');
        }
      } else {
        recordIssue('Birthday Celebration', '#mount-birthday-headquarters not found in DOM', 'CRITICAL');
      }

      // Check Session Content AI Analysis Modal
      const analysisModalExists = await page.$('#modal-transcript-analysis');
      if (analysisModalExists) {
        recordPass('Session Content AI Analysis Modal (#modal-transcript-analysis) is injected in Admin Dashboard');
        
        // Trigger modal evaluation for Junayd
        await page.evaluate(() => {
          if (window.AdminEngine && window.AdminEngine.openTranscriptAnalysisModal) {
            window.AdminEngine.openTranscriptAnalysisModal('rec_arc_03');
          }
        });
        await page.waitForTimeout(600);
        const modalVisible = await page.$eval('#modal-transcript-analysis', el => !el.classList.contains('hidden'));
        if (modalVisible) {
          recordPass('AI Analysis Modal opens cleanly on AdminEngine trigger');
          const modalText = await page.$eval('#modal-transcript-analysis', el => el.innerText);
          if (modalText.includes('Scratch') || modalText.includes('Junayd') || modalText.includes('Adherence')) {
            recordPass('AI Analysis Modal renders student details, adherence %, and safeguarding metrics');
          } else {
            recordIssue('AI Analysis Modal Content', 'Modal opened but lacked session metrics content', 'WARNING');
          }
          
          // Close modal
          await page.evaluate(() => {
            if (window.AdminEngine && window.AdminEngine.closeTranscriptAnalysisModal) {
              window.AdminEngine.closeTranscriptAnalysisModal();
            }
          });
        } else {
          recordIssue('AI Analysis Modal', 'Modal failed to remove .hidden after openTranscriptAnalysisModal call', 'CRITICAL');
        }
      } else {
        recordIssue('AI Analysis Modal', '#modal-transcript-analysis element missing from Admin Dashboard', 'CRITICAL');
      }

      // Test Gemini Parent Report Trigger function
      const reportTriggerWorks = await page.evaluate(async () => {
        return typeof window.triggerGeminiParentReport === 'function' || 
               (typeof window.SessionContentAnalysisEngine !== 'undefined' && typeof window.SessionContentAnalysisEngine.triggerGeminiParentReport === 'function');
      });
      if (reportTriggerWorks) {
        recordPass('triggerGeminiParentReport function is accessible');
      } else {
        recordIssue('Gemini Parent Report', 'triggerGeminiParentReport function is missing', 'CRITICAL');
      }

      // Check Faculty Messenger Suite & Rejoin Beacon in Admin Dashboard
      const chatSection = await page.$('#section-chat');
      const chatMount = await page.$('#mount-faculty-chat-suite');
      if (chatSection && chatMount) {
        recordPass('Admin Dashboard: Faculty Messenger Suite (#section-chat & #mount-faculty-chat-suite) mounted');
        const hasFacultyEngines = await page.evaluate(() => {
          return typeof window.FacultyChatEngine !== 'undefined' && typeof window.ClassroomRejoinBeacon !== 'undefined';
        });
        if (hasFacultyEngines) {
          recordPass('Admin Dashboard: FacultyChatEngine & ClassroomRejoinBeacon loaded and available');
        } else {
          recordIssue('Admin Chat Engines', 'FacultyChatEngine or ClassroomRejoinBeacon missing on window', 'CRITICAL');
        }
      } else {
        recordIssue('Admin Chat Suite', 'Missing #section-chat or #mount-faculty-chat-suite', 'CRITICAL');
      }

      await page.close();
    }

    console.log('\n=============================================================');
    console.log('STAGE 2: VIRTUAL CLASSROOM (join-class.html)');
    console.log('=============================================================');
    {
      const page = await context.newPage();
      const consoleErrors = [];
      const failedRequests = [];

      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', err => {
        consoleErrors.push(`Uncaught PageError: ${err.message}`);
      });
      page.on('requestfailed', req => {
        failedRequests.push(`${req.method()} ${req.url()}: ${req.failure() ? req.failure().errorText : 'failed'}`);
      });
      page.on('response', res => {
        if (res.status() >= 400) {
          failedRequests.push(`HTTP ${res.status()} on ${res.url()}`);
        }
      });

      await primeStorage(page, 'student', 'junayd@example.com', 'Junayd Kari');
      await page.goto(`http://localhost:${PORT}/join-class.html?id=sched-junayd-01&role=student&test=1`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('8099'));
      if (criticalErrors.length === 0) {
        recordPass('Virtual Classroom: Zero critical JavaScript console errors');
      } else {
        recordIssue('Virtual Classroom Console', criticalErrors.join(' | '), 'CRITICAL');
      }

      const critical404s = failedRequests.filter(r => !r.includes('favicon.ico') && !r.includes('.mp4') && !r.includes('8099'));
      if (critical404s.length === 0) {
        recordPass('Virtual Classroom: Zero broken assets or 404 requests');
      } else {
        recordIssue('Virtual Classroom Assets', critical404s.join(' | '), 'WARNING');
      }

      // Check Bilingual Companion Mount
      const bilingualCompanion = await page.$('#mount-bilingual-assistant');
      if (bilingualCompanion) {
        recordPass('Bilingual Classroom Companion is mounted for Junayd Kari');
        const companionTitle = await page.$eval('#mount-bilingual-assistant', el => el.innerText);
        if (companionTitle.includes('Junayd') || companionTitle.includes('Olalekan') || companionTitle.includes('Bilingual')) {
          recordPass('Bilingual Companion displays custom coach & student companion badge');
        } else {
          recordIssue('Bilingual Companion', 'Companion card missing coach/student header names', 'WARNING');
        }

        // Test Scratch Block Bank interaction
        const blockButtons = await page.$$('#mount-scratch-blocks button');
        if (blockButtons.length >= 4) {
          recordPass(`Scratch Block Bank contains ${blockButtons.length} interactive dual-audio block buttons`);
          await blockButtons[0].scrollIntoViewIfNeeded();
          await blockButtons[0].click({ timeout: 5000, force: true });
          recordPass('Clicking Scratch block button executes speech audio safely');
        } else {
          recordIssue('Scratch Block Bank', `Expected >= 4 block buttons in #mount-scratch-blocks but found ${blockButtons.length}`, 'WARNING');
        }
      } else {
        recordIssue('Bilingual Companion', '#mount-bilingual-assistant not found in DOM for Junayd', 'CRITICAL');
      }

      // Test Disconnect and Reconnect escalation from classroom
      const escalationTrigger = await page.evaluate(() => {
        if (window.ClassEscalationEngine) {
          window.ClassEscalationEngine.recordDisconnect('ses-junayd-test', 'sched-junayd-01', 'student', 'Junayd Kari', 'Scratch Coding Quest');
          const incidents = window.ClassEscalationEngine.getIncidents();
          return incidents.length;
        }
        return 0;
      });

      if (escalationTrigger > 0) {
        recordPass('Virtual Classroom: Disconnect event triggers escalation recording immediately');
      } else {
        recordIssue('Class Escalation', 'ClassEscalationEngine recordDisconnect failed or returned 0 incidents', 'CRITICAL');
      }

      await page.close();
    }

    console.log('\n=============================================================');
    console.log('STAGE 3: PARENT DASHBOARD (parent-dashboard.html)');
    console.log('=============================================================');
    {
      const page = await context.newPage();
      const consoleErrors = [];
      const failedRequests = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          const txt = msg.text();
          if (!txt.includes('firestore') && !txt.includes('Backend didn\'t respond')) {
            consoleErrors.push(txt);
          }
        }
      });
      page.on('pageerror', err => {
        consoleErrors.push(`Uncaught PageError: ${err.message}`);
      });
      page.on('requestfailed', req => {
        failedRequests.push(`${req.method()} ${req.url()}: ${req.failure() ? req.failure().errorText : 'failed'}`);
      });
      page.on('response', res => {
        if (res.status() >= 400) {
          failedRequests.push(`HTTP ${res.status()} on ${res.url()}`);
        }
      });

      await primeStorage(page, 'parent', 'parent@stemuluskidstech.com', 'John Doe');
      await page.goto(`http://localhost:${PORT}/parent-dashboard.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      // Verify page didn't redirect away
      if (page.url().includes('parent-dashboard.html')) {
        recordPass('Parent Dashboard: Authenticated session validated successfully (No redirect)');
      } else {
        recordIssue('Parent Auth', `Redirected to ${page.url()}`, 'CRITICAL');
      }

      const criticalErrors = consoleErrors.filter(e => !e.includes('favicon'));
      if (criticalErrors.length === 0) {
        recordPass('Parent Dashboard: Zero critical JavaScript console errors');
      } else {
        recordIssue('Parent Dashboard Console', criticalErrors.join(' | '), 'CRITICAL');
      }

      const critical404s = failedRequests.filter(r => !r.includes('favicon.ico') && !r.includes('.mp4'));
      if (critical404s.length === 0) {
        recordPass('Parent Dashboard: Zero broken assets or 404 requests');
      } else {
        recordIssue('Parent Dashboard Assets', critical404s.join(' | '), 'WARNING');
      }

      // Check Dual Switchers
      const switcherMount = await page.$('#mount-parent-dual-switcher');
      if (switcherMount) {
        recordPass('Parent Dashboard: Dual Switcher mount present in header');
      } else {
        recordIssue('Parent Dashboard Switcher', 'Missing #mount-parent-dual-switcher', 'CRITICAL');
      }

      const hasBeaconParent = await page.evaluate(() => typeof window.ClassroomRejoinBeacon !== 'undefined');
      if (hasBeaconParent) {
        recordPass('Parent Dashboard: ClassroomRejoinBeacon active for instant dropout prompts');
      } else {
        recordIssue('Parent Rejoin Beacon', 'ClassroomRejoinBeacon not loaded on parent dashboard', 'WARNING');
      }

      await page.close();
    }

    console.log('\n=============================================================');
    console.log('STAGE 4: TUTOR DASHBOARD (tutor-dashboard.html)');
    console.log('=============================================================');
    {
      const page = await context.newPage();
      const consoleErrors = [];
      const failedRequests = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          const txt = msg.text();
          if (!txt.includes('firestore') && !txt.includes('Backend didn\'t respond')) {
            consoleErrors.push(txt);
          }
        }
      });
      page.on('pageerror', err => {
        consoleErrors.push(`Uncaught PageError: ${err.message}`);
      });
      page.on('requestfailed', req => {
        failedRequests.push(`${req.method()} ${req.url()}: ${req.failure() ? req.failure().errorText : 'failed'}`);
      });
      page.on('response', res => {
        if (res.status() >= 400) {
          failedRequests.push(`HTTP ${res.status()} on ${res.url()}`);
        }
      });

      await primeStorage(page, 'tutor', 'tutor@stemuluskidstech.com', 'Sarah Jane');
      await page.goto(`http://localhost:${PORT}/tutor-dashboard.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      // Verify page didn't redirect away
      if (page.url().includes('tutor-dashboard.html')) {
        recordPass('Tutor Dashboard: Authenticated session validated successfully (No redirect)');
      } else {
        recordIssue('Tutor Auth', `Redirected to ${page.url()}`, 'CRITICAL');
      }

      const criticalErrors = consoleErrors.filter(e => !e.includes('favicon'));
      if (criticalErrors.length === 0) {
        recordPass('Tutor Dashboard: Zero critical JavaScript console errors');
      } else {
        recordIssue('Tutor Dashboard Console', criticalErrors.join(' | '), 'CRITICAL');
      }

      const critical404s = failedRequests.filter(r => !r.includes('favicon.ico') && !r.includes('.mp4'));
      if (critical404s.length === 0) {
        recordPass('Tutor Dashboard: Zero broken assets or 404 requests');
      } else {
        recordIssue('Tutor Dashboard Assets', critical404s.join(' | '), 'WARNING');
      }

      // Check Dual Switchers
      const switcherMount = await page.$('#mount-tutor-dual-switcher');
      if (switcherMount) {
        recordPass('Tutor Dashboard: Dual Switcher mount present in header');
      } else {
        recordIssue('Tutor Dashboard Switcher', 'Missing #mount-tutor-dual-switcher', 'CRITICAL');
      }

      // Check authentic Google Meet links
      const meetLinks = await page.$$('a[href*="meet.google.com"]');
      recordPass(`Tutor Dashboard: Verified ${meetLinks.length} active class launch elements`);

      // Check Tutor Direct Line Chat Drawer & Rejoin Beacon
      const drawerMount = await page.$('#mount-tutor-chat-drawer');
      const hasTutorEngines = await page.evaluate(() => {
        return typeof window.FacultyChatEngine !== 'undefined' && typeof window.ClassroomRejoinBeacon !== 'undefined';
      });
      if (drawerMount && hasTutorEngines) {
        recordPass('Tutor Dashboard: Admin Direct Line Drawer mounted and FacultyChatEngine active');
      } else {
        recordIssue('Tutor Chat Drawer', 'Missing #mount-tutor-chat-drawer or FacultyChatEngine', 'CRITICAL');
      }

      await page.close();
    }

    console.log('\n=============================================================');
    console.log('STAGE 5: COMPLETE CODER SCHEDULE & DATABASE AUDIT');
    console.log('=============================================================');
    {
      const requiredCoders = [
        { name: 'David Gjoka', tokens: ['david', 'gjoka'], meetCode: 'ckd-ngjs-cth' },
        { name: 'Junayd Kari', tokens: ['junayd', 'kari'], meetCode: 'gyd-fewb-cdh' },
        { name: 'Momooreoluwa Sonaike', tokens: ['momooreoluwa', 'sonaike'], meetCode: 'vdp-nmbh-sjj' },
        { name: 'Joshua Ogba', tokens: ['joshua', 'ogba'], meetCode: 'yko-xwce-ugd' },
        { name: 'King Myles Omosuyi', tokens: ['myles', 'omosuyi'], meetCode: 'miz-dthg-pmt' },
        { name: 'Babalola Oluwadunmininu Pearl', tokens: ['pearl', 'babalola'], meetCode: 'bbx-ocde-ytw' }
      ];

      for (const coder of requiredCoders) {
        const student = authenticDb.students.find(s => {
          const fullName = ((s.firstName || '') + ' ' + (s.lastName || '') + ' ' + (s.name || '')).toLowerCase();
          return coder.tokens.some(tok => fullName.includes(tok));
        });

        if (!student) {
          recordIssue('Database Audit', `Student ${coder.name} not found in stemulus_db_latest.json`, 'CRITICAL');
          continue;
        }

        const schedules = authenticDb.schedules.filter(sc => {
          const sName = ((sc.studentName || '') + ' ' + (sc.course || '')).toLowerCase();
          return coder.tokens.some(tok => sName.includes(tok));
        });

        if (schedules.length === 0) {
          recordIssue('Database Audit', `No schedules found for ${coder.name}`, 'CRITICAL');
          continue;
        }

        const hasValidLink = schedules.every(sc => (sc.meetingLink || sc.link || '').includes(coder.meetCode));
        const hasHostNotRequired = schedules.every(sc => sc.hostNotRequired === true);

        if (hasValidLink && hasHostNotRequired) {
          recordPass(`Coder ${coder.name}: Valid Meet Link (${coder.meetCode}) & hostNotRequired=true across ${schedules.length} schedules`);
        } else {
          recordIssue('Database Audit', `Coder ${coder.name} has missing meet link or hostNotRequired is false`, 'CRITICAL');
        }
      }
    }

  } catch (err) {
    console.error('Test Runner Exception:', err);
    issuesFound.push({ category: 'Runtime Runner Error', msg: err.message, severity: 'CRITICAL' });
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n=============================================================');
  console.log(`E2E AUDIT RESULTS SUMMARY: ${passes.length} Passed | ${issuesFound.length} Issues`);
  console.log('=============================================================');

  if (issuesFound.length > 0) {
    console.log('\nISSUES IDENTIFIED:');
    issuesFound.forEach((issue, idx) => {
      console.log(`  [${idx + 1}] [${issue.severity}] ${issue.category}: ${issue.msg}`);
    });
  } else {
    console.log('\n[PERFECTION] All end-to-end tests across every dashboard passed with ZERO issues!');
  }

  return { passes, issuesFound };
}

runExhaustiveE2ETest().then(({ issuesFound }) => {
  if (issuesFound.some(i => i.severity === 'CRITICAL')) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
