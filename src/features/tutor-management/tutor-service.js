/**
 * STEMulus Tutor Management & Banking Audits Feature Service (ES Module)
 * Authoritative business logic for faculty directory, tutor resolution,
 * canonical weekly timetable calculations, profile updates, account status,
 * student assignment, Nigerian NUBAN banking validation, and workstation audits.
 */

export const CORE_DEFAULT_TUTORS = [
  {
    id: "tut-101",
    name: "Sarah Jane",
    email: "tutor@stemuluskidstech.com",
    phone: "+2348011223344",
    subjects: ["Python Programming", "Scratch Creators"],
    location: "Lagos, Nigeria",
    assignmentType: "Online Remote Senior Instructor",
    status: "active"
  },
  {
    id: "tut-102",
    name: "David Okon",
    email: "david.okon@stemuluskidstech.com",
    phone: "+2348022334455",
    subjects: ["Web Development", "Robotics"],
    location: "Abuja, Nigeria",
    assignmentType: "Online Remote Lead Mentor",
    status: "active"
  },
  {
    id: "tut-103",
    name: "Olalekan Israel Ajimati",
    email: "olalekan@stemuluskidstech.com",
    altEmail: "ajimatimati@gmail.com",
    phone: "+2347052466716",
    subjects: ["Python Programming", "Full-Stack Web Development", "AI & Machine Learning"],
    location: "Lagos, Nigeria",
    assignmentType: "Online & Lead Full-Stack Specialist",
    bankName: "GTBank",
    accountHolderName: "Olalekan Israel Ajimati",
    accountNumber: "0123456789",
    workstationAudit: "High-Performance Workstation (16GB RAM, HD Cam, Fiber 50Mbps, Solar Inverter 3.5kVA)",
    weeklyAvailableSlots: "Tuesday (4pm, 7pm), Wednesday (4pm), Friday (4pm, 5pm)",
    operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant",
    digitalSignature: "Olalekan Israel Ajimati",
    status: "active"
  },
  {
    id: "tut-104-moses",
    name: "Moses Oluwafemi Adebayo",
    email: "adefemiadebayo20@gmail.com",
    phone: "07063346551",
    subjects: ["Scratch Creators", "Robotics & Micro:bit", "Python Programming"],
    location: "No 1 Asunle Bus Stop Ojoo Terminal Ibadan",
    assignmentType: "Online Only: Currently restricted to remote online sessions only.",
    bankName: "Opay",
    accountHolderName: "Moses Oluwafemi Adebayo",
    accountNumber: "7063346551",
    nextOfKinName: "Mr Adebayo Michael (Sibling)",
    nextOfKinContact: "0809 440 9716. Apo Wumba, Abuja",
    workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup",
    weeklyAvailableSlots: "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Sunday Afternoons (1:00 PM to 5:00 PM WAT)",
    operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant",
    digitalSignature: "Moses Oluwafemi Adebayo",
    onboardedAt: "2026-10-01T18:59:30.000Z",
    status: "active"
  },
  {
    id: "tut-105-kafa",
    name: "Kafayat Abdulwahab",
    email: "kafayatabdulwahab.et@gmail.com",
    phone: "08065220517",
    subjects: ["Scratch Creators", "Web Development", "Python Programming"],
    location: "Tanke, Ilorin Kwara state.",
    assignmentType: "Online Only: Currently restricted to remote online sessions only.",
    bankName: "GTBank",
    accountHolderName: "Kafayat Abdulwahab",
    accountNumber: "0141342433",
    nextOfKinName: "Kudirat Mojisola / Sister",
    nextOfKinContact: "08036580498 / Ilorin, Kwara state",
    workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup",
    weeklyAvailableSlots: "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Weekday Evenings (5:30 PM to 7:30 PM WAT), Saturday Afternoons (12:00 PM to 4:00 PM WAT)",
    operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant",
    digitalSignature: "Kafayat Abdulwahab",
    onboardedAt: "2026-10-02T09:25:11.000Z",
    status: "active"
  },
  {
    id: "tut-106-tola",
    name: "Tola Tosin Ayanleke",
    email: "tonetbod@gmail.com",
    phone: "0912 313 1969",
    subjects: ["Python Programming", "Scratch Creators"],
    location: "Ajia, Ibadan.",
    assignmentType: "Online Only: Currently restricted to remote online sessions only.",
    bankName: "UBA",
    accountHolderName: "TOLA TOSIN AYANLEKE",
    accountNumber: "2054121458",
    nextOfKinName: "Lawal Jumoke (Sister)",
    nextOfKinContact: "0816 070 2956 - Ilorin",
    workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup",
    weeklyAvailableSlots: "Saturday Mornings (9:00 AM to 12:00 PM WAT)",
    operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant",
    digitalSignature: "TOLA TOSIN AYANLEKE",
    onboardedAt: "2026-10-17T14:04:53.000Z",
    status: "active"
  },
  {
    id: "tut-107-emmanuel",
    name: "Emmanuel O.",
    email: "emmanuel@stemuluskidstech.com",
    altEmail: "oojekudo@gmail.com",
    phone: "+2348030000000",
    subjects: ["Robotics & Arduino", "Physical Computing", "Web & App Development"],
    location: "Ibadan Hub, Nigeria",
    assignmentType: "Physical (In-Person Hub & Hardware Maker Mentor)",
    bankName: "Access Bank",
    accountHolderName: "Emmanuel O.",
    accountNumber: "0987654321",
    workstationAudit: "Physical Electronics Tooling, Robotics Workstation, Hardware Toolkits",
    weeklyAvailableSlots: "Saturday (12:00 PM WAT), Sunday (5:00 PM WAT)",
    operatingStandard: "STEMulus Physical Hub Standard Compliant",
    digitalSignature: "Emmanuel O.",
    status: "active"
  }
];

