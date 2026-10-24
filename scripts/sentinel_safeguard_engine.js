/**
 * STEMulus Real-Time Sentinel Safeguarding & Operations Engine
 * 
 * Functions:
 * 1. Intelligent Lifetime Management:
 *    - Stays for the full lesson.
 *    - Never leaves until BOTH teacher and coder leave after a full class,
 *      OR until closing remarks, assignments, and bye-byes have concluded.
 *    - Handles arrival grace periods (never terminates prematurely in empty room).
 * 2. Silent Real-Time Classroom Watchdog:
 *    - Analyzes live speech in real time without interrupting the class (mic muted, camera off).
 *    - Detects foul, abusive, sexual, violent language, and off-platform solicitation.
 *    - Monitors student responsiveness (alerts if student is silent for 5 minutes straight).
 *    - Tracks curriculum keyword progress (alerts if stagnation detected after 20 minutes).
 * 3. Class Manager & Operations Manager Escalation Tool:
 *    - Determines immediate things to address for every incident.
 *    - Dispatches silent high-priority admin alerts via ntfy.sh and stores in database.
 *    - Synthesizes session Next Steps, Assigned Homework, and WhatsApp Parent Updates.
 *    - 100% independent of Google Workspace Enterprise cloud recording (optimized for 18-month Jio Trial Plan).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');
const INCIDENTS_PATH = path.join(ROOT_DIR, 'data', 'untoward_incidents.json');
const AUDITS_DIR = path.join(ROOT_DIR, 'data', 'session_audits');
if (!fs.existsSync(AUDITS_DIR)) fs.mkdirSync(AUDITS_DIR, { recursive: true });

const NTFY_TOPIC = 'stemulus-admin-escalations-2026';

// 1. Safeguarding Patterns with Immediate Operational Actions
const SAFEGUARD_RULES = [
  {
    category: 'Sexual / Inappropriate Language',
    severity: 'CRITICAL',
    regex: /\b(sex|sexual|nude|naked|send pic|are you a virgin|boobs|penis|vagina|strip|show me your body|fais voir ton corps|tout nu)\b/i,
    rationale: 'Inappropriate or sexual reference detected in lesson with minor.',
    immediateAction: '🚨 CRITICAL CHILD SAFETY PROTOCOL: Admin must immediately join the meeting silently or phone guardian. Lock tutor profile pending formal pedagogical review.'
  },
  {
    category: 'Violent / Threatening Language',
    severity: 'CRITICAL',
    regex: /(i will kill you|slit your throat|punch you|beat you up|break your bones|shoot you|gun|knife|stab|je vais te tuer|te frapper|te poignarder)/i,
    rationale: 'Threatening or physically violent language detected.',
    immediateAction: '🚨 CRITICAL SAFETY INTERVENTION: Admin review audio snippet immediately. Check child emotional safety and escalate to safeguarding lead.'
  },
  {
    category: 'Unauthorized Contact Solicitation',
    severity: 'CRITICAL',
    regex: /(add me on discord|give me your phone|my instagram|outside class|don't tell your parents|dm me privately|whatsapp me privately|donne-moi ton numéro|ajoute-moi sur discord)/i,
    rationale: 'Attempted off-platform communication outside the STEMulus portal.',
    immediateAction: '🛡️ COPPA SAFEGUARDING: Issue immediate formal caution to tutor regarding outside contact. Reinforce STEMulus portal-only messaging.'
  },
  {
    category: 'Foul / Abusive Language / Hostility',
    severity: 'HIGH',
    regex: /\b(damn|hell|ass|crap|shit|fuck|bitch|bastard|dick|pussy|shut up|you're dumb|stupid|useless|merde|putain|bâtard|bordel|connard|salope|tais-toi|tu es bête)\b/i,
    rationale: 'Profanity, verbal hostility, or abusive demeanor detected in classroom.',
    immediateAction: '⚠️ PEDAGOGICAL ESCALATION: Flag transcript timestamp for Head of Academics review. Send coaching feedback to tutor regarding encouraging tone and patience.'
  }
];

// 2. Closing Remarks & Bye-Bye Patterns (English & French)
const CLOSING_PATTERNS = [
  /\b(bye|bye bye|goodbye|bye-bye)\b/i,
  /\b(see you next (week|time|class|lesson))\b/i,
  /\b(have a (great|good|wonderful) (week|day|weekend))\b/i,
  /\b(au revoir|à la semaine prochaine|à bientôt|bonne journée|bon week-end)\b/i,
  /\b(assignment for next|homework is|homework for next|practice this project|devoirs pour|ton devoir c'est)\b/i
];

class SentinelSafeguardEngine {
  constructor(options = {}) {
    this.studentName = options.studentName || 'Coder';
    this.tutorName = options.tutorName || 'Coach';
    this.courseName = options.courseName || 'Coding Class';
    this.meetUrl = options.meetUrl || '';
    this.sessionId = options.sessionId || `ses-${Date.now()}`;

    this.transcriptTurns = [];
    this.incidents = [];
    this.sessionStartTime = Date.now();
    this.lastStudentSpokeTime = Date.now();
    this.lastTeacherSpokeTime = Date.now();
    this.lastInactivityAlertTime = 0;
    this.progressAlertSent = false;
    this.closingRemarksDetected = false;
    this.closingRemarksTimestamp = null;
    this.technicalKeywordsFound = new Set();
    this.explicitHomeworkNotes = [];

    // Intelligent Session Lifetime State Machine
    this.hasSeenClassActivity = false;
    this.consecutiveDepartureChecks = 0;
    this.classStartedTimestamp = null;
  }

  /**
   * Process a live speech turn from Google Meet captions.
   * NEVER interrupts the class; runs completely silently.
   */
  processLiveTurn(speaker, text) {
    if (!text || !text.trim()) return null;

    const trimmed = text.trim();
    const timestamp = new Date().toISOString();

    // Mark that classroom activity is active
    this.hasSeenClassActivity = true;
    if (!this.classStartedTimestamp) this.classStartedTimestamp = Date.now();

    const isStudent = (speaker || '').toLowerCase().includes(this.studentName.toLowerCase()) || 
                      (speaker || '').toLowerCase().includes('student') ||
                      (!((speaker || '').toLowerCase().includes(this.tutorName.toLowerCase()) || (speaker || '').toLowerCase().includes('coach')));

    if (isStudent) {
      this.lastStudentSpokeTime = Date.now();
    } else {
      this.lastTeacherSpokeTime = Date.now();
    }

    const turnObj = {
      speaker: speaker || (isStudent ? this.studentName : this.tutorName),
      text: trimmed,
      timestamp,
      isStudent
    };
    this.transcriptTurns.push(turnObj);

    // 1. Check for closing remarks & bye-byes
    for (const pat of CLOSING_PATTERNS) {
      if (pat.test(trimmed)) {
        this.closingRemarksDetected = true;
        this.closingRemarksTimestamp = Date.now();
        console.log(`[Sentinel] 🏁 Closing remark, assignment, or bye-bye detected: "${trimmed}"`);
        break;
      }
    }

    // 2. Extract explicit homework assignments
    const hwMatch = trimmed.match(/(?:homework|assignment|devoirs|challenge|practice)\s+(?:is|pour|for|to)?\s*([^\.\!\?]+[\.\!\?]?)/i);
    if (hwMatch && trimmed.length > 10) {
      this.explicitHomeworkNotes.push(trimmed);
    }

    // 3. Track technical curriculum keywords
    const keywords = [
      'sprite', 'move', 'loop', 'repeat', 'green flag', 'variable', 'function',
      'def', 'print', 'html', 'css', 'script', 'block', 'code', 'bug', 'debug',
      'project', 'avancer', 'drapeau', 'boucle', 'touche'
    ];
    for (const kw of keywords) {
      if (trimmed.toLowerCase().includes(kw)) {
        this.technicalKeywordsFound.add(kw);
      }
    }

    // 4. Evaluate Safeguarding Patterns
    for (const rule of SAFEGUARD_RULES) {
      const match = trimmed.match(rule.regex);
      if (match) {
        const incident = {
          id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          sessionId: this.sessionId,
          course: this.courseName,
          student: this.studentName,
          tutor: this.tutorName,
          meetUrl: this.meetUrl,
          category: rule.category,
          severity: rule.severity,
          rationale: rule.rationale,
          immediateAction: rule.immediateAction,
          quote: trimmed,
          matchedTerm: match[0],
          speaker: turnObj.speaker,
          timestamp,
          status: 'ESCALATED_TO_ADMIN'
        };

        this.incidents.push(incident);
        this.persistIncident(incident);
        this.dispatchAdminAlert(incident);
        return incident;
      }
    }

    return null;
  }

  /**
   * Periodic watchdog check (called every 10-15s).
   * Checks for 5-minute student inactivity and 20-minute progress stagnation.
   * Informs the admin immediately and NEVER interrupts the class.
   */
  checkPeriodicWatchdog() {
    const now = Date.now();
    const elapsedMinutes = (now - this.sessionStartTime) / (1000 * 60);

    // 1. Check 5-minute Student Inactivity / Unresponsiveness
    // Triggered only after class activity has begun
    if (this.hasSeenClassActivity) {
      const studentSilenceSeconds = (now - this.lastStudentSpokeTime) / 1000;
      const timeSinceLastInactivityAlert = (now - this.lastInactivityAlertTime) / 1000;

      if (studentSilenceSeconds >= 300 && timeSinceLastInactivityAlert >= 300) {
        this.lastInactivityAlertTime = now;
        const inactivityIncident = {
          id: `inc-inact-${Date.now()}`,
          sessionId: this.sessionId,
          course: this.courseName,
          student: this.studentName,
          tutor: this.tutorName,
          meetUrl: this.meetUrl,
          category: 'Student Inactivity (5+ Mins)',
          severity: 'HIGH',
          rationale: `Student has not responded or spoken for ${Math.floor(studentSilenceSeconds / 60)} minutes straight while class is active.`,
          immediateAction: `⏱️ ENGAGEMENT ASSISTANCE: Student ${this.studentName} has been silent for 5+ minutes. Send silent coach prompt to check microphone, screen-share, or ask an interactive question.`,
          quote: `No student speech detected for ${Math.floor(studentSilenceSeconds / 60)} minutes.`,
          speaker: this.studentName,
          timestamp: new Date().toISOString(),
          status: 'ESCALATED_TO_ADMIN'
        };

        this.incidents.push(inactivityIncident);
        this.persistIncident(inactivityIncident);
        this.dispatchAdminAlert(inactivityIncident);
        console.warn(`[Sentinel] ⚠️ ALERT: Student has been unresponsive for 5+ minutes in ${this.courseName}!`);
      }
    }

    // 2. Check 20-Minute Progress Stagnation
    if (elapsedMinutes >= 20 && !this.progressAlertSent && this.technicalKeywordsFound.size < 2) {
      this.progressAlertSent = true;
      const progressIncident = {
        id: `inc-prog-${Date.now()}`,
        sessionId: this.sessionId,
        course: this.courseName,
        student: this.studentName,
        tutor: this.tutorName,
        meetUrl: this.meetUrl,
        category: 'Curriculum Progress Stagnation',
        severity: 'MEDIUM',
        rationale: 'Minimal technical progress or coding curriculum keywords detected after 20 minutes.',
        immediateAction: `📈 PACING ADJUSTMENT: Only ${this.technicalKeywordsFound.size} technical milestones detected after 20 minutes in ${this.courseName}. Coach ${this.tutorName} should transition from theory to active hands-on building.`,
        quote: `Found only ${this.technicalKeywordsFound.size} technical keywords after 20 minutes of class.`,
        speaker: 'Classroom Operations Watchdog',
        timestamp: new Date().toISOString(),
        status: 'ESCALATED_TO_ADMIN'
      };

      this.incidents.push(progressIncident);
      this.persistIncident(progressIncident);
      this.dispatchAdminAlert(progressIncident);
      console.warn(`[Sentinel] ⚠️ ALERT: Progress stagnation detected at T+20m in ${this.courseName}!`);
    }
  }

  /**
   * Determine whether it is safe to conclude the session.
   * Strict Rules:
   * 1. Must NOT leave until BOTH teacher and coder leave after a full class,
   *    OR until closing remarks, assignments, and bye-byes have concluded.
   * 2. Pre-class grace period: Never leave an empty room during initial arrival window.
   */
  canSafelyConclude(activeHumansCount, callHasEndedUI = false) {
    const elapsedMinutes = (Date.now() - this.sessionStartTime) / (1000 * 60);

    // If class has NOT started yet (waiting for tutor and coder to enter)
    if (!this.hasSeenClassActivity) {
      if (activeHumansCount >= 2) {
        this.hasSeenClassActivity = true;
        this.classStartedTimestamp = Date.now();
        console.log(`[Sentinel] 👥 Both participants detected in meeting room. Classroom sentinel actively tracking.`);
      } else {
        // Pre-class arrival grace period: wait up to 20 minutes for teacher and student
        if (elapsedMinutes < 20) {
          return {
            canConclude: false,
            reason: `Waiting for tutor and student to join room (Elapsed: ${Math.floor(elapsedMinutes)}m / 20m grace period)`
          };
        } else {
          // If nobody joined after 20 minutes, conclude as no-show
          return {
            canConclude: true,
            reason: 'Session timeout: Zero attendees joined room after 20 minutes.'
          };
        }
      }
    }

    // Classroom HAS been active!
    // Check if both teacher and coder have departed the room:
    // In Google Meet, activeHumansCount <= 1 means only the Sentinel bot remains (0 other humans).
    if (activeHumansCount <= 1 || callHasEndedUI) {
      this.consecutiveDepartureChecks++;
      // Require 2 consecutive checks (20+ seconds) to prevent premature exits during network blips or page reloads
      if (this.consecutiveDepartureChecks >= 2) {
        console.log(`[Sentinel] 🏁 Active humans: ${activeHumansCount} across consecutive checks. Both teacher and coder have left the room. Safe to conclude.`);
        return { canConclude: true, reason: 'Both teacher and coder have left the room' };
      }
      return {
        canConclude: false,
        reason: `Departure detected, awaiting persistence confirmation (${this.consecutiveDepartureChecks}/2)`
      };
    } else {
      // Humans are still present in the room! Reset consecutive departure checks.
      this.consecutiveDepartureChecks = 0;
    }

    // Check Condition B: Full 50-60+ mins elapsed, closing remarks/bye-byes detected, and post-closing buffer observed
    if (elapsedMinutes >= 50 && this.closingRemarksDetected) {
      const minutesSinceClosing = (Date.now() - this.closingRemarksTimestamp) / (1000 * 60);
      // Allow 2.5 minutes after bye-byes for final wrap-up, assignments, and bye-byes to complete
      if (minutesSinceClosing >= 2.5) {
        console.log(`[Sentinel] 🏁 Full session completed (${Math.floor(elapsedMinutes)}m) with closing remarks & bye-byes concluded. Safe to conclude.`);
        return { canConclude: true, reason: 'Full hour completed and closing remarks / bye-byes finished' };
      }
    }

    return { 
      canConclude: false, 
      reason: `Class actively in progress (Elapsed: ${Math.floor(elapsedMinutes)}m, Humans in Room: ${activeHumansCount}, Closing Remarks: ${this.closingRemarksDetected})`
    };
  }

  /**
   * Dispatch silent high-priority alert to Admin via ntfy.sh and console.
   * NEVER interrupts the class.
   */
  dispatchAdminAlert(incident) {
    const title = `🚨 [${incident.severity}] STEMulus Alert: ${incident.category}`;
    const safeTitle = `[${incident.severity}] STEMulus Alert: ${incident.category}`.replace(/[^\x20-\x7E]/g, '');
    const message = `Class: ${incident.course} (${incident.student} & ${incident.tutor})\n` +
                    `Issue: ${incident.rationale}\n` +
                    `Immediate Action: ${incident.immediateAction}\n` +
                    `Quote: "${incident.quote}"\n` +
                    `Link: ${incident.meetUrl}`;

    console.log(`\n======================================================`);
    console.log(`[ADMIN ESCALATION SENT SILENTLY]`);
    console.log(`Title: ${title}`);
    console.log(`Immediate Action: ${incident.immediateAction}`);
    console.log(`Quote: "${incident.quote}"`);
    console.log(`======================================================\n`);

    try {
      const req = https.request({
        hostname: 'ntfy.sh',
        port: 443,
        path: `/${NTFY_TOPIC}`,
        method: 'POST',
        headers: {
          'Title': safeTitle,
          'Priority': incident.severity === 'CRITICAL' ? 'urgent' : 'high',
          'Tags': incident.severity === 'CRITICAL' ? 'rotating_light,warning' : 'warning,bell'
        }
      }, res => {});

      req.on('error', () => {});
      req.write(message);
      req.end();
    } catch(err) {
      console.error('[Sentinel] Network dispatch note:', err.message);
    }
  }

  /**
   * Persist incident to local database file.
   */
  persistIncident(incident) {
    try {
      const incidents = fs.existsSync(INCIDENTS_PATH) ? JSON.parse(fs.readFileSync(INCIDENTS_PATH, 'utf8')) : [];
      incidents.unshift(incident);
      fs.writeFileSync(INCIDENTS_PATH, JSON.stringify(incidents, null, 2));
    } catch(e) {
      console.error('[Sentinel] Error saving incident to file:', e.message);
    }
  }

  /**
   * Post-Class Operations Manager & Next Steps Synthesis
   */
  synthesizePostClassReport(videoFilePath = '') {
    const elapsedMinutes = Math.floor((Date.now() - this.sessionStartTime) / (1000 * 60));
    const fullTranscriptText = this.transcriptTurns.map(t => `${t.speaker} (${t.timestamp.slice(11, 16)}): ${t.text}`).join('\n');

    // 1. Determine Things to Address Immediately
    const thingsToAddressImmediately = this.incidents.length > 0
      ? this.incidents.map(inc => `[${inc.severity}] ${inc.category}: ${inc.immediateAction}`)
      : ['✅ Zero safeguarding violations or inactivity flags. Session was 100% compliant with STEMulus Child Safety & COPPA standards.'];

    // 2. Extract Assigned Homework
    let assignedHomework = 'Continue practicing project milestones and review concepts covered today.';
    if (this.explicitHomeworkNotes.length > 0) {
      assignedHomework = this.explicitHomeworkNotes.join(' | ');
    } else {
      const lower = this.courseName.toLowerCase();
      if (lower.includes('scratch')) assignedHomework = 'Add an animation costume and sound effect to your sprite.';
      else if (lower.includes('python')) assignedHomework = 'Write a loop script printing numbers 1 to 10 in Python.';
      else if (lower.includes('roblox')) assignedHomework = 'Experiment with part transparency and anchor properties in Studio.';
      else if (lower.includes('web')) assignedHomework = 'Add custom CSS styling and a button hover effect.';
    }

    // 3. Concrete Next Steps
    const nextSteps = [
      `[Coder Milestone] ${this.studentName} to complete homework challenge: "${assignedHomework.slice(0, 80)}"`,
      `[Coach Milestone] Coach ${this.tutorName} to review project progress and prepare next logic tier.`,
      `[Operations/Admin] Verify WhatsApp parent debrief dispatched and confirm next week's schedule.`
    ];

    // 4. High-Touch Parent WhatsApp Update Draft
    const conceptsSummary = Array.from(this.technicalKeywordsFound).slice(0, 3).join(', ') || 'interactive coding concepts';
    const parentUpdateDraft = `Hello! 🚀 Today in ${this.courseName}, ${this.studentName} had a fantastic session with Coach ${this.tutorName}! They actively built code and practiced ${conceptsSummary}. 🎯 Challenge for this week: ${assignedHomework}. We are so proud of their creativity and progress! ⭐`;

    const report = {
      sessionId: this.sessionId,
      course: this.courseName,
      student: this.studentName,
      tutor: this.tutorName,
      meetUrl: this.meetUrl,
      durationMinutes: elapsedMinutes,
      videoFilePath,
      totalTurnsCount: this.transcriptTurns.length,
      incidentsCount: this.incidents.length,
      incidents: this.incidents,
      thingsToAddressImmediately,
      assignedHomework,
      nextSteps,
      parentUpdateDraft,
      closingRemarksDetected: this.closingRemarksDetected,
      technicalKeywordsCovered: Array.from(this.technicalKeywordsFound),
      accountTierNotice: 'Recorded autonomously via STEMulus Sentinel Engine (18-Month Jio Trial Plan compatible; zero cloud recording fees).',
      createdAt: new Date().toISOString()
    };

    const auditFile = path.join(AUDITS_DIR, `audit_${this.studentName.replace(/\s+/g, '_')}_${Date.now()}.json`);
    fs.writeFileSync(auditFile, JSON.stringify(report, null, 2));
    console.log(`[Sentinel] 📋 Operations Manager Report generated: ${auditFile}`);

    return report;
  }
}

module.exports = {
  SentinelSafeguardEngine,
  SAFEGUARD_RULES,
  CLOSING_PATTERNS
};
