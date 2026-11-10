/**
 * STEMulus Quest™ Zenith - Core Engine & Interactive State Controller
 * 
 * Features:
 * - Living S-Curve SVG Quest Trail with organic Bezier curves and animated particle flow
 * - Interactive Mission Detail Popover with rich previews, competencies, and time estimates
 * - Institutional 5-Axis Junior Readiness Radar (Chart.js + Native Canvas fallback)
 * - Tactile Web Audio Synthesizer (Zero-latency acoustic clicks & harmonic fanfares)
 * - Gamification HUD (Monochromatic high-contrast capsules, XP odometer, Streak tracker)
 * - Seamless postMessage completion bridge with slide decks
 * - Technology Passport (Light Evolution Eras I-VIII) synchronization
 * - Digital Academy Pass freemium entitlement integration
 */

const LmsQuestEngine = (function() {
  'use strict';

  const STORAGE_KEY = 'stemulus_lms_state';
  const CATALOG_URL = 'assets/data/curriculum-catalog.json';

  // Available Curriculum Tracks
  const TRACKS = {
    'course_fundamentals': {
      id: 'course_fundamentals',
      title: 'Fundamental Concepts of Coding',
      shortTitle: 'Fundamentals',
      subtitle: 'Early Explorers & Junior Innovators',
      icon: 'images/portal/standalone/puzzle-piece-3d.png',
      badgeAsset: 'images/portal/standalone/star-badge-3d.png',
      color: '#0284C7',
      totalLessons: 21,
      baseFolder: 'course_fundamentals'
    },
    'course_ai_studio': {
      id: 'course_ai_studio',
      title: 'Generative AI Studio: Prompt, Loop & Graph Engineering',
      shortTitle: 'AI Studio',
      subtitle: 'Prompt Engineering & Autonomous Agents',
      icon: 'images/portal/standalone/robot-3d.png',
      badgeAsset: 'images/portal/standalone/radar-chart-3d.png',
      color: '#F97316',
      totalLessons: 24,
      baseFolder: 'course_ai_studio'
    },
    'track_1_web_engineering': {
      id: 'track_1_web_engineering',
      title: 'Web & Interactive App Engineering',
      shortTitle: 'Web Apps',
      subtitle: 'HTML5, Modern CSS & JavaScript Engines',
      icon: 'images/portal/standalone/laptop-3d.png',
      badgeAsset: 'images/portal/standalone/terminal-3d.png',
      color: '#10B981',
      totalLessons: 40,
      baseFolder: 'track_1_web_engineering'
    },
    'track_2_ai_automation': {
      id: 'track_2_ai_automation',
      title: 'AI Explorers & Smart Automations',
      shortTitle: 'AI Automations',
      subtitle: 'Workflow Bots, Vision & Language Models',
      icon: 'images/portal/standalone/robot-3d.png',
      badgeAsset: 'images/portal/standalone/radar-chart-3d.png',
      color: '#8B5CF6',
      totalLessons: 32,
      baseFolder: 'track_2_ai_automation'
    },
    'track_3_product_design': {
      id: 'track_3_product_design',
      title: 'Digital Product & Game UI/UX Design',
      shortTitle: 'UI/UX Design',
      subtitle: 'Figma, Design Systems & Game Ergonomics',
      icon: 'images/portal/standalone/paintbrush-3d.png',
      badgeAsset: 'images/portal/standalone/category-labels-3d.png',
      color: '#EC4899',
      totalLessons: 32,
      baseFolder: 'track_3_product_design'
    },
    'track_4_python_data': {
      id: 'track_4_python_data',
      title: 'Python & Data Detectives',
      shortTitle: 'Python Data',
      subtitle: 'Algorithms, Data Science & Detective Scripts',
      icon: 'images/portal/standalone/code-brackets-3d.png',
      badgeAsset: 'images/portal/standalone/terminal-3d.png',
      color: '#F59E0B',
      totalLessons: 18,
      baseFolder: 'track_4_python_data'
    },
    'track_5_cybersecurity': {
      id: 'track_5_cybersecurity',
      title: 'Cyber Defenders & Ethical Hacking',
      shortTitle: 'Cyber Security',
      subtitle: 'Defensive Architecture, Ciphers & Network Ops',
      icon: 'images/portal/standalone/admin-shield-3d.png',
      badgeAsset: 'images/portal/standalone/key-3d.png',
      color: '#0D9488',
      totalLessons: 16,
      baseFolder: 'track_5_cybersecurity'
    },
    'track_6_robotics': {
      id: 'track_6_robotics',
      title: 'Robotics, Physical Computing & Autonomous AI',
      shortTitle: 'Robotics & Edge AI',
      subtitle: 'Micro:bit, Arduino, Sensors & Embedded Vision',
      icon: 'images/portal/standalone/rocket-3d.png',
      badgeAsset: 'images/portal/standalone/progress-cylinder-3d.png',
      color: '#6366F1',
      totalLessons: 32,
      baseFolder: 'track_6_robotics'
    }
  };

  // ── Tactile Web Audio Synthesizer ─────────────────────────────────────────
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const SoundFX = {
    hover: function() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(820, ctx.currentTime);
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.035);
      } catch(e) {}
    },
    click: function() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(560, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.07);
      } catch(e) {}
    },
    locked: function() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      } catch(e) {}
    },
    success: function() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
          gain.gain.setValueAtTime(0.09, ctx.currentTime + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.07);
          osc.stop(ctx.currentTime + i * 0.07 + 0.27);
        });
      } catch(e) {}
    },
    fanfare: function() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const chords = [
          { f: 523.25, t: 0 },
          { f: 659.25, t: 0.09 },
          { f: 783.99, t: 0.18 },
          { f: 1046.50, t: 0.30 },
          { f: 1318.51, t: 0.42 }
        ];
        chords.forEach(c => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(c.f, ctx.currentTime + c.t);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + c.t);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + c.t + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + c.t);
          osc.stop(ctx.currentTime + c.t + 0.42);
        });
      } catch(e) {}
    }
  };

  // State Management
  let state = null;
  let catalogData = [];
  let radarChartInstance = null;
  let activePopoverNode = null;

  function initDefaultState() {
    let studentName = 'Daniel M.';
    let studentId = 'std-1001';

    // Synchronize with DashboardEngine if user is signed into portal
    if (typeof window !== 'undefined' && window.DashboardEngine && typeof window.DashboardEngine.getCurrentUser === 'function') {
      const u = window.DashboardEngine.getCurrentUser();
      if (u) {
        studentName = (u.firstName ? u.firstName + ' ' + (u.lastName || '') : u.name) || studentName;
        studentId = u.id || studentId;
      }
    }

    return {
      studentId: studentId,
      studentName: studentName.trim(),
      activeTrack: 'course_fundamentals',
      viewMode: 'trail', // 'trail' or 'matrix'
      xp: 450,
      dailyStreak: 3,
      lastActiveDate: new Date().toISOString().split('T')[0],
      tracks: {
        'course_fundamentals': { completedLessons: [1, 2], currentLesson: 3, unlockedLessons: [1, 2, 3] },
        'course_ai_studio': { completedLessons: [1], currentLesson: 2, unlockedLessons: [1, 2] },
        'track_1_web_engineering': { completedLessons: [1, 2, 3], currentLesson: 4, unlockedLessons: [1, 2, 3, 4] },
        'track_2_ai_automation': { completedLessons: [], currentLesson: 1, unlockedLessons: [1] },
        'track_3_product_design': { completedLessons: [], currentLesson: 1, unlockedLessons: [1] },
        'track_4_python_data': { completedLessons: [], currentLesson: 1, unlockedLessons: [1] },
        'track_5_cybersecurity': { completedLessons: [], currentLesson: 1, unlockedLessons: [1] },
        'track_6_robotics': { completedLessons: [], currentLesson: 1, unlockedLessons: [1] }
      },
      competencies: {
        logic: 72,
        variables: 65,
        loops: 80,
        syntax: 62,
        capstone: 70
      },
      earnedBadges: [1, 2]
    };
  }

  function getStudentState() {
    if (state) return state;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        state = JSON.parse(raw);
        // Ensure all track keys exist
        Object.keys(TRACKS).forEach(t => {
          if (!state.tracks[t]) {
            state.tracks[t] = { completedLessons: [], currentLesson: 1, unlockedLessons: [1] };
          }
        });
        checkStreak(state);
      } else {
        state = initDefaultState();
        saveStudentState(state);
      }
    } catch(e) {
      state = initDefaultState();
    }
    return state;
  }

  function saveStudentState(newState) {
    state = newState || state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch(e) {}
  }

  function checkStreak(s) {
    const today = new Date().toISOString().split('T')[0];
    if (!s.lastActiveDate) {
      s.lastActiveDate = today;
      s.dailyStreak = 1;
      return;
    }
    if (s.lastActiveDate === today) return;

    const last = new Date(s.lastActiveDate);
    const curr = new Date(today);
    const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      s.dailyStreak = (s.dailyStreak || 1) + 1;
    } else if (diffDays > 1) {
      s.dailyStreak = 1;
    }
    s.lastActiveDate = today;
  }

  function getLevelInfo(xp) {
    if (xp < 500) {
      return { level: 1, title: 'Apprentice Coder', minXP: 0, nextXP: 500, percent: Math.round((xp / 500) * 100) };
    } else if (xp < 1500) {
      return { level: 2, title: 'Junior Architect', minXP: 500, nextXP: 1500, percent: Math.round(((xp - 500) / 1000) * 100) };
    } else if (xp < 3000) {
      return { level: 3, title: 'Senior Engineer', minXP: 1500, nextXP: 3000, percent: Math.round(((xp - 1500) / 1500) * 100) };
    } else {
      return { level: 4, title: 'Master Innovator', minXP: 3000, nextXP: 5000, percent: Math.min(100, Math.round(((xp - 3000) / 2000) * 100)) };
    }
  }

  // Load Curriculum Catalog Data
  async function loadCatalog() {
    if (typeof window !== 'undefined' && window.STEMULUS_CATALOG && Array.isArray(window.STEMULUS_CATALOG)) {
      catalogData = window.STEMULUS_CATALOG;
      return catalogData;
    }
    if (catalogData && catalogData.length > 0) return catalogData;
    try {
      const res = await fetch(CATALOG_URL);
      if (res.ok) {
        catalogData = await res.json();
        return catalogData;
      }
    } catch(e) {}

    catalogData = generateFallbackCatalog();
    return catalogData;
  }

  function generateFallbackCatalog() {
    const items = [];
    Object.keys(TRACKS).forEach(trackKey => {
      const t = TRACKS[trackKey];
      for (let i = 1; i <= t.totalLessons; i++) {
        const isCapstone = (i % 6 === 0);
        items.push({
          track_id: trackKey,
          track_title: t.title,
          num: i,
          title: isCapstone ? `Milestone Capstone: Phase ${i / 6} Challenge` : `Lesson ${i}: Engineering Practice & Applied Concepts`,
          concept_title: isCapstone ? 'Capstone Engineering' : `Module Core ${i}`,
          rel_path: `curriculum/slides/${t.baseFolder}/lesson_${String(i).padStart(2, '0')}.html`,
          hook: `Master practical hands-on principles of ${t.shortTitle} in this step-by-step interactive lab.`,
          is_capstone: isCapstone
        });
      }
    });
    return items;
  }

  function getLessonsForTrack(trackId) {
    const track = TRACKS[trackId] || TRACKS['course_fundamentals'];
    let rawLessons = catalogData.filter(item => item.track_id === trackId);
    
    if (!rawLessons || rawLessons.length === 0) {
      rawLessons = generateFallbackCatalog().filter(item => item.track_id === trackId);
    }
    
    // Assign strictly ascending unique mission numbers 1 to N based on pedagogical curriculum order
    const lessons = rawLessons.map((item, index) => {
      const missionIndex = index + 1;
      const isCapstone = (missionIndex % 6 === 0) || item.is_capstone;
      return Object.assign({}, item, {
        num: missionIndex,
        missionNum: missionIndex,
        originalNum: item.num,
        is_capstone: isCapstone
      });
    });

    return lessons;
  }

  // ── Render Top HUD Gamification Capsules ───────────────────────────────────
  function updateHUD() {
    const s = getStudentState();
    const lvl = getLevelInfo(s.xp);

    const levelElem = document.getElementById('hud-level-tag');
    const xpElem = document.getElementById('hud-xp-counter');
    const streakElem = document.getElementById('hud-streak-counter');
    const studentNameElem = document.getElementById('hud-student-name');

    if (levelElem) {
      levelElem.innerHTML = `<span class="hud-dot blue"></span><span>Lvl ${lvl.level} · ${lvl.title}</span>`;
    }
    if (xpElem) {
      xpElem.innerText = `${s.xp.toLocaleString()} XP`;
    }
    if (streakElem) {
      streakElem.innerHTML = `<span class="hud-dot orange"></span><span>${s.dailyStreak || 1}d Streak</span>`;
    }
    if (studentNameElem) studentNameElem.innerText = s.studentName;

    // Update Digital Pass status badge if available
    const passPill = document.getElementById('hud-pass-badge');
    if (passPill) {
      const hasPass = (window.StemulusPassEngine && typeof window.StemulusPassEngine.hasActivePass === 'function')
        ? window.StemulusPassEngine.hasActivePass()
        : false;
      passPill.innerHTML = hasPass
        ? `<span class="hud-dot emerald"></span><span>Digital Pass Active</span>`
        : `<span class="hud-dot orange"></span><span>Free Starter Pass</span>`;
    }

    // Update Progress bar on active track
    updateTrackProgress(s.activeTrack);
  }

  function updateTrackProgress(trackId) {
    const s = getStudentState();
    const trackState = s.tracks[trackId] || { completedLessons: [] };
    const lessons = getLessonsForTrack(trackId);
    const completedCount = trackState.completedLessons.length;
    const totalCount = lessons.length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const progressPercentText = document.getElementById('track-progress-percent');
    const progressFill = document.getElementById('track-progress-fill');

    if (progressPercentText) {
      progressPercentText.innerText = `${completedCount} / ${totalCount} Missions (${percent}%)`;
    }
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
  }

  // ── Render Living S-Curve Quest Trail ──────────────────────────────────────
  function renderQuestTrail(trackId) {
    const container = document.getElementById('quest-trail-container');
    if (!container) return;

    const s = getStudentState();
    const trackState = s.tracks[trackId] || { completedLessons: [], currentLesson: 1, unlockedLessons: [1] };
    const lessons = getLessonsForTrack(trackId);

    // Layout dimensions
    const isMobile = window.innerWidth <= 640;
    const nodeSpacingY = isMobile ? 150 : 155;
    const waveAmplitude = isMobile ? 38 : 74;
    const totalHeight = 120 + (lessons.length * nodeSpacingY);
    const containerWidth = container.clientWidth || (isMobile ? 360 : 780);
    const widthScale = Math.max(3.2, containerWidth / 100);

    // Calculate node coordinates
    const nodes = lessons.map((les, index) => {
      const phase = index * 1.15;
      const offsetX = Math.sin(phase) * waveAmplitude;
      const posY = 75 + (index * nodeSpacingY);

      let status = 'locked';
      if (trackState.completedLessons.includes(les.num)) {
        status = 'completed';
      } else if (les.num === trackState.currentLesson || trackState.unlockedLessons.includes(les.num)) {
        status = 'active';
      }

      const isMilestone = (les.num % 6 === 0) || les.is_capstone;

      return {
        lesson: les,
        index: index,
        x: offsetX,
        y: posY,
        status: status,
        isMilestone: isMilestone
      };
    });

    // Build SVG smooth Bezier path through squircle centers
    let bgPathD = '';
    let completedPathD = '';

    nodes.forEach((n, idx) => {
      const currX = 50 + (n.x / widthScale);
      const currY = n.y + 34; // exact vertical center of squircle button

      if (idx === 0) {
        bgPathD += `M ${currX} ${currY} `;
      } else {
        const prev = nodes[idx - 1];
        const prevX = 50 + (prev.x / widthScale);
        const prevY = prev.y + 34;
        const midY = (prevY + currY) / 2;
        bgPathD += `C ${prevX} ${midY}, ${currX} ${midY}, ${currX} ${currY} `;
      }
    });

    // Generate HTML for nodes
    let nodesHTML = '';
    nodes.forEach((n, idx) => {
      const l = n.lesson;
      const isCurrent = (n.status === 'active');
      const isDone = (n.status === 'completed');

      let iconAsset = '';
      if (n.isMilestone) {
        iconAsset = 'images/portal/standalone/gold-trophy-3d.png';
      } else if (isDone) {
        iconAsset = 'images/portal/standalone/star-badge-3d.png';
      } else if (isCurrent) {
        iconAsset = 'images/portal/standalone/rocket-3d.png';
      } else {
        iconAsset = 'images/portal/standalone/key-3d.png';
      }

      nodesHTML += `
        <div class="quest-node-anchor ${n.status} ${n.isMilestone ? 'milestone' : ''}" 
             data-track="${trackId}" 
             data-lesson="${l.num}"
             style="--node-x: ${n.x}px; transform: translate(calc(-50% + ${n.x}px), 0); top: ${n.y}px;"
             onclick="LmsQuestEngine.handleNodeClick('${trackId}', ${l.num}, event)"
             onmouseenter="LmsQuestEngine.handleNodeHover('${trackId}', ${l.num}, event)"
             role="button"
             tabindex="0"
             aria-label="Mission ${l.num}: ${l.title}. Status: ${n.status}">
          
          ${isCurrent ? `
            <div class="current-mission-pointer">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
              CONTINUE MISSION
            </div>
          ` : ''}

          <div class="quest-node-button">
            <span class="node-number-badge">${l.num}</span>
            <img src="${iconAsset}" alt="Mission ${l.num}" style="width: ${n.isMilestone ? '44px' : '36px'}; height: ${n.isMilestone ? '44px' : '36px'}; object-fit: contain; pointer-events: none;">
          </div>

          <div class="node-title-tag">
            <div style="font-weight: 800; color: ${n.isMilestone ? '#B45309' : 'var(--zenith-text-hero)'};">
              ${n.isMilestone ? 'Boss Capstone' : `Mission ${l.num}`}
            </div>
            <span class="node-concept-muted">
              ${l.concept_title || l.title}
            </span>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="quest-trail-viewport" style="height: ${totalHeight + 100}px;">
        <svg class="quest-path-canvas" viewBox="0 0 100 ${totalHeight}" preserveAspectRatio="none">
          <path class="quest-path-line-bg" d="${bgPathD}" vector-effect="non-scaling-stroke"></path>
          <path class="quest-path-line-progress" d="${bgPathD}" vector-effect="non-scaling-stroke"></path>
        </svg>
        <div class="quest-nodes-flow" style="height: ${totalHeight}px; position: relative;">
          ${nodesHTML}
        </div>

        <!-- Floating Popover Shell -->
        <div id="mission-detail-popover" class="mission-detail-popover">
          <div class="popover-header">
            <span id="popover-badge" class="popover-badge">Mission 1</span>
            <span id="popover-xp" style="font-family: var(--zenith-font-mono); font-size: 11px; font-weight: 800; color: #10B981;">+100 XP</span>
          </div>
          <h4 id="popover-title" class="popover-title">The Robot Dance</h4>
          <p id="popover-hook" class="popover-hook">Step-by-step algorithms and flow sequences.</p>
          <div class="popover-stats-row">
            <span>⏱ 15 Mins</span>
            <span>•</span>
            <span id="popover-concept">Sequencing</span>
          </div>
          <button id="popover-action-btn" class="btn-zenith primary" style="width: 100%; font-size: 12px; padding: 7px 12px;">
            Launch Mission →
          </button>
        </div>
      </div>
    `;

    // Ensure popover closes when clicking outside
    document.addEventListener('click', (e) => {
      const popover = document.getElementById('mission-detail-popover');
      if (popover && !popover.contains(e.target) && !e.target.closest('.quest-node-anchor')) {
        popover.classList.remove('visible');
      }
    });

    // Smoothly scroll active node into comfortable view
    setTimeout(() => {
      const activeNode = container.querySelector('.quest-node-anchor.active');
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  }

  // ── Node Hover & Popover Controller ───────────────────────────────────────
  function handleNodeHover(trackId, lessonNum, e) {
    SoundFX.hover();
  }

  function handleNodeClick(trackId, lessonNum, e) {
    const s = getStudentState();
    const trackState = s.tracks[trackId] || { completedLessons: [], currentLesson: 1, unlockedLessons: [1] };
    const isUnlocked = trackState.unlockedLessons.includes(lessonNum) || trackState.completedLessons.includes(lessonNum);

    if (!isUnlocked) {
      SoundFX.locked();
      if (lessonNum >= 4 && window.StemulusPassEngine && typeof window.StemulusPassEngine.hasActivePass === 'function' && !window.StemulusPassEngine.hasActivePass()) {
        if (typeof window.StemulusPassEngine.showUpgradeModal === 'function') {
          window.StemulusPassEngine.showUpgradeModal(`Mission ${lessonNum} is part of the STEMulus Digital Academy Pass. Upgrade today to unlock all 215 lessons!`);
        }
        return;
      }
      showToastAlert(`Mission ${lessonNum} is locked. Complete Mission ${lessonNum - 1} to unlock.`);
      return;
    }

    SoundFX.click();

    // Show floating popover anchored near the clicked node
    const lessons = getLessonsForTrack(trackId);
    const lesson = lessons.find(l => l.num === lessonNum);
    if (!lesson) {
      openSlideModal(trackId, lessonNum);
      return;
    }

    const popover = document.getElementById('mission-detail-popover');
    const nodeElem = e.currentTarget || document.querySelector(`.quest-node-anchor[data-lesson='${lessonNum}']`);
    
    if (popover && nodeElem) {
      const popBadge = document.getElementById('popover-badge');
      const popXP = document.getElementById('popover-xp');
      const popTitle = document.getElementById('popover-title');
      const popHook = document.getElementById('popover-hook');
      const popConcept = document.getElementById('popover-concept');
      const popBtn = document.getElementById('popover-action-btn');

      const isCapstone = (lessonNum % 6 === 0) || lesson.is_capstone;
      if (popBadge) popBadge.innerText = isCapstone ? `Boss Milestone ${lessonNum}` : `Mission ${lessonNum}`;
      if (popXP) popXP.innerText = isCapstone ? '+250 XP' : '+100 XP';
      if (popTitle) popTitle.innerText = lesson.title;
      if (popHook) popHook.innerText = lesson.hook || 'Hands-on guided programming exercise and code challenge.';
      if (popConcept) popConcept.innerText = lesson.concept_title || 'Core Practice';
      
      if (popBtn) {
        popBtn.innerText = trackState.completedLessons.includes(lessonNum) ? 'Review Lesson ↗' : 'Start Mission →';
        popBtn.onclick = () => {
          popover.classList.remove('visible');
          openSlideModal(trackId, lessonNum);
        };
      }

      // Position popover
      const nodeRect = nodeElem.getBoundingClientRect();
      const parentRect = nodeElem.parentElement.getBoundingClientRect();
      const popX = nodeRect.left - parentRect.left + (nodeRect.width / 2) - 140;
      const popY = nodeRect.top - parentRect.top - 170;

      popover.style.left = `${Math.max(10, Math.min(parentRect.width - 290, popX))}px`;
      popover.style.top = `${Math.max(10, popY)}px`;
      popover.classList.add('visible');
    } else {
      openSlideModal(trackId, lessonNum);
    }
  }

  // ── Render Matrix Grid View ───────────────────────────────────────────────
  function renderMatrixGrid(trackId) {
    const container = document.getElementById('quest-matrix-container');
    if (!container) return;

    const s = getStudentState();
    const trackState = s.tracks[trackId] || { completedLessons: [], currentLesson: 1, unlockedLessons: [1] };
    const lessons = getLessonsForTrack(trackId);

    let unitsHTML = '';
    const unitCount = Math.ceil(lessons.length / 6);

    for (let u = 0; u < unitCount; u++) {
      const unitLessons = lessons.slice(u * 6, (u + 1) * 6);
      const unitNum = u + 1;
      const unitTitles = [
        'Foundational Mechanics & First Logic',
        'Variables, Flow Control & Data Structures',
        'Modular Functions, Loops & Architecture',
        'Applied Systems, AI Integrations & Capstones',
        'Advanced Engineering & Production Optimization',
        'Autonomous Edge Computing & Honors Defense',
        'Senior Software Architecture & Systems Lab'
      ];

      let cardsHTML = '';
      unitLessons.forEach(l => {
        const isDone = trackState.completedLessons.includes(l.num);
        const isActive = (l.num === trackState.currentLesson);
        const isLocked = !isDone && !isActive && !trackState.unlockedLessons.includes(l.num);
        const isCapstone = (l.num % 6 === 0) || l.is_capstone;

        cardsHTML += `
          <div class="matrix-module-card ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: ${isDone ? '#15803D' : isActive ? '#C2410C' : '#94A3B8'};">
                <span class="hud-dot ${isDone ? 'emerald' : isActive ? 'orange' : ''}" style="${isLocked ? 'background: #CBD5E1;' : ''}"></span>
                ${isDone ? 'Completed' : isActive ? 'Current Mission' : 'Locked'}
              </span>
              <span style="font-family: var(--zenith-font-mono); font-size: 11px; font-weight: 700; color: #64748B;">
                ${isCapstone ? '+250 XP' : '+100 XP'}
              </span>
            </div>

            <div style="margin-bottom: 12px;">
              <h4 style="font-size: 13.5px; font-weight: 800; color: var(--zenith-text-hero); margin: 0 0 4px 0; line-height: 1.35;">
                ${l.num}. ${l.title}
              </h4>
              <p style="font-size: 11.5px; color: var(--zenith-text-secondary); margin: 0; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${l.hook || 'Hands-on guided programming exercise and interactive code challenge.'}
              </p>
            </div>

            <button class="btn-zenith ${isActive ? 'primary' : ''}" 
                    style="width: 100%; font-size: 12px; padding: 6px 12px;"
                    onclick="LmsQuestEngine.handleNodeClick('${trackId}', ${l.num}, event)">
              ${isDone ? 'Review Lesson' : isActive ? 'Launch Mission →' : 'Locked'}
            </button>
          </div>
        `;
      });

      unitsHTML += `
        <div style="margin-bottom: 2rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--zenith-border-subtle); padding-bottom: 0.5rem; margin-bottom: 1rem;">
            <h3 style="font-size: 14.5px; font-weight: 800; color: var(--zenith-text-hero); margin: 0; display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 20px; height: 20px; border-radius: 6px; background: var(--zenith-text-hero); color: #FFF; font-size: 10px; font-weight: 800; text-align: center; line-height: 20px; font-family: var(--zenith-font-mono);">${unitNum}</span>
              Unit ${unitNum}: ${unitTitles[u] || 'Advanced Engineering Systems'}
            </h3>
            <span style="font-size: 11.5px; font-weight: 700; color: var(--zenith-text-muted); font-family: var(--zenith-font-mono);">6 Missions</span>
          </div>
          <div class="quest-matrix-grid">
            ${cardsHTML}
          </div>
        </div>
      `;
    }

    container.innerHTML = unitsHTML;
  }

  // ── Distraction-Free Slide Modal Player ────────────────────────────────────
  function openSlideModal(trackId, lessonNum) {
    const track = TRACKS[trackId] || TRACKS['course_fundamentals'];
    const lessons = getLessonsForTrack(trackId);
    const lesson = lessons.find(l => l.num === lessonNum) || {
      num: lessonNum,
      title: `Mission ${lessonNum}`,
      rel_path: `curriculum/slides/${track.baseFolder}/lesson_${String(lessonNum).padStart(2, '0')}.html`
    };

    let modal = document.getElementById('lms-slide-modal');
    if (!modal) {
      createModalDOM();
      modal = document.getElementById('lms-slide-modal');
    }

    const titleElem = document.getElementById('lms-modal-title');
    const trackElem = document.getElementById('lms-modal-track');
    const iframe = document.getElementById('lms-modal-iframe');
    const extLink = document.getElementById('lms-modal-external');

    let targetUrl = lesson.rel_path;
    if (targetUrl && !targetUrl.startsWith('curriculum/slides/') && !targetUrl.startsWith('http')) {
      targetUrl = 'curriculum/slides/' + targetUrl;
    }

    if (titleElem) titleElem.innerText = `Mission ${lesson.num}: ${lesson.title}`;
    if (trackElem) trackElem.innerText = track.title;
    if (extLink) extLink.href = targetUrl;

    if (iframe) {
      iframe.src = targetUrl;
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    modal.setAttribute('data-active-track', trackId);
    modal.setAttribute('data-active-lesson', lessonNum);
  }

  function closeSlideModal() {
    const modal = document.getElementById('lms-slide-modal');
    if (!modal) return;

    modal.classList.remove('show');
    document.body.style.overflow = '';

    const iframe = document.getElementById('lms-modal-iframe');
    if (iframe) iframe.src = 'about:blank';
  }

  function createModalDOM() {
    const div = document.createElement('div');
    div.id = 'lms-slide-modal';
    div.innerHTML = `
      <div class="lms-modal-window">
        <div class="lms-modal-bar">
          <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
            <div style="width: 30px; height: 30px; border-radius: 9px; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <img src="images/portal/standalone/laptop-3d.png" style="width: 18px; height: 18px; object-fit: contain;" alt="Lesson">
            </div>
            <div style="min-width: 0;">
              <div id="lms-modal-title" style="font-size: 13.5px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 540px;">
                Mission Title
              </div>
              <div id="lms-modal-track" style="font-size: 11px; color: #94A3B8; font-weight: 600;">
                Curriculum Track
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn-zenith primary" style="padding: 6px 14px; font-size: 12px;" onclick="LmsQuestEngine.completeActiveLessonManual()">
              ✓ Mark Complete
            </button>
            <a id="lms-modal-external" href="#" target="_blank" class="btn-zenith" style="padding: 6px 12px; font-size: 12px; color: #FFF; background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15);">
              Dual Screen ↗
            </a>
            <button class="btn-zenith" style="padding: 6px 10px; font-size: 13px; color: #FFF; background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15);" onclick="LmsQuestEngine.closeSlideModal()">
              ✕
            </button>
          </div>
        </div>
        <iframe id="lms-modal-iframe" class="lms-modal-iframe" title="Interactive Lesson Viewer"></iframe>
      </div>
    `;
    document.body.appendChild(div);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && div.classList.contains('show')) {
        closeSlideModal();
      }
    });
  }

  // ── Lesson Completion Controller ──────────────────────────────────────────
  function handleLessonCompleted(trackId, lessonNum) {
    const s = getStudentState();
    const trackState = s.tracks[trackId] || { completedLessons: [], currentLesson: 1, unlockedLessons: [1] };

    const isFirstTime = !trackState.completedLessons.includes(lessonNum);

    if (isFirstTime) {
      trackState.completedLessons.push(lessonNum);
      const isCapstone = (lessonNum % 6 === 0);
      const xpAwarded = isCapstone ? 250 : 100;
      s.xp += xpAwarded;

      const nextNum = lessonNum + 1;
      if (!trackState.unlockedLessons.includes(nextNum)) {
        trackState.unlockedLessons.push(nextNum);
      }
      trackState.currentLesson = nextNum;

      // Update Competencies
      s.competencies.logic = Math.min(100, (s.competencies.logic || 60) + (isCapstone ? 5 : 2));
      s.competencies.loops = Math.min(100, (s.competencies.loops || 60) + (isCapstone ? 4 : 2));
      s.competencies.syntax = Math.min(100, (s.competencies.syntax || 60) + 2);
      s.competencies.variables = Math.min(100, (s.competencies.variables || 60) + 2);
      if (isCapstone) {
        s.competencies.capstone = Math.min(100, (s.competencies.capstone || 60) + 8);
      }

      saveStudentState(s);

      if (isCapstone) {
        SoundFX.fanfare();
      } else {
        SoundFX.success();
      }

      triggerConfetti();

      updateHUD();
      if (s.viewMode === 'matrix') {
        renderMatrixGrid(trackId);
      } else {
        renderQuestTrail(trackId);
      }
      updateReadinessRadar(s.competencies);

      showCompletionBanner(lessonNum, xpAwarded, isCapstone);
    }
  }

  function completeActiveLessonManual() {
    const modal = document.getElementById('lms-slide-modal');
    if (!modal) return;
    const trackId = modal.getAttribute('data-active-track') || state.activeTrack;
    const lessonNum = parseInt(modal.getAttribute('data-active-lesson'), 10) || 1;
    handleLessonCompleted(trackId, lessonNum);
    closeSlideModal();
  }

  function showCompletionBanner(lessonNum, xpAwarded, isCapstone) {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #FFFFFF;
      border: 1px solid ${isCapstone ? '#FCD34D' : '#86EFAC'};
      border-radius: 20px;
      padding: 14px 18px;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 100000;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    banner.innerHTML = `
      <div style="width: 42px; height: 42px; border-radius: 12px; background: ${isCapstone ? '#FEF3C7' : '#DCFCE7'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <img src="${isCapstone ? 'images/portal/standalone/gold-trophy-3d.png' : 'images/portal/standalone/star-badge-3d.png'}" style="width: 28px; height: 28px; object-fit: contain;" alt="Badge">
      </div>
      <div>
        <div style="font-family: var(--zenith-font-mono); font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${isCapstone ? '#B45309' : '#15803D'};">
          ${isCapstone ? 'Milestone Capstone Passed' : 'Mission Completed'}
        </div>
        <div style="font-size: 14px; font-weight: 800; color: #0F172A;">
          +${xpAwarded} XP Earned · Mission ${lessonNum}
        </div>
      </div>
    `;
    document.body.appendChild(banner);
    setTimeout(() => {
      banner.style.opacity = '0';
      banner.style.transition = 'opacity 0.25s ease';
      setTimeout(() => banner.remove(), 300);
    }, 4500);
  }

  function triggerConfetti() {
    if (typeof window.confetti === 'function') {
      window.confetti({ particleCount: 65, spread: 55, origin: { y: 0.7 } });
    }
  }

  function showToastAlert(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #0F172A;
      color: #FFFFFF;
      font-size: 12.5px;
      font-weight: 700;
      padding: 9px 18px;
      border-radius: 999px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 999999;
      pointer-events: none;
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  // ── Institutional 5-Axis Readiness Radar ──────────────────────────────────
  function initReadinessRadar(containerCanvasId) {
    const canvas = document.getElementById(containerCanvasId || 'readiness-radar-chart');
    if (!canvas) return;

    const s = getStudentState();
    const comp = s.competencies || { logic: 70, variables: 65, loops: 75, syntax: 60, capstone: 68 };

    // Update Average Mastery Stat
    const avg = Math.round((comp.logic + comp.variables + comp.loops + comp.syntax + comp.capstone) / 5);
    const avgElem = document.getElementById('radar-average-score');
    if (avgElem) avgElem.innerText = `${avg}% Mastery`;

    if (typeof window.Chart !== 'undefined') {
      try {
        if (radarChartInstance) radarChartInstance.destroy();
        const ctx = canvas.getContext('2d');
        radarChartInstance = new window.Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Logic', 'Variables', 'Loops', 'Syntax', 'Capstone'],
            datasets: [{
              label: 'Student Mastery',
              data: [comp.logic, comp.variables, comp.loops, comp.syntax, comp.capstone],
              backgroundColor: 'rgba(2, 132, 199, 0.12)',
              borderColor: '#0284C7',
              borderWidth: 2,
              pointBackgroundColor: '#FFFFFF',
              pointBorderColor: '#0284C7',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              r: {
                angleLines: { color: 'rgba(226, 232, 240, 0.9)' },
                grid: { color: 'rgba(226, 232, 240, 0.9)' },
                pointLabels: {
                  font: { family: 'Nunito', size: 11, weight: '800' },
                  color: '#1E293B'
                },
                suggestedMin: 30,
                suggestedMax: 100,
                ticks: { display: false }
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#0F172A',
                titleFont: { family: 'Nunito', weight: '800' },
                bodyFont: { family: 'Nunito' }
              }
            }
          }
        });
        return;
      } catch(e) {}
    }

    drawFallbackCanvasRadar(canvas, comp);
  }

  function drawFallbackCanvasRadar(canvas, comp) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width || 280;
    const h = canvas.height || 280;
    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(centerX, centerY) - 36;

    const labels = ['Logic', 'Variables', 'Loops', 'Syntax', 'Capstone'];
    const values = [comp.logic / 100, comp.variables / 100, comp.loops / 100, comp.syntax / 100, comp.capstone / 100];
    const totalSides = labels.length;

    for (let level = 1; level <= 4; level++) {
      const r = (radius / 4) * level;
      ctx.beginPath();
      for (let i = 0; i < totalSides; i++) {
        const angle = (Math.PI * 2 / totalSides) * i - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.font = 'bold 11px Nunito, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < totalSides; i++) {
      const angle = (Math.PI * 2 / totalSides) * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#E2E8F0';
      ctx.stroke();

      const labelX = centerX + Math.cos(angle) * (radius + 18);
      const labelY = centerY + Math.sin(angle) * (radius + 14);
      ctx.fillText(labels[i], labelX, labelY);
    }

    ctx.beginPath();
    for (let i = 0; i < totalSides; i++) {
      const angle = (Math.PI * 2 / totalSides) * i - Math.PI / 2;
      const r = radius * values[i];
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(2, 132, 199, 0.12)';
    ctx.fill();
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < totalSides; i++) {
      const angle = (Math.PI * 2 / totalSides) * i - Math.PI / 2;
      const r = radius * values[i];
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function updateReadinessRadar(comp) {
    const avg = Math.round((comp.logic + comp.variables + comp.loops + comp.syntax + comp.capstone) / 5);
    const avgElem = document.getElementById('radar-average-score');
    if (avgElem) avgElem.innerText = `${avg}% Mastery`;

    if (radarChartInstance) {
      radarChartInstance.data.datasets[0].data = [comp.logic, comp.variables, comp.loops, comp.syntax, comp.capstone];
      radarChartInstance.update();
    } else {
      const canvas = document.getElementById('readiness-radar-chart');
      if (canvas) drawFallbackCanvasRadar(canvas, comp);
    }
  }

  // ── Technology Passport Shelf ─────────────────────────────────────────────
  function renderPassportShelf() {
    const shelfContainer = document.getElementById('passport-shelf-container');
    if (!shelfContainer) return;

    if (window.BadgePassportEngine && typeof window.BadgePassportEngine.getEras === 'function') {
      const eras = window.BadgePassportEngine.getEras();
      let html = '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">';
      eras.slice(0, 8).forEach(era => {
        html += `
          <div style="background: var(--zenith-surface-subtle); border: 1px solid var(--zenith-border-hairline); border-radius: 12px; padding: 8px 6px; text-align: center; cursor: pointer; transition: all 0.15s;"
               onclick="BadgePassportEngine.openBadgeModal(${era.id})"
               title="${era.name}: ${era.theme}">
            <div style="font-family: var(--zenith-font-mono); font-size: 9px; font-weight: 700; color: ${era.color}; margin-bottom: 2px;">Era ${era.id}</div>
            <img src="images/portal/standalone/medal-3d.png" style="width: 24px; height: 24px; object-fit: contain; margin: 0 auto 2px auto;" alt="Medal">
            <div style="font-size: 9px; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${era.theme}
            </div>
          </div>
        `;
      });
      html += '</div>';
      shelfContainer.innerHTML = html;
    }
  }

  // ── Switch Active Track ───────────────────────────────────────────────────
  function switchTrack(trackId) {
    if (!TRACKS[trackId]) return;
    const s = getStudentState();
    s.activeTrack = trackId;
    saveStudentState(s);

    const selector = document.getElementById('track-select-dropdown');
    if (selector) selector.value = trackId;

    const bannerTitle = document.getElementById('active-track-title');
    const bannerSubtitle = document.getElementById('active-track-subtitle');
    const bannerBadge = document.getElementById('active-track-badge');

    if (bannerTitle) bannerTitle.innerText = TRACKS[trackId].title;
    if (bannerSubtitle) bannerSubtitle.innerText = TRACKS[trackId].subtitle;
    if (bannerBadge) bannerBadge.innerText = `${TRACKS[trackId].totalLessons} Interactive Missions`;

    updateTrackProgress(trackId);

    if (s.viewMode === 'matrix') {
      renderMatrixGrid(trackId);
    } else {
      renderQuestTrail(trackId);
    }
  }

  // ── Switch View Mode (Trail vs Matrix) ────────────────────────────────────
  function setViewMode(mode) {
    const s = getStudentState();
    s.viewMode = mode;
    saveStudentState(s);

    const trailContainer = document.getElementById('quest-trail-container');
    const matrixContainer = document.getElementById('quest-matrix-container');
    const btnTrail = document.getElementById('btn-view-trail');
    const btnMatrix = document.getElementById('btn-view-matrix');

    if (mode === 'matrix') {
      if (trailContainer) trailContainer.style.display = 'none';
      if (matrixContainer) matrixContainer.style.display = 'block';
      if (btnTrail) btnTrail.classList.remove('active');
      if (btnMatrix) btnMatrix.classList.add('active');
      renderMatrixGrid(s.activeTrack);
    } else {
      if (trailContainer) trailContainer.style.display = 'block';
      if (matrixContainer) matrixContainer.style.display = 'none';
      if (btnTrail) btnTrail.classList.add('active');
      if (btnMatrix) btnMatrix.classList.remove('active');
      renderQuestTrail(s.activeTrack);
    }
  }

  // ── Initialize Full Engine ────────────────────────────────────────────────
  async function init() {
    await loadCatalog();
    const s = getStudentState();

    updateHUD();
    switchTrack(s.activeTrack);
    initReadinessRadar('readiness-radar-chart');
    renderPassportShelf();

    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'STEMULUS_LESSON_COMPLETED') {
        const trk = event.data.track || s.activeTrack;
        const les = parseInt(event.data.lessonNumber, 10) || 1;
        handleLessonCompleted(trk, les);
      }
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (s.viewMode === 'trail') {
          renderQuestTrail(s.activeTrack);
        }
      }, 250);
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      setTimeout(init, 50);
    }
  }

  return {
    init: init,
    getStudentState: getStudentState,
    saveStudentState: saveStudentState,
    switchTrack: switchTrack,
    setViewMode: setViewMode,
    handleNodeClick: handleNodeClick,
    handleNodeHover: handleNodeHover,
    openSlideModal: openSlideModal,
    closeSlideModal: closeSlideModal,
    completeActiveLessonManual: completeActiveLessonManual,
    handleLessonCompleted: handleLessonCompleted,
    updateHUD: updateHUD,
    TRACKS: TRACKS
  };

})();

if (typeof window !== 'undefined') {
  window.LmsQuestEngine = LmsQuestEngine;
}