/**
 * Computes deduplicated 1-week canonical recurring timetable by (studentId, dayOfWeek, time).
 * @param {object} db
 * @returns {Array}
 */
export function getCanonicalWeeklySchedules(db = {}) {
  const schedules = Array.isArray(db.schedules) ? db.schedules : [];
  const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slotMap = new Map();

  schedules.forEach(s => {
    if (!s || s.status === 'cancelled' || s.attendanceStatus === 'cancelled') return;
    if (!s.dayOfWeek && s.date && s.date < '2026-10-01') return;

    let dayName = s.dayOfWeek || '';
    if (!dayName && s.date) {
      const dObj = new Date(s.date + 'T12:00:00');
      if (!isNaN(dObj.getTime())) dayName = daysArr[dObj.getDay()];
    }
    if (!dayName) return;

    const studentKey = String(s.studentId || s.studentName || '').toLowerCase().trim();
    const dayKey = String(dayName).toLowerCase().trim();
    const timeKey = String(s.time || '').toLowerCase().trim();
    const compositeKey = `${studentKey}|${dayKey}|${timeKey}`;

    if (!slotMap.has(compositeKey)) {
      slotMap.set(compositeKey, Object.assign({}, s, { dayOfWeek: dayName }));
    }
  });

  return Array.from(slotMap.values());
}

/**
 * Resolve tutor profile from input identifier (email, altEmail, id, name, or token).
 * @param {string} tutorInput
 * @param {object} db
 * @returns {object|null}
 */
export function resolveTutorDetails(tutorInput, db = {}) {
  if (!tutorInput) return null;
  const clean = String(tutorInput).toLowerCase().trim();
  if (!clean || clean === 'unassigned') return null;

  const allTutors = getTutors(db);

  // 1. Exact email or altEmail match
  let found = allTutors.find(t => (t.email && t.email.toLowerCase().trim() === clean) || (t.altEmail && t.altEmail.toLowerCase().trim() === clean));
  if (found) return found;
  if (clean.includes('@')) return null;

  // 2. Exact ID match
  found = allTutors.find(t => t.id && t.id.toLowerCase().trim() === clean);
  if (found) return found;

  // 3. Exact name match
  found = allTutors.find(t => t.name && t.name.toLowerCase().trim() === clean);
  if (found) return found;

  // 4. Token match (all significant tokens must appear in tutor name)
  const ignoredTitles = new Set(['coach', 'mentor', 'teacher', 'tutor', 'instructor', 'prof', 'mr', 'mrs', 'ms', 'dr', 'engr']);
  const tokens = clean.split(/\s+/).filter(t => t.length > 2 && !ignoredTitles.has(t));
  if (tokens.length > 0) {
    found = allTutors.find(t => {
      const tName = (t.name || '').toLowerCase().trim();
      return tokens.every(tok => tName.includes(tok));
    });
    if (found) return found;
  }

  return null;
}

