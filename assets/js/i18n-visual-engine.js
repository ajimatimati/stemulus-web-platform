/**
 * STEMulus Internationalization (i18n) & 3D Visual Display Engine (Production)
 * 
 * Capabilities:
 * 1. Global Language Switcher: English (🇬🇧) ⇄ Français (🇫🇷).
 *    - Instant live DOM text translation without full page reloads.
 *    - Tailored for bilingual students (e.g. Junayd Kari) and Francophone families.
 * 2. Display Mode Switcher: 3D Visual Cards (🖼️) ⇄ Compact Text (📝).
 *    - Transforms tabular data into rich 3D cards using STEMulus standalone 3D assets.
 * 3. Reactive State Persistence in localStorage (`stemulus_portal_lang`, `stemulus_portal_view_mode`).
 */

const I18nVisualEngine = (function() {
  'use strict';

  const LANG_KEY = 'stemulus_portal_lang';
  const MODE_KEY = 'stemulus_portal_view_mode';

  // Supported Languages
  let currentLang = 'en';
  // Display Mode: 'visual' (3D cards) or 'compact' (text/tables)
  let currentMode = 'visual';

  const DICTIONARY = {
    en: {
      // Direct & Short Aliases
      "dashboard_title": "Command Center",
      "welcome_sub": "Clean, intelligent learning operations for mentors and coders.",
      "switch_lang": "Language",
      "visual_cards": "3D Visual Mode",
      "compact_text": "Compact Text",
      "ops_title": "Operations Suite",
      "birthday_title": "Birthday Headquarters",
      "join_class": "Join Classroom",

      // Navigation & Sections
      "nav_dashboard": "Command Center",
      "nav_schedules": "Class Schedules",
      "nav_students": "Active Coders",
      "nav_tutors": "Faculty Mentors",
      "nav_attendance": "Attendance & Operations",
      "nav_recordings": "Recordings Vault",
      "nav_billing": "Tuition & Billing",
      
      // Headquarters & Modules
      "bday_hq_title": "Birthday Headquarters",
      "bday_hq_subtitle": "Celebrating our coders and faculty mentors across Nigeria and diaspora.",
      "bday_month_badge": "Celebrations This Month",
      "bday_today_badge": "Celebrants Today!",
      "bday_today_title": "Today's Celebrants",
      "bday_upcoming_title": "Upcoming Within 30 Days",
      "bday_send_card": "Send Card 💬",
      "bday_celebrate_now": "Celebrate 🎂",
      "bday_tomorrow": "Tomorrow!",
      "bday_in_days": "in {days} days",
      "bday_turning_age": "Turning {age} today",
      "bday_celebrating_today": "Celebrating Today",
      
      // Operations Suite
      "ops_hq_title": "Classroom & Operations Headquarters",
      "ops_hq_subtitle": "Real-time attendance radar, standby faculty allocation, and operational metrics.",
      "ops_concurrency": "Active Concurrency",
      "ops_force_scan": "⚡ Force Radar Scan",
      "ops_today_sessions": "Today's Sessions",
      "ops_ontime_rate": "On-Time Start Rate",
      "ops_attendance_rate": "Session Attendance",
      "ops_makeup_tokens": "Makeup Tokens",
      "ops_audit_clean": "Double-Booking Audit Clean: Zero conflicts across faculty and coder slots.",
      "ops_action_matrix": "Admin Action Matrix",
      "ops_faculty_workload": "Faculty Workload Balancer",
      "ops_reassign_sub": "Reassign Substitute 🔄",
      
      // AI Content & Transcript Analysis
      "ai_analysis_title": "AI Content & Transcript Inspector",
      "ai_analysis_sub": "Autonomous Lesson Plan Adherence & Untoward Safeguarding Watchdog",
      "ai_plan_adherence": "Plan Adherence",
      "ai_safeguard_score": "Safeguard Score",
      "ai_student_talk": "Student Talk",
      "ai_praises": "Praises Given",
      "ai_untoward_flagged": "Untoward Incident Flagged",
      "ai_plan_adhered": "Plan Adhered • Verified COPPA",
      "ai_milestones_checked": "Curriculum Milestones Checked",

      // Live Classroom & Companion
      "companion_title": "Classroom Companion Active",
      "companion_sub": "Live presence monitoring & automated safeguarding active.",
      "companion_open_meet": "🚀 Open Google Meet Room",
      "companion_leave_clean": "Leave Class Cleanly (End Session)",
      "companion_tab_hint": "Keep this companion tab open during class to maintain real-time attendance.",
      "companion_both_in_room": "Connected Live • Both in Room",
      "companion_recording_active": "Automated Gemini Notes & Video Recording Active",
      
      // General UI
      "lang_en": "English",
      "lang_fr": "Français",
      "mode_visual": "3D Visual Mode",
      "mode_compact": "Compact Text",
      "status_in_session": "In Session",
      "status_completed": "Completed",
      "status_upcoming": "Upcoming",
      "status_tutor_waiting": "Tutor Waiting",
      "status_disconnected": "Disconnected",
      "status_reconnected": "Reconnected"
    },
    fr: {
      // Direct & Short Aliases
      "dashboard_title": "Centre de Commandement",
      "welcome_sub": "Gestion pédagogique intelligente pour nos mentors et codeurs.",
      "switch_lang": "Langue",
      "visual_cards": "Mode Visuel 3D",
      "compact_text": "Texte Compact",
      "ops_title": "Suite Opérations",
      "birthday_title": "Quartier Général des Anniversaires",
      "join_class": "Rejoindre la Classe",

      // Navigation & Sections
      "nav_dashboard": "Centre de Commandement",
      "nav_schedules": "Emploi du Temps",
      "nav_students": "Jeunes Codeurs",
      "nav_tutors": "Professeurs & Mentors",
      "nav_attendance": "Présences & Opérations",
      "nav_recordings": "Coffre des Enregistrements",
      "nav_billing": "Scolarité & Factures",
      
      // Headquarters & Modules
      "bday_hq_title": "Quartier Général des Anniversaires",
      "bday_hq_subtitle": "Célébration de nos codeurs et mentors au Nigeria et dans la diaspora.",
      "bday_month_badge": "Célébrations ce Mois-ci",
      "bday_today_badge": "En Fête Aujourd'hui !",
      "bday_today_title": "Célébrants du Jour",
      "bday_upcoming_title": "À Venir dans les 30 Jours",
      "bday_send_card": "Envoyer Carte 💬",
      "bday_celebrate_now": "Célébrer 🎂",
      "bday_tomorrow": "Demain !",
      "bday_in_days": "dans {days} jours",
      "bday_turning_age": "Fête ses {age} ans aujourd'hui",
      "bday_celebrating_today": "En fête aujourd'hui",
      
      // Operations Suite
      "ops_hq_title": "QG des Classes & Opérations",
      "ops_hq_subtitle": "Radar de présence en temps réel, tuteurs remplaçants et indicateurs de qualité.",
      "ops_concurrency": "Classes en Direct",
      "ops_force_scan": "⚡ Scanner le Radar",
      "ops_today_sessions": "Sessions du Jour",
      "ops_ontime_rate": "Taux de Ponctualité",
      "ops_attendance_rate": "Taux de Présence",
      "ops_makeup_tokens": "Jetons de Rattrapage",
      "ops_audit_clean": "Audit Conflits Parfait : Zéro double réservation détectée.",
      "ops_action_matrix": "Matrice des Actions Quotidiennes",
      "ops_faculty_workload": "Équilibreur de Charge des Professeurs",
      "ops_reassign_sub": "Remplacer le Coach 🔄",
      
      // AI Content & Transcript Analysis
      "ai_analysis_title": "Analyseur IA du Contenu & Transcription",
      "ai_analysis_sub": "Respect du Plan Pédagogique & Surveillance des Incidents",
      "ai_plan_adherence": "Adhérence au Plan",
      "ai_safeguard_score": "Score de Sécurité",
      "ai_student_talk": "Parole Élève",
      "ai_praises": "Encouragements",
      "ai_untoward_flagged": "Incident Détecté • Escaladé",
      "ai_plan_adhered": "Plan Respecté • Conforme COPPA",
      "ai_milestones_checked": "Jalons Pédagogiques Validés",

      // Live Classroom & Companion
      "companion_title": "Compagnon de Classe Actif",
      "companion_sub": "Suivi des présences en direct & enregistrement de sécurité actif.",
      "companion_open_meet": "🚀 Ouvrir la Salle Google Meet",
      "companion_leave_clean": "Quitter Proprement (Fin de Session)",
      "companion_tab_hint": "Gardez cet onglet ouvert pour maintenir votre présence et la sécurité en direct.",
      "companion_both_in_room": "Connecté en Direct • Tous en Salle",
      "companion_recording_active": "Prise de Notes Gemini & Enregistrement Vidéo Actifs",
      
      // General UI
      "lang_en": "English",
      "lang_fr": "Français",
      "mode_visual": "Mode 3D Visuel",
      "mode_compact": "Texte Compact",
      "status_in_session": "En Cours",
      "status_completed": "Terminé",
      "status_upcoming": "À Venir",
      "status_tutor_waiting": "Le Coach Attend",
      "status_disconnected": "Déconnecté",
      "status_reconnected": "Reconnecté"
    }
  };

  function init() {
    try {
      currentLang = localStorage.getItem(LANG_KEY) || 'en';
      currentMode = localStorage.getItem(MODE_KEY) || 'visual';
    } catch (e) {
      currentLang = 'en';
      currentMode = 'visual';
    }
    applyLanguage(currentLang);
    applyMode(currentMode);
  }

  function t(key, replacements = {}) {
    const dict = DICTIONARY[currentLang] || DICTIONARY.en;
    let text = dict[key] || DICTIONARY.en[key] || key;
    Object.entries(replacements).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    return text;
  }

  function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'fr') return;
    currentLang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {}
    applyLanguage(lang);
    window.dispatchEvent(new CustomEvent('stemulus_lang_changed', { detail: { lang } }));
  }

  function setDisplayMode(mode) {
    if (mode !== 'visual' && mode !== 'compact') return;
    currentMode = mode;
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch (e) {}
    applyMode(mode);
    window.dispatchEvent(new CustomEvent('stemulus_mode_changed', { detail: { mode } }));
  }

  function applyLanguage(lang) {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;

    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = t(key);
      }
    });

    // Update Language Button Toggles if present
    const btnEn = document.getElementById('lang-toggle-en');
    const btnFr = document.getElementById('lang-toggle-fr');
    if (btnEn && btnFr) {
      if (lang === 'en') {
        btnEn.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-orange-600 text-white shadow-sm transition-all';
        btnFr.className = 'px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all';
      } else {
        btnFr.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-orange-600 text-white shadow-sm transition-all';
        btnEn.className = 'px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all';
      }
    }

    // Refresh Headquarters if mounted
    if (typeof BirthdayCelebrationEngine !== 'undefined') {
      const bdayEl = document.getElementById('mount-birthday-headquarters');
      if (bdayEl) bdayEl.innerHTML = BirthdayCelebrationEngine.renderBirthdayHeadquartersHTML();
    }
    if (typeof OperationsManagerEngine !== 'undefined') {
      const opsEl = document.getElementById('mount-operations-suite');
      if (opsEl) opsEl.innerHTML = OperationsManagerEngine.renderOperationsSuiteHTML();
    }
  }

  function applyMode(mode) {
    if (typeof document === 'undefined') return;
    const body = document.body;
    if (mode === 'visual') {
      body.classList.add('stemulus-mode-visual');
      body.classList.remove('stemulus-mode-compact');
    } else {
      body.classList.add('stemulus-mode-compact');
      body.classList.remove('stemulus-mode-visual');
    }

    const btnVis = document.getElementById('mode-toggle-visual');
    const btnComp = document.getElementById('mode-toggle-compact');
    if (btnVis && btnComp) {
      if (mode === 'visual') {
        btnVis.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm transition-all';
        btnComp.className = 'px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all';
      } else {
        btnComp.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm transition-all';
        btnVis.className = 'px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all';
      }
    }

    // Re-render modules if mounted
    if (typeof OperationsManagerEngine !== 'undefined') {
      const opsEl = document.getElementById('mount-operations-suite');
      if (opsEl) opsEl.innerHTML = OperationsManagerEngine.renderOperationsSuiteHTML();
    }
  }

  /**
   * Helper to render the Dual Switcher HTML widget for navigation bars.
   */
  function renderSwitcherWidgetHTML() {
    return `
      <div class="inline-flex items-center gap-2 p-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl shadow-sm backdrop-blur-md">
        <!-- Language Switcher -->
        <div class="inline-flex items-center gap-1 bg-white p-0.5 rounded-full border border-slate-200/60 shadow-xs">
          <button id="lang-toggle-en" onclick="I18nVisualEngine.setLanguage('en')" class="px-2.5 py-1 rounded-full text-xs font-bold ${currentLang === 'en' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'} transition-all" title="English">
            🇬🇧 EN
          </button>
          <button id="lang-toggle-fr" onclick="I18nVisualEngine.setLanguage('fr')" class="px-2.5 py-1 rounded-full text-xs font-bold ${currentLang === 'fr' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'} transition-all" title="Français">
            🇫🇷 FR
          </button>
        </div>

        <div class="h-4 w-[1px] bg-slate-300"></div>

        <!-- 3D Visual vs Compact Mode -->
        <div class="inline-flex items-center gap-1 bg-white p-0.5 rounded-full border border-slate-200/60 shadow-xs">
          <button id="mode-toggle-visual" onclick="I18nVisualEngine.setDisplayMode('visual')" class="px-2.5 py-1 rounded-full text-xs font-bold ${currentMode === 'visual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'} transition-all" title="3D Visual Cards">
            🖼️ Visual
          </button>
          <button id="mode-toggle-compact" onclick="I18nVisualEngine.setDisplayMode('compact')" class="px-2.5 py-1 rounded-full text-xs font-bold ${currentMode === 'compact' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'} transition-all" title="Compact Text">
            📝 Text
          </button>
        </div>
      </div>
    `;
  }

  return {
    init,
    t,
    setLanguage,
    switchLanguage: setLanguage,
    setDisplayMode,
    switchDisplayMode: setDisplayMode,
    getLanguage: () => currentLang,
    getDisplayMode: () => currentMode,
    renderSwitcherWidgetHTML,
    DICTIONARY
  };
})();

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', I18nVisualEngine.init);
}

if (typeof window !== 'undefined') {
  window.I18nVisualEngine = I18nVisualEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18nVisualEngine;
}
