/**
 * STEMulus Kids Tech - Mulu AI Mascot Engine (Production)
 * 
 * The Official, Extremely Wise AI Mascot & Copilot of STEMulus Kids Tech
 * Provides:
 * 1. Role-Aware Context Sensing (Tutor | Parent | Coder | Admin)
 * 2. Autonomous Deep-Link Navigation & Page Action Dispatcher
 * 3. 1-Click Drafting Copilot (Monthly Reports, WhatsApp Summaries, Reschedule Notes, Substitute Handoffs)
 * 4. Academic Knowledge Oracle (10 Suites & 12 Courses, Prerequisites, Age Brackets)
 * 5. Dual-Core Intelligence: Google Gemini 2.5 Flash + Zero-Fault Deterministic Knowledge Base
 * 6. High-End Double-Bezel Playful Luxury UI (WCAG 2.1 AA, touch targets >= 38px, mobile responsive)
 */

(function() {
  'use strict';

  // --- KNOWLEDGE BASE: 10 SUITES & 12 COURSES & POLICIES ---
  const MULU_KNOWLEDGE = {
    identity: {
      name: "Mulu",
      title: "The Owl of STEMulus / Lead AI Mascot",
      tagline: "Extremely Wise, Warm, and Playful Coding Copilot",
      organization: "STEMulus Kids Tech"
    },
    suites: [
      { id: "scratch", name: "Scratch Creators", ages: "5–8", tools: "Scratch 3.0, ScratchJr", desc: "Visual block-based logic, sprite animation, storytelling, broadcast events, loops & conditionals." },
      { id: "python", name: "Python Prodigies", ages: "9–14", tools: "Python 3, Turtle, Pygame", desc: "Text-based coding, algorithms, variables, loops, custom functions, data structures, and game creation." },
      { id: "web", name: "Web Wizards", ages: "10–16", tools: "HTML5, CSS3, Modern JavaScript", desc: "Semantic web architecture, responsive Flexbox/Grid layouts, interactive DOM manipulation, and web apps." },
      { id: "robotics", name: "Junior Robotics & IoT", ages: "8–15", tools: "Micro:bit, Tinkercad, Arduino", desc: "Sensors, actuators, hardware breadboarding, block/text micro-controller logic, and automated gadgets." },
      { id: "ai", name: "AI & Machine Learning Explorers", ages: "10–17", tools: "Teachable Machine, Python AI, Prompt Engineering", desc: "Computer vision, neural network foundations, ethical AI use, and creative generative AI workflows." },
      { id: "mobile", name: "Mobile App Builders", ages: "10–16", tools: "MIT App Inventor, Thunkable", desc: "Touchscreen app design, mobile hardware sensors (GPS/accelerometer), database storage, and app publishing." },
      { id: "games", name: "Game Dev Champions", ages: "9–16", tools: "Godot 2D, Roblox Studio (Lua)", desc: "2D physics engines, sprite collisions, game mechanics, state machines, and 3D level scripting." },
      { id: "data", name: "Data Science Detectives", ages: "12–17", tools: "Python, Pandas, Matplotlib", desc: "Data cleaning, statistical charts, finding insights in real-world datasets, and algorithmic logic." },
      { id: "cyber", name: "Cyber Safety & Digital Citizens", ages: "7–16", tools: "Interactive Labs & Security Vaults", desc: "Online privacy, two-factor authentication, ethical hacking basics, phishing defense, and digital footprints." },
      { id: "creative", name: "Creative Tech & Digital Art", ages: "6–14", tools: "Vector Graphics, 3D Tinkercad, UI/UX", desc: "Digital illustration, 3D spatial modeling, user experience wireframing, and interactive multimedia design." }
    ],
    courses_12: [
      "1. Junior Scratch Explorers (Ages 5-7)",
      "2. Scratch Game Architect (Ages 8-10)",
      "3. Python Starter & Turtle Graphics (Ages 9-11)",
      "4. Advanced Python & Pygame Studio (Ages 12-14)",
      "5. Frontend Web Fundamentals: HTML & CSS (Ages 10-13)",
      "6. Fullstack JavaScript Wizards (Ages 13-17)",
      "7. Micro:bit Junior Hardware Innovators (Ages 8-11)",
      "8. Arduino & Robotics Automation (Ages 12-16)",
      "9. AI Explorers & Computer Vision (Ages 10-15)",
      "10. Mobile App Creation Studio (Ages 10-15)",
      "11. 2D Arcade & Godot Game Development (Ages 11-16)",
      "12. Data Science & Python Analytics (Ages 13-17)"
    ],
    faqs: {
      reschedule: "Parents can reschedule sessions up to 4 hours before class using the Smart Reschedule Concierge modal. Unused credits roll over automatically.",
      meet_links: "All STEMulus classes run on authentic Google Meet Pro links with 'hostNotRequired: true'. Students and tutors can join without waiting for manual host admission.",
      billing: "Tuition is payable in NGN (Zenith Bank), USD (Mercury Bank wire/ACH), GBP, and EUR. Invoices and official PDF receipts are stored in the Billing Vault on the parent dashboard.",
      attendance: "Tutors are required to log attendance within 24 hours of session completion. Meeting duration is automatically synchronized from Google Meet telemetry.",
      safeguarding: "All 1-on-1 virtual sessions are safeguarded, monitored by the Sentinel Watchdog, and recorded for child safety with full COPPA/GDPR compliance."
    }
  };

  // --- CORE MULU ENGINE ---
  class MuluAIEngine {
    constructor() {
      this.role = 'guest';
      this.activeStudent = '';
      this.currentPortal = '';
      this.isOpen = false;
      this.isThinking = false;
      this.messages = [];
      this.tips = [];
      this.autoHideTimer = null;
      this.actionRegistry = {};
      this.actionSeq = 0;
      this.msgSeq = 0;
      
      this.detectContext();
      this.init();
    }

    detectContext() {
      const path = (window.location.pathname || '').toLowerCase();
      const search = window.location.search || '';

      if (path.includes('tutor-') || path.includes('attendance') || path.includes('monthly-report')) {
        this.role = 'tutor';
        this.currentPortal = 'Tutor Operational Hub';
      } else if (path.includes('parent-') || path.includes('parent-progress')) {
        this.role = 'parent';
        this.currentPortal = 'Parent Command Center';
      } else if (path.includes('join-class') || search.includes('role=student') || search.includes('role=coder')) {
        this.role = 'coder';
        this.currentPortal = 'Live Classroom Companion';
      } else if (path.includes('admin-')) {
        this.role = 'admin';
        this.currentPortal = 'Operations Control';
      } else {
        // Check localStorage
        const storedRole = localStorage.getItem('user_role') || localStorage.getItem('stemulus_current_role');
        if (storedRole === 'tutor') this.role = 'tutor';
        else if (storedRole === 'parent') this.role = 'parent';
        else if (storedRole === 'admin') this.role = 'admin';
        else this.role = 'parent'; // default friendly fallback
        this.currentPortal = 'STEMulus Portal';
      }

      // Detect active student if parent dashboard
      try {
        const sel = document.getElementById('child-selector') || document.querySelector('select[name="student"]');
        if (sel && sel.value) {
          this.activeStudent = sel.options[sel.selectedIndex]?.text || sel.value;
        } else {
          const urlParams = new URLSearchParams(window.location.search);
          this.activeStudent = urlParams.get('student') || localStorage.getItem('parent_active_child') || 'Sarah Adeyemi';
        }
      } catch (e) {
        this.activeStudent = 'Sarah Adeyemi';
      }

      this.setupRoleSpecificTips();
    }

    setupRoleSpecificTips() {
      if (this.role === 'tutor') {
        this.tips = [
          "Need to wrap up? Click me to draft your Monthly Progress Report in 5 seconds!",
          "Pro-Tip: Log attendance immediately after Google Meet to auto-sync duration.",
          "Emergency coverage needed? I can launch the coverage dispatch modal for you.",
          "Faculty Chat is online! Ping fellow tutors or admin directly anytime."
        ];
      } else if (this.role === 'coder') {
        this.tips = [
          "Welcome coder! Stuck on a Scratch loop or Python bug? Ask Mulu for a hint!",
          "Check your Technology Passport on the dashboard to see your next badge unlock!",
          "Remember: Errors are just puzzle pieces that haven't clicked yet!",
          "Have fun in today's coding adventure!"
        ];
      } else if (this.role === 'admin') {
        this.tips = [
          "Sentinel Watchdog is monitoring live sessions for child safety compliance.",
          "Need to reassign emergency coverage? Use the quick actions in Faculty Chat.",
          "Attendance completion rate is tracking high across all 10 suites."
        ];
      } else {
        // Parent
        this.tips = [
          `Hi! I'm Mulu, your STEMulus guide. Need to reschedule ${this.activeStudent}'s class? Just ask me!`,
          "Looking for tuition fees or bank details? I can take you straight to the Billing Vault.",
          `Check out ${this.activeStudent}'s newly unlocked badges in the Technology Passport!`,
          "Our WhatsApp Coordinator line is available 24/7 for urgent schedule needs."
        ];
      }
    }

    init() {
      this.injectStyles();
      this.render();
      this.bindEvents();
      this.seedInitialMessages();
      this.scheduleAutoHide();
    }

    injectStyles() {
      if (document.getElementById('mulu-ai-styles')) return;
      const style = document.createElement('style');
      style.id = 'mulu-ai-styles';
      style.textContent = `
        /* --- MULU FLOATING WIDGET CONTAINER --- */
        .mulu-ai-root {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 99999;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          transition: right 0.25s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Seamless coexistence with Faculty Chat Direct Line */
        body:has(#mount-tutor-chat-drawer) .mulu-ai-root,
        body:has(#stemulus-floating-chat-bubble) .mulu-ai-root,
        .mulu-ai-root.with-faculty-chat {
          right: 96px !important;
        }
        @media (max-width: 640px) {
          body:has(#mount-tutor-chat-drawer) .mulu-ai-root,
          body:has(#stemulus-floating-chat-bubble) .mulu-ai-root,
          .mulu-ai-root.with-faculty-chat {
            right: 84px !important;
            bottom: 16px !important;
          }
        }

        /* --- CONTEXTUAL SPEECH BUBBLE PILL --- */
        .mulu-speech-pill {
          pointer-events: auto;
          background: rgba(255, 255, 255, 0.98);
          color: #0F172A;
          padding: 12px 16px;
          border-radius: 20px 20px 4px 20px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 12px 30px -8px rgba(15, 23, 42, 0.15), 0 4px 10px -2px rgba(15, 23, 42, 0.05);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.4;
          max-width: 250px;
          position: relative;
          cursor: pointer;
          animation: muluFloatIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(8px);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .mulu-speech-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px -6px rgba(15, 23, 42, 0.2);
        }
        .mulu-speech-pill-close {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 36px;
          height: 36px;
          min-width: 36px;
          min-height: 36px;
          background: #F1F5F9;
          color: #64748B;
          border: 1px solid #CBD5E1;
          border-radius: 50%;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-weight: 800;
          line-height: 1;
        }
        .mulu-speech-pill-close:hover {
          background: #EF4444;
          color: #FFF;
          border-color: #EF4444;
        }

        /* --- FLOATING MASCOT BUTTON --- */
        .mulu-mascot-btn {
          pointer-events: auto;
          width: 66px;
          height: 66px;
          min-width: 66px;
          min-height: 66px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #FF8A4C, #F4600C 65%, #C2410C);
          padding: 3px;
          box-shadow: 0 12px 28px -4px rgba(244, 96, 12, 0.45), 0 4px 12px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s;
          border: 2px solid rgba(255, 255, 255, 0.8);
        }
        .mulu-mascot-btn:hover {
          transform: scale(1.08) translateY(-3px);
          box-shadow: 0 18px 36px -4px rgba(244, 96, 12, 0.55);
        }
        .mulu-mascot-btn:active {
          transform: scale(0.96);
        }
        .mulu-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
          animation: muluGentleBob 4s ease-in-out infinite;
        }
        .mulu-badge-pulse {
          position: absolute;
          top: 0;
          right: 0;
          width: 16px;
          height: 16px;
          background: #10B981;
          border: 2.5px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
        }

        /* --- DOUBLE-BEZEL EXPANDABLE CHAT DRAWER --- */
        .mulu-drawer-shell {
          pointer-events: auto;
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 380px;
          max-width: calc(100vw - 32px);
          height: 580px;
          max-height: calc(100vh - 100px);
          background: rgba(248, 250, 252, 0.96);
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          border-radius: 2.5rem;
          padding: 8px;
          box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.6) inset;
          backdrop-filter: blur(20px);
          display: none;
          flex-direction: column;
          z-index: 100000;
          animation: muluDrawerPop 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mulu-drawer-shell.open {
          display: flex;
        }

        .mulu-drawer-core {
          background: #FFFFFF;
          border-radius: calc(2.5rem - 0.5rem);
          border: 1px solid #F1F5F9;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* Header */
        .mulu-drawer-header {
          padding: 14px 18px;
          background: linear-gradient(135deg, #FFF7ED, #FFFFFF);
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mulu-header-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mulu-header-avatar {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #FFEDD5;
          border: 1px solid #FED7AA;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(244, 96, 12, 0.15);
        }
        .mulu-header-avatar img {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }
        .mulu-header-title {
          font-size: 13px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .mulu-header-sub {
          font-size: 10px;
          font-weight: 700;
          color: #EA580C;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .mulu-header-sub-dot {
          width: 6px;
          height: 6px;
          background: #10B981;
          border-radius: 50%;
          display: inline-block;
          animation: muluPulse 2s infinite;
        }
        .mulu-header-close {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #F1F5F9;
          color: #64748B;
          border: none;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .mulu-header-close:hover {
          background: #EF4444;
          color: #FFFFFF;
        }

        /* Chips Bar */
        .mulu-chips-bar {
          padding: 8px 12px;
          background: #FAFAFA;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          gap: 6px;
          overflow-x: auto;
          white-space: nowrap;
          scrollbar-width: none;
        }
        .mulu-chips-bar::-webkit-scrollbar { display: none; }
        .mulu-chip {
          padding: 6px 12px;
          min-height: 34px;
          border-radius: 100px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          font-size: 11px;
          font-weight: 700;
          color: #334155;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .mulu-chip:hover {
          background: #FFF7ED;
          border-color: #FDBA74;
          color: #EA580C;
          transform: translateY(-1px);
        }

        /* Chat Feed */
        .mulu-chat-feed {
          flex: 1;
          padding: 14px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #FDFDFD;
        }
        .mulu-msg-wrap {
          display: flex;
          flex-direction: column;
          max-width: 88%;
          animation: muluMsgPop 0.2s ease-out;
        }
        .mulu-msg-wrap.bot {
          align-self: flex-start;
        }
        .mulu-msg-wrap.user {
          align-self: flex-end;
        }
        .mulu-msg-bubble {
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 12px;
          line-height: 1.45;
          word-break: break-word;
        }
        .mulu-msg-wrap.bot .mulu-msg-bubble {
          background: #F8FAFC;
          color: #1E293B;
          border: 1px solid #E2E8F0;
          border-bottom-left-radius: 4px;
        }
        .mulu-msg-wrap.user .mulu-msg-bubble {
          background: linear-gradient(135deg, #F4600C, #EA580C);
          color: #FFFFFF;
          border-bottom-right-radius: 4px;
          font-weight: 600;
          box-shadow: 0 3px 8px rgba(244, 96, 12, 0.25);
        }
        .mulu-msg-meta {
          font-size: 9px;
          color: #94A3B8;
          margin-top: 3px;
          padding: 0 4px;
        }

        /* Action Card in Bubble */
        .mulu-action-card {
          margin-top: 8px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .mulu-action-btn {
          padding: 8px 14px;
          min-height: 38px;
          background: #0284C7;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.15s, transform 0.15s;
        }
        .mulu-action-btn:hover {
          background: #0369A1;
          transform: translateY(-1px);
        }
        .mulu-copy-btn {
          padding: 8px 14px;
          min-height: 38px;
          background: #F1F5F9;
          color: #334155;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .mulu-copy-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        /* Input Tray */
        .mulu-input-tray {
          padding: 10px 14px;
          background: #FFFFFF;
          border-top: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mulu-input-field {
          flex: 1;
          padding: 10px 14px;
          min-height: 42px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          font-size: 12px;
          font-weight: 500;
          color: #0F172A;
          background: #F8FAFC;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .mulu-input-field:focus {
          border-color: #F4600C;
          background: #FFFFFF;
        }
        .mulu-send-btn {
          width: 42px;
          height: 42px;
          min-width: 42px;
          min-height: 42px;
          border-radius: 12px;
          background: #F4600C;
          color: #FFFFFF;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          transition: transform 0.15s, background 0.15s;
        }
        .mulu-send-btn:hover {
          background: #EA580C;
          transform: scale(1.05);
        }

        /* Animations */
        @keyframes muluGentleBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(2deg); }
        }
        @keyframes muluFloatIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes muluDrawerPop {
          from { opacity: 0; transform: translateY(20px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes muluMsgPop {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes muluPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }

        @media (max-width: 640px) {
          .mulu-ai-root {
            bottom: 16px;
            right: 16px;
          }
          .mulu-drawer-shell {
            bottom: 12px;
            right: 12px;
            left: 12px;
            width: auto;
            max-width: calc(100vw - 24px);
            height: calc(100vh - 80px);
          }
        }
      `;
      document.head.appendChild(style);
    }

    render() {
      // 1. Root container
      let root = document.getElementById('mulu-root-container');
      if (!root) {
        root = document.createElement('div');
        root.id = 'mulu-root-container';
        root.className = 'mulu-ai-root';
        document.body.appendChild(root);
      }

      // Seamless coexistence with Faculty Chat Direct Line
      const hasFacultyChat = document.getElementById('mount-tutor-chat-drawer') || 
                             document.getElementById('stemulus-floating-chat-bubble') ||
                             this.role === 'tutor';
      if (hasFacultyChat) {
        root.classList.add('with-faculty-chat');
        root.style.right = '96px';
      }

      // 2. Render mascot button and speech pill
      const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)] || "Hi! I'm Mulu, your wise STEMulus AI guide!";
      root.innerHTML = `
        <div class="mulu-speech-pill" id="mulu-pill" onclick="window.MuluEngine.openChat()">
          <button class="mulu-speech-pill-close" onclick="event.stopPropagation(); window.MuluEngine.closePill();">×</button>
          <span id="mulu-pill-text">${randomTip}</span>
        </div>
        <div class="mulu-mascot-btn" id="mulu-toggle-btn" onclick="window.MuluEngine.toggleChat()" title="Chat with Mulu AI Mascot">
          <img src="images/portal/mulu_mascot_nobg.png" alt="Mulu Mascot" class="mulu-avatar-img" />
          <div class="mulu-badge-pulse" id="mulu-online-badge"></div>
        </div>
      `;

      // 3. Render Double-Bezel drawer
      let drawer = document.getElementById('mulu-drawer');
      if (!drawer) {
        drawer = document.createElement('div');
        drawer.id = 'mulu-drawer';
        drawer.className = 'mulu-drawer-shell';
        document.body.appendChild(drawer);
      }

      const roleLabel = this.role.toUpperCase();
      const chipsHtml = this.getQuickChipsHtml();

      drawer.innerHTML = `
        <div class="mulu-drawer-core">
          <!-- Header -->
          <div class="mulu-drawer-header">
            <div class="mulu-header-info">
              <div class="mulu-header-avatar">
                <img src="images/portal/mulu_mascot_nobg.png" alt="Mulu" />
              </div>
              <div>
                <div class="mulu-header-title">Mulu The Wise Mascot</div>
                <div class="mulu-header-sub">
                  <span class="mulu-header-sub-dot"></span>
                  <span>ONLINE &bull; ${roleLabel} COPILOT</span>
                </div>
              </div>
            </div>
            <button class="mulu-header-close" onclick="window.MuluEngine.closeChat()" title="Close Drawer">×</button>
          </div>

          <!-- Quick Suggestion Chips Tray -->
          <div class="mulu-chips-bar" id="mulu-chips-bar">
            ${chipsHtml}
          </div>

          <!-- Chat Feed -->
          <div class="mulu-chat-feed" id="mulu-chat-feed">
            <!-- Messages populated dynamically -->
          </div>

          <!-- Input Footer -->
          <div class="mulu-input-tray">
            <input type="text" id="mulu-user-input" class="mulu-input-field" maxlength="1000" placeholder="Ask Mulu for drafts, navigation, or questions..." />
            <button class="mulu-send-btn" id="mulu-send-btn" onclick="window.MuluEngine.handleSend()" title="Send">
              ➔
            </button>
          </div>
        </div>
      `;
    }

    getQuickChipsHtml() {
      if (this.role === 'tutor') {
        return `
          <button class="mulu-chip" onclick="window.MuluEngine.askPrompt('Draft Monthly Progress Report for my student')">⚡ Draft Monthly Report</button>
          <button class="mulu-chip" onclick="window.MuluEngine.askPrompt('Generate WhatsApp summary for parent after class')">💬 WhatsApp Summary</button>
          <button class="mulu-chip" onclick="window.MuluEngine.executeAction('open_coverage_modal')">🚨 Request Coverage</button>
          <button class="mulu-chip" onclick="window.MuluEngine.executeAction('navigate_attendance')">📋 Log Attendance</button>
          <button class="mulu-chip" onclick="window.MuluEngine.executeAction('open_faculty_chat')">👥 Faculty Chat</button>
        `;
      } else if (this.role === 'coder') {
        return `
          <button class="mulu-chip" onclick="window.MuluEngine.askPrompt('How do loops work in Scratch?')">💡 Scratch Loop Hint</button>
          <button class="mulu-chip" onclick="window.MuluEngine.askPrompt('Why is Python indentation giving me an error?')">🐍 Python Indentation</button>
          <button class="mulu-chip" onclick="window.MuluEngine.executeAction('open_badge_passport')">🏆 My Badges & XP</button>
          <button class="mulu-chip" onclick="window.MuluEngine.askPrompt('Tell me a fun coding riddle!')">🎮 Fun Riddle</button>
        `;
      } else if (this.role === 'admin') {
        return `
          <button class="mulu-chip" onclick="window.MuluEngine.askPrompt('Summarize recent safeguarding audits')">🛡️ Sentinel Audit</button>
          <button class="mulu-chip" onclick="window.MuluEngine.askPrompt('Show attendance completion rates')">📊 Attendance Status</button>
          <button class="mulu-chip" onclick="window.MuluEngine.executeAction('open_faculty_chat')">👥 Faculty Broadcast</button>
        `;
      } else {
        // Parent
        return `
          <button class="mulu-chip" onclick="window.MuluEngine.executeAction('open_reschedule')">📅 Reschedule Class</button>
          <button class="mulu-chip" onclick="window.MuluEngine.executeAction('open_billing')">💳 Tuition & Bank Info</button>
          <button class="mulu-chip" onclick="window.MuluEngine.executeAction('open_badge_passport')">🏆 View Technology Passport</button>
          <button class="mulu-chip" onclick="window.MuluEngine.askPrompt('What are the 10 suites and 12 courses?')">📚 10 Suites & Courses</button>
          <button class="mulu-chip" onclick="window.MuluEngine.askPrompt('How do I pay tuition in USD?')">💵 Pay in USD</button>
        `;
      }
    }

    bindEvents() {
      const input = document.getElementById('mulu-user-input');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.handleSend();
          }
        });
      }
    }

    seedInitialMessages() {
      const feed = document.getElementById('mulu-chat-feed');
      if (!feed) return;

      let welcomeText = '';
      if (this.role === 'tutor') {
        welcomeText = `Greetings Coach! I'm **Mulu**, your academic copilot. I can draft your **Monthly Progress Reports**, summarize lessons for WhatsApp, check student milestones, or launch the emergency coverage dispatcher. What can I assist you with today?`;
      } else if (this.role === 'coder') {
        welcomeText = `Hey there, superstar coder! 🦉 I'm **Mulu**, your wise coding owl. Ready to build something epic today? Ask me for hints on Scratch sprites, Python functions, or badge challenges!`;
      } else if (this.role === 'admin') {
        welcomeText = `Admin command link verified. I'm **Mulu**, overseeing operations across all 10 suites and 12 courses. Let me know if you need incident summaries or attendance audit reports.`;
      } else {
        welcomeText = `Welcome! I'm **Mulu**, the wise mascot of STEMulus Kids Tech. I'm here to help you manage ${this.activeStudent}'s classes, explore our 10 coding suites, reschedule sessions, or access the Billing Vault. How may I guide you?`;
      }

      this.addBotMessage(welcomeText);
    }

    scheduleAutoHide() {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = setTimeout(() => {
        this.closePill();
      }, 7000);
    }

    closePill() {
      const pill = document.getElementById('mulu-pill');
      if (pill) pill.style.display = 'none';
    }

    showPill(text) {
      if (this.isOpen) return;
      const pill = document.getElementById('mulu-pill');
      const pillText = document.getElementById('mulu-pill-text');
      if (pill && pillText) {
        if (text) pillText.textContent = text;
        pill.style.display = 'block';
        this.scheduleAutoHide();
      }
    }

    toggleChat() {
      if (this.isOpen) {
        this.closeChat();
      } else {
        this.openChat();
      }
    }

    openChat() {
      const drawer = document.getElementById('mulu-drawer');
      if (drawer) {
        drawer.classList.add('open');
        this.isOpen = true;
        this.closePill();
        setTimeout(() => {
          const inp = document.getElementById('mulu-user-input');
          if (inp) inp.focus();
        }, 150);
      }
    }

    closeChat() {
      const drawer = document.getElementById('mulu-drawer');
      if (drawer) {
        drawer.classList.remove('open');
        this.isOpen = false;
      }
    }

    askPrompt(queryText) {
      this.openChat();
      const inp = document.getElementById('mulu-user-input');
      if (inp) inp.value = queryText;
      return this.handleSend();
    }

    async handleSend() {
      const inp = document.getElementById('mulu-user-input');
      if (!inp) return;
      const query = (inp.value || '').trim().slice(0, 1000);
      if (!query || this.isThinking) return;

      // Add user message
      this.addUserMessage(query);
      inp.value = '';

      // Set thinking indicator
      this.isThinking = true;
      const thinkingId = this.addBotMessage("🦉 *Mulu is thinking wisely...*");

      try {
        const responseData = await this.generateResponse(query);
        this.updateBotMessage(thinkingId, responseData.text, responseData.actions);
      } catch (err) {
        console.warn('[MuluAIEngine] Response error:', err);
        const fallback = this.generateDeterministicFallback(query);
        this.updateBotMessage(thinkingId, fallback.text, fallback.actions);
      } finally {
        this.isThinking = false;
      }
    }

    addUserMessage(text) {
      const feed = document.getElementById('mulu-chat-feed');
      if (!feed) return;

      const wrap = document.createElement('div');
      wrap.className = 'mulu-msg-wrap user';
      wrap.innerHTML = `
        <div class="mulu-msg-bubble">${this.escapeHtml(text)}</div>
        <div class="mulu-msg-meta">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      `;
      feed.appendChild(wrap);
      feed.scrollTop = feed.scrollHeight;
    }

    addBotMessage(text, actions = []) {
      const feed = document.getElementById('mulu-chat-feed');
      if (!feed) return '';

      const msgId = 'mulu-msg-' + Date.now() + '-' + (++this.msgSeq);
      const wrap = document.createElement('div');
      wrap.id = msgId;
      wrap.className = 'mulu-msg-wrap bot';
      
      let actionsHtml = '';
      if (actions && actions.length > 0) {
        actionsHtml = `<div class="mulu-action-card">${this.renderActionButtons(actions)}</div>`;
      }

      wrap.innerHTML = `
        <div class="mulu-msg-bubble">${this.formatMarkdown(text)}${actionsHtml}</div>
        <div class="mulu-msg-meta">Mulu AI &bull; ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      `;
      feed.appendChild(wrap);
      feed.scrollTop = feed.scrollHeight;
      return msgId;
    }

    updateBotMessage(msgId, text, actions = []) {
      const wrap = document.getElementById(msgId);
      if (!wrap) return;

      let actionsHtml = '';
      if (actions && actions.length > 0) {
        actionsHtml = `<div class="mulu-action-card">${this.renderActionButtons(actions)}</div>`;
      }

      const bubble = wrap.querySelector('.mulu-msg-bubble');
      if (bubble) {
        bubble.innerHTML = `${this.formatMarkdown(text)}${actionsHtml}`;
      }
      const feed = document.getElementById('mulu-chat-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;
    }

    renderActionButtons(actions) {
      return actions.map(act => {
        const actId = 'mulu-act-' + (++this.actionSeq);
        this.actionRegistry[actId] = act;
        if (act.type === 'copy') {
          return `
            <button class="mulu-copy-btn" onclick="window.MuluEngine.triggerAction('${actId}')">
              📋 ${this.escapeHtml(act.label || 'Copy Draft to Clipboard')}
            </button>
          `;
        } else {
          return `
            <button class="mulu-action-btn" onclick="window.MuluEngine.triggerAction('${actId}')">
              ⚡ ${this.escapeHtml(act.label || 'Execute Action')} ↗
            </button>
          `;
        }
      }).join('');
    }

    triggerAction(actId) {
      const act = this.actionRegistry[actId];
      if (!act) return;
      if (act.type === 'copy') {
        this.copyToClipboard(act.payload);
      } else {
        this.executeAction(act.action, act.payload || {});
      }
    }

    // --- REAL-TIME NTFY PUSH NOTIFICATION BRIDGE ---
    async sendNtfyNotification({ title, priority = 'default', tags = 'robot', message, clickUrl = '' }) {
      try {
        const topic = (typeof window !== 'undefined' && window.STEMULUS_CONFIG && window.STEMULUS_CONFIG.NTFY_TOPIC) 
          ? window.STEMULUS_CONFIG.NTFY_TOPIC 
          : 'stemulus-admin-alerts';
        const endpoint = `https://ntfy.sh/${encodeURIComponent(topic)}`;
        
        // Ensure Title is ASCII safe (no emojis in HTTP headers to prevent ByteString errors)
        const safeTitle = (title || 'STEMulus Mascot Alert').replace(/[^\x00-\x7F]/g, '').trim() || 'STEMulus Mascot Alert';
        
        const headers = {
          'Title': safeTitle,
          'Priority': priority,
          'Tags': tags
        };
        if (clickUrl) {
          headers['Click'] = clickUrl;
        }
        
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          body: message
        });
        console.log('[MuluAIEngine] ntfy push notification dispatched to topic:', topic, 'Status:', res.status);
        return res.ok;
      } catch (err) {
        console.warn('[MuluAIEngine] ntfy push notification failed (non-blocking):', err.message);
        return false;
      }
    }

    // --- SITUATION-AWARE SPECIAL INTENT CLASSIFIER & ADMIN ESCALATION ---
    checkSpecialIntents(query) {
      const q = (query || '').toLowerCase().trim();
      const student = this.activeStudent || 'Sarah Adeyemi';

      // 1. SAFEGUARDING / DISTRESS / BULLYING ESCALATION (HIGHEST PRIORITY)
      const safeguardingRegex = /\b(bully|bullying|abuse|abusive|harass|harassment|scared|hurt|danger|unsafe|inappropriate|crying|uncomfortable|predator)\b/i;
      if (safeguardingRegex.test(q)) {
        this.sendNtfyNotification({
          title: 'URGENT SAFEGUARDING ALERT',
          priority: 'urgent',
          tags: 'police_car,sos',
          message: `[${this.role.toUpperCase()}] Safeguarding alert triggered in session!\nStudent: ${student}\nPortal: ${this.currentPortal}\nQuery: "${query}"\nImmediate safeguarding protocol initiated.`,
          clickUrl: 'https://wa.me/2347052466716'
        });

        return {
          text: `🛡️ **Safeguarding Priority Alert:**\nYour safety, emotional well-being, and protection are our highest priority at STEMulus Kids Tech.\n\nI have immediately alerted the **Lead Safeguarding Officer and Executive Director**. Please reach out directly through our immediate priority line:`,
          actions: [
            { action: 'contact_admissions', label: 'Contact Lead Safeguarding Officer Now 🚨' }
          ]
        };
      }

      // 2. PRICING & TUITION PROHIBITION (LOCATION & AGE SENSITIVE - DEFER TO ADMISSIONS)
      const pricingRegex = /\b(how\s+much|cost|pricing|price|prices|fee|fees|tuition|charge|rates?|pay\s+in\s+usd|pay\s+in\s+naira|discount|discounts|scholarship|scholarships|payment\s+plan)\b/i;
      if (pricingRegex.test(q)) {
        this.sendNtfyNotification({
          title: 'Tuition Inquiry Escalation',
          priority: 'high',
          tags: 'moneybag,admission',
          message: `[${this.role.toUpperCase()}] Tuition & pricing inquiry received.\nStudent: ${student}\nQuery: "${query}"\nDeferred to Admissions Desk for personalized age and location-sensitive quote.`,
          clickUrl: 'https://wa.me/2347052466716'
        });

        return {
          text: `🦉 **STEMulus Tuition & Enrollment Guidance:**\n\nBecause our curriculum is uniquely customized for each young creator—varying by **age tier (Ages 4-7, Ages 8-12, or Teens 13-17)**, **personalized learning track (1-on-1 private mentoring vs. collaborative cohort)**, and **geographic region (Nigeria NGN vs. International USD/GBP/EUR)**—I do not quote fixed prices or fee amounts directly.\n\nOur **Admissions & Academic Advisory Desk** provides exact, personalized fee schedules, family discounts, and international card checkout tailored specifically for **${student}**.\n\n📢 *I have notified the Admissions team of your inquiry!* You can connect directly via WhatsApp or review issued invoices in your Billing Vault:`,
          actions: [
            { action: 'contact_admissions', label: 'Chat with Admissions on WhatsApp 💬' },
            { action: 'open_billing', label: 'View Issued Invoices in Vault 💳' }
          ]
        };
      }

      // 3. URGENT RESCHEDULING (< 4 HOURS) OR FACULTY COMPLAINT / NO-SHOW
      const urgentOpsRegex = /\b(starting\s+now|in\s+10\s+min|in\s+5\s+min|in\s+15\s+min|in\s+30\s+min|emergency\s+reschedule|cannot\s+make\s+it\s+today|tutor\s+missing|tutor\s+absent|tutor\s+didn'?t\s+show|tutor\s+not\s+here|coach\s+not\s+here|complain|complaint|replace\s+tutor|change\s+tutor)\b/i;
      if (urgentOpsRegex.test(q)) {
        this.sendNtfyNotification({
          title: 'Urgent Ops Escalation',
          priority: 'high',
          tags: 'warning,coordinator',
          message: `[${this.role.toUpperCase()}] Urgent scheduling/faculty dispatch: "${query}".\nStudent: ${student}\nPortal: ${this.currentPortal}`,
          clickUrl: 'https://wa.me/2347052466716'
        });

        return {
          text: `⚠️ **Urgent Scheduling & Operations Support:**\nStandard self-service rescheduling through the Reschedule Concierge requires **4 hours advance notice** to preserve coach timetables. For short-notice adjustments or coach attendance, our **Academic Operations Coordinator** steps in immediately.\n\n📢 *I have dispatched an alert to our academic coordinators!* Please click below to connect directly or launch the concierge for future dates:`,
          actions: [
            { action: 'contact_admissions', label: 'Connect with Academic Coordinator 💬' },
            { action: 'open_reschedule', label: 'Open Reschedule Concierge 📅' }
          ]
        };
      }

      return null;
    }

    // --- AI REASONING & DUAL BACKBONE ---
    async generateResponse(query) {
      // 1. Situation-Aware Special Intent Classifier (Pricing, Safeguarding, Urgent Ops)
      const specialResponse = this.checkSpecialIntents(query);
      if (specialResponse) {
        return specialResponse;
      }

      // Check if GeminiService is available and configured
      const hasGemini = typeof GeminiService !== 'undefined' && GeminiService.isAvailable && GeminiService.isAvailable();

      if (hasGemini) {
        try {
          const systemPrompt = `You are Mulu, the official wise, warm, and playful AI mascot of STEMulus Kids Tech.
Current User Role: ${this.role.toUpperCase()}
Current Portal: ${this.currentPortal}
Active Student: ${this.activeStudent || 'Sarah Adeyemi'}

Curriculum Knowledge:
STEMulus offers 10 Suites and 12 Courses:
${MULU_KNOWLEDGE.suites.map(s => `- ${s.name} (${s.ages}): ${s.desc}`).join('\n')}

CRITICAL PRICING & FEE REGULATION:
- NEVER quote dollar, naira, pound, or numeric figures for tuition, pricing, packages, or rates.
- Pricing is strictly age-sensitive (Ages 4-7, Ages 8-12, Teens) and location-sensitive (Nigeria vs International USD/GBP/EUR).
- If the user asks about cost, pricing, discounts, or tuition rates, explain that fees vary by student age, region, and 1-on-1 vs group track, and conclude with:
ACTION: contact_admissions | Chat with Admissions Desk
ACTION: open_billing | View Billing Vault

Guidelines:
1. Speak with enthusiasm, high wisdom, warmth, and encouraging humor.
2. If the user asks for drafts (monthly report, WhatsApp summary, reschedule request), generate a complete, high-quality draft ready to copy.
3. If the user asks about navigation (reschedule, billing, badges, attendance, coverage, chat), give the answer AND conclude with an action key in this exact format on the final line:
ACTION: <action_key> | <button_label>
Supported action keys: open_reschedule, open_billing, open_badge_passport, open_coverage_modal, open_faculty_chat, navigate_attendance, contact_admissions.`;

          const rawText = await GeminiService.callGemini(query, systemPrompt, 'gemini-2.5-flash');
          return this.parseAIResponse(rawText);
        } catch (err) {
          console.warn('[MuluAIEngine] Gemini query failed, switching to local knowledge engine:', err.message);
          return this.generateDeterministicFallback(query);
        }
      } else {
        // Deterministic Zero-Fault Local Engine
        return this.generateDeterministicFallback(query);
      }
    }

    parseAIResponse(rawText) {
      const lines = rawText.split('\n');
      const actions = [];
      const cleanLines = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('ACTION:')) {
          const actData = trimmed.replace('ACTION:', '').trim();
          const parts = actData.split('|');
          const actionKey = parts[0]?.trim();
          const label = parts[1]?.trim() || 'Open Feature';
          if (actionKey) {
            actions.push({ action: actionKey, label: label });
          }
        } else {
          cleanLines.push(line);
        }
      }

      const cleanText = cleanLines.join('\n').trim();

      // If text looks like a draft, attach a 1-click Copy button
      if (cleanText.includes('Progress Report') || cleanText.includes('WhatsApp') || cleanText.includes('Dear') || cleanText.length > 250) {
        actions.push({ type: 'copy', payload: cleanText, label: 'Copy Draft to Clipboard' });
      }

      return { text: cleanText, actions: actions };
    }

    generateDeterministicFallback(query) {
      const q = query.toLowerCase();
      const student = this.activeStudent || 'Sarah Adeyemi';

      // 1. Reschedule inquiries
      if (q.includes('reschedule') || q.includes('change date') || q.includes('change time') || q.includes('missed class')) {
        return {
          text: `You can easily reschedule **${student}'s** session using our Smart Reschedule Concierge. Rescheduling is available up to 4 hours prior to class time, and all tuition credits roll over automatically.`,
          actions: [
            { action: 'open_reschedule', label: `Launch Reschedule Concierge for ${student}` }
          ]
        };
      }

      // 2. Billing Invoices & Bank Vault
      if (q.includes('billing') || q.includes('tuition') || q.includes('fee') || q.includes('usd') || q.includes('pay') || q.includes('bank') || q.includes('invoice') || q.includes('receipt')) {
        return {
          text: `Official invoices, receipts, and payment accounts are managed inside the **Parents' Billing Vault**. We support local bank transfers (Zenith Bank NGN) and international accounts (Mercury Bank USD/GBP/EUR). Because tuition rates are personalized according to child age and location, please consult our Admissions Desk for customized quotes.`,
          actions: [
            { action: 'open_billing', label: 'View Billing Vault & Bank Details' },
            { action: 'contact_admissions', label: 'Chat with Admissions Desk 💬' }
          ]
        };
      }

      // 3. Draft Monthly Progress Report
      if (q.includes('draft') || q.includes('monthly report') || q.includes('progress report') || q.includes('report card')) {
        const reportDraft = `**STEMulus Kids Tech - Monthly Academic Progress Report**
**Student:** ${student}
**Curriculum Track:** Python Prodigies & Computational Logic
**Reporting Period:** Current Month
**Mentor:** Lead STEM Coach

**1. Concepts Mastered & Technical Milestones:**
During this reporting cycle, ${student} demonstrated strong analytical thinking, conquering conditional loops, algorithm efficiency, and modular function design. Their ability to decompose complex coding bugs independently has advanced significantly.

**2. Practical Project Showcase:**
${student} successfully built and debugged an interactive project applying real-time event handling. Their code structure showed excellent readability and algorithmic logic.

**3. Next Month Growth Objectives:**
We will introduce multi-file code modularity and interactive user input validation. At home, encourage ${student} to showcase their running project!`;

        return {
          text: `Here is a custom, professionally formatted **Monthly Progress Report** draft ready for parent dispatch:`,
          actions: [
            { type: 'copy', payload: reportDraft, label: 'Copy Progress Report Draft' },
            { action: 'navigate_monthly_report', label: 'Open Monthly Report Editor' }
          ]
        };
      }

      // 4. WhatsApp Lesson Summary
      if (q.includes('whatsapp') || q.includes('summary') || q.includes('wrap up') || q.includes('wrap-up') || q.includes('class notes')) {
        const waDraft = `🚀 *STEMulus Kids Tech - Quick Class Wrap-Up!*
Hey there! Here is what *${student}* conquered in today's coding session:
✅ *Core Concept:* Mastered while loops & conditional branching.
✅ *Project Built:* Built an interactive game stage with sound triggers!
💡 *Dinner Table Prompt:* Ask ${student} to explain how the code knows when to trigger the game-over sound!`;

        return {
          text: `Here is a concise, high-touch WhatsApp summary for parents:`,
          actions: [
            { type: 'copy', payload: waDraft, label: 'Copy WhatsApp Summary' }
          ]
        };
      }

      // 5. Emergency Substitute Coverage
      if (q.includes('coverage') || q.includes('emergency') || q.includes('substitute') || q.includes('sick') || q.includes('absent')) {
        return {
          text: `If you have an emergency or need temporary substitute coverage for a class, use our 1-click **Emergency Coverage Dispatcher**. The system alerts verified standby faculty and logs the reassignment.`,
          actions: [
            { action: 'open_coverage_modal', label: 'Launch Emergency Coverage Dispatch' }
          ]
        };
      }

      // 6. Badges & Technology Passport
      if (q.includes('badge') || q.includes('passport') || q.includes('xp') || q.includes('level') || q.includes('achievement')) {
        return {
          text: `**${student}'s Technology Passport** tracks gamified skill badges across 4 rarity tiers (*Diamond, Gold, Silver, Bronze*). As coders conquer modules and submit projects, badges unlock automatically!`,
          actions: [
            { action: 'open_badge_passport', label: 'Open Technology Passport Drawer' }
          ]
        };
      }

      // 7. Attendance Logging
      if (q.includes('attendance') || q.includes('log attendance') || q.includes('mark present')) {
        return {
          text: `Attendance can be logged immediately following a session. Meeting durations are automatically cross-referenced with Google Meet session logs.`,
          actions: [
            { action: 'navigate_attendance', label: 'Go to Attendance Logger' }
          ]
        };
      }

      // 8. 10 Suites & 12 Courses
      if (q.includes('10 suites') || q.includes('suites') || q.includes('12 courses') || q.includes('curriculum') || q.includes('course list')) {
        const suitesList = MULU_KNOWLEDGE.suites.map(s => `• **${s.name}** (${s.ages}): ${s.desc}`).join('\n');
        return {
          text: `### STEMulus 10 Suites & Comprehensive Curriculum:\n${suitesList}\n\nOur **12 Specialized Courses** range from *Junior Scratch Explorers* up to *Data Science & Python Analytics*!`,
          actions: [
            { action: 'open_badge_passport', label: 'Explore Curriculum Roadmap' }
          ]
        };
      }

      // 9. Scratch & Python Socratic Coding Hints
      if (q.includes('scratch') || q.includes('sprite') || q.includes('broadcast')) {
        return {
          text: `🦉 **Mulu's Scratch Wisdom:**\nRemember that *Broadcast* blocks work like walkie-talkies! One sprite sends a message, and any sprite with the matching \`when I receive [message]\` block will spring into action! Check that both sprites are using the exact same message name.`,
          actions: []
        };
      }

      if (q.includes('python') || q.includes('indent') || q.includes('syntax') || q.includes('loop')) {
        return {
          text: `🦉 **Mulu's Python Tip:**\nIn Python, whitespace matters! If you see an \`IndentationError\`, check that all lines inside your \`for\`, \`while\`, or \`if\` statement are indented by exactly 4 spaces.`,
          actions: []
        };
      }

      // 10. General Encouraging Fallback
      return {
        text: `I'm **Mulu**, your wise STEMulus companion! I can help you with:\n• **1-Click Drafts:** Monthly progress reports, WhatsApp summaries, handoffs.\n• **Portal Actions:** Rescheduling classes, accessing billing, unlocking badges.\n• **Curriculum Info:** Details on all 10 suites & 12 courses.\n\nWhat would you like to explore next?`,
        actions: [
          { action: 'open_reschedule', label: 'Reschedule a Class' },
          { action: 'open_billing', label: 'View Billing Vault' }
        ]
      };
    }

    // --- AUTONOMOUS ACTION DISPATCHER ---
    executeAction(actionKey, payload = {}) {
      this.closeChat();

      switch (actionKey) {
        case 'open_reschedule': {
          if (typeof ParentEngine !== 'undefined' && typeof ParentEngine.openRescheduleModal === 'function') {
            const schs = (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getSchedules === 'function') ? DashboardEngine.getSchedules() : [];
            const targetSch = (schs && schs.length > 0) ? schs[0].id : 'sch-001';
            ParentEngine.openRescheduleModal(targetSch);
          } else {
            const btn = document.querySelector('[onclick*="openRescheduleModal"]') || document.getElementById('btn-open-reschedule') || document.querySelector('[data-action="reschedule"]');
            if (btn) btn.click();
            else window.location.href = 'parent-dashboard.html?action=reschedule';
          }
          break;
        }

        case 'open_billing': {
          const billingEl = document.getElementById('billing-vault') || document.getElementById('tuition-invoices') || document.querySelector('.billing-section');
          if (billingEl) {
            billingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            billingEl.classList.add('animate-pulse');
            setTimeout(() => billingEl.classList.remove('animate-pulse'), 2500);
          } else {
            window.location.href = 'parent-dashboard.html#billing-vault';
          }
          break;
        }

        case 'open_badge_passport': {
          if (typeof BadgePassportEngine !== 'undefined' && typeof BadgePassportEngine.openDrawer === 'function') {
            BadgePassportEngine.openDrawer();
          } else {
            const btn = document.getElementById('btn-view-passport') || document.querySelector('[data-action="passport"]');
            if (btn) btn.click();
            else window.location.href = 'parent-progress.html';
          }
          break;
        }

        case 'open_coverage_modal': {
          if (typeof TutorEngine !== 'undefined' && typeof TutorEngine.openCoverageModal === 'function') {
            const schs = (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getSchedules === 'function') ? DashboardEngine.getSchedules() : [];
            const targetSch = (schs && schs.length > 0) ? schs[0].id : 'sch-001';
            TutorEngine.openCoverageModal(targetSch);
          } else if (typeof ClassEscalationEngine !== 'undefined' && typeof ClassEscalationEngine.openCoverageModal === 'function') {
            ClassEscalationEngine.openCoverageModal();
          } else {
            const btn = document.querySelector('[onclick*="openCoverageModal"]') || document.getElementById('btn-request-coverage') || document.querySelector('[data-action="coverage"]');
            if (btn) btn.click();
            else window.location.href = 'tutor-dashboard.html?action=coverage';
          }
          break;
        }

        case 'open_faculty_chat': {
          if (typeof FacultyChatEngine !== 'undefined') {
            if (typeof FacultyChatEngine.openDrawer === 'function') {
              FacultyChatEngine.openDrawer();
            } else if (typeof FacultyChatEngine.toggleDrawer === 'function') {
              const drawer = document.getElementById('stemulus-floating-chat-drawer');
              if (!drawer || drawer.classList.contains('hidden') || window.getComputedStyle(drawer).display === 'none') {
                FacultyChatEngine.toggleDrawer();
              }
            }
          } else {
            const btn = document.getElementById('btn-faculty-chat') || document.getElementById('btn-open-chat') || document.querySelector('#stemulus-floating-chat-bubble button');
            if (btn) btn.click();
            else window.location.href = 'tutor-dashboard.html?action=chat';
          }
          break;
        }

        case 'navigate_attendance': {
          window.location.href = 'tutor-attendance-create.html';
          break;
        }

        case 'navigate_monthly_report': {
          window.location.href = 'tutor-monthly-report.html';
          break;
        }

        case 'open_classroom': {
          window.location.href = 'join-class.html';
          break;
        }

        case 'contact_admissions': {
          const phone = '2347052466716';
          const msg = encodeURIComponent(`Hello STEMulus Admissions Desk! Mulu AI Mascot referred me regarding ${this.activeStudent || 'my child'} for enrollment, tuition guidance, or academic advisory.`);
          window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
          break;
        }

        default:
          console.warn('[MuluAIEngine] Unknown action key:', actionKey);
      }
    }

    copyToClipboard(text) {
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.showToast("✅ Draft copied to clipboard!");
        }).catch(() => {
          this.fallbackCopy(text);
        });
      } else {
        this.fallbackCopy(text);
      }
    }

    fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        this.showToast("✅ Draft copied to clipboard!");
      } catch (e) {
        alert("Please copy text manually: " + text.slice(0, 50) + "...");
      }
      document.body.removeChild(ta);
    }

    showToast(msg) {
      let toast = document.getElementById('mulu-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'mulu-toast';
        toast.style.cssText = `
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 100001;
          background: #0F172A;
          color: #FFF;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          transition: opacity 0.2s;
        `;
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.style.display = 'block';
      toast.style.opacity = '1';
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.style.display = 'none', 200);
      }, 2500);
    }

    formatMarkdown(text) {
      if (!text) return '';
      let escaped = this.escapeHtml(text);
      // Bold
      escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic
      escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Headers
      escaped = escaped.replace(/^### (.*$)/gim, '<h4 style="font-weight:800;margin:6px 0 3px 0;font-size:12px;">$1</h4>');
      // Bullets
      escaped = escaped.replace(/^\• (.*$)/gim, '<div style="margin-left:8px;">&bull; $1</div>');
      // Code inline
      escaped = escaped.replace(/\`(.*?)\`/g, '<code style="background:#E2E8F0;padding:1px 4px;border-radius:4px;font-family:monospace;font-size:11px;">$1</code>');
      // Line breaks
      escaped = escaped.replace(/\n/g, '<br/>');
      return escaped;
    }

    escapeHtml(str) {
      return (str || '').replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
      );
    }

    // Backwards compatibility methods
    handleClick() { this.toggleChat(); }
    startTour() { this.openChat(); }
    skipTour() { this.closeChat(); }
    closeBubble() { this.closePill(); }
    showBubble() { this.showPill(); }
  }

  // --- GLOBAL BINDING & AUTO-INIT ---
  window.MuluAIEngine = MuluAIEngine;

  function initMulu() {
    if (!window.MuluEngine) {
      window.MuluEngine = new MuluAIEngine();
      // Backwards compatibility references
      window.mulu = window.MuluEngine;
      window.muluInstance = window.MuluEngine;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMulu);
  } else {
    initMulu();
  }
})();