/**
 * Gather and return full list of verified tutors with weekly session counts and workload.
 * @param {object} db
 * @param {object|null} storageService
 * @returns {Array}
 */
export function getTutors(db = {}, storageService = null) {
  const tutorMap = {};
  const deletedIds = Array.isArray(db.deletedTutorIds) ? db.deletedTutorIds.map(x => String(x).toLowerCase().trim()) : [];
  const deletedEmails = Array.isArray(db.deletedTutorEmails) ? db.deletedTutorEmails.map(x => String(x).toLowerCase().trim()) : [];

  function isTutorDeleted(id, email) {
    const cleanId = id ? String(id).toLowerCase().trim() : '';
    const cleanEmail = email ? String(email).toLowerCase().trim() : '';
    if (cleanId && deletedIds.includes(cleanId)) return true;
    if (cleanEmail && deletedEmails.includes(cleanEmail)) return true;
    return false;
  }

  // 1. Load from db.tutors array
  if (Array.isArray(db.tutors)) {
    db.tutors.forEach(t => {
      if (!t || isTutorDeleted(t.id, t.email)) return;
      const key = (t.email || t.name || '').toLowerCase().trim();
      if (key) {
        tutorMap[key] = Object.assign({
          id: t.id || (`tut-${key}`),
          name: t.name || 'Tutor',
          email: t.email || '',
          phone: t.phone || '',
          subjects: t.subjects || ['General Coding'],
          bio: t.bio || '',
          availability: t.availability || {},
          status: t.status || 'active'
        }, t);
      }
    });
  }

  // 2. Load from db.users where role === 'tutor'
  const usersList = Array.isArray(db.users) ? db.users : Object.values(db.users || {});
  usersList.filter(u => u && u.role === 'tutor').forEach(u => {
    if (isTutorDeleted(u.id, u.email)) return;
    const key = (u.email || u.name || '').toLowerCase().trim();
    if (key) {
      if (!tutorMap[key]) {
        tutorMap[key] = {
          id: u.id || (`tut-${key}`),
          name: u.name || 'Tutor',
          email: u.email || '',
          phone: u.phone || '',
          subjects: u.subjects || ['General Coding'],
          status: u.status || 'active'
        };
      } else if (u.name && (!tutorMap[key].name || tutorMap[key].name === 'Tutor')) {
        tutorMap[key].name = u.name;
      }
    }
  });

  // 3. Core verified tutors guarantee
  CORE_DEFAULT_TUTORS.forEach(ct => {
    if (isTutorDeleted(ct.id, ct.email)) return;
    const key = ct.email.toLowerCase().trim();
    if (!tutorMap[key]) {
      tutorMap[key] = Object.assign({}, ct);
    } else {
      tutorMap[key] = Object.assign({}, ct, tutorMap[key]);
    }
  });

  // 4. Inferred from student tutor names
  if (Array.isArray(db.students)) {
    db.students.forEach(s => {
      if (s.tutorName && s.tutorName !== 'Unassigned') {
        if (isTutorDeleted(s.tutorId, s.tutorEmail)) return;
        const key = (s.tutorEmail || s.tutorName).toLowerCase().trim();
        if (!tutorMap[key]) {
          tutorMap[key] = {
            id: s.tutorId || (`tut-${key}`),
            name: s.tutorName,
            email: s.tutorEmail || (s.tutorName.toLowerCase().replace(/\s+/g, '') + '@stemuluskidstech.com'),
            status: 'active'
          };
        }
      }
    });
  }

  // Canonical weekly schedule calculation
  const canonicalWeeklyAll = getCanonicalWeeklySchedules(db);
  const allResolved = Object.values(tutorMap)
    .filter(t => !isTutorDeleted(t.id, t.email))
    .map(t => {
      const tEm = String(t.email || '').toLowerCase().trim();
      const tId = String(t.id || '').toLowerCase().trim();
      const tNm = String(t.name || '').toLowerCase().trim();
      const myWeekly = canonicalWeeklyAll.filter(s => {
        const sEm = String(s.tutorEmail || '').toLowerCase().trim();
        const sId = String(s.tutorId || '').toLowerCase().trim();
        const sNm = String(s.mentor || s.tutorName || '').toLowerCase().trim();
        if (tId && sId && tId === sId) return true;
        if (tEm && sEm && tEm === sEm) return true;
        if (sEm && sEm.includes('@') && tEm && sEm !== tEm) return false;
        if (tNm && sNm && tNm === sNm) return true;
        return false;
      });
      const weeklyMins = myWeekly.reduce((acc, s) => acc + (parseInt(s.duration, 10) || 60), 0);
      t.weeklySessions = myWeekly.length;
      t.weeklyHours = Math.round((weeklyMins / 60) * 10) / 10;
      return t;
    });

  let tutorsUpdated = false;
  if (!Array.isArray(db.tutors)) {
    db.tutors = allResolved;
    tutorsUpdated = true;
  } else {
    const seenEmails = new Set();
    const cleanStoredTutors = [];
    db.tutors.forEach(t => {
      if (!t || isTutorDeleted(t.id, t.email)) {
        tutorsUpdated = true;
        return;
      }
      const emKey = String(t.email || t.id || '').toLowerCase().trim();
      if (emKey && seenEmails.has(emKey)) {
        tutorsUpdated = true;
        return;
      }
      if (emKey) seenEmails.add(emKey);
      cleanStoredTutors.push(t);
    });
    if (cleanStoredTutors.length !== db.tutors.length) {
      db.tutors = cleanStoredTutors;
      tutorsUpdated = true;
    }

    allResolved.forEach(t => {
      const existsIdx = db.tutors.findIndex(existing =>
        (existing.id && t.id && existing.id === t.id) ||
        (existing.email && t.email && existing.email.toLowerCase().trim() === t.email.toLowerCase().trim())
      );
      if (existsIdx === -1) {
        db.tutors.push(t);
        tutorsUpdated = true;
      } else {
        db.tutors[existsIdx].weeklySessions = t.weeklySessions;
        db.tutors[existsIdx].weeklyHours = t.weeklyHours;
      }
    });
  }

  if (tutorsUpdated && storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  return allResolved;
}

/**
 * Update a tutor profile and sync name/phone to user collection.
 * @param {string} tutorIdOrEmail
 * @param {object} updates
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object|null}
 */
export function updateTutor(tutorIdOrEmail, updates, db = {}, storageService = null) {
  if (!Array.isArray(db.tutors)) db.tutors = [];
  const target = (tutorIdOrEmail || '').toLowerCase().trim();
  const index = db.tutors.findIndex(t => (t.id && t.id.toLowerCase() === target) || (t.email && t.email.toLowerCase().trim() === target));

  if (index !== -1) {
    db.tutors[index] = Object.assign({}, db.tutors[index], updates);

    if (updates.name || updates.phone) {
      const userKey = (db.tutors[index].email || '').toLowerCase().trim();
      if (db.users && db.users[userKey]) {
        if (updates.name) db.users[userKey].name = updates.name;
        if (updates.phone) db.users[userKey].phone = updates.phone;
      }
    }

    if (storageService && typeof storageService.save === 'function') {
      storageService.save(db);
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'tutors', action: 'update', item: db.tutors[index] } }));
    }

    return db.tutors[index];
  }

  return null;
}

