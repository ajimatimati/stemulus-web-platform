/**
 * STEMulus Academy: Smart Operational Detection Engine (Admin Cockpit)
 * 
 * Continuous operational radar that monitors:
 * 1. Payment cycles & due dates (approaching, due, overdue, bridge dates)
 * 2. Birthday celebrations (students & mentors within 3-7 days or today)
 * 3. Schedule adjustments & reschedules
 * 4. Timezone shifts & Daylight Saving Time (DST) divergences (UK/US/Canada vs WAT UTC+1)
 * 
 * STRICT ZERO-AUTONOMOUS DISPATCH POLICY:
 * - NEVER autonomously sends emails or in-app popups directly to parents or tutors.
 * - Staged exclusively into db.emailQueue with status: 'pending' for Admin review and manual dispatch.
 * - Pushes real-time alerts to the Admin via NTFY (stemulus-admin-alerts).
 * - Adheres strictly to the Director Voice (zero em-dashes, Segoe UI typography, verified accounts).
 */

(function (window) {
  'use strict';

  var STORAGE_LOG_KEY = 'stemulus_smart_alerts_log';
  var ADMIN_NTFY_TOPIC = 'stemulus-admin-alerts';
  var OFFICIAL_NGN_ACCOUNT = {
    bank: 'Wema Bank Nigeria',
    accountName: 'STEMulus innovation Limited',
    accountNumber: '0128062292',
    usdDomAccount: '0622219817'
  };
  var VERIFIED_CONTACTS = {
    phone: '+234 906 752 1562',
    whatsapp: '+234 705 246 6716',
    email: 'admissions@stemuluskidstech.com',
    portalUrl: 'https://stemuluskidstech.com/admin-dashboard.html#email-queue'
  };

  // Standard domestic tuition rates (NGN)
  var DOMESTIC_RATES = {
    beginner: { fee: 48000, label: 'Beginners Coding Foundations (Ages 5-9)' },
    intermediate: { fee: 75000, label: 'Intermediate Young Engineers (Ages 10-13)' },
    advanced: { fee: 120000, label: 'Advanced Pre-University Robotics & AI (Ages 14-18)' }
  };

  var AdminSmartDetector = {
    isScanning: false,
    lastScanAt: null,
    scanStats: { payment: 0, birthday: 0, schedule: 0, timezone: 0 },

    init: function () {
      console.log('[AdminSmartDetector] Initializing Smart Operational Radar...');
      this.renderControlsBadge();
      // Run an initial scan 1.5 seconds after load to ensure DB is fully mounted
      setTimeout(() => {
        AdminSmartDetector.scanAll(false);
      }, 1500);

      // Listen for database updates or manual trigger requests
      window.addEventListener('stemulus_run_smart_scan', function () {
        AdminSmartDetector.scanAll(true);
      });
    },

    // ─── Deduplication Guard ──────────────────────────────────────────────
    getAlertsLog: function () {
      try {
        var raw = localStorage.getItem(STORAGE_LOG_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    },

    saveAlertsLog: function (log) {
      try {
        localStorage.setItem(STORAGE_LOG_KEY, JSON.stringify(log));
      } catch (e) {
        console.warn('[AdminSmartDetector] Unable to persist alerts log:', e.message);
      }
    },

    isEventLogged: function (key, maxAgeHours) {
      maxAgeHours = maxAgeHours || 72; // default 3-day quiet window per event key
      var log = this.getAlertsLog();
      var timestamp = log[key];
      if (!timestamp) return false;
      var ageMs = Date.now() - new Date(timestamp).getTime();
      return ageMs < (maxAgeHours * 60 * 60 * 1000);
    },

    markEventLogged: function (key) {
      var log = this.getAlertsLog();
      log[key] = new Date().toISOString();
      this.saveAlertsLog(log);
    },

    clearAlertsLog: function () {
      try {
        localStorage.removeItem(STORAGE_LOG_KEY);
        console.log('[AdminSmartDetector] Alert log cleared.');
      } catch (e) {}
    },

    // ─── NTFY Push Dispatcher ────────────────────────────────────────────
    sendAdminNtfy: async function (title, message, priority, tags, click) {
      priority = priority || 'high';
      tags = tags || 'bell';
      click = click || VERIFIED_CONTACTS.portalUrl;

      // 1. Try Netlify notify function proxy
      try {
        var resp = await fetch('/.netlify/functions/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'admin',
            title: title,
            message: message,
            priority: priority,
            tags: tags,
            click: click
          })
        });
        if (resp.ok) return { ok: true, via: 'netlify' };
      } catch (e) {}

      // 2. Direct anonymous fallback to ntfy.sh
      try {
        var cleanTitle = String(title || '').replace(/[^\x20-\x7E]/g, ' ').trim();
        await fetch('https://ntfy.sh/' + ADMIN_NTFY_TOPIC, {
          method: 'POST',
          headers: {
            'Title': cleanTitle,
            'Priority': priority,
            'Tags': tags,
            'Click': click
          },
          body: message
        });
        return { ok: true, via: 'ntfy_direct' };
      } catch (err) {
        console.warn('[AdminSmartDetector] NTFY push warning:', err.message);
        return { ok: false, error: err.message };
      }
    },

    // ─── Email Queue Staging (Strict Zero-Autonomous Policy) ─────────────
    stageQueuedEmail: function (item) {
      var db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
      if (!db) return false;

      db.emailQueue = db.emailQueue || [];

      // Check if an identical draft is already pending
      var exists = db.emailQueue.some(function (q) {
        return q.status === 'pending' && (
          q.id === item.id ||
          (q.type === item.type && q.to === item.to && q.subject === item.subject)
        );
      });

      if (exists) {
        console.log('[AdminSmartDetector] Duplicate queue draft skipped:', item.subject);
        return false;
      }

      // Ensure proper attributes
      item.status = 'pending'; // MUST ALWAYS BE PENDING
      item.source = 'smart_detector';
      item.createdAt = item.createdAt || new Date().toISOString();

      db.emailQueue.unshift(item);

      if (DashboardEngine.saveDB) {
        DashboardEngine.saveDB(db);
      }

      // Dispatch event to refresh email queue counter and UI
      window.dispatchEvent(new CustomEvent('stemulusDbUpdated'));
      if (typeof window.loadEmailQueue === 'function') {
        window.loadEmailQueue();
      }
      return true;
    },

    // ─── Master Scan Runner ──────────────────────────────────────────────
    scanAll: async function (isManualTrigger) {
      if (this.isScanning) return;
      this.isScanning = true;
      this.updateStatusBadge('Scanning...', 'amber');

      var results = { payment: 0, birthday: 0, schedule: 0, timezone: 0 };

      try {
        var pCount = await this.scanPaymentCycles();
        var bCount = await this.scanBirthdayCelebrations();
        var sCount = await this.scanScheduleAdjustments();
        var tCount = await this.scanTimezoneShifts();

        results.payment = pCount;
        results.birthday = bCount;
        results.schedule = sCount;
        results.timezone = tCount;

        this.scanStats = results;
        this.lastScanAt = new Date();

        var totalEvents = pCount + bCount + sCount + tCount;
        var msg = totalEvents > 0
          ? 'Radar detected ' + totalEvents + ' operational event(s): ' + pCount + ' billing, ' + bCount + ' birthday, ' + sCount + ' schedule, ' + tCount + ' timezone.'
          : 'Operational Radar scan completed. All systems synchronized and up-to-date.';

        if (isManualTrigger && typeof showToast === 'function') {
          showToast(msg, totalEvents > 0 ? 'info' : 'success');
        }

        this.updateStatusBadge('Active (Last: ' + this.formatTimeShort(this.lastScanAt) + ')', 'emerald');
      } catch (err) {
        console.error('[AdminSmartDetector] Master scan error:', err);
        this.updateStatusBadge('Scan Error', 'red');
      } finally {
        this.isScanning = false;
      }

      return results;
    },

    // ─── 1. Payment Cycles Scanner ───────────────────────────────────────
    scanPaymentCycles: async function () {
      var db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
      if (!db) return 0;

      var students = (typeof DashboardEngine.getStudents === 'function') ? DashboardEngine.getStudents() : (db.students || []);
      var queuedCount = 0;
      var today = new Date();
      today.setHours(0, 0, 0, 0);

      // Excluded students per executive instructions
      var excludedNames = ['david djoka', 'junayd', 'king myles'];

      for (var i = 0; i < students.length; i++) {
        var s = students[i];
        if (!s) continue;

        var sName = ((s.firstName || '') + ' ' + (s.lastName || '')).trim().toLowerCase();
        if (excludedNames.some(name => sName.includes(name))) {
          continue;
        }

        // Joshua Ogba has paid for the rest of the year (through 2026-12-31)
        if (s.id === 'std-1013-jogb' || sName.includes('joshua ogba') || (s.billing && s.billing.paidThrough && new Date(s.billing.paidThrough) > today)) {
          continue;
        }

        var billing = s.billing || {};
        var parentEmail = s.parentEmail || (s.parent && s.parent.email) || '';
        var parentName = s.parentName || (s.parent && s.parent.name) || 'Parent';
        var studentDisplayName = ((s.firstName || '') + ' ' + (s.lastName || '')).trim() || s.name || 'Student';

        // Check Pearl Babalola Special Case (Intermediate Young Engineers, Age 13: ₦75,000/mo)
        var isPearl = s.id === 'std-1007-r4cv' || sName.includes('pearl');
        if (isPearl) {
          var pearlKey = 'billing_pearl_realignment_oct_nov_2026';
          if (!this.isEventLogged(pearlKey, 120)) {
            var pearlTitle = 'Tuition Cycle Realignment: Babalola Oluwadunmininu Pearl';
            var pearlMsg = 'Pearl Babalola (Intermediate - Age 13, ₦75k/mo) has an uncollected October bridge (₦37,500) and November renewal (₦75,000). Total realignment: ₦112,500. Invoice drafted in Email Queue.';

            await this.sendAdminNtfy(pearlTitle, pearlMsg, 'high', 'moneybag,calendar');

            var pearlDraft = {
              id: 'smart-bill-pearl-' + Date.now(),
              type: 'billing',
              category: 'billing',
              to: parentEmail || 'adewale.babalola@yahoo.com',
              recipientName: parentName || 'Mr. & Mrs. Babalola',
              studentId: s.id,
              studentName: studentDisplayName,
              subject: 'STEMulus Academy Tuition & Month-End Cycle Realignment: Pearl Babalola (Intermediate Package)',
              htmlPreview: this.buildPearlInvoiceHTML(studentDisplayName, parentName),
              priority: 'high',
              triggeredBy: 'Smart Operational Radar (Tuition Realignment)'
            };

            if (this.stageQueuedEmail(pearlDraft)) {
              this.markEventLogged(pearlKey);
              queuedCount++;
            }
          }
          continue;
        }

        // Check Gbolade Okesanjo (Physical Sessions, Due Nov 4, 2026)
        var isGbolade = sName.includes('gbolade') || sName.includes('okesanjo');
        if (isGbolade) {
          var gDueDate = new Date('2026-11-04');
          var gDiffDays = Math.ceil((gDueDate - today) / (1000 * 60 * 60 * 24));
          var gKey = 'billing_gbolade_nov4_2026';

          if (gDiffDays <= 10 && !this.isEventLogged(gKey, 96)) {
            var gTitle = 'Tuition Cycle Reminder: Gbolade Okesanjo';
            var gMsg = 'Gbolade Okesanjo physical sessions payment cycle is due on November 4th, 2026 (' + gDiffDays + ' days remaining). Renewal invoice drafted in Email Queue.';

            await this.sendAdminNtfy(gTitle, gMsg, 'default', 'moneybag,calendar');

            var gDraft = {
              id: 'smart-bill-gbolade-' + Date.now(),
              type: 'billing',
              category: 'billing',
              to: parentEmail || 'okesanjogbolade@gmail.com',
              recipientName: parentName || 'Mr. & Mrs. Okesanjo',
              studentId: s.id,
              studentName: studentDisplayName,
              subject: 'STEMulus Academy Physical Sessions Tuition Renewal: Gbolade Okesanjo (Due Nov 4)',
              htmlPreview: this.buildStandardInvoiceHTML({
                studentName: studentDisplayName,
                parentName: parentName,
                packageName: 'Physical STEM & Robotics Lab',
                feeFormatted: '₦48,000',
                dueDateFormatted: 'November 4, 2026',
                notes: 'Physical on-site laboratory session cycle renewal.'
              }),
              priority: 'normal',
              triggeredBy: 'Smart Operational Radar (Payment Cycle)'
            };

            if (this.stageQueuedEmail(gDraft)) {
              this.markEventLogged(gKey);
              queuedCount++;
            }
          }
          continue;
        }

        // Standard Cycle Check for other students
        var nextDueStr = billing.nextDueDate || billing.dueDate || '';
        if (!nextDueStr && billing.anchorDay) {
          var yr = today.getFullYear();
          var mo = today.getMonth();
          var candidate = new Date(yr, mo, billing.anchorDay);
          if (candidate < today) {
            candidate = new Date(yr, mo + 1, billing.anchorDay);
          }
          nextDueStr = candidate.toISOString().split('T')[0];
        }

        if (nextDueStr) {
          var dueDate = new Date(nextDueStr);
          var diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

          // Trigger if due in next 4 days, due today, or overdue within 14 days
          if (diffDays <= 4 && diffDays >= -14) {
            var tierKey = (s.tier || 'beginner').toLowerCase();
            var rateInfo = DOMESTIC_RATES[tierKey] || DOMESTIC_RATES.beginner;
            var feeFormatted = '₦' + (billing.monthlyFee || rateInfo.fee).toLocaleString();
            var eventKey = 'billing_std_' + s.id + '_' + nextDueStr;

            if (!this.isEventLogged(eventKey, 72)) {
              var dueText = diffDays === 0 ? 'Today' : diffDays > 0 ? 'in ' + diffDays + ' days (' + nextDueStr + ')' : Math.abs(diffDays) + ' days overdue';
              var title = 'Tuition Cycle Notice: ' + studentDisplayName;
              var msg = studentDisplayName + ' (' + rateInfo.label + ' - ' + feeFormatted + ') tuition cycle is ' + dueText + '. Renewal notice drafted in Email Queue for manual review.';

              await this.sendAdminNtfy(title, msg, diffDays <= 0 ? 'urgent' : 'high', 'moneybag,calendar');

              var draft = {
                id: 'smart-bill-' + s.id + '-' + Date.now(),
                type: 'billing',
                category: 'billing',
                to: parentEmail || 'parent@stemuluskidstech.com',
                recipientName: parentName,
                studentId: s.id,
                studentName: studentDisplayName,
                subject: 'STEMulus Academy Tuition Renewal: ' + studentDisplayName + ' (' + rateInfo.label + ')',
                htmlPreview: this.buildStandardInvoiceHTML({
                  studentName: studentDisplayName,
                  parentName: parentName,
                  packageName: rateInfo.label,
                  feeFormatted: feeFormatted,
                  dueDateFormatted: nextDueStr,
                  notes: 'Monthly 1-on-1 private coding & robotics mentorship cycle.'
                }),
                priority: diffDays <= 0 ? 'high' : 'normal',
                triggeredBy: 'Smart Operational Radar (Payment Cycle)'
              };

              if (this.stageQueuedEmail(draft)) {
                this.markEventLogged(eventKey);
                queuedCount++;
              }
            }
          }
        }
      }

      return queuedCount;
    },

    // ─── 2. Birthday Scanner ─────────────────────────────────────────────
    scanBirthdayCelebrations: async function () {
      var db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
      if (!db) return 0;

      var students = (typeof DashboardEngine.getStudents === 'function') ? DashboardEngine.getStudents() : (db.students || []);
      var mentors = (typeof DashboardEngine.getMentors === 'function') ? DashboardEngine.getMentors() : (db.mentors || []);
      var queuedCount = 0;
      var today = new Date();
      var currentYear = today.getFullYear();

      var roster = [];
      students.forEach(s => {
        if (s) roster.push({ ...s, role: 'student' });
      });
      mentors.forEach(m => {
        if (m) roster.push({ ...m, role: 'mentor' });
      });

      for (var i = 0; i < roster.length; i++) {
        var person = roster[i];
        var dobStr = person.dateOfBirth || person.birthday || person.dob || '';
        if (!dobStr) continue;

        var bDate = new Date(dobStr);
        if (isNaN(bDate.getTime())) continue;

        var bMonth = bDate.getMonth();
        var bDay = bDate.getDate();

        // Target birthday celebration in the current year
        var targetBday = new Date(currentYear, bMonth, bDay);
        // If birthday has passed by more than 2 days this year, evaluate next year
        var diffMs = targetBday - today;
        var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Detect if birthday is within the upcoming 7 days or today (0 to 7)
        if (diffDays >= 0 && diffDays <= 7) {
          var personName = ((person.firstName || '') + ' ' + (person.lastName || '')).trim() || person.name || 'Innovator';
          var roleTitle = person.role === 'mentor' ? 'Mentor / Faculty Member' : 'Student Coder';
          var bdayKey = 'bday_' + (person.id || person.email) + '_' + currentYear + '_' + (bMonth + 1) + '_' + bDay;

          if (!this.isEventLogged(bdayKey, 168)) { // log quiet window 7 days
            var whenText = diffDays === 0 ? 'Today!' : 'in ' + diffDays + ' day(s) (' + targetBday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ')';
            var title = 'Upcoming Birthday: ' + personName;
            var msg = personName + ' (' + roleTitle + ') celebrates their birthday ' + whenText + '. Warm Director birthday greeting staged in Email Queue for manual review.';

            await this.sendAdminNtfy(title, msg, 'default', 'birthday,tada,gift');

            var targetEmail = person.role === 'mentor' ? person.email : (person.parentEmail || (person.parent && person.parent.email) || person.email || '');
            var recipientName = person.role === 'mentor' ? personName : (person.parentName || personName);

            var draft = {
              id: 'smart-bday-' + (person.id || 'usr') + '-' + Date.now(),
              type: 'birthday',
              category: 'birthday',
              to: targetEmail,
              recipientName: recipientName,
              subject: 'Happy Birthday from the STEMulus Academy Family, ' + personName + '!',
              htmlPreview: this.buildBirthdayGreetingHTML(personName, person.role, targetBday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })),
              priority: 'normal',
              triggeredBy: 'Smart Operational Radar (Birthday Milestone)'
            };

            if (this.stageQueuedEmail(draft)) {
              this.markEventLogged(bdayKey);
              queuedCount++;
            }
          }
        }
      }

      return queuedCount;
    },

    // ─── 3. Schedule Adjustments Scanner ─────────────────────────────────
    scanScheduleAdjustments: async function () {
      var db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
      if (!db) return 0;

      var queuedCount = 0;
      var scheduleRequests = db.scheduleRequests || db.reschedules || [];

      for (var i = 0; i < scheduleRequests.length; i++) {
        var req = scheduleRequests[i];
        if (!req || req.notifiedToQueue) continue;

        var reqKey = 'sched_adj_' + (req.id || ('req_' + i)) + '_' + (req.requestedDate || req.date) + '_' + (req.requestedTime || req.time);

        if (!this.isEventLogged(reqKey, 72)) {
          var studentName = req.studentName || 'Student';
          var tutorName = req.tutorName || req.mentor || 'Mentor';
          var newDate = req.requestedDate || req.date || 'Upcoming Date';
          var newTime = req.requestedTime || req.time || 'Scheduled Time';

          var title = 'Schedule Adjustment: ' + studentName;
          var msg = 'Schedule change recorded for ' + studentName + ' with ' + tutorName + ' on ' + newDate + ' at ' + newTime + ' WAT. Notification email drafted in Email Queue.';

          await this.sendAdminNtfy(title, msg, 'high', 'calendar,arrows_counterclockwise');

          var draft = {
            id: 'smart-sched-' + (req.id || Date.now()),
            type: 'schedule',
            category: 'schedule',
            to: req.parentEmail || 'parent@stemuluskidstech.com',
            recipientName: req.parentName || 'Parent',
            subject: 'STEMulus Session Schedule Update: ' + studentName + ' (' + (req.course || 'Coding Session') + ')',
            htmlPreview: this.buildScheduleAdjustmentHTML({
              studentName: studentName,
              parentName: req.parentName || 'Parent',
              tutorName: tutorName,
              course: req.course || 'Private Mentorship Track',
              date: newDate,
              time: newTime,
              meetLink: req.meetLink || req.classroomLink || 'https://meet.google.com/yre-naci-zmp'
            }),
            priority: 'high',
            triggeredBy: 'Smart Operational Radar (Schedule Adjustment)'
          };

          if (this.stageQueuedEmail(draft)) {
            this.markEventLogged(reqKey);
            queuedCount++;
          }
        }
      }

      return queuedCount;
    },

    // ─── 4. Timezone Shifts Scanner (Daylight Saving Time) ───────────────
    scanTimezoneShifts: async function () {
      var db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
      if (!db) return 0;

      var students = (typeof DashboardEngine.getStudents === 'function') ? DashboardEngine.getStudents() : (db.students || []);
      var queuedCount = 0;
      var now = new Date();
      var month = now.getMonth(); // 9 = Oct, 10 = Nov
      var day = now.getDate();

      // DST transition window: late October through early November
      // In UK: BST to GMT occurs last Sunday in October (around Oct 25-31).
      // In US/Canada: EDT to EST occurs first Sunday in November (around Nov 1-7).
      var isDstTransitionPeriod = (month === 9 && day >= 20) || (month === 10 && day <= 15);

      if (!isDstTransitionPeriod) {
        return 0; // outside transition window
      }

      for (var i = 0; i < students.length; i++) {
        var s = students[i];
        if (!s) continue;

        var isInternational = s.international || s.isDiaspora || (s.country && s.country !== 'Nigeria') || (s.timezone && !s.timezone.includes('Lagos'));
        // Also check student notes or course for UK/US/Canada indicators
        var notes = ((s.notes || '') + ' ' + (s.billing ? s.billing.notes || '' : '')).toLowerCase();
        if (notes.includes('uk') || notes.includes('london') || notes.includes('diaspora') || notes.includes('us') || notes.includes('canada')) {
          isInternational = true;
        }

        if (isInternational) {
          var studentName = ((s.firstName || '') + ' ' + (s.lastName || '')).trim() || s.name || 'Student';
          var targetTz = s.timezone || (notes.includes('us') ? 'America/New_York' : 'Europe/London');
          var regionName = targetTz.includes('London') ? 'United Kingdom (GMT)' : targetTz.includes('New_York') ? 'United States Eastern (EST)' : 'International';
          var tzKey = 'tz_dst_' + s.id + '_' + now.getFullYear() + '_autumn';

          if (!this.isEventLogged(tzKey, 240)) { // quiet window 10 days
            var title = 'Daylight Saving Shift Notice: ' + studentName + ' (' + regionName + ')';
            var msg = 'Clocks in ' + regionName + ' have shifted for autumn winter. ' + studentName + '\'s lesson time diverges by 1 hour against Nigeria WAT. Timezone advisory drafted in Email Queue.';

            await this.sendAdminNtfy(title, msg, 'high', 'globe_with_meridians,clock1');

            var draft = {
              id: 'smart-tz-' + s.id + '-' + Date.now(),
              type: 'timezone',
              category: 'timezone',
              to: s.parentEmail || (s.parent && s.parent.email) || 'parent@stemuluskidstech.com',
              recipientName: s.parentName || 'Parent',
              subject: 'Important Timezone Advisory: ' + studentName + '\'s STEMulus Coding Sessions',
              htmlPreview: this.buildTimezoneAdvisoryHTML({
                studentName: studentName,
                parentName: s.parentName || 'Parent',
                region: regionName,
                tutorName: s.mentor || s.tutorName || 'Senior Mentor'
              }),
              priority: 'high',
              triggeredBy: 'Smart Operational Radar (Timezone Shift)'
            };

            if (this.stageQueuedEmail(draft)) {
              this.markEventLogged(tzKey);
              queuedCount++;
            }
          }
        }
      }

      return queuedCount;
    },

    // ─── UI Helper: Control Badge & Manual Scan Button ────────────────────
    renderControlsBadge: function () {
      var queueBulkBar = document.getElementById('email-queue-bulk-bar');
      if (!queueBulkBar) return;

      var existingMount = document.getElementById('smart-detector-toolbar-card');
      if (existingMount) return;

      var card = document.createElement('div');
      card.id = 'smart-detector-toolbar-card';
      card.className = 'bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-2xl shadow-sm border border-slate-700/60 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4';

      card.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-orange-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-sm text-slate-100">Smart Operational Radar</h4>
              <span id="smart-detector-status-pill" class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active</span>
            </div>
            <p class="text-xs text-slate-300 mt-0.5">Autonomous monitoring for payment cycles, birthdays, schedule shifts, and daylight saving changes. Pre-fills emails in queue for manual dispatch.</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" onclick="AdminSmartDetector.scanAll(true)" class="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Scan Operational Events</span>
          </button>
        </div>
      `;

      queueBulkBar.parentNode.insertBefore(card, queueBulkBar);
    },

    updateStatusBadge: function (text, color) {
      var pill = document.getElementById('smart-detector-status-pill');
      if (!pill) return;
      pill.textContent = text;
      if (color === 'emerald') {
        pill.className = 'text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      } else if (color === 'amber') {
        pill.className = 'text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse';
      } else if (color === 'red') {
        pill.className = 'text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30';
      }
    },

    formatTimeShort: function (date) {
      if (!date) return '';
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    },

    // ─── 5. Executive Email HTML Builders (Director Voice) ───────────────

    // Pearl Babalola Realignment Invoice HTML
    buildPearlInvoiceHTML: function (studentName, parentName) {
      return `
        <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,sans-serif;max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <div style="background:#0F172A;padding:28px 32px;border-bottom:4px solid #F4600C;">
            <p style="color:#F4600C;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 6px 0;">Official Tuition Statement & Realignment</p>
            <h2 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;line-height:1.3;">STEMulus Academy of Young Engineers</h2>
          </div>
          <div style="padding:32px;">
            <p style="font-size:15px;color:#1E293B;line-height:1.6;margin:0 0 16px 0;">Dear <strong>${parentName || 'Mr. & Mrs. Babalola'}</strong>,</p>
            <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px 0;">
              We want to celebrate Pearl's exceptional growth in the Academy. She has advanced into our <strong>Intermediate Young Engineers Package</strong> (Age 13), currently maintaining a stellar 27 sessions and earning her prestigious Fire Progression Master honors.
            </p>
            <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 24px 0;">
              In accordance with our standardized domestic tuition framework and month-end operational calendar, here is the transparent breakdown of her tuition realignment:
            </p>

            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:24px;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <tr>
                  <td style="padding:8px 0;color:#64748B;font-weight:600;">Student:</td>
                  <td style="padding:8px 0;color:#0F172A;font-weight:700;text-align:right;">${studentName} (Age 13)</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748B;font-weight:600;">Tier / Track:</td>
                  <td style="padding:8px 0;color:#0F172A;font-weight:700;text-align:right;">Intermediate Young Engineers (₦75,000 / month)</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748B;font-weight:600;border-top:1px solid #E2E8F0;">October Bridge (Oct 19 to Oct 31, 4 sessions):</td>
                  <td style="padding:8px 0;color:#0F172A;font-weight:700;text-align:right;border-top:1px solid #E2E8F0;">₦37,500</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748B;font-weight:600;">Full November Cycle (Nov 1 to Nov 30, 8 sessions):</td>
                  <td style="padding:8px 0;color:#0F172A;font-weight:700;text-align:right;">₦75,000</td>
                </tr>
                <tr>
                  <td style="padding:12px 0 4px 0;color:#0F172A;font-weight:800;font-size:15px;border-top:2px solid #CBD5E1;">Total Realignment Amount:</td>
                  <td style="padding:12px 0 4px 0;color:#0F172A;font-weight:800;font-size:16px;text-align:right;border-top:2px solid #CBD5E1;">₦112,500</td>
                </tr>
              </table>
              <p style="font-size:11px;color:#64748B;margin:12px 0 0 0;line-height:1.5;">
                <em>Note: If you prefer, the October bridge (₦37,500) can be settled immediately, and the November cycle (₦75,000) settled on November 1st.</em>
              </p>
            </div>

            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:20px;margin-bottom:24px;">
              <h4 style="margin:0 0 12px 0;color:#1E40AF;font-size:14px;font-weight:800;">Official STEMulus Bank Accounts</h4>
              <p style="margin:4px 0;font-size:13px;color:#1E3A8A;"><strong>Bank:</strong> ${OFFICIAL_NGN_ACCOUNT.bank}</p>
              <p style="margin:4px 0;font-size:13px;color:#1E3A8A;"><strong>Account Name:</strong> ${OFFICIAL_NGN_ACCOUNT.accountName}</p>
              <p style="margin:4px 0;font-size:14px;color:#1E3A8A;"><strong>Account Number (NGN):</strong> <span style="font-family:monospace;font-weight:700;background:#DBEAFE;padding:2px 6px;border-radius:4px;">${OFFICIAL_NGN_ACCOUNT.accountNumber}</span></p>
              <p style="margin:4px 0;font-size:13px;color:#1E3A8A;"><strong>USD DOM Account:</strong> <span style="font-family:monospace;font-weight:700;">${OFFICIAL_NGN_ACCOUNT.usdDomAccount}</span></p>
            </div>

            <p style="font-size:13px;color:#64748B;line-height:1.6;margin:0 0 20px 0;">
              Once your transfer is complete, please share a screenshot or payment receipt via our direct WhatsApp line at <strong>${VERIFIED_CONTACTS.whatsapp}</strong> or reply directly to this email so our finance office can generate your official digital receipt.
            </p>

            <p style="font-size:14px;color:#1E293B;margin:0;line-height:1.6;">
              Warm regards,<br>
              <strong>Office of the Director</strong><br>
              <span style="font-size:12px;color:#64748B;">STEMulus Academy of Young Innovators &middot; Direct: ${VERIFIED_CONTACTS.phone}</span>
            </p>
          </div>
          <div style="background:#F8FAFC;padding:16px 32px;border-top:1px solid #E2E8F0;text-align:center;">
            <p style="margin:0;font-size:11px;color:#94A3B8;">STEMulus Kids Technologies Ltd &middot; Official Academy Notice &middot; Confidential</p>
          </div>
        </div>
      `;
    },

    // Standard Tuition Invoice HTML
    buildStandardInvoiceHTML: function (data) {
      return `
        <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <div style="background:#0F172A;padding:24px 28px;border-bottom:4px solid #F4600C;">
            <p style="color:#F4600C;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 4px 0;">Tuition Renewal Notice</p>
            <h2 style="color:#ffffff;font-size:20px;font-weight:800;margin:0;">STEMulus Academy of Young Engineers</h2>
          </div>
          <div style="padding:28px;">
            <p style="font-size:15px;color:#1E293B;margin:0 0 16px 0;">Dear <strong>${data.parentName || 'Parent'}</strong>,</p>
            <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px 0;">
              This is a courteous reminder that <strong>${data.studentName}</strong>'s monthly learning cycle for the <strong>${data.packageName}</strong> is scheduled for renewal.
            </p>

            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px;margin-bottom:20px;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <tr>
                  <td style="padding:6px 0;color:#64748B;">Student:</td>
                  <td style="padding:6px 0;color:#0F172A;font-weight:700;text-align:right;">${data.studentName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748B;">Program:</td>
                  <td style="padding:6px 0;color:#0F172A;font-weight:700;text-align:right;">${data.packageName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748B;">Due Date:</td>
                  <td style="padding:6px 0;color:#0F172A;font-weight:700;text-align:right;">${data.dueDateFormatted}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0 2px 0;color:#0F172A;font-weight:800;font-size:15px;border-top:1px solid #CBD5E1;">Tuition Fee:</td>
                  <td style="padding:10px 0 2px 0;color:#0F172A;font-weight:800;font-size:16px;text-align:right;border-top:1px solid #CBD5E1;">${data.feeFormatted}</td>
                </tr>
              </table>
              ${data.notes ? `<p style="font-size:11px;color:#64748B;margin:8px 0 0 0;"><em>${data.notes}</em></p>` : ''}
            </div>

            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:18px;margin-bottom:20px;">
              <h4 style="margin:0 0 8px 0;color:#1E40AF;font-size:13px;font-weight:800;">Official STEMulus Bank Accounts</h4>
              <p style="margin:3px 0;font-size:13px;color:#1E3A8A;"><strong>Bank:</strong> ${OFFICIAL_NGN_ACCOUNT.bank}</p>
              <p style="margin:3px 0;font-size:13px;color:#1E3A8A;"><strong>Account Name:</strong> ${OFFICIAL_NGN_ACCOUNT.accountName}</p>
              <p style="margin:3px 0;font-size:14px;color:#1E3A8A;"><strong>Account Number (NGN):</strong> <span style="font-family:monospace;font-weight:700;">${OFFICIAL_NGN_ACCOUNT.accountNumber}</span></p>
              <p style="margin:3px 0;font-size:13px;color:#1E3A8A;"><strong>USD DOM Account:</strong> <span style="font-family:monospace;font-weight:700;">${OFFICIAL_NGN_ACCOUNT.usdDomAccount}</span></p>
            </div>

            <p style="font-size:13px;color:#64748B;margin:0 0 20px 0;">
              Please forward proof of payment via WhatsApp to <strong>${VERIFIED_CONTACTS.whatsapp}</strong> or reply to this message.
            </p>

            <p style="font-size:13px;color:#1E293B;margin:0;line-height:1.6;">
              Warm regards,<br>
              <strong>Office of Admissions & Finance</strong><br>
              <span style="font-size:11px;color:#64748B;">STEMulus Academy &middot; Contact: ${VERIFIED_CONTACTS.phone}</span>
            </p>
          </div>
        </div>
      `;
    },

    // Birthday Greeting HTML
    buildBirthdayGreetingHTML: function (personName, role, birthdayFormatted) {
      var isMentor = role === 'mentor';
      return `
        <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <div style="background:#0F172A;padding:28px;text-align:center;border-bottom:4px solid #F4600C;">
            <p style="color:#F4600C;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 6px 0;">Academy Celebration</p>
            <h2 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">Happy Birthday, ${personName}!</h2>
          </div>
          <div style="padding:32px;">
            <p style="font-size:15px;color:#1E293B;line-height:1.6;margin:0 0 16px 0;">Dear <strong>${personName}</strong>,</p>
            <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px 0;">
              ${isMentor 
                ? 'On behalf of everyone at the STEMulus Academy, we want to wish you a wonderful and joyful birthday on ' + birthdayFormatted + '. Your mentorship, dedication, and patience continue to transform young minds into fearless creators and engineers.'
                : 'The entire STEMulus Academy family celebrates you on your birthday (' + birthdayFormatted + ')! Watching your creative curiosity and problem solving grow with every line of code is an immense privilege.'}
            </p>
            <div style="background:#FFF7ED;border:1px solid #FFEDD5;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
              <p style="font-size:14px;color:#C2410C;font-weight:700;margin:0 0 4px 0;">"The future belongs to those who build it."</p>
              <p style="font-size:12px;color:#9A3412;margin:0;">May this new year bring you remarkable breakthroughs, joy, and boundless achievement.</p>
            </div>
            <p style="font-size:14px;color:#1E293B;margin:0;line-height:1.6;">
              Warmest congratulations and best wishes,<br>
              <strong>The Director & Faculty Team</strong><br>
              <span style="font-size:12px;color:#64748B;">STEMulus Academy of Young Engineers</span>
            </p>
          </div>
        </div>
      `;
    },

    // Schedule Adjustment HTML
    buildScheduleAdjustmentHTML: function (data) {
      return `
        <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <div style="background:#0F172A;padding:24px 28px;border-bottom:4px solid #F4600C;">
            <p style="color:#F4600C;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 4px 0;">Schedule Update Confirmation</p>
            <h2 style="color:#ffffff;font-size:20px;font-weight:800;margin:0;">STEMulus Session Rescheduled</h2>
          </div>
          <div style="padding:28px;">
            <p style="font-size:15px;color:#1E293B;margin:0 0 16px 0;">Dear <strong>${data.parentName || 'Parent'}</strong>,</p>
            <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px 0;">
              This confirms the updated schedule for <strong>${data.studentName}</strong>'s upcoming 1-on-1 private coding session with mentor <strong>${data.tutorName}</strong>.
            </p>

            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px;margin-bottom:20px;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <tr>
                  <td style="padding:6px 0;color:#64748B;">Student:</td>
                  <td style="padding:6px 0;color:#0F172A;font-weight:700;text-align:right;">${data.studentName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748B;">Program:</td>
                  <td style="padding:6px 0;color:#0F172A;font-weight:700;text-align:right;">${data.course}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748B;">Mentor:</td>
                  <td style="padding:6px 0;color:#0F172A;font-weight:700;text-align:right;">${data.tutorName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748B;">Date:</td>
                  <td style="padding:6px 0;color:#0F172A;font-weight:700;text-align:right;">${data.date}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748B;">Confirmed Time:</td>
                  <td style="padding:6px 0;color:#0F172A;font-weight:700;text-align:right;">${data.time} WAT</td>
                </tr>
              </table>
            </div>

            <div style="text-align:center;margin:24px 0;">
              <a href="${data.meetLink}" target="_blank" style="display:inline-block;background:#0F172A;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;border-bottom:3px solid #F4600C;">
                Open Google Meet Classroom
              </a>
            </div>

            <p style="font-size:13px;color:#64748B;line-height:1.6;margin:0 0 20px 0;">
              If any further adjustments are required, kindly notify us via WhatsApp at <strong>${VERIFIED_CONTACTS.whatsapp}</strong> at least 6 hours in advance.
            </p>

            <p style="font-size:13px;color:#1E293B;margin:0;line-height:1.6;">
              Warm regards,<br>
              <strong>Academic Operations Desk</strong><br>
              <span style="font-size:11px;color:#64748B;">STEMulus Academy of Young Engineers</span>
            </p>
          </div>
        </div>
      `;
    },

    // Timezone Advisory HTML
    buildTimezoneAdvisoryHTML: function (data) {
      return `
        <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <div style="background:#0F172A;padding:24px 28px;border-bottom:4px solid #F4600C;">
            <p style="color:#F4600C;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 4px 0;">International Timezone Advisory</p>
            <h2 style="color:#ffffff;font-size:20px;font-weight:800;margin:0;">Daylight Saving Time Adjustment</h2>
          </div>
          <div style="padding:28px;">
            <p style="font-size:15px;color:#1E293B;margin:0 0 16px 0;">Dear <strong>${data.parentName || 'Parent'}</strong>,</p>
            <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px 0;">
              As clocks across <strong>${data.region}</strong> shift for Daylight Saving Time, we want to ensure seamless alignment for <strong>${data.studentName}</strong>'s private mentorship sessions.
            </p>

            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px;margin-bottom:20px;">
              <h4 style="margin:0 0 10px 0;color:#0F172A;font-size:13px;font-weight:800;">Timezone Reference Note</h4>
              <p style="font-size:13px;color:#475569;line-height:1.6;margin:0 0 8px 0;">
                Our academy mentors operate on <strong>West Africa Time (WAT, UTC+1)</strong>, which does not change clocks.
              </p>
              <p style="font-size:13px;color:#475569;line-height:1.6;margin:0;">
                Because local clocks in ${data.region} have shifted by 1 hour, please check your child's student dashboard to confirm your converted local meeting time so no session minutes are missed.
              </p>
            </div>

            <p style="font-size:13px;color:#64748B;line-height:1.6;margin:0 0 20px 0;">
              Senior Mentor <strong>${data.tutorName}</strong> will be punctual in the Google Meet classroom as always. If you wish to re-anchor your child's slot to your previous local hour, please message us on WhatsApp at <strong>${VERIFIED_CONTACTS.whatsapp}</strong>.
            </p>

            <p style="font-size:13px;color:#1E293B;margin:0;line-height:1.6;">
              Warm regards,<br>
              <strong>Office of Global Admissions & Scheduling</strong><br>
              <span style="font-size:11px;color:#64748B;">STEMulus Academy &middot; International Student Support</span>
            </p>
          </div>
        </div>
      `;
    }
  };

  window.AdminSmartDetector = AdminSmartDetector;
})(window);
