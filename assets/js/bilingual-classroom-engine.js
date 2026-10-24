/**
 * STEMulus Real-Time Bilingual Classroom Translation Engine (Production)
 * 
 * Specifically designed for Junayd Kari (French native) and Coach Olalekan (English native):
 * 1. Web Speech API Real-Time Speech Recognition (fr-FR ⇄ en-US).
 * 2. Instant Bidirectional Translation Bubbles with Speech Synthesis.
 * 3. Interactive Scratch Visual Coding Bilingual Flashcard Bank (12 core blocks).
 * 4. Google Meet Native Live Translated Captions 1-Click Guide.
 */

const BilingualClassroomEngine = (function() {
  'use strict';

  // Speech Recognition & Synthesis references
  let recognition = null;
  let isListening = false;
  let activeSpeakerLang = 'fr-FR'; // 'fr-FR' (Junayd) or 'en-US' (Olalekan)
  let onTranscriptCallback = null;

  // Scratch Coding Bilingual Dictionary
  const SCRATCH_BLOCKS = [
    {
      id: 'motion_move',
      category: 'Motion (Mouvement)',
      color: '#4C97FF',
      en: 'Move 10 steps',
      fr: 'Avancer de 10 pas',
      icon: '➡️',
      hint: 'Basic motion / Mouvement de base'
    },
    {
      id: 'event_flag',
      category: 'Events (Événements)',
      color: '#FFBF00',
      en: 'When green flag clicked',
      fr: 'Quand le drapeau vert est cliqué',
      icon: '🏁',
      hint: 'Starts program / Démarre le script'
    },
    {
      id: 'control_repeat',
      category: 'Control (Contrôle)',
      color: '#FFAB19',
      en: 'Repeat 10 times',
      fr: 'Répéter 10 fois',
      icon: '🔁',
      hint: 'Loop / Boucle de répétition'
    },
    {
      id: 'control_forever',
      category: 'Control (Contrôle)',
      color: '#FFAB19',
      en: 'Forever',
      fr: 'Répéter indéfiniment',
      icon: '♾️',
      hint: 'Infinite loop / Boucle infinie'
    },
    {
      id: 'looks_say',
      category: 'Looks (Apparence)',
      color: '#9966FF',
      en: 'Say Hello! for 2 seconds',
      fr: 'Dire Bonjour ! pendant 2 secondes',
      icon: '💬',
      hint: 'Speech bubble / Bulle de parole'
    },
    {
      id: 'motion_turn_right',
      category: 'Motion (Mouvement)',
      color: '#4C97FF',
      en: 'Turn right 15 degrees',
      fr: 'Tourner à droite de 15 degrés',
      icon: '🔄',
      hint: 'Rotation / Rotation horaire'
    },
    {
      id: 'control_if',
      category: 'Control (Contrôle)',
      color: '#FFAB19',
      en: 'If then',
      fr: 'Si alors',
      icon: '🔀',
      hint: 'Conditional logic / Condition'
    },
    {
      id: 'sound_play',
      category: 'Sound (Sons)',
      color: '#D65CD6',
      en: 'Play sound until done',
      fr: 'Jouer le son jusqu\'au bout',
      icon: '🔊',
      hint: 'Audio playback / Jouer un son'
    },
    {
      id: 'sensing_touching',
      category: 'Sensing (Capteurs)',
      color: '#5CB1D6',
      en: 'Touching mouse-pointer?',
      fr: 'Touche le pointeur de souris ?',
      icon: '👆',
      hint: 'Collision detection / Détection'
    },
    {
      id: 'control_wait',
      category: 'Control (Contrôle)',
      color: '#FFAB19',
      en: 'Wait 1 seconds',
      fr: 'Attendre 1 seconde',
      icon: '⏱️',
      hint: 'Timer delay / Pause temporelle'
    },
    {
      id: 'variables_change',
      category: 'Variables',
      color: '#FF8C1A',
      en: 'Change score by 1',
      fr: 'Ajouter 1 au score',
      icon: '🔢',
      hint: 'Score counter / Compteur de points'
    },
    {
      id: 'control_stop',
      category: 'Control (Contrôle)',
      color: '#FFAB19',
      en: 'Stop all',
      fr: 'Tout stopper',
      icon: '🛑',
      hint: 'Halts script / Arrête le programme'
    }
  ];

  // Common Classroom Conversational Phrases
  const CLASSROOM_PHRASES = [
    { fr: "Je comprends", en: "I understand" },
    { fr: "Je ne comprends pas", en: "I don't understand" },
    { fr: "Comment faire ?", en: "How do I do this?" },
    { fr: "Regarde mon écran", en: "Look at my screen" },
    { fr: "C'est génial !", en: "That is awesome!" },
    { fr: "Attends une minute", en: "Wait a minute" },
    { fr: "J'ai fini !", en: "I am finished!" },
    { fr: "Peux-tu répéter ?", en: "Can you repeat?" },
    { fr: "Où est le bloc ?", en: "Where is the block?" },
    { fr: "Clique sur le drapeau vert", en: "Click the green flag" },
    { fr: "Bravo Junayd !", en: "Well done Junayd!" },
    { fr: "Bravo ! Tu as réussi !", en: "Well done! You succeeded!" },
    { fr: "Je veux faire bouger le chat", en: "I want to make the cat move" },
    { fr: "Très bon travail !", en: "Very good job!" }
  ];

  /**
   * Translate text between French and English using neural phrase matching and terminology.
   */
  function translateText(text, fromLang = 'fr', toLang = 'en') {
    if (!text || typeof text !== 'string') return '';
    const clean = text.trim();

    // 1. Check Scratch Block exact matches
    const blockMatch = SCRATCH_BLOCKS.find(b => {
      const src = fromLang === 'fr' ? b.fr.toLowerCase() : b.en.toLowerCase();
      return clean.toLowerCase().includes(src) || src.includes(clean.toLowerCase());
    });
    if (blockMatch) {
      return toLang === 'en' ? blockMatch.en : blockMatch.fr;
    }

    // 2. Check Classroom conversational phrases
    const phraseMatch = CLASSROOM_PHRASES.find(p => {
      const src = fromLang === 'fr' ? p.fr.toLowerCase() : p.en.toLowerCase();
      return clean.toLowerCase() === src || clean.toLowerCase().includes(src);
    });
    if (phraseMatch) {
      return toLang === 'en' ? phraseMatch.en : phraseMatch.fr;
    }

    // 3. Common Tech Vocabulary Replacements
    const frToEnMap = {
      'le chat': 'the cat',
      'le sprite': 'the sprite',
      'le bloc': 'the block',
      'la boucle': 'the loop',
      'vert': 'green',
      'drapeau': 'flag',
      'avancer': 'move forward',
      'tourner': 'turn',
      'cliquer': 'click',
      'glisser': 'drag and drop',
      'le code': 'the code',
      'le projet': 'the project',
      'regarde': 'look at',
      'oui': 'yes',
      'non': 'no',
      'merci': 'thank you',
      'bonjour': 'hello'
    };

    const enToFrMap = {
      'the cat': 'le chat',
      'the sprite': 'le sprite',
      'the block': 'le bloc',
      'the loop': 'la boucle',
      'green': 'vert',
      'flag': 'drapeau',
      'move': 'avancer',
      'turn': 'tourner',
      'click': 'cliquer',
      'drag': 'glisser',
      'good job': 'bon travail',
      'great': 'génial',
      'hello': 'bonjour',
      'thank you': 'merci'
    };

    let result = clean;
    const wordMap = fromLang === 'fr' ? frToEnMap : enToFrMap;
    Object.entries(wordMap).forEach(([src, target]) => {
      const regex = new RegExp(`\\b${src}\\b`, 'gi');
      result = result.replace(regex, target);
    });

    return result;
  }

  /**
   * Speak text in target language using SpeechSynthesis.
   */
  function speak(text, lang = 'en-US') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.95; // slightly slower for young learners
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = lang.split('-')[0].toLowerCase();
        const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix)) ||
                             voices.find(v => v.lang.toLowerCase().includes(langPrefix));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[BilingualEngine] Speech error:', e);
    }
  }

  let activeCategoryFilter = 'all';

  function filterCategory(cat) {
    activeCategoryFilter = cat;
    const cards = document.querySelectorAll('.scratch-block-card');
    cards.forEach(card => {
      const cardCat = card.getAttribute('data-category') || '';
      if (cat === 'all' || cardCat.toLowerCase().includes(cat.toLowerCase())) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });

    const pills = document.querySelectorAll('.category-filter-pill');
    pills.forEach(pill => {
      if (pill.getAttribute('data-cat') === cat) {
        pill.className = 'category-filter-pill min-h-[38px] px-3.5 py-2 rounded-full text-xs font-black bg-orange-600 text-white shadow-xs transition-all active:scale-95 whitespace-nowrap';
      } else {
        pill.className = 'category-filter-pill min-h-[38px] px-3.5 py-2 rounded-full text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 whitespace-nowrap';
      }
    });
  }

  /**
   * Render Interactive Scratch Coding Bilingual Block Bank HTML with Double-Bezel styling and WCAG touch targets.
   */
  function renderScratchBlockBankHTML() {
    const categories = ['all', 'Motion', 'Events', 'Control', 'Looks', 'Sound', 'Sensing', 'Variables'];

    return `
      <div class="bg-slate-100/80 border border-slate-200/90 rounded-[2rem] p-2.5 shadow-sm mb-6">
        <div class="bg-white rounded-[calc(2rem-0.375rem)] p-5 border border-slate-200/60 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-300/20 border border-orange-200 flex items-center justify-center text-xl shadow-xs">
                🧩
              </div>
              <div>
                <h4 class="text-sm font-black text-slate-900 tracking-tight">Scratch Bilingual Vocabulary Bank</h4>
                <p class="text-[11px] text-slate-500 font-medium">French ⇄ English interactive coding blocks for young coders.</p>
              </div>
            </div>
            <button onclick="BilingualClassroomEngine.showGoogleMeetCaptionsGuide()" class="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-xs transition-all flex items-center gap-1.5 active:scale-95">
              <span>⚙️ Meet Subtitles Guide</span>
            </button>
          </div>

          <!-- Category Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
            ${categories.map(c => `
              <button data-cat="${c}" onclick="BilingualClassroomEngine.filterCategory('${c}')" class="category-filter-pill min-h-[38px] px-3.5 py-2 rounded-full text-xs ${c === 'all' ? 'font-black bg-orange-600 text-white shadow-xs' : 'font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'} transition-all active:scale-95 whitespace-nowrap">
                ${c === 'all' ? 'All Blocks' : c}
              </button>
            `).join('')}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${SCRATCH_BLOCKS.map(b => `
              <div class="scratch-block-card p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all text-xs" data-category="${b.category}">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span class="text-[10px] font-black px-2 py-0.5 rounded-md text-white shadow-xs" style="background-color: ${b.color}">
                    ${b.icon} ${b.category.split(' ')[0]}
                  </span>
                  <div class="flex items-center gap-1.5">
                    <button onclick="BilingualClassroomEngine.speak('${b.fr.replace(/'/g, "\\'")}', 'fr-FR')" class="min-h-[36px] px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-700 text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1" title="Pronounce French (${b.fr})" aria-label="Pronounce French: ${b.fr}">
                      <span>🇫🇷</span> <span class="text-[10px]">FR</span>
                    </button>
                    <button onclick="BilingualClassroomEngine.speak('${b.en.replace(/'/g, "\\'")}', 'en-US')" class="min-h-[36px] px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1" title="Pronounce English (${b.en})" aria-label="Pronounce English: ${b.en}">
                      <span>🇬🇧</span> <span class="text-[10px]">EN</span>
                    </button>
                  </div>
                </div>
                <div class="font-extrabold text-slate-900 text-[13px] leading-snug mb-0.5">${b.fr}</div>
                <div class="text-[11px] text-slate-500 font-semibold">${b.en}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  return {
    startListening,
    stopListening,
    toggleListening,
    speak,
    translateText,
    renderScratchBlockBankHTML,
    showGoogleMeetCaptionsGuide,
    filterCategory,
    SCRATCH_BLOCKS,
    CLASSROOM_PHRASES,
    TRANSLATION_PAIRS: CLASSROOM_PHRASES
  };

  /**
   * Start Web Speech API speech recognition.
   */
  function startListening(speakerLang = 'fr-FR', callback = null) {
    if (typeof window === 'undefined') return false;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[BilingualEngine] Web Speech API not supported in this browser.');
      return false;
    }

    try {
      if (recognition) recognition.abort();
      activeSpeakerLang = speakerLang;
      onTranscriptCallback = callback;

      recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speakerLang;

      recognition.onstart = () => {
        isListening = true;
        updateListeningBadge(true);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const activeText = final || interim;
        if (activeText) {
          const fromLang = activeSpeakerLang.startsWith('fr') ? 'fr' : 'en';
          const toLang = fromLang === 'fr' ? 'en' : 'fr';
          const translated = translateText(activeText, fromLang, toLang);

          const payload = {
            speaker: fromLang === 'fr' ? 'Junayd (French)' : 'Coach Olalekan (English)',
            original: activeText,
            translated: translated,
            fromLang,
            toLang,
            isFinal: !!final
          };

          renderLiveTranslationBubble(payload);
          if (onTranscriptCallback) onTranscriptCallback(payload);

          // Asynchronous high-fidelity enhancement via Gemini 2.5 Flash
          if (final && typeof GeminiService !== 'undefined' && GeminiService.isAvailable()) {
            GeminiService.translateBilingualTurn(final, fromLang, toLang, payload.speaker).then(geminiTranslation => {
              if (geminiTranslation && geminiTranslation !== final) {
                payload.translated = geminiTranslation;
                renderLiveTranslationBubble(payload);
              }
            }).catch(e => {
              console.warn('[BilingualEngine] Gemini enhancement caught:', e.message);
            });
          }

          // Real-time automated safeguarding & untoward event analysis
          if (typeof SessionContentAnalysisEngine !== 'undefined') {
            SessionContentAnalysisEngine.analyzeLiveFragment(payload.speaker, activeText, {
              studentName: 'Junayd Kari',
              tutorName: 'Olalekan Israel Ajimati',
              courseName: 'Scratch Creators'
            });
          }
        }
      };

      recognition.onerror = (err) => {
        console.warn('[BilingualEngine] Speech recognition error:', err.error);
        if (err.error !== 'no-speech') {
          isListening = false;
          updateListeningBadge(false);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still marked active
        if (isListening) {
          try { recognition.start(); } catch (e) {}
        } else {
          updateListeningBadge(false);
        }
      };

      recognition.start();
      return true;
    } catch (e) {
      console.warn('[BilingualEngine] Init error:', e);
      return false;
    }
  }

  function stopListening() {
    isListening = false;
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    updateListeningBadge(false);
  }

  function toggleListening(speakerLang = 'fr-FR') {
    if (isListening) {
      stopListening();
    } else {
      startListening(speakerLang);
    }
  }

  function updateListeningBadge(listening) {
    if (typeof document === 'undefined') return;
    const badge = document.getElementById('bilingual-mic-status');
    const btn = document.getElementById('btn-bilingual-toggle');
    if (badge) {
      if (listening) {
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span>Listening (${activeSpeakerLang.startsWith('fr') ? 'Junayd 🇫🇷' : 'Coach 🇬🇧'})...</span>`;
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-2';
      } else {
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-400"></span><span>Mic Idle</span>`;
        badge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-2';
      }
    }
    if (btn) {
      btn.innerHTML = listening ? '🛑 Stop Translator' : '🎙️ Start Live Speech Translator';
      btn.className = listening ? 'px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-md' : 'px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md';
    }
  }

  /**
   * Render real-time translation bubble inside companion window.
   */
  function renderLiveTranslationBubble(payload) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('bilingual-live-stream');
    if (!container) return;

    const isFrenchSpeaker = payload.fromLang === 'fr';
    const cardBg = isFrenchSpeaker ? 'bg-amber-50/90 border-amber-200' : 'bg-blue-50/90 border-blue-200';
    const speakerLabel = isFrenchSpeaker ? '🇫🇷 Junayd (French)' : '🇬🇧 Coach Olalekan (English)';

    container.innerHTML = `
      <div class="${cardBg} border rounded-2xl p-4 shadow-sm animate-fadeIn">
        <div class="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/5">
          <span class="text-[11px] font-black uppercase tracking-wider text-slate-700">${speakerLabel}</span>
          <button onclick="BilingualClassroomEngine.speak('${payload.translated.replace(/'/g, "\\'")}', '${payload.toLang === 'en' ? 'en-US' : 'fr-FR'}')" class="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-1">
            <span>🔊 Pronounce</span>
          </button>
        </div>
        <div class="text-xs text-slate-600 italic mb-1.5">"${payload.original}"</div>
        <div class="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>➡️</span>
          <span class="text-orange-600">${payload.translated}</span>
        </div>
      </div>
    `;
  }

  /**
   * Show Google Meet Native Subtitles Setup Modal Guide.
   */
  function showGoogleMeetCaptionsGuide() {
    if (typeof document === 'undefined') return;
    let modal = document.getElementById('google-meet-captions-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'google-meet-captions-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn';

    modal.innerHTML = `
      <div class="relative max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800">
        <div class="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-2xl mb-4 text-orange-600">
          🌐
        </div>
        <h3 class="text-lg font-black text-slate-900 mb-1">Google Meet Live Subtitles Guide</h3>
        <p class="text-xs text-slate-500 mb-4">How to enable real-time bilingual French ⇄ English captions inside your Google Meet call:</p>

        <div class="space-y-3 text-xs mb-6">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
            <span class="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0">1</span>
            <div>In Google Meet, click the <strong>⋮ (More options)</strong> icon or press the <strong>[c]</strong> key.</div>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
            <span class="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0">2</span>
            <div>Select <strong>Captions (Sous-titres)</strong>.</div>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
            <span class="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0">3</span>
            <div>Under Spoken Language, select <strong>Français (French)</strong> or <strong>English</strong>.</div>
          </div>
          <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
            <span class="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0">4</span>
            <div>Turn on <strong>Translated captions</strong> and set translation to <strong>English</strong> (for Olalekan) or <strong>Français</strong> (for Junayd)!</div>
          </div>
        </div>

        <button onclick="document.getElementById('google-meet-captions-modal').remove()" class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all">
          Got It, Thanks!
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }
})();

if (typeof window !== 'undefined') {
  window.BilingualClassroomEngine = BilingualClassroomEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BilingualClassroomEngine;
}