/**
 * Delete a tutor, purge records, unassign from students, and mark as deleted.
 * @param {string} tutorIdOrEmail
 * @param {object} db
 * @param {object|null} storageService
 * @returns {boolean}
 */
export function deleteTutor(tutorIdOrEmail, db = {}, storageService = null) {
  const target = String(tutorIdOrEmail || '').toLowerCase().trim();
  if (!target) return false;

  db.deletedTutorIds = db.deletedTutorIds || [];
  db.deletedTutorEmails = db.deletedTutorEmails || [];

  let foundTutor = null;
  if (Array.isArray(db.tutors)) {
    foundTutor = db.tutors.find(t =>
      (t.id && String(t.id).toLowerCase().trim() === target) ||
      (t.email && String(t.email).toLowerCase().trim() === target)
    );
  }

  const tutorId = foundTutor && foundTutor.id ? String(foundTutor.id).trim() : (target.startsWith('tut-') ? target : '');
  const tutorEmail = foundTutor && foundTutor.email ? String(foundTutor.email).toLowerCase().trim() : (target.includes('@') ? target : '');
  const tutorName = foundTutor && foundTutor.name ? foundTutor.name : '';

  if (tutorId && !db.deletedTutorIds.includes(tutorId)) {
    db.deletedTutorIds.push(tutorId);
  }
  if (tutorEmail && !db.deletedTutorEmails.includes(tutorEmail)) {
    db.deletedTutorEmails.push(tutorEmail);
  }

  if (Array.isArray(db.tutors)) {
    db.tutors = db.tutors.filter(t => {
      const matchesId = t.id && (String(t.id).toLowerCase().trim() === target || (tutorId && String(t.id).trim() === tutorId));
      const matchesEmail = t.email && (String(t.email).toLowerCase().trim() === target || (tutorEmail && String(t.email).toLowerCase().trim() === tutorEmail));
      return !matchesId && !matchesEmail;
    });
  }

  if (tutorEmail) {
    if (Array.isArray(db.users)) {
      db.users = db.users.filter(u => !u || String(u.email || '').toLowerCase().trim() !== tutorEmail);
    } else if (db.users && typeof db.users === 'object') {
      delete db.users[tutorEmail];
    }
  }

  if (Array.isArray(db.students)) {
    db.students.forEach(s => {
      if (!s) return;
      const matchesAssigned = (tutorEmail && String(s.tutorEmail || '').toLowerCase().trim() === tutorEmail) ||
        (tutorId && String(s.tutorId || '').trim() === tutorId) ||
        (tutorName && String(s.tutorName || '').trim().toLowerCase() === tutorName.toLowerCase());
      if (matchesAssigned) {
        s.tutorName = 'Unassigned';
        s.tutorEmail = '';
        s.tutorId = '';
      }
    });
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'tutors', action: 'delete', id: target } }));
  }

  return true;
}

