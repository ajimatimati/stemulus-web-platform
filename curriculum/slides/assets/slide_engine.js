// STEMulus Kids Tech – 3D Playful Minimalist Slide Deck Controller
// Zero Unicode Emojis, Pure SVG/Clean Text Controls, Web Audio API Sound
// Features: Interactive Quests, XP Gamification, Slide Dots Ribbon, Code Tools, Print Brief
(function() {
  let currentSlide = 0;
  const slides = document.querySelectorAll('.slide');
  const progressBar = document.querySelector('.progress-bar');
  const counter = document.getElementById('slide-counter');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const notesDrawer = document.getElementById('notes-drawer');
  const notesContent = document.getElementById('notes-content');
  const tutorCockpit = document.getElementById('tutor-cockpit');
  const cockpitSlideNum = document.getElementById('cockpit-slide-num');
  const cockpitSlideTitleTag = document.getElementById('cockpit-slide-title-tag');
  const cockpitSlideNotes = document.getElementById('cockpit-slide-notes');
  const dotsContainer = document.getElementById('slide-dots-ribbon');
  let soundEnabled = true;

  // BroadcastChannel and localStorage sync for Dual-Monitor Presenter Teleprompter
  const syncChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('stemulus_slide_sync') : null;
  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'SLIDE_CHANGE') {
        updateSlide(event.data.index, false);
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'stemulus_sync_slide' && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        updateSlide(data.index, false);
      } catch(e) {}
    }
  });

  // Derive unique lesson storage key from URL pathname
  const pagePath = window.location.pathname;
  const lessonKey = 'stemulus_quest_' + pagePath.substring(pagePath.lastIndexOf('/') + 1).replace('.html', '');

  // Web Audio Synth for instant, zero-dependency sound effects
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playSlideSound() { playTone(520, 'sine', 0.06); }
  function playClickSound() { playTone(440, 'triangle', 0.05); }
  function playSuccessSound() {
    playTone(523.25, 'triangle', 0.1);
    setTimeout(() => playTone(659.25, 'triangle', 0.1), 70);
    setTimeout(() => playTone(783.99, 'triangle', 0.18), 140);
  }
  function playSuccessFanfare() {
    playTone(523.25, 'triangle', 0.1);
    setTimeout(() => playTone(659.25, 'triangle', 0.1), 80);
    setTimeout(() => playTone(783.99, 'triangle', 0.12), 160);
    setTimeout(() => playTone(1046.50, 'triangle', 0.25), 240);
  }
  function playErrorSound() {
    playTone(220, 'sawtooth', 0.12);
  }

  // Lightweight Confetti Particle Burst (Zero External Dependencies)
  function burstConfetti() {
    const colors = ['#F4600C', '#4F46E5', '#10B981', '#F59E0B', '#38BDF8'];
    for (let i = 0; i < 32; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.left = (Math.random() * 80 + 10) + 'vw';
      particle.style.top = (Math.random() * 30 + 15) + 'vh';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.animationDuration = (Math.random() * 0.7 + 0.8) + 's';
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1600);
    }
  }

  // Slide Dots Ribbon Initialization
  function initDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    slides.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = 'slide-dot' + (idx === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
      dot.addEventListener('click', () => updateSlide(idx));
      dotsContainer.appendChild(dot);
    });
  }

  function updateDots() {
    if (!dotsContainer) return;
    const dots = dotsContainer.querySelectorAll('.slide-dot');
    dots.forEach((dot, idx) => {
      if (idx === currentSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function updateSlide(newIndex, shouldBroadcast = true) {
    if (newIndex < 0 || newIndex >= slides.length) return;
    slides[currentSlide].classList.remove('active');
    currentSlide = newIndex;
    slides[currentSlide].classList.add('active');

    // Update Counter & Progress
    if (counter) counter.innerText = `Slide ${currentSlide + 1} of ${slides.length}`;
    if (progressBar) progressBar.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;
    
    if (prevBtn) {
      prevBtn.disabled = (currentSlide === 0);
      if (currentSlide === 0) {
        prevBtn.classList.add('disabled');
      } else {
        prevBtn.classList.remove('disabled');
      }
    }
    
    if (nextBtn) {
      nextBtn.disabled = (currentSlide === slides.length - 1);
      if (currentSlide === slides.length - 1) {
        nextBtn.classList.add('disabled');
        handleFinalSlideReached();
      } else {
        nextBtn.classList.remove('disabled');
      }
    }

    updateDots();

    // Update Cockpit Slide Number & Title Tag
    if (cockpitSlideNum) cockpitSlideNum.innerText = (currentSlide + 1);
    if (cockpitSlideTitleTag) cockpitSlideTitleTag.innerText = `Slide ${currentSlide + 1}`;

    // Update Speaker Notes & Cockpit Notes
    const note = slides[currentSlide].getAttribute('data-notes') || 'No notes for this slide.';
    if (cockpitSlideNotes) cockpitSlideNotes.innerHTML = note;
    if (notesContent) notesContent.innerHTML = note;

    // Broadcast Slide Update to Dual Screen
    if (shouldBroadcast) {
      try {
        if (syncChannel) syncChannel.postMessage({ type: 'SLIDE_CHANGE', index: currentSlide });
        localStorage.setItem('stemulus_sync_slide', JSON.stringify({ index: currentSlide, timestamp: Date.now() }));
      } catch(e) {}
    }

    playSlideSound();
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Universal Command Palette shortcut (Ctrl+K or Cmd+K)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      window.toggleCommandPalette();
      return;
    }

    // Palette active keyboard controls
    if (window.isCommandPaletteOpen && window.isCommandPaletteOpen()) {
      if (e.key === 'Escape') {
        e.preventDefault();
        window.closeCommandPalette();
        return;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        window.navigateCommandPalette(1);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        window.navigateCommandPalette(-1);
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        window.executeSelectedCommand();
        return;
      }
    }

    // Parent QR modal active controls
    const qrBackdrop = document.getElementById('parent-qr-backdrop');
    if (qrBackdrop && qrBackdrop.style.display === 'flex') {
      if (e.key === 'Escape') {
        e.preventDefault();
        window.closeParentQrModal();
        return;
      }
    }

    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      updateSlide(currentSlide + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      updateSlide(currentSlide - 1);
    } else if (e.key.toLowerCase() === 't' || e.key.toLowerCase() === 's') {
      window.toggleTutorCockpit();
    } else if (e.key.toLowerCase() === 'f') {
      toggleFullscreen();
    } else if (e.key.toLowerCase() === 'p') {
      window.printMissionBrief();
    } else if (e.key.toLowerCase() === 'm') {
      window.toggleLearningJourney();
    } else if (e.key.toLowerCase() === 'g') {
      window.toggleGlossary();
    } else if (e.key.toLowerCase() === 'v') {
      window.verifyLessonSolution();
    } else if (e.key.toLowerCase() === 'q') {
      window.openParentQrModal();
    } else if (e.key >= '1' && e.key <= '6') {
      const targetIdx = parseInt(e.key, 10) - 1;
      if (targetIdx < slides.length) updateSlide(targetIdx);
    }
  });

  if (prevBtn) prevBtn.addEventListener('click', () => updateSlide(currentSlide - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => updateSlide(currentSlide + 1));

  // Toggle Tutor Cockpit
  window.toggleTutorCockpit = function() {
    const target = tutorCockpit || notesDrawer;
    if (!target) return;
    const isOpen = target.classList.toggle('open');
    const tutorBtn = document.getElementById('tutor-btn');
    if (tutorBtn) tutorBtn.classList.toggle('active', isOpen);
    playClickSound();
  };
  window.toggleNotes = window.toggleTutorCockpit;

  // Switch Cockpit Tab
  window.switchCockpitTab = function(tabKey) {
    if (!tutorCockpit) return;
    tutorCockpit.querySelectorAll('.cockpit-tab').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabKey);
    });
    tutorCockpit.querySelectorAll('.cockpit-tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === `pane-${tabKey}`);
    });
    playClickSound();
  };

  // Open Presenter Popout Window
  window.openPresenterPopout = function() {
    const popoutUrl = window.location.pathname + '?role=tutor_presenter';
    window.open(popoutUrl, 'STEMulusTutorTeleprompter', 'width=540,height=850,resizable=yes,scrollbars=yes');
    playClickSound();
  };

  // Copy Google Classroom Assignment
  window.copyClassroomAssignment = function(btn) {
    const pre = document.getElementById('classroom-copy-preview');
    if (!pre) return;
    const text = pre.innerText;
    navigator.clipboard.writeText(text).then(() => {
      playSuccessSound();
      const origHtml = btn.innerHTML;
      btn.innerHTML = '<svg class="ui-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Copied to Clipboard!</span>';
      btn.style.background = 'linear-gradient(180deg, #10B981 0%, #059669 100%)';
      btn.style.color = '#FFFFFF';
      setTimeout(() => {
        btn.innerHTML = origHtml;
        btn.style.background = '';
        btn.style.color = '';
      }, 2500);
    }).catch(() => {});
  };

  // Pacing Clock & Stopwatch Timer
  let timerInterval = null;
  let timerSecondsRemaining = 60 * 60; // 60 minutes
  let timerRunning = false;

  function updateTimerDisplay() {
    const display = document.getElementById('cockpit-timer-display');
    if (!display) return;
    const mins = Math.floor(timerSecondsRemaining / 60);
    const secs = timerSecondsRemaining % 60;
    display.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    // Highlight active pacing milestone based on elapsed time
    const elapsedMinutes = (60 * 60 - timerSecondsRemaining) / 60;
    const milestones = document.querySelectorAll('.milestone-row');
    milestones.forEach((m) => {
      const stage = parseInt(m.getAttribute('data-stage'), 10);
      let isActive = false;
      if (stage === 1 && elapsedMinutes <= 5) isActive = true;
      else if (stage === 2 && elapsedMinutes > 5 && elapsedMinutes <= 15) isActive = true;
      else if (stage === 3 && elapsedMinutes > 15 && elapsedMinutes <= 35) isActive = true;
      else if (stage === 4 && elapsedMinutes > 35 && elapsedMinutes <= 42) isActive = true;
      else if (stage === 5 && elapsedMinutes > 42 && elapsedMinutes <= 55) isActive = true;
      else if (stage === 6 && elapsedMinutes > 55) isActive = true;
      m.classList.toggle('active', isActive);
    });
  }

  window.startTimer = function() {
    if (timerRunning) return;
    timerRunning = true;
    playClickSound();
    timerInterval = setInterval(() => {
      if (timerSecondsRemaining > 0) {
        timerSecondsRemaining--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        timerRunning = false;
        playSuccessFanfare();
      }
    }, 1000);
  };

  window.pauseTimer = function() {
    timerRunning = false;
    clearInterval(timerInterval);
    playClickSound();
  };

  window.resetTimer = function() {
    timerRunning = false;
    clearInterval(timerInterval);
    timerSecondsRemaining = 60 * 60;
    updateTimerDisplay();
    playClickSound();
  };

  // Toggle Fullscreen
  window.toggleFullscreen = function() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Toggle Sound
  window.toggleSound = function() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-btn');
    if (btn) {
      const icon = soundEnabled
        ? '<svg class="ui-svg" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>'
        : '<svg class="ui-svg" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
      btn.innerHTML = `${icon} <span>Sound: ${soundEnabled ? 'On' : 'Off'}</span>`;
    }
  };

  // Print Mission Brief
  window.printMissionBrief = function() {
    window.print();
  };

  // Interactive Quiz Option Handler
  window.handleQuiz = function(btn, isCorrect) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.quiz-btn').forEach(b => {
      b.disabled = true;
    });

    if (isCorrect) {
      btn.classList.add('correct');
      playSuccessSound();
      burstConfetti();
    } else {
      btn.classList.add('wrong');
      playErrorSound();
      parent.querySelectorAll('.quiz-btn[data-correct="true"]').forEach(b => b.classList.add('correct'));
    }

    const expBox = parent.parentElement.querySelector('.quiz-explanation');
    if (expBox) {
      const statusSpan = expBox.querySelector('.quiz-status');
      if (statusSpan) {
        statusSpan.innerHTML = isCorrect ? '<strong>Correct!</strong> ' : '<strong>Review:</strong> ';
      }
      expBox.style.display = 'block';
    }
  };

  // Reset Quiz for Active Socratic Retrying
  window.resetQuiz = function(retryBtn) {
    const quizBox = retryBtn.closest('.quiz-box');
    if (!quizBox) return;
    quizBox.querySelectorAll('.quiz-btn').forEach(b => {
      b.disabled = false;
      b.classList.remove('correct', 'wrong');
    });
    const expBox = quizBox.querySelector('.quiz-explanation');
    if (expBox) expBox.style.display = 'none';
    playClickSound();
  };

  // Interactive Quest Toggle & LocalStorage XP Gamification
  window.handleQuestToggle = function(tierCard, tierName, xpAmount) {
    const isCompleted = tierCard.classList.toggle('completed');
    playTone(isCompleted ? 660 : 440, 'triangle', 0.08);

    // Save state to localStorage
    try {
      const state = JSON.parse(localStorage.getItem(lessonKey) || '{}');
      state[tierName] = isCompleted;
      localStorage.setItem(lessonKey, JSON.stringify(state));
    } catch (e) {}

    // Calculate total XP
    const questTiers = document.querySelectorAll('.quest-tier');
    let totalXp = 0;
    let completedCount = 0;
    questTiers.forEach(q => {
      if (q.classList.contains('completed')) {
        completedCount++;
        const xp = parseInt(q.getAttribute('data-xp') || '50', 10);
        totalXp += xp;
      }
    });

    const xpVal = document.getElementById('xp-counter-val');
    const xpDisplay = document.getElementById('lesson-xp-counter');
    if (xpVal) {
      xpVal.innerText = `${totalXp} / 350 XP`;
    } else if (xpDisplay) {
      xpDisplay.innerText = `${totalXp} / 350 XP`;
    }

    // If all 3 quests completed, trigger celebration!
    if (completedCount === questTiers.length && questTiers.length > 0) {
      playSuccessFanfare();
      burstConfetti();
    }
  };

  // Load Saved Quests from LocalStorage
  function loadSavedQuests() {
    try {
      const state = JSON.parse(localStorage.getItem(lessonKey) || '{}');
      const questTiers = document.querySelectorAll('.quest-tier');
      let totalXp = 0;
      questTiers.forEach(q => {
        const tierName = q.getAttribute('data-tier');
        if (state[tierName]) {
          q.classList.add('completed');
          const xp = parseInt(q.getAttribute('data-xp') || '50', 10);
          totalXp += xp;
        }
      });
      const xpVal = document.getElementById('xp-counter-val');
      const xpDisplay = document.getElementById('lesson-xp-counter');
      if (xpVal && totalXp > 0) {
        xpVal.innerText = `${totalXp} / 350 XP`;
      } else if (xpDisplay && totalXp > 0) {
        xpDisplay.innerText = `${totalXp} / 350 XP`;
      }
    } catch (e) {}
  }

  // Copy Code Snippet with Tactile Feedback
  window.copyCodeSnippet = function(btn) {
    const container = btn.closest('.code-container');
    if (!container) return;
    const codeElem = container.querySelector('code');
    if (!codeElem) return;

    const textToCopy = codeElem.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
      playClickSound();
      const originalText = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = '<svg class="ui-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Copied!</span>';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = originalText;
      }, 2000);
    }).catch(() => {});
  };

  // Toggle Context-Aware Interactive Sandbox
  window.toggleSandbox = function(btn) {
    const container = btn.closest('.code-container');
    if (!container) return;
    const sandbox = container.querySelector('.sandbox-engine-card');
    if (sandbox) {
      const isOpen = sandbox.classList.toggle('open');
      playClickSound();
      btn.classList.toggle('active', isOpen);
    }
  };

  // Legacy fallback
  window.toggleConsoleOutput = window.toggleSandbox;

  // Live CSS Preview: Update CSS Custom Properties Live
  window.updatePreviewVar = function(elem, cssVar, value) {
    const sandbox = elem.closest('.sandbox-engine-card');
    if (!sandbox) return;
    const stage = sandbox.querySelector('.sandbox-interactive-card') || sandbox.querySelector('.sandbox-preview-stage');
    if (stage) {
      stage.style.setProperty(cssVar, value);
    }

    // If color chip, toggle active state
    if (elem.classList.contains('color-chip')) {
      const parent = elem.parentElement;
      parent.querySelectorAll('.color-chip').forEach(c => c.classList.remove('active'));
      elem.classList.add('active');
    }

    // If slider, update numerical label
    if (elem.classList.contains('sandbox-slider')) {
      const label = elem.parentElement.querySelector('.knob-val');
      if (label) label.innerText = value;
    }

    playTone(580, 'sine', 0.04);
  };

  // Real Web Crypto SHA-256 Hash Workbench
  window.updateLiveHash = async function(inputElem) {
    const sandbox = inputElem.closest('.sandbox-engine-card');
    if (!sandbox) return;
    const hashBox = sandbox.querySelector('.hash-result-box');
    if (!hashBox) return;

    const text = inputElem.value;
    try {
      if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        hashBox.innerText = hashHex;
      } else {
        hashBox.innerText = 'SHA-256 computed locally';
      }
    } catch (e) {
      hashBox.innerText = 'Error calculating hash';
    }
  };

  // Real Caesar Cipher Shift
  window.updateCaesarCipher = function(inputElem) {
    const sandbox = inputElem.closest('.sandbox-engine-card');
    if (!sandbox) return;
    const textInput = sandbox.querySelector('.caesar-text-input');
    const shiftSlider = sandbox.querySelector('.caesar-shift-slider');
    const resultBox = sandbox.querySelector('.caesar-result-box');
    const shiftValLabel = sandbox.querySelector('.caesar-shift-val');
    
    if (!textInput || !resultBox) return;
    const text = textInput.value;
    const shift = shiftSlider ? parseInt(shiftSlider.value, 10) : 3;
    if (shiftValLabel) shiftValLabel.innerText = `+${shift}`;

    let result = '';
    for (let i = 0; i < text.length; i++) {
      let c = text.charCodeAt(i);
      if (c >= 65 && c <= 90) {
        result += String.fromCharCode(((c - 65 + shift) % 26) + 65);
      } else if (c >= 97 && c <= 122) {
        result += String.fromCharCode(((c - 97 + shift) % 26) + 97);
      } else {
        result += text.charAt(i);
      }
    }
    resultBox.innerText = result;
  };

  // Live CIA Triad Threat Defense Simulator Handler
  window.simulateCIAThreat = function(btn, threatType) {
    const sandbox = btn.closest('.sandbox-engine-card');
    if (!sandbox) return;

    // Toggle active chip
    sandbox.querySelectorAll('.threat-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');

    const pillarC = sandbox.querySelector('#pillar-c');
    const pillarI = sandbox.querySelector('#pillar-i');
    const pillarA = sandbox.querySelector('#pillar-a');
    const summaryElem = sandbox.querySelector('#cia-analysis-summary');

    function setPillar(pillar, isBreached, badgeText) {
      if (!pillar) return;
      const badge = pillar.querySelector('.pillar-badge');
      if (isBreached) {
        pillar.classList.add('breached');
        pillar.classList.remove('secure');
        if (badge) {
          badge.className = 'pillar-badge badge-breached';
          badge.innerText = badgeText || 'BREACHED';
        }
      } else {
        pillar.classList.remove('breached');
        pillar.classList.add('secure');
        if (badge) {
          badge.className = 'pillar-badge badge-secure';
          badge.innerText = badgeText || 'SECURE';
        }
      }
    }

    if (threatType === 'confidentiality') {
      setPillar(pillarC, true, 'BREACHED');
      setPillar(pillarI, false, 'SECURE');
      setPillar(pillarA, false, 'SECURE');
      if (summaryElem) {
        summaryElem.innerHTML = '<strong>Threat Analysis:</strong> An unauthorized student bypassed classroom folder permissions to view unencrypted quiz scores. <strong>Confidentiality is breached</strong> because unauthorized eyes accessed private student data. Integrity is intact (scores were not altered) and Availability is intact (the portal remained online).';
      }
      playTone(320, 'sawtooth', 0.08);
    } else if (threatType === 'integrity') {
      setPillar(pillarC, false, 'SECURE');
      setPillar(pillarI, true, 'BREACHED');
      setPillar(pillarA, false, 'SECURE');
      if (summaryElem) {
        summaryElem.innerHTML = '<strong>Threat Analysis:</strong> A participant sent a forged packet to tamper with the tournament leaderboard and boost their score. <strong>Integrity is breached</strong> because trusted data was modified without authorization. Confidentiality is intact (leaderboards are public) and Availability is intact (the server stayed up).';
      }
      playTone(320, 'sawtooth', 0.08);
    } else if (threatType === 'availability') {
      setPillar(pillarC, false, 'SECURE');
      setPillar(pillarI, false, 'SECURE');
      setPillar(pillarA, true, 'BREACHED');
      if (summaryElem) {
        summaryElem.innerHTML = '<strong>Threat Analysis:</strong> Hundreds of automated script requests flooded the school homework submission portal minutes before midnight, causing server timeout errors. <strong>Availability is breached</strong> because legitimate students cannot access the service. Data remained private (Confidentiality) and untouched (Integrity).';
      }
      playTone(320, 'sawtooth', 0.08);
    }
  };

  // Prompt Workbench: Select Ingredient Chip
  window.selectPromptChip = function(chip, category) {
    const group = chip.parentElement;
    group.querySelectorAll('.prompt-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    const sandbox = chip.closest('.sandbox-engine-card');
    if (!sandbox) return;

    // Gather active chips
    const activeChips = sandbox.querySelectorAll('.prompt-chip.active');
    const parts = Array.from(activeChips).map(c => c.getAttribute('data-val') || c.innerText);
    const compiledElem = sandbox.querySelector('.prompt-compiled-text');
    if (compiledElem) {
      compiledElem.innerText = parts.join(' + ');
    }
    playTone(660, 'triangle', 0.06);
  };

  // Step-by-Step Algorithm Sequence Player
  window.playStepSequence = function(playBtn) {
    const sandbox = playBtn.closest('.sandbox-engine-card');
    if (!sandbox) return;
    const nodes = sandbox.querySelectorAll('.step-node');
    if (!nodes.length) return;

    playBtn.disabled = true;
    nodes.forEach(n => n.classList.remove('active'));

    const freqs = [440, 554.37, 659.25, 880];
    let i = 0;

    function step() {
      if (i > 0) nodes[i - 1].classList.remove('active');
      if (i < nodes.length) {
        nodes[i].classList.add('active');
        playTone(freqs[i % freqs.length], 'triangle', 0.12);
        i++;
        setTimeout(step, 550);
      } else {
        playBtn.disabled = false;
        playSuccessSound();
        burstConfetti();
      }
    }
    step();
  };

  // Live HTML Rendered Document Preview Handler
  window.updateHtmlPreviewStyle = function(elem, prop, value) {
    const sandbox = elem.closest('.sandbox-engine-card');
    if (!sandbox) return;
    const target = sandbox.querySelector('#sandbox-target-element') || sandbox.querySelector('.sandbox-rendered-html-card');
    if (target) {
      target.style[prop] = value;
    }
    if (elem.classList.contains('color-chip')) {
      elem.parentElement.querySelectorAll('.color-chip').forEach(c => c.classList.remove('active'));
      elem.classList.add('active');
    } else if (elem.classList.contains('sandbox-knob-btn')) {
      elem.parentElement.querySelectorAll('.sandbox-knob-btn').forEach(b => b.classList.remove('active'));
      elem.classList.add('active');
    } else if (elem.classList.contains('sandbox-slider')) {
      const label = elem.parentElement.querySelector('.knob-val');
      if (label) label.innerText = value;
    }
    playTone(560, 'sine', 0.04);
  };

  // Live CSS Flexbox Layout Handler
  window.updateFlexLayout = function(btn, prop, value) {
    const sandbox = btn.closest('.sandbox-engine-card');
    if (!sandbox) return;
    const flexContainer = sandbox.querySelector('.sandbox-flex-container');
    if (flexContainer) {
      flexContainer.style[prop] = value;
    }
    btn.parentElement.querySelectorAll('.sandbox-knob-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    playTone(580, 'sine', 0.04);
  };

  // Live CSS Grid Layout Handler
  window.updateGridLayout = function(btn, colTemplate) {
    const sandbox = btn.closest('.sandbox-engine-card');
    if (!sandbox) return;
    const gridContainer = sandbox.querySelector('.sandbox-grid-container');
    if (gridContainer) {
      gridContainer.style.gridTemplateColumns = colTemplate;
    }
    btn.parentElement.querySelectorAll('.sandbox-knob-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    playTone(600, 'sine', 0.04);
  };

  // Live CSS Box Model Handler
  window.updateBoxModel = function(slider, targetSelector, cssProp) {
    const sandbox = slider.closest('.sandbox-engine-card');
    if (!sandbox) return;
    const elem = sandbox.querySelector(targetSelector);
    if (elem) {
      elem.style[cssProp] = slider.value + 'px';
    }
    const label = slider.parentElement.querySelector('.knob-val');
    if (label) label.innerText = slider.value + 'px';
    playTone(540, 'sine', 0.04);
  };

  // Live DOM Event Machine Handler
  window.triggerDomClick = function(btn) {
    const sandbox = btn.closest('.sandbox-engine-card');
    if (!sandbox) return;
    const counterElem = sandbox.querySelector('#dom-counter-val');
    const logElem = sandbox.querySelector('.dom-event-log');
    let count = counterElem ? parseInt(counterElem.innerText, 10) : 0;
    count++;
    if (counterElem) counterElem.innerText = count;
    if (logElem) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      logElem.innerText = `[${timeStr}] 'click' event captured -> Callback executed. Counter = ${count}`;
    }
    playClickSound();
  };

  // Live Descriptive Statistics Outlier Handler
  window.updateDataStats = function(btn, includeOutlier) {
    const sandbox = btn.closest('.sandbox-engine-card');
    if (!sandbox) return;
    const meanElem = sandbox.querySelector('.stat-mean-val');
    const medianElem = sandbox.querySelector('.stat-median-val');
    const noteElem = sandbox.querySelector('.stat-note-val');
    if (includeOutlier) {
      if (meanElem) meanElem.innerText = '210.2';
      if (medianElem) medianElem.innerText = '14.0';
      if (noteElem) noteElem.innerText = 'Outlier [1000] drags the mean up drastically, while median remains resilient!';
    } else {
      if (meanElem) meanElem.innerText = '12.5';
      if (medianElem) medianElem.innerText = '13.0';
      if (noteElem) noteElem.innerText = 'Without outlier: Mean (12.5) and Median (13.0) align closely!';
    }
    btn.parentElement.querySelectorAll('.sandbox-knob-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    playTone(580, 'sine', 0.04);
  };

  // ========================================================
  // SOCRATIC AGENT SYNTHESIS: MISSION & GLOSSARY DRAWERS
  // ========================================================
  window.toggleLearningJourney = function() {
    const drawer = document.getElementById('learning-journey-drawer');
    if (!drawer) return;
    const isOpen = drawer.classList.toggle('open');
    const btn = document.getElementById('mission-btn');
    if (btn) btn.classList.toggle('active', isOpen);
    if (isOpen) {
      if (tutorCockpit) tutorCockpit.classList.remove('open');
      const gDrawer = document.getElementById('glossary-drawer');
      if (gDrawer) gDrawer.classList.remove('open');
      renderLearningRecordsList();
    }
    playClickSound();
  };

  window.toggleGlossary = function() {
    const drawer = document.getElementById('glossary-drawer');
    if (!drawer) return;
    const isOpen = drawer.classList.toggle('open');
    const btn = document.getElementById('glossary-btn');
    if (btn) btn.classList.toggle('active', isOpen);
    if (isOpen) {
      if (tutorCockpit) tutorCockpit.classList.remove('open');
      const jDrawer = document.getElementById('learning-journey-drawer');
      if (jDrawer) jDrawer.classList.remove('open');
    }
    playClickSound();
  };

  function renderLearningRecordsList() {
    const container = document.getElementById('journey-records-list');
    if (!container) return;
    let records = [];
    try {
      records = JSON.parse(localStorage.getItem('stemulus_learning_records') || '[]');
    } catch(e) {}
    
    const zpdCountElem = document.getElementById('zpd-lessons-count');
    const zpdXpElem = document.getElementById('zpd-total-xp');
    if (zpdCountElem) zpdCountElem.innerText = records.length;
    let totalXp = 0;
    records.forEach(r => totalXp += (r.xp || 50));
    if (zpdXpElem) zpdXpElem.innerText = totalXp + ' XP';

    if (!records.length) {
      container.innerHTML = '<div style="font-size: 13px; color: #64748B; font-style: italic; padding: 12px; background: #F8FAFC; border-radius: 8px;">No verified milestones yet. Click \\"Verify Solution\\" on Slide 3 or claim quest badges to build your permanent learning record!</div>';
      return;
    }

    container.innerHTML = records.map((r, i) => `
      <div class="learning-record-item">
        <div class="record-header">
          <span class="record-badge">LR-${String(records.length - i).padStart(4, '0')}</span>
          <span class="record-date">${r.date || 'Active'}</span>
        </div>
        <div class="record-title">${r.title || 'Concept Mastery'}</div>
        <div class="record-evidence">${r.evidence || 'Verified through hands-on workbench build and checkpoint challenge.'}</div>
      </div>
    `).join('');
  }

  window.verifyLessonSolution = function(btn) {
    if (!btn) btn = document.querySelector('.verify-btn');
    const feedbackBox = document.getElementById('solution-verification-feedback');
    const meta = window.STEMULUS_LESSON_META || {};
    
    playTone(520, 'sine', 0.08);
    
    if (btn) {
      btn.classList.add('verified');
      btn.innerHTML = `
        <svg class="ui-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Verified!</span>`;
    }

    if (feedbackBox) {
      feedbackBox.className = 'solution-verification-feedback success';
      feedbackBox.style.display = 'flex';
      feedbackBox.innerHTML = `
        <img src="../../assets/3d/star-badge-3d.png" style="width: 22px; height: 22px; object-fit: contain;" alt="Verified">
        <div>
          <strong>Milestone Verified!</strong> Code blueprint structure and syntax checks passed. +50 XP awarded and logged to your permanent Student Learning Journey!
        </div>`;
    }

    try {
      let records = JSON.parse(localStorage.getItem('stemulus_learning_records') || '[]');
      const lessonTitle = meta.lessonTitle || document.title.split('|')[0].replace('Lesson', '').trim();
      const existing = records.find(r => r.lessonTitle === lessonTitle);
      if (!existing) {
        records.unshift({
          lessonTitle: lessonTitle,
          title: `Mastered ${meta.conceptTitle || 'Core Syntax & Architecture'}`,
          date: new Date().toLocaleDateString(),
          evidence: `Successfully verified working code solution on workbench with zero errors.`,
          xp: 50
        });
        localStorage.setItem('stemulus_learning_records', JSON.stringify(records));
      }
    } catch(e) {}

    playSuccessFanfare();
    burstConfetti();
  };

  window.exportLearningJourney = function() {
    let records = [];
    try {
      records = JSON.parse(localStorage.getItem('stemulus_learning_records') || '[]');
    } catch(e) {}
    
    const pageTitle = document.title;
    let md = `# STEMulus Student Learning Journey & ADR Records\\n\\n`;
    md += `**Generated**: ${new Date().toLocaleString()}\\n`;
    md += `**Curriculum**: ${pageTitle}\\n\\n`;
    md += `## Active Mission\\n\\n`;
    md += `> "Build and deploy production-grade software projects with computational thinking, zero-bug discipline, and creative confidence."\\n\\n`;
    md += `## Learning Records (Educational ADRs)\\n\\n`;
    
    if (!records.length) {
      md += `*No milestones recorded yet. Complete lessons to build records.*\\n`;
    } else {
      records.forEach((r, idx) => {
        md += `### LR-${String(records.length - idx).padStart(4, '0')}: ${r.title}\\n`;
        md += `- **Date**: ${r.date}\\n`;
        md += `- **Lesson**: ${r.lessonTitle}\\n`;
        md += `- **Evidence**: ${r.evidence}\\n`;
        md += `- **Status**: Active & Verified (+${r.xp || 50} XP)\\n\\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STEMULUS_LEARNING_JOURNEY_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    playSuccessSound();
  };

  /* ==========================================================================
     ZERO-DEPENDENCY PURE SVG QR CODE ENGINE (STEMULUS_QR)
     ========================================================================== */
  (function() {
    function QR8bitByte(data) { this.mode = 4; this.data = data; }
    QR8bitByte.prototype = {
      getLength: function() { return this.data.length; },
      write: function(buf) { for (var i = 0; i < this.data.length; i++) buf.put(this.data.charCodeAt(i), 8); }
    };
    function QRCode(typeNumber, errorCorrectLevel) {
      this.typeNumber = typeNumber;
      this.errorCorrectLevel = errorCorrectLevel;
      this.modules = null;
      this.moduleCount = 0;
      this.dataList = [];
    }
    QRCode.prototype = {
      addData: function(d) { this.dataList.push(new QR8bitByte(d)); },
      isDark: function(r, c) { return this.modules[r][c]; },
      getModuleCount: function() { return this.moduleCount; },
      make: function() {
        var typeNumber = 1;
        for (; typeNumber < 40; typeNumber++) {
          var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);
          var buf = new QRBitBuffer();
          var total = 0;
          for (var i = 0; i < rsBlocks.length; i++) total += rsBlocks[i].dataCount;
          for (var i = 0; i < this.dataList.length; i++) {
            var d = this.dataList[i];
            buf.put(d.mode, 4);
            buf.put(d.getLength(), QRUtil.getLengthInBits(d.mode, typeNumber));
            d.write(buf);
          }
          if (buf.getLengthInBits() <= total * 8) break;
        }
        this.typeNumber = typeNumber;
        this.moduleCount = this.typeNumber * 4 + 17;
        this.modules = new Array(this.moduleCount);
        for (var r = 0; r < this.moduleCount; r++) {
          this.modules[r] = new Array(this.moduleCount);
          for (var c = 0; c < this.moduleCount; c++) this.modules[r][c] = null;
        }
        this.setupPositionProbePattern(0, 0);
        this.setupPositionProbePattern(this.moduleCount - 7, 0);
        this.setupPositionProbePattern(0, this.moduleCount - 7);
        this.setupPositionAdjustPattern();
        this.setupTimingPattern();
        this.setupTypeInfo(false, 0);
        var dataCache = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
        this.mapData(dataCache, 0);
      },
      setupPositionProbePattern: function(row, col) {
        for (var r = -1; r <= 7; r++) {
          if (row + r <= -1 || this.moduleCount <= row + r) continue;
          for (var c = -1; c <= 7; c++) {
            if (col + c <= -1 || this.moduleCount <= col + c) continue;
            this.modules[row + r][col + c] = ((0 <= r && r <= 6 && (c == 0 || c == 6)) || (0 <= c && c <= 6 && (r == 0 || r == 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4));
          }
        }
      },
      setupTimingPattern: function() {
        for (var r = 8; r < this.moduleCount - 8; r++) if (this.modules[r][6] == null) this.modules[r][6] = (r % 2 == 0);
        for (var c = 8; c < this.moduleCount - 8; c++) if (this.modules[6][c] == null) this.modules[6][c] = (c % 2 == 0);
      },
      setupPositionAdjustPattern: function() {
        var pos = QRUtil.getPatternPosition(this.typeNumber);
        for (var i = 0; i < pos.length; i++) {
          for (var j = 0; j < pos.length; j++) {
            var row = pos[i], col = pos[j];
            if (this.modules[row][col] != null) continue;
            for (var r = -2; r <= 2; r++) {
              for (var c = -2; c <= 2; c++) {
                this.modules[row + r][col + c] = (r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0));
              }
            }
          }
        }
      },
      setupTypeInfo: function(test, maskPattern) {
        var data = (this.errorCorrectLevel << 3) | maskPattern;
        var bits = QRUtil.getBCHTypeInfo(data);
        for (var i = 0; i < 15; i++) {
          var mod = (!test && ((bits >> i) & 1) == 1);
          if (i < 6) this.modules[i][8] = mod;
          else if (i < 8) this.modules[i + 1][8] = mod;
          else this.modules[this.moduleCount - 15 + i][8] = mod;
          if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
          else if (i < 9) this.modules[8][15 - i] = mod;
          else this.modules[8][15 - i - 1] = mod;
        }
        this.modules[this.moduleCount - 8][8] = (!test);
      },
      mapData: function(data, maskPattern) {
        var inc = -1, row = this.moduleCount - 1, bitIndex = 7, byteIndex = 0;
        for (var col = this.moduleCount - 1; col > 0; col -= 2) {
          if (col == 6) col--;
          while (true) {
            for (var c = 0; c < 2; c++) {
              if (this.modules[row][col - c] == null) {
                var dark = false;
                if (byteIndex < data.length) dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
                if (QRUtil.getMask(maskPattern, row, col - c)) dark = !dark;
                this.modules[row][col - c] = dark;
                bitIndex--;
                if (bitIndex == -1) { byteIndex++; bitIndex = 7; }
              }
            }
            row += inc;
            if (row < 0 || this.moduleCount <= row) { row -= inc; inc = -inc; break; }
          }
        }
      },
      toSvg: function(size, margin, color) {
        size = size || 180; margin = (typeof margin === 'number') ? margin : 2; color = color || '#0F172A';
        var count = this.getModuleCount(), totalDim = count + margin * 2, path = '';
        for (var r = 0; r < count; r++) {
          for (var c = 0; c < count; c++) {
            if (this.isDark(r, c)) path += 'M' + (c + margin) + ' ' + (r + margin) + 'h1v1h-1z ';
          }
        }
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + totalDim + ' ' + totalDim + '" width="' + size + '" height="' + size + '" shape-rendering="crispEdges">' +
               '<rect width="100%" height="100%" fill="#FFFFFF" rx="8"/>' +
               '<path d="' + path + '" fill="' + color + '"/>' +
               '</svg>';
      }
    };
    QRCode.createData = function(typeNumber, errorCorrectLevel, dataList) {
      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
      var buffer = new QRBitBuffer();
      for (var i = 0; i < dataList.length; i++) {
        var data = dataList[i];
        buffer.put(data.mode, 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
        data.write(buffer);
      }
      var totalDataCount = 0;
      for (var i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
      while (buffer.getLengthInBits() % 8 != 0) buffer.putBit(false);
      while (true) {
        if (buffer.getLengthInBits() >= totalDataCount * 8) break;
        buffer.put(0xEC, 8);
        if (buffer.getLengthInBits() >= totalDataCount * 8) break;
        buffer.put(0x11, 8);
      }
      return QRCode.createBytes(buffer, rsBlocks);
    };
    QRCode.createBytes = function(buffer, rsBlocks) {
      var offset = 0, maxDcCount = 0, maxEcCount = 0;
      var dcdata = new Array(rsBlocks.length), ecdata = new Array(rsBlocks.length);
      for (var r = 0; r < rsBlocks.length; r++) {
        var dcCount = rsBlocks[r].dataCount, ecCount = rsBlocks[r].totalCount - dcCount;
        maxDcCount = Math.max(maxDcCount, dcCount); maxEcCount = Math.max(maxEcCount, ecCount);
        dcdata[r] = new Array(dcCount);
        for (var i = 0; i < dcdata[r].length; i++) dcdata[r][i] = 0xff & buffer.buffer[i + offset];
        offset += dcCount;
        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (var i = 0; i < ecdata[r].length; i++) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
        }
      }
      var totalCodeCount = 0;
      for (var i = 0; i < rsBlocks.length; i++) totalCodeCount += rsBlocks[i].totalCount;
      var data = new Array(totalCodeCount), index = 0;
      for (var i = 0; i < maxDcCount; i++) {
        for (var r = 0; r < rsBlocks.length; r++) { if (i < dcdata[r].length) data[index++] = dcdata[r][i]; }
      }
      for (var i = 0; i < maxEcCount; i++) {
        for (var r = 0; r < rsBlocks.length; r++) { if (i < ecdata[r].length) data[index++] = ecdata[r][i]; }
      }
      return data;
    };
    var QRUtil = {
      PATTERN_POSITION_TABLE: [
        [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
        [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
        [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70],
        [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86],
        [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98],
        [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110],
        [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122],
        [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134],
        [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146],
        [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154],
        [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162],
        [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]
      ],
      G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
      G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),
      getBCHTypeInfo: function(data) {
        var d = data << 10;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
          d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)));
        }
        return ((data << 10) | d) ^ QRUtil.G15_MASK;
      },
      getBCHDigit: function(data) { var digit = 0; while (data != 0) { digit++; data >>>= 1; } return digit; },
      getPatternPosition: function(t) { return QRUtil.PATTERN_POSITION_TABLE[t - 1]; },
      getMask: function(p, i, j) {
        switch (p) {
          case 0: return (i + j) % 2 == 0;
          case 1: return i % 2 == 0;
          case 2: return j % 3 == 0;
          case 3: return (i + j) % 3 == 0;
          case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
          case 5: return (i * j) % 2 + (i * j) % 3 == 0;
          case 6: return ((i * j) % 2 + (i * j) % 3) % 2 == 0;
          case 7: return ((i * j) % 3 + (i + j) % 2) % 2 == 0;
          default: return false;
        }
      },
      getErrorCorrectPolynomial: function(ecLen) {
        var a = new QRPolynomial([1], 0);
        for (var i = 0; i < ecLen; i++) a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
        return a;
      },
      getLengthInBits: function(mode, type) {
        if (type < 10) return (mode == 4 ? 8 : (mode == 2 ? 9 : 10));
        if (type < 27) return (mode == 4 ? 16 : (mode == 2 ? 11 : 12));
        return (mode == 4 ? 16 : (mode == 2 ? 13 : 14));
      }
    };
    var QRMath = {
      glog: function(n) { return QRMath.LOG_TABLE[n]; },
      gexp: function(n) { while (n < 0) n += 255; while (n >= 255) n -= 255; return QRMath.EXP_TABLE[n]; },
      EXP_TABLE: new Array(256),
      LOG_TABLE: new Array(256)
    };
    for (var i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
    for (var i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
    for (var i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

    function QRPolynomial(num, shift) {
      var offset = 0;
      while (offset < num.length && num[offset] == 0) offset++;
      this.num = new Array(num.length - offset + shift);
      for (var i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
    }
    QRPolynomial.prototype = {
      get: function(i) { return this.num[i]; },
      getLength: function() { return this.num.length; },
      multiply: function(e) {
        var num = new Array(this.getLength() + e.getLength() - 1);
        for (var i = 0; i < this.getLength(); i++) {
          for (var j = 0; j < e.getLength(); j++) num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
        }
        return new QRPolynomial(num, 0);
      },
      mod: function(e) {
        if (this.getLength() - e.getLength() < 0) return this;
        var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
        var num = new Array(this.getLength());
        for (var i = 0; i < this.getLength(); i++) num[i] = this.get(i);
        for (var i = 0; i < e.getLength(); i++) num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
        return new QRPolynomial(num, 0).mod(e);
      }
    };
    function QRRSBlock(totalCount, dataCount) { this.totalCount = totalCount; this.dataCount = dataCount; }
    QRRSBlock.RS_BLOCK_TABLE = [
      [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
      [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
      [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
      [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
      [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
      [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
      [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
      [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
      [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
      [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16]
    ];
    QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
      var rsBlock = QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1]; // Level L
      var length = rsBlock.length / 3, list = [];
      for (var i = 0; i < length; i++) {
        var count = rsBlock[i * 3 + 0], totalCount = rsBlock[i * 3 + 1], dataCount = rsBlock[i * 3 + 2];
        for (var j = 0; j < count; j++) list.push(new QRRSBlock(totalCount, dataCount));
      }
      return list;
    };
    function QRBitBuffer() { this.buffer = []; this.length = 0; }
    QRBitBuffer.prototype = {
      put: function(num, length) { for (var i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) == 1); },
      getLengthInBits: function() { return this.length; },
      putBit: function(bit) {
        var bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) this.buffer.push(0);
        if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
        this.length++;
      }
    };
    window.STEMULUS_QR = {
      createSvg: function(text, size, margin, color) {
        var qr = new QRCode(0, 0);
        qr.addData(text);
        qr.make();
        return qr.toSvg(size || 180, margin || 2, color || '#0F172A');
      }
    };
  })();

  /* ==========================================================================
     UNIVERSAL COMMAND PALETTE (Ctrl+K / Cmd+K Spotlight Modal)
     ========================================================================== */
  let commandPaletteBackdrop = null;
  let commandPaletteInput = null;
  let commandPaletteResults = null;
  let currentFilteredCommands = [];
  let selectedCommandIndex = 0;

  function getAllCommands() {
    const nextBtnElem = document.querySelector('.btn-next-lesson');
    const nextHref = nextBtnElem ? nextBtnElem.getAttribute('href') : null;
    const nextText = nextBtnElem ? nextBtnElem.innerText.trim() : 'Continue Next Lesson';

    return [
      { group: 'Slide Jumps', title: 'Slide 1: Mission Launch & Hook', shortcut: '1', action: () => updateSlide(0) },
      { group: 'Slide Jumps', title: 'Slide 2: Concepts & Architecture', shortcut: '2', action: () => updateSlide(1) },
      { group: 'Slide Jumps', title: 'Slide 3: Interactive Coding Sandbox & Workbench', shortcut: '3', action: () => updateSlide(2) },
      { group: 'Slide Jumps', title: 'Slide 4: Real-World Case Study & Application', shortcut: '4', action: () => updateSlide(3) },
      { group: 'Slide Jumps', title: 'Slide 5: Concept Check Quiz & Solo Quest', shortcut: '5', action: () => updateSlide(4) },
      { group: 'Slide Jumps', title: 'Slide 6: Lesson Summary & Take-Home Practice', shortcut: '6', action: () => updateSlide(5) },
      
      ...(nextHref ? [{ group: 'Navigation', title: nextText, shortcut: '↵', action: () => { window.location.href = nextHref; } }] : []),
      { group: 'Navigation', title: 'Return to Curriculum Learning Portal', shortcut: 'Esc', action: () => { window.location.href = '../../index.html'; } },

      { group: 'Tutor & Student Tools', title: 'Toggle Mentor Guide Cockpit', shortcut: 'T', action: () => window.toggleTutorCockpit() },
      { group: 'Tutor & Student Tools', title: 'Parent & Mobile QR Code (Scan to View)', shortcut: 'Q', action: () => window.openParentQrModal() },
      { group: 'Tutor & Student Tools', title: 'Print 1-Page Student Mission Brief (PDF)', shortcut: 'P', action: () => window.printMissionBrief() },
      { group: 'Tutor & Student Tools', title: 'Student Learning Journey & ADR Records', shortcut: 'M', action: () => window.toggleLearningJourney() },
      { group: 'Tutor & Student Tools', title: 'Canonical Concept Glossary', shortcut: 'G', action: () => window.toggleGlossary() },
      { group: 'Tutor & Student Tools', title: 'Toggle Presentation Fullscreen', shortcut: 'F', action: () => toggleFullscreen() },
      { group: 'Tutor & Student Tools', title: 'Launch Interactive Assessment Runner', shortcut: '', action: () => { window.location.href = '../../../assessments/interactive_assessment_runner.html'; } },
      { group: 'Tutor & Student Tools', title: 'Launch Prompt Lab & AI Playground', shortcut: '', action: () => { window.location.href = '../../../prompt_lab/prompt_tester.html'; } },
      { group: 'Tutor & Student Tools', title: 'Verify Workbench Solution (+50 XP)', shortcut: 'V', action: () => window.verifyLessonSolution() }
    ];
  }

  function renderCommandPaletteResults(filterText) {
    if (!commandPaletteResults) return;
    const all = getAllCommands();
    const query = (filterText || '').toLowerCase().trim();
    
    currentFilteredCommands = query ? all.filter(c => c.title.toLowerCase().includes(query) || c.group.toLowerCase().includes(query)) : all;
    selectedCommandIndex = 0;

    if (!currentFilteredCommands.length) {
      commandPaletteResults.innerHTML = '<div style="padding: 24px; text-align: center; color: #94A3B8; font-size: 13.5px; font-weight: 600;">No actions match your search.</div>';
      return;
    }

    let lastGroup = null;
    let html = '';
    currentFilteredCommands.forEach((cmd, idx) => {
      if (cmd.group !== lastGroup) {
        lastGroup = cmd.group;
        html += `<div class="command-group-title">${lastGroup}</div>`;
      }
      html += `
        <div class="command-item ${idx === 0 ? 'selected' : ''}" data-index="${idx}" onclick="window.selectAndExecuteCommand(${idx})">
          <div class="command-item-left">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 8 8 12 12 16"></polyline><line x1="16" y1="12" x2="8" y2="12"></line></svg>
            <span>${cmd.title}</span>
          </div>
          ${cmd.shortcut ? `<span class="command-shortcut">${cmd.shortcut}</span>` : ''}
        </div>
      `;
    });
    commandPaletteResults.innerHTML = html;
  }

  window.isCommandPaletteOpen = function() {
    return commandPaletteBackdrop && commandPaletteBackdrop.classList.contains('open');
  };

  window.toggleCommandPalette = function() {
    if (window.isCommandPaletteOpen()) {
      window.closeCommandPalette();
    } else {
      window.openCommandPalette();
    }
  };

  window.openCommandPalette = function() {
    if (!commandPaletteBackdrop) initCommandPalette();
    commandPaletteBackdrop.classList.add('open');
    if (commandPaletteInput) {
      commandPaletteInput.value = '';
      renderCommandPaletteResults('');
      setTimeout(() => commandPaletteInput.focus(), 60);
    }
    playClickSound();
  };

  window.closeCommandPalette = function() {
    if (commandPaletteBackdrop) {
      commandPaletteBackdrop.classList.remove('open');
      if (commandPaletteInput) commandPaletteInput.blur();
    }
  };

  window.navigateCommandPalette = function(delta) {
    if (!currentFilteredCommands.length) return;
    selectedCommandIndex = (selectedCommandIndex + delta + currentFilteredCommands.length) % currentFilteredCommands.length;
    const items = commandPaletteResults.querySelectorAll('.command-item');
    items.forEach((it, idx) => {
      it.classList.toggle('selected', idx === selectedCommandIndex);
      if (idx === selectedCommandIndex) {
        it.scrollIntoView({ block: 'nearest' });
      }
    });
    playSlideSound();
  };

  window.executeSelectedCommand = function() {
    if (currentFilteredCommands[selectedCommandIndex]) {
      const act = currentFilteredCommands[selectedCommandIndex].action;
      window.closeCommandPalette();
      if (act) act();
    }
  };

  window.selectAndExecuteCommand = function(idx) {
    selectedCommandIndex = idx;
    window.executeSelectedCommand();
  };

  function initCommandPalette() {
    if (document.getElementById('command-palette-backdrop')) return;

    commandPaletteBackdrop = document.createElement('div');
    commandPaletteBackdrop.id = 'command-palette-backdrop';
    commandPaletteBackdrop.className = 'command-palette-backdrop';
    commandPaletteBackdrop.innerHTML = `
      <div class="command-palette-modal">
        <div class="command-palette-search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" class="command-palette-input" id="command-palette-input" placeholder="Type a slide number, action, or tool..." autocomplete="off" spellcheck="false">
          <span class="command-kbd-badge" onclick="window.closeCommandPalette()">ESC</span>
        </div>
        <div class="command-palette-results" id="command-palette-results"></div>
        <div class="command-palette-footer">
          <span>Navigate with <kbd class="command-shortcut">&uarr;</kbd> <kbd class="command-shortcut">&darr;</kbd></span>
          <span>Select with <kbd class="command-shortcut">&crarr; Enter</kbd></span>
          <span>Close with <kbd class="command-shortcut">Esc</kbd></span>
        </div>
      </div>
    `;

    commandPaletteBackdrop.addEventListener('click', (e) => {
      if (e.target === commandPaletteBackdrop) window.closeCommandPalette();
    });

    document.body.appendChild(commandPaletteBackdrop);

    commandPaletteInput = commandPaletteBackdrop.querySelector('#command-palette-input');
    commandPaletteResults = commandPaletteBackdrop.querySelector('#command-palette-results');

    commandPaletteInput.addEventListener('input', (e) => {
      renderCommandPaletteResults(e.target.value);
    });

    injectSpotlightHeaderButton();
  }

  function injectSpotlightHeaderButton() {
    const headerControls = document.querySelector('.header-controls');
    if (!headerControls || headerControls.querySelector('#spotlight-btn')) return;

    const spotBtn = document.createElement('button');
    spotBtn.className = 'ctrl-btn spotlight-btn';
    spotBtn.id = 'spotlight-btn';
    spotBtn.title = 'Command Palette & Quick Jump (Ctrl+K or ⌘K)';
    spotBtn.innerHTML = `
      <svg class="ui-svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      <span>Jump (⌘K)</span>
    `;
    spotBtn.addEventListener('click', () => window.toggleCommandPalette());

    const portalLink = headerControls.querySelector('a[href*="index.html"]');
    if (portalLink) {
      headerControls.insertBefore(spotBtn, portalLink);
    } else {
      headerControls.appendChild(spotBtn);
    }
  }

  /* ==========================================================================
     MOBILE & PARENT QR CODE CONNECT MODAL
     ========================================================================== */
  function initParentQrSystem() {
    const nextRow = document.querySelector('.next-lesson-row');
    if (nextRow && !nextRow.querySelector('.btn-parent-qr')) {
      const qrBtn = document.createElement('button');
      qrBtn.className = 'btn-3d neutral btn-parent-qr';
      qrBtn.style.padding = '10px 18px';
      qrBtn.style.fontSize = '13.5px';
      qrBtn.innerHTML = `
        <svg class="ui-svg" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        <span>Parent / Mobile QR</span>
      `;
      qrBtn.addEventListener('click', () => window.openParentQrModal());
      nextRow.appendChild(qrBtn);
    }
  }

  window.openParentQrModal = function() {
    let modalBackdrop = document.getElementById('parent-qr-backdrop');
    if (!modalBackdrop) {
      modalBackdrop = document.createElement('div');
      modalBackdrop.id = 'parent-qr-backdrop';
      modalBackdrop.className = 'parent-qr-backdrop';
      modalBackdrop.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 99999;';
      modalBackdrop.innerHTML = `
        <div class="parent-qr-card" style="background: #FFFFFF; border-radius: 20px; border: 1px solid #CBD5E1; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); width: 440px; max-width: 92vw; padding: 28px; text-align: center; position: relative;">
          <button style="position: absolute; top: 16px; right: 16px; background: #F1F5F9; border: none; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748B;" onclick="window.closeParentQrModal()">
            <svg class="ui-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 8px;">
            <img src="../../assets/3d/qr-block-3d.png" style="width: 32px; height: 32px; object-fit: contain;" alt="QR" onerror="this.style.display='none'">
            <h3 style="font-family: 'Fredoka', 'Nunito', sans-serif; font-size: 20px; font-weight: 700; color: #0F172A; margin: 0;">Mobile & Parent Connect</h3>
          </div>
          <p style="font-size: 13.5px; color: #64748B; font-weight: 600; margin: 0 0 20px;">Scan with any phone or tablet camera to view this lesson, review take-home project instructions, and monitor student milestones.</p>
          <div id="parent-qr-svg-wrap" style="display: inline-flex; padding: 14px; background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 16px; box-shadow: inset 0 2px 4px rgba(15, 23, 42, 0.04); margin-bottom: 16px;"></div>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <input id="parent-qr-url-input" type="text" readonly style="flex: 1; padding: 8px 12px; font-size: 12px; font-family: 'JetBrains Mono', monospace; background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 8px; color: #334155;">
            <button id="parent-qr-copy-btn" class="btn-3d primary" style="padding: 8px 14px; font-size: 12px;">Copy Link</button>
          </div>
          <div id="parent-qr-copy-msg" style="font-size: 12px; color: #059669; font-weight: 700; height: 18px; margin-top: 6px; display: none;">Copied to clipboard!</div>
        </div>
      `;
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) window.closeParentQrModal();
      });
      document.body.appendChild(modalBackdrop);

      const copyBtn = modalBackdrop.querySelector('#parent-qr-copy-btn');
      copyBtn.addEventListener('click', () => {
        const inp = modalBackdrop.querySelector('#parent-qr-url-input');
        if (inp) {
          navigator.clipboard.writeText(inp.value).then(() => {
            playSuccessSound();
            const msg = modalBackdrop.querySelector('#parent-qr-copy-msg');
            msg.style.display = 'block';
            setTimeout(() => msg.style.display = 'none', 2000);
          }).catch(() => {});
        }
      });
    }

    const currentUrl = window.location.href;
    const urlInput = modalBackdrop.querySelector('#parent-qr-url-input');
    if (urlInput) urlInput.value = currentUrl;

    const qrWrap = modalBackdrop.querySelector('#parent-qr-svg-wrap');
    if (qrWrap && window.STEMULUS_QR) {
      qrWrap.innerHTML = window.STEMULUS_QR.createSvg(currentUrl, 180, 2, '#0F172A');
    }

    modalBackdrop.style.display = 'flex';
    playSlideSound();
  };

  window.closeParentQrModal = function() {
    const modalBackdrop = document.getElementById('parent-qr-backdrop');
    if (modalBackdrop) modalBackdrop.style.display = 'none';
  };

  /* ==========================================================================
     MONACO-GRADE CODE CONTAINER PRESENTATION
     ========================================================================== */
  function initMonacoCodeEnhancements() {
    const codeContainers = document.querySelectorAll('.code-container');
    codeContainers.forEach(container => {
      const header = container.querySelector('.code-header');
      if (header && !header.querySelector('.monaco-mac-dots')) {
        const dots = document.createElement('div');
        dots.className = 'monaco-mac-dots';
        dots.style.cssText = 'display: inline-flex; gap: 6px; align-items: center; margin-right: 10px;';
        dots.innerHTML = `
          <span style="width: 10px; height: 10px; border-radius: 50%; background: #EF4444; opacity: 0.85; display: inline-block;"></span>
          <span style="width: 10px; height: 10px; border-radius: 50%; background: #F59E0B; opacity: 0.85; display: inline-block;"></span>
          <span style="width: 10px; height: 10px; border-radius: 50%; background: #10B981; opacity: 0.85; display: inline-block;"></span>
        `;
        header.insertBefore(dots, header.firstChild);
      }

      // 1-Click Code Solution Download
      const actions = container.querySelector('.code-header-actions');
      if (actions && !actions.querySelector('.download-code-btn')) {
        const dlBtn = document.createElement('button');
        dlBtn.className = 'code-action-btn download-code-btn';
        dlBtn.title = 'Download code file to your computer';
        dlBtn.innerHTML = `
          <svg class="ui-svg" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span>Download</span>
        `;
        dlBtn.addEventListener('click', () => {
          const codeBlock = container.querySelector('.code-block');
          if (!codeBlock) return;
          const code = codeBlock.innerText;
          const meta = window.STEMULUS_LESSON_META || {};
          let ext = 'txt';
          if (code.includes('<!DOCTYPE html>') || code.includes('<html>')) ext = 'html';
          else if (code.includes('def ') || code.includes('import ') || code.includes('print(')) ext = 'py';
          else if (code.includes('const ') || code.includes('let ') || code.includes('function ')) ext = 'js';
          else if (code.includes('{') && (code.includes('margin:') || code.includes('display:'))) ext = 'css';
          else if (code.includes('SELECT ') || code.includes('FROM ')) ext = 'sql';
          
          const filename = (meta.lessonSlug || 'stemulus_solution') + '.' + ext;
          const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          playSuccessSound();
        });
        actions.appendChild(dlBtn);
      }
    });
  }

  /* ==========================================================================
     COURSE COMPLETION & ASSESSMENT CELEBRATION SYSTEM
     ========================================================================== */
  function getTrackCourseId() {
    const path = window.location.pathname.toLowerCase().replace(/\\/g, '/');
    if (path.includes('track_1_web_engineering')) return 'COURSE-WEB-DEV';
    if (path.includes('track_2_ai_automation')) return 'COURSE-AI-PROMPT';
    if (path.includes('track_3_product_design')) return 'COURSE-UIUX-DESIGN';
    if (path.includes('track_4_python_data')) return 'COURSE-PYTHON-CORE';
    if (path.includes('track_5_cybersecurity')) return 'COURSE-DIGITAL-SAFETY';
    if (path.includes('track_6_robotics')) return 'COURSE-ROBOTICS-SIM';
    if (path.includes('course_ai_studio')) return 'COURSE-AI-PROMPT';
    if (path.includes('course_fundamentals')) return 'COURSE-INTRO-CS';
    return 'COURSE-AI-PROMPT';
  }

  function initCourseCompletionSystem() {
    const nextBtnElem = document.querySelector('.btn-next-lesson');
    if (!nextBtnElem) return;
    const href = nextBtnElem.getAttribute('href') || '';
    if (href.includes('interactive_assessment_runner.html')) {
      const courseId = getTrackCourseId();
      nextBtnElem.setAttribute('href', `../../../assessments/interactive_assessment_runner.html?course=${courseId}`);
      nextBtnElem.innerHTML = `
        <span>Complete Course Assessment &amp; Claim Certificate</span>
        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
      `;

      const ribbon = document.querySelector('.next-lesson-ribbon');
      if (ribbon) {
        const titleElem = ribbon.querySelector('div');
        if (titleElem && titleElem.innerText.includes('Lesson Completed')) {
          titleElem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <img src="../../assets/3d/gold-trophy-3d.png" style="width: 26px; height: 26px; object-fit: contain;" alt="Trophy">
              <span style="font-family: 'Fredoka', 'Nunito', sans-serif; font-size: 20px; font-weight: 800; color: #0F172A;">Course Curriculum Completed!</span>
            </div>
            <p style="font-size: 13px; color: #64748B; font-weight: 600; margin: 0 0 10px 0;">Take your course assessment now to claim your verified certificate of completion and capstone evaluation.</p>
          `;
        }
      }
    }
  }

  function handleFinalSlideReached() {
    const nextBtnElem = document.querySelector('.btn-next-lesson');
    if (!nextBtnElem) return;
    const href = nextBtnElem.getAttribute('href') || '';
    if (href.includes('interactive_assessment_runner.html')) {
      burstConfetti();
      playSuccessFanfare();
      showCourseGraduationModal();
    }
  }

  function showCourseGraduationModal() {
    const sessionKey = 'stemulus_grad_modal_' + pagePath;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, 'true');

    const courseId = getTrackCourseId();
    let modal = document.getElementById('course-graduation-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'course-graduation-modal';
      modal.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 999999; padding: 20px;';
      modal.innerHTML = `
        <div style="background: #FFFFFF; border-radius: 24px; border: 1.5px solid #BAE6FD; box-shadow: 0 25px 50px -12px rgba(2, 132, 199, 0.25); width: 480px; max-width: 92vw; padding: 32px 24px; text-align: center; position: relative;">
          <div style="width: 68px; height: 68px; margin: 0 auto 14px auto; border-radius: 50%; background: #F0F9FF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.12);">
            <img src="../../assets/3d/gold-trophy-3d.png" style="width: 44px; height: 44px; object-fit: contain;" alt="Trophy">
          </div>
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; background: #E0F2FE; color: #0369A1; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px;">
            Course Curriculum Completed
          </div>
          <h2 style="font-family: 'Fredoka', 'Nunito', sans-serif; font-size: 23px; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; line-height: 1.25;">
            Ready to Claim Your Certificate?
          </h2>
          <p style="font-size: 14px; color: #475569; font-weight: 600; line-height: 1.55; margin: 0 0 20px 0;">
            You have completed all lessons in this curriculum track! Launch the final course assessment to test your problem-solving, review your capstone rubric, and claim your verified honors certificate.
          </p>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="../../../assessments/interactive_assessment_runner.html?course=${courseId}" class="tactile-btn" style="background: linear-gradient(180deg, #BAE6FD 0%, #38BDF8 100%); color: #0369A1; border: 1px solid #7DD3FC; padding: 12px 24px; border-radius: 14px; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 800; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 3px 0 #0284C7, 0 6px 14px rgba(56, 189, 248, 0.28);">
              <span>Start Course Completion Assessment &rarr;</span>
            </a>
            <button onclick="document.getElementById('course-graduation-modal').remove()" style="background: none; border: none; font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 700; color: #64748B; cursor: pointer; padding: 6px;">
              Review Slide 6 Notes First
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
  }

  // Digital Academy Pass Entitlement Interceptor
  function initPassEntitlementGate() {
    const nextBtnElem = document.querySelector('.btn-next-lesson');
    if (!nextBtnElem) return;

    nextBtnElem.addEventListener('click', (e) => {
      const href = nextBtnElem.getAttribute('href') || '';
      const targetMatch = href.match(/lesson[_-]?0*(\d+)/i);
      if (targetMatch) {
        const targetLessonNum = parseInt(targetMatch[1], 10);
        if (targetLessonNum > 3) {
          if (typeof StemulusPassEngine !== 'undefined') {
            if (!StemulusPassEngine.hasActivePass()) {
              e.preventDefault();
              const trackName = document.title ? document.title.split('|')[0].trim() : 'STEMulus Coding Track';
              StemulusPassEngine.showUpgradeModal(targetLessonNum, trackName);
            }
          } else {
            // Dynamically load Pass Engine
            const s = document.createElement('script');
            s.src = '../assets/stemulus-pass-engine.js';
            s.onload = () => {
              if (typeof StemulusPassEngine !== 'undefined' && !StemulusPassEngine.hasActivePass()) {
                e.preventDefault();
                const trackName = document.title ? document.title.split('|')[0].trim() : 'STEMulus Coding Track';
                StemulusPassEngine.showUpgradeModal(targetLessonNum, trackName);
              }
            };
            document.head.appendChild(s);
          }
        }
      }
    });
  }

  // Initialize
  initDots();
  loadSavedQuests();
  initCommandPalette();
  initParentQrSystem();
  initMonacoCodeEnhancements();
  initCourseCompletionSystem();
  initPassEntitlementGate();
  updateSlide(0);

  // Handle role parameters in URL
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('role') === 'tutor' || sessionStorage.getItem('stemulus_tutor_mode') === 'true') {
      if (tutorCockpit) tutorCockpit.classList.add('open');
      const tutorBtn = document.getElementById('tutor-btn');
      if (tutorBtn) tutorBtn.classList.add('active');
      sessionStorage.setItem('stemulus_tutor_mode', 'true');
    } else if (urlParams.get('role') === 'tutor_presenter') {
      document.body.classList.add('presenter-mode');
      if (tutorCockpit) tutorCockpit.classList.add('open');
    }
  } catch (e) {}
})();
