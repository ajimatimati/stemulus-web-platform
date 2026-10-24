/**
 * STEMulus Birthday Celebration Engine (Production)
 * 
 * Celebrates both Coders and Tutors:
 * 1. Identifies Today's Celebrants (MM-DD match) and Upcoming Celebrants (within 30 days).
 * 2. 1-Click WhatsApp Personalized Greeting Card Dispatcher (parents, coders, tutors).
 * 3. Dynamic Confetti Particle Fireworks & Celebratory Card Modal.
 * 4. Mounts Birthday Headquarters widget on Admin Dashboard.
 */

const BirthdayCelebrationEngine = (function() {
  'use strict';

  const CELEBRATED_KEY = 'stemulus_celebrated_birthdays_log';

  function getCelebratedLog() {
    try {
      return JSON.parse(localStorage.getItem(CELEBRATED_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function markAsCelebrated(personId, year) {
    try {
      const log = getCelebratedLog();
      log[`${personId}_${year}`] = new Date().toISOString();
      localStorage.setItem(CELEBRATED_KEY, JSON.stringify(log));
    } catch (e) {}
  }

  function isAlreadyCelebrated(personId, year) {
    const log = getCelebratedLog();
    return !!log[`${personId}_${year}`];
  }

  /**
   * Parse a date string into { month: 1-12, day: 1-31, year: number }
   */
  function parseBirthday(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.trim().split(/[-/]/);
    if (parts.length < 3) return null;

    let y, m, d;
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else {
      // DD-MM-YYYY or MM-DD-YYYY
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
    }

    if (isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) return null;
    return { month: m, day: d, birthYear: isNaN(y) ? null : y };
  }

  /**
   * Calculate days until next birthday from today.
   */
  function getDaysUntilBirthday(bMonth, bDay, referenceDate = new Date()) {
    const currentYear = referenceDate.getFullYear();
    let nextBday = new Date(currentYear, bMonth - 1, bDay);

    // If already passed this year, check next year
    const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    if (nextBday < today) {
      nextBday = new Date(currentYear + 1, bMonth - 1, bDay);
    }

    const diffMs = nextBday.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Fetch all members (coders and tutors) with birthday data from DB.
   */
  function getAllMembersWithBirthdays() {
    if (typeof DashboardEngine === 'undefined') return [];
    const db = DashboardEngine.getDB();
    const list = [];
    const today = new Date();
    const currentYear = today.getFullYear();

    // 1. Process Students / Coders
    const students = db.students || [];
    students.forEach(std => {
      const bday = std.birthday || std.dob;
      const parsed = parseBirthday(bday);
      if (parsed) {
        const daysAway = getDaysUntilBirthday(parsed.month, parsed.day, today);
        const turningAge = parsed.birthYear ? (currentYear - parsed.birthYear + (daysAway > 180 ? 1 : 0)) : (std.age || null);
        list.push({
          id: std.id,
          name: `${std.firstName || ''} ${std.lastName || ''}`.trim() || 'STEMulus Coder',
          role: 'coder',
          typeLabel: 'Coder',
          program: std.program || 'Coding Track',
          birthdayRaw: bday,
          month: parsed.month,
          day: parsed.day,
          daysAway: daysAway,
          isToday: daysAway === 0,
          isThisMonth: daysAway <= 30,
          turningAge: turningAge,
          phone: std.parentPhone || std.phone || '2347052466716',
          parentName: std.parentName || 'Parent',
          avatarColor: std.avatarColor || 'bg-amber-600',
          mentor: std.tutorName || 'STEMulus Faculty'
        });
      }
    });

    // 2. Process Tutors / Instructors
    const users = db.users || {};
    Object.values(users).forEach(u => {
      if (u.role === 'tutor') {
        const bday = u.birthday || u.dob;
        const parsed = parseBirthday(bday);
        if (parsed) {
          const daysAway = getDaysUntilBirthday(parsed.month, parsed.day, today);
          list.push({
            id: u.id || u.email,
            name: u.name || 'STEMulus Tutor',
            role: 'tutor',
            typeLabel: 'Lead Instructor',
            program: 'STEMulus Faculty & Mentorship',
            birthdayRaw: bday,
            month: parsed.month,
            day: parsed.day,
            daysAway: daysAway,
            isToday: daysAway === 0,
            isThisMonth: daysAway <= 30,
            turningAge: null,
            phone: u.phone || '2347052466716',
            parentName: null,
            avatarColor: 'bg-emerald-600',
            mentor: 'STEMulus Academic Board'
          });
        }
      }
    });

    return list.sort((a, b) => a.daysAway - b.daysAway);
  }

  /**
   * Get filtered birthday buckets.
   */
  function getBirthdayRadar() {
    const all = getAllMembersWithBirthdays();
    const today = all.filter(m => m.isToday);
    const upcomingThisWeek = all.filter(m => !m.isToday && m.daysAway <= 7);
    const upcomingThisMonth = all.filter(m => !m.isToday && m.daysAway <= 30);

    return {
      today,
      upcomingThisWeek,
      upcomingThisMonth,
      all
    };
  }

  /**
   * Generate heartfelt personalized WhatsApp message for birthday.
   */
  function generateBirthdayMessage(member) {
    const isCoder = member.role === 'coder';
    const ageStr = member.turningAge ? ` on turning ${member.turningAge} today` : '';

    if (isCoder) {
      return `🎉🎂 HAPPY BIRTHDAY ${member.name.toUpperCase()}! 🚀\n\nOn behalf of the entire STEMulus Kids Tech Club family, we celebrate you today! 🌟 Keep dreaming big, coding brilliant programs, and building tomorrow's world. We are super proud of your journey in ${member.program}!\n\nMay this new age bring you boundless creativity, joy, and groundbreaking tech creations! 🎈🥳\n\n— With warm regards,\nSTEMulus Academic & Mentorship Team\nwww.stemuluskidstech.com`;
    } else {
      return `🎂✨ HAPPY BIRTHDAY COACH ${member.name.toUpperCase()}! 🏆\n\nToday, STEMulus celebrates an extraordinary mentor and educator! Thank you for your relentless dedication, passion, and mentorship in inspiring young minds to master technology and code.\n\nWishing you an amazing year of great health, boundless joy, and continued excellence! 🥂🎉\n\n— With immense appreciation,\nSTEMulus Operations & Management\nwww.stemuluskidstech.com`;
    }
  }

  /**
   * Generate 1-click WhatsApp URL for birthday greeting.
   */
  function getWhatsAppGreetingUrl(member) {
    let phone = (member.phone || '2347052466716').replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '234' + phone.slice(1);
    const msg = generateBirthdayMessage(member);
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  /**
   * Confetti Fireworks particle synthesizer (pure JS canvas, zero dependencies).
   */
  function launchConfettiFireworks(durationMs = 4000) {
    if (typeof document === 'undefined') return;

    let canvas = document.getElementById('stemulus-confetti-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'stemulus-confetti-canvas';
      canvas.className = 'fixed inset-0 pointer-events-none z-[10000] w-full h-full';
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f97316', '#fbbf24', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
    const particles = [];
    const count = 120;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width * 0.5,
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 16,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    const startTime = Date.now();
    function animate() {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.rotation += p.vr;
        p.opacity = Math.max(0, 1 - (elapsed / durationMs));

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      });

      if (elapsed < durationMs) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.remove();
      }
    }
    requestAnimationFrame(animate);
  }

  /**
   * Display festive celebration modal.
   */
  function showCelebrationModal(member) {
    if (typeof document === 'undefined') return;
    launchConfettiFireworks(5000);

    let modal = document.getElementById('stemulus-birthday-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'stemulus-birthday-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn';

    const waUrl = getWhatsAppGreetingUrl(member);
    const badgeColor = member.role === 'coder' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300';

    modal.innerHTML = `
      <div class="relative max-w-md w-full bg-white border border-slate-200/90 rounded-[2.5rem] p-6 sm:p-8 text-center shadow-2xl overflow-hidden">
        <div class="absolute -top-16 -right-16 w-44 h-44 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div class="relative w-20 h-20 mx-auto mb-3 flex items-center justify-center">
          <img src="images/portal/standalone/gift-3d.png" class="w-16 h-16 object-contain animate-bounce" alt="Gift" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><text y=\\'.9em\\' font-size=\\'90\\'>🎁</text></svg>'">
        </div>

        <span class="inline-block px-3 py-1 rounded-full text-xs font-bold border ${badgeColor} mb-2 uppercase tracking-wider">
          ${member.typeLabel} Celebrant
        </span>

        <h3 class="text-2xl font-black text-slate-900 tracking-tight mb-1">
          Happy Birthday, ${member.name}!
        </h3>
        <p class="text-xs text-amber-700 font-bold mb-4">
          ${member.turningAge ? `Turning ${member.turningAge} Years Old Today!` : 'Celebrating Excellence & Dedication!'}
        </p>

        <div class="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200/80 text-left text-xs space-y-2 text-slate-700">
          <div class="flex justify-between">
            <span class="text-slate-500">Track:</span>
            <strong class="text-slate-900 font-bold">${member.program}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Celebration:</span>
            <strong class="text-slate-900 font-bold">${member.birthdayRaw} (Today!)</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Phone:</span>
            <strong class="text-emerald-700 font-mono font-bold">${member.phone}</strong>
          </div>
        </div>

        <div class="flex gap-2">
          <a href="${waUrl}" target="_blank" class="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/25">
            <span>💬 Send WhatsApp Card</span>
          </a>
          <button id="btn-close-bday-modal" class="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200">
            Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('#btn-close-bday-modal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }

  /**
   * Render Birthday Headquarters HTML card for mounting on Admin Dashboard.
   */
  function renderBirthdayHeadquartersHTML() {
    const radar = getBirthdayRadar();
    const todayCount = radar.today.length;
    const monthCount = radar.upcomingThisMonth.length + todayCount;
    const isFr = (typeof I18nVisualEngine !== 'undefined' && I18nVisualEngine.getLanguage() === 'fr');

    const title = isFr ? "Quartier Général des Anniversaires" : "Birthday Headquarters";
    const sub = isFr ? "Célébration de nos codeurs et mentors." : "Honoring our coders and faculty mentors.";
    const monthBadge = isFr ? `${monthCount} Célébrations ce Mois-ci` : `${monthCount} Celebrations This Month`;
    const todayBadge = isFr ? `🎉 ${todayCount} en Fête Aujourd'hui !` : `🎉 ${todayCount} Celebrant(s) Today!`;

    return `
      <div class="bg-slate-100/70 border border-slate-200/80 rounded-[2.5rem] p-2 shadow-xs mb-8">
        <div class="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
                <img src="images/portal/standalone/gift-3d.png" class="w-8 h-8 object-contain" alt="Gift" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><text y=\\'.9em\\' font-size=\\'90\\'>🎁</text></svg>'">
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-black text-slate-900 tracking-tight">${title}</h3>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    ${monthBadge}
                  </span>
                </div>
                <p class="text-xs text-slate-500">${sub}</p>
              </div>
            </div>
            ${todayCount > 0 ? `
              <div class="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs text-amber-800 font-extrabold shadow-xs">
                <span>${todayBadge}</span>
              </div>
            ` : ''}
          </div>

          <!-- Today's Celebrants (if any) -->
          ${todayCount > 0 ? `
            <div class="mb-6">
              <h4 class="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3 flex items-center gap-1.5">
                <span>🌟 ${isFr ? "Célébrants du Jour" : "Today's Celebrants"}</span>
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${radar.today.map(m => `
                  <div class="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:shadow-sm transition-all">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm flex-shrink-0 shadow-xs">
                        ${m.name.charAt(0)}
                      </div>
                      <div class="min-w-0">
                        <h5 class="text-sm font-black text-slate-900 truncate">${m.name}</h5>
                        <p class="text-[11px] text-amber-800 font-semibold truncate">${m.typeLabel} • ${m.turningAge ? (isFr ? `Fête ses ${m.turningAge} ans` : `Turning ${m.turningAge} today`) : 'Celebrating Today'}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <button onclick="BirthdayCelebrationEngine.showCelebrationModal(${JSON.stringify(m).replace(/"/g, '&quot;')})" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs">
                        ${isFr ? "Célébrer 🎂" : "Celebrate 🎂"}
                      </button>
                      <a href="${getWhatsAppGreetingUrl(m)}" target="_blank" class="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs transition-all shadow-xs" title="Send WhatsApp">
                        💬
                      </a>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Upcoming Celebrations -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span>📅 ${isFr ? `À venir (${radar.upcomingThisMonth.length})` : `Upcoming Within 30 Days (${radar.upcomingThisMonth.length})`}</span>
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              ${radar.upcomingThisMonth.map(m => `
                <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs hover:bg-white hover:shadow-xs transition-all">
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 mb-0.5">
                      <strong class="text-slate-800 font-bold truncate">${m.name}</strong>
                      <span class="text-[9px] px-1.5 py-0.2 rounded font-semibold ${m.role === 'coder' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">${m.typeLabel}</span>
                    </div>
                    <span class="text-[11px] text-slate-500">${m.birthdayRaw} (${m.daysAway === 1 ? (isFr ? 'Demain !' : 'Tomorrow!') : (isFr ? `dans ${m.daysAway} j` : `in ${m.daysAway}d`)})</span>
                  </div>
                  <a href="${getWhatsAppGreetingUrl(m)}" target="_blank" class="px-2 py-1 bg-white hover:bg-emerald-600 hover:text-white text-slate-600 font-bold text-[11px] rounded-lg border border-slate-200 transition-all flex-shrink-0">
                    💬
                  </a>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return {
    getAllMembersWithBirthdays,
    getBirthdayRadar,
    generateBirthdayMessage,
    getWhatsAppGreetingUrl,
    launchConfettiFireworks,
    showCelebrationModal,
    renderBirthdayHeadquartersHTML,
    markAsCelebrated,
    isAlreadyCelebrated,
    getCelebrantsCount: function() {
      const radar = getBirthdayRadar();
      return {
        today: (radar.today || []).length,
        thisMonth: (radar.upcomingThisMonth || []).length
      };
    },
    generateCoderWhatsAppCard: function(name, age, course) {
      return generateBirthdayMessage({
        name: name,
        turningAge: age,
        program: course,
        role: 'coder'
      });
    }
  };
})();

if (typeof window !== 'undefined') {
  window.BirthdayCelebrationEngine = BirthdayCelebrationEngine;
  window.BirthdayEngine = BirthdayCelebrationEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BirthdayCelebrationEngine;
}