/**
 * Update tutor active or suspended status in users collection.
 * @param {string} tutorEmail
 * @param {string} status
 * @param {object} db
 * @param {object|null} storageService
 * @returns {boolean}
 */
export function updateTutorStatus(tutorEmail, status, db = {}, storageService = null) {
  const key = (tutorEmail || '').toLowerCase().trim();
  const tutor = db.users && db.users[key];
  if (!tutor) return false;

  tutor.status = status;

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  return true;
}

/**
 * Retrieve students assigned to a tutor (or all students if requester is admin).
 * @param {string|null} tutorEmail
 * @param {object} db
 * @param {object|null} currentSession
 * @returns {Array}
 */
export function getTutorStudents(tutorEmail = null, db = {}, currentSession = null) {
  const students = Array.isArray(db.students) ? db.students : [];

  if (currentSession && currentSession.role === 'admin') {
    const cleanTutorEmail = (tutorEmail || '').toLowerCase().trim();
    const adminEmail = (currentSession.email || '').toLowerCase().trim();
    if (!cleanTutorEmail || cleanTutorEmail === adminEmail || cleanTutorEmail === 'admin') {
      return students;
    }
  }

  const candidateInputs = [
    tutorEmail,
    (!tutorEmail && currentSession) ? currentSession.email : null,
    (!tutorEmail && currentSession) ? currentSession.name : null,
    (!tutorEmail && currentSession) ? (currentSession.id || currentSession.tutorId) : null
  ].filter(Boolean).map(s => String(s).toLowerCase().trim());

  if (candidateInputs.length === 0) return [];

  let matchedTutor = null;
  for (const input of candidateInputs) {
    matchedTutor = resolveTutorDetails(input, db);
    if (matchedTutor) break;
  }

  const tutorEmails = new Set();
  const tutorNames = new Set();
  const tutorIds = new Set();
  const nameTokens = new Set();

  candidateInputs.forEach(inp => {
    if (inp.includes('@')) tutorEmails.add(inp);
    else tutorNames.add(inp);
  });

  const IGNORED_NAME_TOKENS = new Set(['coach', 'mentor', 'teacher', 'tutor', 'instructor', 'prof', 'mr', 'mrs', 'ms', 'dr', 'engr']);

  if (matchedTutor) {
    if (matchedTutor.email) tutorEmails.add(matchedTutor.email.toLowerCase().trim());
    if (matchedTutor.altEmail) tutorEmails.add(matchedTutor.altEmail.toLowerCase().trim());
    if (matchedTutor.id) tutorIds.add(String(matchedTutor.id).toLowerCase().trim());
    if (matchedTutor.name) {
      tutorNames.add(matchedTutor.name.toLowerCase().trim());
      matchedTutor.name.split(/\s+/).forEach(tok => {
        const tLow = tok.toLowerCase().trim();
        if (tLow.length > 2 && !IGNORED_NAME_TOKENS.has(tLow)) {
          nameTokens.add(tLow);
        }
      });
    }
  }

  return students.filter(s => {
    if (!s) return false;
    const sTutorEmail = String(s.tutorEmail || '').toLowerCase().trim();
    const sTutorId = String(s.tutorId || '').toLowerCase().trim();
    const sTutorName = String(s.tutorName || '').toLowerCase().trim();

    if (sTutorEmail && tutorEmails.has(sTutorEmail)) return true;
    if (sTutorId && tutorIds.has(sTutorId)) return true;
    if (sTutorName && tutorNames.has(sTutorName)) return true;

    // Never match by partial name token if student has an explicit email or ID belonging to another tutor
    if (sTutorEmail && tutorEmails.size > 0 && !tutorEmails.has(sTutorEmail)) return false;
    if (sTutorId && tutorIds.size > 0 && !tutorIds.has(sTutorId)) return false;

    if (!sTutorEmail && !sTutorId && sTutorName && nameTokens.size > 0) {
      const allTokensMatch = Array.from(nameTokens).every(tok => sTutorName.includes(tok));
      if (allTokensMatch) return true;
    }
    return false;
  });
}

