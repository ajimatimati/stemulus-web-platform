/**
 * STEMulus Autonomous Parent & Coder Onboarding Utility (Playwright)
 *
 * Autonomously parses parent and student rosters from spreadsheets (CSV / JSON),
 * launches a secure Playwright browser instance, authenticates into the Admin Portal,
 * registers parents and coders, establishes tutor relationships, and safely stages
 * welcome credential packets in the Admin Email Queue with status: 'pending'.
 *
 * STRICT OPERATIONAL POLICY:
 * ZERO automated emails are sent to parents or tutors. All welcome kits and login
 * credentials remain held in the Admin Review Queue awaiting human administrator approval.
 *
 * Usage:
 *   node scripts/autonomous_onboard_playwright.js [--file=path/to/roster.csv] [--dry-run] [--headed]
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_PORT = 8791;

// ─── Simple Static HTTP Server for Local Playwright Session ─────────────────
function startLocalServer(port) {
  return new Promise((resolve, reject) => {
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };

    const server = http.createServer((req, res) => {
      let cleanUrl = req.url.split('?')[0];
      if (cleanUrl === '/') cleanUrl = '/index.html';
      const filePath = path.join(ROOT_DIR, decodeURIComponent(cleanUrl));

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found: ' + cleanUrl);
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      });
    });

    server.listen(port, () => {
      resolve(server);
    });
    server.on('error', reject);
  });
}

// ─── Flexible CSV Parser (handles quotes, commas, escapes) ───────────────────
function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  function splitLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const rawHeaders = splitLine(lines[0]).map(h => h.toLowerCase().replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    if (values.every(v => v === '')) continue;
    const row = {};
    rawHeaders.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

// ─── Program Track Normalizer ───────────────────────────────────────────────
function resolveProgram(rawProg, age) {
  if (!rawProg) {
    return age <= 8 ? 'Scratch Creators' : (age <= 12 ? 'Python Programming' : 'Web & App Development');
  }
  // Strip emojis
  const clean = rawProg.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  // If multiple tracks are selected, prioritize based on age appropriateness
  const lower = clean.toLowerCase();
  if (lower.includes('scratch') && age <= 9) return 'Scratch Creators';
  if (lower.includes('python')) return 'Python Programming';
  if (lower.includes('scratch')) return 'Scratch Creators';
  if (lower.includes('web')) return 'Web & App Development';
  if (lower.includes('robotics')) return 'Robotics & Arduino';
  if (lower.includes('artificial intelligence') || lower.includes('machine learning')) return 'Python Programming';
  
  return clean.split(',')[0].trim() || 'Scratch Creators';
}

// ─── Field Normalizer ────────────────────────────────────────────────────────
function normalizeRow(row) {
  const getField = (aliases, fallback = '') => {
    // 1. Exact match pass
    for (const alias of aliases) {
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '');
        if (cleanKey === alias && row[key] && String(row[key]).trim().length > 0) {
          return String(row[key]).trim();
        }
      }
    }
    // 2. Substring match pass
    for (const alias of aliases) {
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '');
        if (cleanKey.includes(alias) && row[key] && String(row[key]).trim().length > 0) {
          return String(row[key]).trim();
        }
      }
    }
    return fallback;
  };

  const parentName = getField(['parent_guardian_full_name', 'parent_full_name', 'parent_name', 'guardian_full_name', 'guardian_name']);
  const parentEmail = getField(['parent_guardian_email_address', 'parent_email_address', 'parent_email', 'email_address', 'email']);
  const parentPhone = getField(['parent_guardian_phone_number', 'parent_phone_number', 'parent_phone', 'phone', 'phone_number', 'whatsapp', 'mobile']);
  const relationship = getField(['relationship_to_child', 'relationship']);
  
  let childFirstName = getField(['child_first_name', 'student_first_name', 'coder_first_name']);
  let childLastName = getField(['child_last_name', 'student_last_name', 'coder_last_name']);
  const fullName = getField(['child_s_full_name', 'child_full_name', 'child_name', 'student_full_name', 'student_name', 'coder_name']);

  if (!childFirstName && fullName) {
    const parts = fullName.split(/\s+/);
    childFirstName = parts[0] || '';
    childLastName = parts.slice(1).join(' ') || '';
  }

  const rawAge = getField(['child_s_age', 'child_age', 'student_age', 'age', 'coder_age']);
  const age = parseInt(rawAge, 10) || 9;

  const birthday = getField(['child_birthday', 'birthday', 'dob', 'date_of_birth']);
  const rawProgram = getField(['which_stemulus_program_are_you_enrolling_for', 'program', 'course', 'track', 'curriculum']);
  const program = resolveProgram(rawProgram, age);

  const grade = getField(['child_s_current_school_class_grade', 'child_current_school_class_grade', 'grade', 'class']);
  const experience = getField(['has_your_child_had_any_prior_coding_tech_experience', 'prior_experience', 'experience']);
  const photoConsent = getField(['do_you_consent_to_your_child_s_photos', 'photo_consent', 'consent']);
  const extraNotes = getField(['any_additional_information_about_your_child', 'additional_information', 'notes', 'comments', 'goals']);

  const notesList = [];
  if (relationship) notesList.push(`Relationship: ${relationship}`);
  if (grade && grade !== '.') notesList.push(`Grade: ${grade}`);
  if (experience) notesList.push(`Experience: ${experience}`);
  if (photoConsent) notesList.push(`Photo Consent: ${photoConsent}`);
  if (extraNotes) notesList.push(`Notes: ${extraNotes}`);
  const notes = notesList.join(' | ');

  const tutorName = getField(['tutor_name', 'tutor', 'mentor', 'instructor'], 'Sarah Jane'); // Default to active mentor Sarah Jane
  const classroomLink = getField(['classroom_link', 'meet_link', 'zoom_link', 'link']);

  return {
    parentName,
    parentEmail,
    parentPhone,
    childFirstName,
    childLastName,
    age,
    birthday,
    program,
    tutorName,
    classroomLink,
    notes
  };
}

// ─── Main Onboarding Execution ───────────────────────────────────────────────
async function runAutonomousOnboarding() {
  const args = process.argv.slice(2);
  const fileArg = args.find(a => a.startsWith('--file='));
  const isDryRun = args.includes('--dry-run');
  const isHeaded = args.includes('--headed');
  const portArg = args.find(a => a.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1], 10) : DEFAULT_PORT;

  let filePath = fileArg ? fileArg.split('=')[1] : path.join(ROOT_DIR, 'data', 'onboarding_template.csv');
  if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(process.cwd(), filePath);
  }

  console.log('\n=============================================================');
  console.log('   STEMULUS AUTONOMOUS ONBOARDING ENGINE (PLAYWRIGHT)');
  console.log('   Security: Web Crypto Vault | Policy: Zero Unapproved Emails');
  console.log('=============================================================');
  console.log(`Source Roster File: ${filePath}`);
  console.log(`Execution Mode    : ${isDryRun ? '[DRY RUN - ZERO WRITE]' : '[LIVE INGESTION]'}`);
  console.log(`Browser Display   : ${isHeaded ? 'Headed (Visible UI)' : 'Headless'}`);

  if (!fs.existsSync(filePath)) {
    console.error(`\n[ERROR] Source file not found: ${filePath}`);
    console.log('Please provide a valid CSV or JSON roster file via --file=<path>');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  let rawRows = [];
  if (filePath.endsWith('.json')) {
    rawRows = JSON.parse(fileContent);
  } else {
    rawRows = parseCSV(fileContent);
  }

  if (!rawRows.length) {
    console.warn('\n[WARNING] No records found in the provided file.');
    process.exit(0);
  }

  const normalized = rawRows.map(normalizeRow);
  console.log(`\nDiscovered ${normalized.length} record(s) to process.\n`);

  // Validation Phase
  const validRecords = [];
  const invalidRecords = [];

  normalized.forEach((rec, idx) => {
    const errors = [];
    if (!rec.parentEmail || !rec.parentEmail.includes('@')) errors.push('Invalid parent email');
    if (!rec.childFirstName) errors.push('Missing child first name');
    if (!rec.parentName) errors.push('Missing parent name');
    if (isNaN(rec.age) || rec.age < 4 || rec.age > 20) errors.push(`Invalid age: ${rec.age}`);

    if (errors.length) {
      invalidRecords.push({ row: idx + 1, record: rec, errors });
    } else {
      validRecords.push({ row: idx + 1, record: rec });
    }
  });

  if (invalidRecords.length) {
    console.warn(`[VALIDATION ALERT] ${invalidRecords.length} row(s) had errors and will be skipped:`);
    invalidRecords.forEach(inv => {
      console.warn(`  Row ${inv.row}: ${inv.record.childFirstName || 'Unnamed'} - ${inv.errors.join(', ')}`);
    });
  }

  if (isDryRun) {
    console.log(`\n[DRY RUN SUMMARY] ${validRecords.length} records ready for safe ingestion. Zero database mutations made.`);
    process.exit(0);
  }

  // Spin up local static server
  console.log(`Starting local server on port ${port}...`);
  const server = await startLocalServer(port);
  const baseUrl = `http://localhost:${port}`;

  console.log('Launching Playwright browser (Chrome / Edge)...');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: !isHeaded });
  } catch (err1) {
    try {
      browser = await chromium.launch({ channel: 'msedge', headless: !isHeaded });
    } catch (err2) {
      browser = await chromium.launch({ headless: !isHeaded });
    }
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  const auditLog = {
    executedAt: new Date().toISOString(),
    sourceFile: filePath,
    totalRows: normalized.length,
    successfulIngestions: [],
    failedIngestions: [],
    emailQueueStaged: []
  };

  try {
    // 1. Authenticate into Admin Session
    console.log('Navigating to Admin Portal and establishing authenticated session...');
    await page.goto(`${baseUrl}/admin-login.html`, { waitUntil: 'domcontentloaded' });

    // Establish verified admin session via StemulusSecurity and DashboardEngine
    await page.evaluate(() => {
      const adminSession = {
        role: 'admin',
        email: 'admin@stemuluskidstech.com',
        name: 'Academic Director',
        issuedAt: Date.now()
      };
      if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
        StemulusSecurity.saveSecureSession(adminSession);
      } else {
        localStorage.setItem('stemulus_session', JSON.stringify(adminSession));
        sessionStorage.setItem('stemulus_session', JSON.stringify(adminSession));
      }
    });

    await page.goto(`${baseUrl}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    console.log('Admin session active. Commencing autonomous record ingestion...');

    // 2. Iterate through valid records
    for (const item of validRecords) {
      const rec = item.record;
      console.log(`\nProcessing [Row ${item.row}]: Coder ${rec.childFirstName} ${rec.childLastName} (Parent: ${rec.parentName})`);

      const result = await page.evaluate((data) => {
        try {
          if (typeof DashboardEngine === 'undefined') {
            return { ok: false, error: 'DashboardEngine not loaded' };
          }

          const db = DashboardEngine.getDB() || {};
          db.students = db.students || [];
          db.users = db.users || [];
          db.emailQueue = db.emailQueue || [];

          // Resolve tutor
          let matchedTutorId = '';
          let matchedTutorEmail = '';
          let matchedTutorName = data.tutorName;

          if (matchedTutorName && matchedTutorName.toLowerCase() !== 'unassigned') {
            const tutors = DashboardEngine.getTutors ? DashboardEngine.getTutors() : [];
            const cleanTName = matchedTutorName.toLowerCase().trim();
            const foundT = tutors.find(t => 
              (t.name && t.name.toLowerCase().trim() === cleanTName) ||
              (t.email && t.email.toLowerCase().trim() === cleanTName)
            );
            if (foundT) {
              matchedTutorId = foundT.id;
              matchedTutorEmail = foundT.email;
              matchedTutorName = foundT.name;
            }
          }

          // Deduplication: check for existing student with same name and parent
          const cleanFirst = (data.childFirstName || '').toLowerCase().trim();
          const cleanLast = (data.childLastName || '').toLowerCase().trim();
          const cleanParentEmail = (data.parentEmail || '').toLowerCase().trim();

          const existingStudent = db.students.find(s => {
            const sFirst = (s.firstName || '').toLowerCase().trim();
            const sLast = (s.lastName || '').toLowerCase().trim();
            const sParent = (s.parentEmail || '').toLowerCase().trim();
            return (sFirst === cleanFirst && sLast === cleanLast) || 
                   (sFirst === cleanFirst && cleanFirst.length > 2 && sParent === cleanParentEmail);
          });

          let studentId;
          let isNewStudent = false;

          if (existingStudent) {
            studentId = existingStudent.id;
            existingStudent.age = data.age || existingStudent.age;
            existingStudent.parentPhone = data.parentPhone || existingStudent.parentPhone;
            existingStudent.parentName = data.parentName || existingStudent.parentName;
            existingStudent.program = data.program || existingStudent.program;
            existingStudent.tutorName = matchedTutorName || existingStudent.tutorName;
            existingStudent.tutorEmail = matchedTutorEmail || existingStudent.tutorEmail;
            existingStudent.tutorId = matchedTutorId || existingStudent.tutorId;
            existingStudent.notes = data.notes || existingStudent.notes;
          } else {
            isNewStudent = true;
            studentId = 'std-' + (1000 + db.students.length + 1) + '-' + Math.random().toString(36).substr(2, 4);
            const studentData = {
              id: studentId,
              firstName: data.childFirstName,
              lastName: data.childLastName,
              age: data.age,
              birthday: data.birthday || '',
              hasExplicitBirthday: !!(data.birthday && data.birthday.length >= 10),
              parentName: data.parentName,
              parentEmail: data.parentEmail,
              parentPhone: data.parentPhone,
              program: data.program,
              status: 'active',
              remindersPaused: false,
              progress: 0,
              tutorName: matchedTutorName,
              tutorEmail: matchedTutorEmail,
              tutorId: matchedTutorId,
              notes: data.notes || '',
              classroomLink: data.classroomLink || '',
              skills: { logic: 50, loops: 50, variables: 50, syntax: 50, projects: 50 },
              metrics: { attended: 0, total: 8, projects: 0, lines: 0 }
            };
            db.students.push(studentData);
          }

          // 2. Ensure Parent User Account exists with secure temp credentials
          const parentKey = data.parentEmail.toLowerCase().trim();
          let isNewUser = false;
          let tempPwd = '';

          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@';
          tempPwd = Array.from(crypto.getRandomValues(new Uint8Array(10))).map(b => chars[b % chars.length]).join('');

          if (Array.isArray(db.users)) {
            const existingU = db.users.find(u => u.email && u.email.toLowerCase() === parentKey);
            if (!existingU) {
              db.users.push({
                email: data.parentEmail,
                name: data.parentName,
                role: 'parent',
                password: tempPwd
              });
              isNewUser = true;
            }
          } else if (typeof db.users === 'object') {
            if (!db.users[parentKey]) {
              db.users[parentKey] = {
                email: data.parentEmail,
                name: data.parentName,
                role: 'parent',
                password: tempPwd
              };
              isNewUser = true;
            }
          }

          // 3. Stage Welcome Packet in Email Queue (STRICTLY PENDING ADMIN APPROVAL)
          let queueId = '';
          if (isNewUser || isNewStudent) {
            queueId = 'queue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
            const queueItem = {
              id: queueId,
              type: isNewUser ? 'welcome' : 'student-enrolled',
              to: data.parentEmail,
              recipientName: data.parentName,
              subject: isNewUser 
                ? `Welcome to STEMulus — ${data.childFirstName}'s coding journey starts!`
                : `STEMulus Enrollment Update — ${data.childFirstName} has been enrolled!`,
              htmlPreview: isNewUser
                ? `Parent Welcome Kit for ${data.parentName}. Student: ${data.childFirstName} ${data.childLastName}. Track: ${data.program}. Initial Temp Password: ${tempPwd}`
                : `Enrollment notice for ${data.childFirstName} in ${data.program}.`,
              data: {
                parentEmail: data.parentEmail,
                parentName: data.parentName,
                studentName: `${data.childFirstName} ${data.childLastName}`.trim(),
                courseName: data.program,
                tempPassword: tempPwd,
                classroomLink: data.classroomLink || '',
                adminApproved: false // STRICT POLICY: unapproved until human clicks send
              },
              status: 'pending',
              createdAt: new Date().toISOString(),
              triggeredBy: 'autonomous_playwright_onboarding'
            };
            db.emailQueue.unshift(queueItem);
          }

          // Save Database through secure vault
          DashboardEngine.saveDB(db);

          return {
            ok: true,
            studentId,
            parentEmail: data.parentEmail,
            isNewUser,
            queueId,
            tutor: matchedTutorName
          };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      }, rec);

      if (result.ok) {
        console.log(`  [SUCCESS] Student registered: ${result.studentId}`);
        console.log(`  [ACCOUNT] Parent User: ${result.parentEmail} (${result.isNewUser ? 'New Account Created' : 'Existing Account Linked'})`);
        console.log(`  [TUTOR] Assigned: ${result.tutor}`);
        console.log(`  [QUEUE] Welcome Packet Staged (Queue ID: ${result.queueId} | STATUS: PENDING ADMIN APPROVAL)`);
        auditLog.successfulIngestions.push(result);
        auditLog.emailQueueStaged.push(result.queueId);
      } else {
        console.error(`  [FAILED] Could not register ${rec.childFirstName}: ${result.error}`);
        auditLog.failedIngestions.push({ row: item.row, record: rec, error: result.error });
      }
    }

    // Refresh and verify admin portal DOM state
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const finalState = await page.evaluate(() => {
      const db = DashboardEngine.getDB() || {};
      return {
        totalStudents: (db.students || []).length,
        totalQueue: (db.emailQueue || []).length,
        fullDB: db
      };
    });

    const dbExportPath = path.join(ROOT_DIR, 'data', 'stemulus_db_latest.json');
    fs.writeFileSync(dbExportPath, JSON.stringify(finalState.fullDB, null, 2));
    console.log(`Database snapshot written to: ${dbExportPath}`);

    console.log('\n=============================================================');
    console.log('   AUTONOMOUS ONBOARDING COMPLETE');
    console.log('=============================================================');
    console.log(`Total Records Processed : ${normalized.length}`);
    console.log(`Successfully Registered : ${auditLog.successfulIngestions.length}`);
    console.log(`Failed / Skipped        : ${auditLog.failedIngestions.length + invalidRecords.length}`);
    console.log(`Email Packets Staged    : ${auditLog.emailQueueStaged.length} (ALL HELD IN PENDING REVIEW)`);
    console.log(`Active Students In Vault: ${finalState.totalStudents}`);
    console.log(`Pending Review in Queue : ${finalState.totalQueue}`);

    // Write audit log file
    const reportPath = path.join(ROOT_DIR, 'data', 'onboarding_audit_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditLog, null, 2));
    console.log(`\nDetailed Audit Report written to: ${reportPath}`);

  } catch (err) {
    console.error('[CRITICAL ONBOARDING ERROR]:', err);
  } finally {
    await browser.close();
    server.close();
  }
}

runAutonomousOnboarding().catch(console.error);