/**
 * Validate Nigerian NUBAN banking details.
 * @param {object} bankingData
 * @returns {object}
 */
export function validateTutorBanking(bankingData = {}) {
  const bankName = String(bankingData.bankName || '').trim();
  const accountNumber = String(bankingData.accountNumber || '').trim().replace(/[^0-9]/g, '');
  const accountHolderName = String(bankingData.accountHolderName || '').trim();

  const errors = [];
  if (!bankName) {
    errors.push('Bank name is required.');
  }

  if (!accountNumber) {
    errors.push('Account number is required.');
  } else if (accountNumber.length !== 10) {
    errors.push('Nigerian NUBAN account number must be exactly 10 digits.');
  }

  if (!accountHolderName) {
    errors.push('Account holder name is required.');
  } else if (accountHolderName.length < 3) {
    errors.push('Account holder name is too short.');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    normalized: {
      bankName: bankName,
      accountNumber: accountNumber,
      accountHolderName: accountHolderName
    }
  };
}

/**
 * Audit all faculty tutors for banking and workstation readiness.
 * @param {object} db
 * @returns {object}
 */
export function auditTutorAccounts(db = {}) {
  const tutors = getTutors(db);
  const audited = [];
  let fullyCompliantCount = 0;
  let missingBankCount = 0;
  let missingWorkstationCount = 0;

  tutors.forEach(t => {
    const bankVal = validateTutorBanking(t);
    const hasWorkstation = Boolean(t.workstationAudit && t.workstationAudit.length > 10);
    const isCompliant = bankVal.valid && hasWorkstation;

    if (isCompliant) fullyCompliantCount += 1;
    if (!bankVal.valid) missingBankCount += 1;
    if (!hasWorkstation) missingWorkstationCount += 1;

    audited.push({
      id: t.id,
      name: t.name,
      email: t.email,
      bankValid: bankVal.valid,
      bankErrors: bankVal.errors,
      workstationAudited: hasWorkstation,
      compliant: isCompliant
    });
  });

  return {
    totalTutors: tutors.length,
    fullyCompliantCount: fullyCompliantCount,
    missingBankCount: missingBankCount,
    missingWorkstationCount: missingWorkstationCount,
    complianceRate: tutors.length > 0 ? Math.round((fullyCompliantCount / tutors.length) * 100) : 0,
    tutors: audited
  };
}

/**
 * Format banking and legal dossier string for quick clipboard copy.
 * @param {object} tutor
 * @returns {string}
 */
export function formatBankDossier(tutor = {}) {
  const bank = tutor.bankName || 'Unknown Bank';
  const acc = tutor.accountNumber || 'No Account on File';
  const name = tutor.accountHolderName || tutor.name || 'Tutor';
  return `${bank} - ${acc} (${name})`;
}

export const TutorManagementService = {
  CORE_DEFAULT_TUTORS,
  getCanonicalWeeklySchedules,
  resolveTutorDetails,
  getTutors,
  updateTutor,
  deleteTutor,
  updateTutorStatus,
  getTutorStudents,
  validateTutorBanking,
  auditTutorAccounts,
  formatBankDossier
};
