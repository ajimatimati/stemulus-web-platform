/**
 * STEMulus Lead Genius Engine
 * Interactive 30-Second AI Coding Track & Readiness Diagnostic
 * Bridges prospective parents from curiosity to personalized curriculum matching and instant 1-on-1 booking.
 */

const LeadGenius = (function() {
    'use strict';

    const CONFIG = {
        EMAIL_ENDPOINT: '/.netlify/functions/send-email',
        NTFY_TOPIC: 'stm-enr-lx7k9w2mq8vp4tz',
        WHATSAPP_NUMBER: '2347052466716',
        FIRESTORE_URL: 'https://firestore.googleapis.com/v1/projects/stemulus-lms/databases/(default)/documents/leads'
    };

    let modalEl = null;
    let currentStep = 1;
    let diagnosticData = {
        childName: '',
        childBirthday: '',
        childAge: null,
        interest: 'games',
        experience: 'beginner',
        parentName: '',
        email: '',
        phone: '',
        country: '',
        timeZone: '',
        recommendedTrack: null,
        sampleDeckUrl: ''
    };

    const TRACK_MATRIX = {
        young_games: {
            name: 'Game Creators & Visual Logic',
            ages: '5–8',
            tagline: 'Turn playtime into algorithmic mastery through Scratch 3.0 & interactive game physics.',
            deckSlug: 'game_creators_deck_01.html',
            trackKey: 'scratch',
            color: '#f97316'
        },
        older_games: {
            name: 'Python Power & Arcade Game Engineering',
            ages: '9–17',
            tagline: 'Build real playable 2D games and text RPGs using industry-standard Python 3 & Pygame.',
            deckSlug: 'python_deck_01.html',
            trackKey: 'python',
            color: '#3b82f6'
        },
        apps_web: {
            name: 'Web Wizards & Full-Stack Apps',
            ages: '10–17',
            tagline: 'Create live interactive websites, responsive web apps, and integrate cloud APIs.',
            deckSlug: 'web_wizards_deck_01.html',
            trackKey: 'web',
            color: '#10b981'
        },
        robotics: {
            name: 'Robotics & Virtual IoT Systems Lab',
            ages: '9–17',
            tagline: 'Simulate microcontrollers, sensors, ultrasonic radar, and automated smart circuits.',
            deckSlug: 'robotics_deck_01.html',
            trackKey: 'robotics',
            color: '#8b5cf6'
        },
        ai: {
            name: 'AI Explorers & Machine Learning',
            ages: '10–17',
            tagline: 'Train machine learning models, build computer vision games, and master AI prompt craft.',
            deckSlug: 'ai_explorers_deck_01.html',
            trackKey: 'ai',
            color: '#ec4899'
        },
        creative: {
            name: 'Creative Coding & Digital Arts',
            ages: '7–14',
            tagline: 'Write algorithmic animations, generative fractal art, and interactive music visualizers in p5.js.',
            deckSlug: 'creative_coding_deck_01.html',
            trackKey: 'creative',
            color: '#06b6d4'
        }
    };

    function init() {
        if (document.getElementById('lead-genius-modal')) return;

        injectStyles();
        injectModalDOM();
        injectFloatingBadge();
        bindGlobalTriggers();

        console.log('[LeadGenius] AI Coding Track Diagnostic ready.');
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'lead-genius-styles';
        style.textContent = `
            #lead-genius-modal {
                position: fixed;
                inset: 0;
                z-index: 1000080;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(15, 23, 42, 0.7);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: 'DM Sans', -apple-system, sans-serif;
                padding: 1rem;
                box-sizing: border-box;
            }
            #lead-genius-modal.open {
                opacity: 1;
                pointer-events: auto;
            }
            #lead-genius-card {
                width: 100%;
                max-width: 620px;
                max-height: 90vh;
                overflow-y: auto;
                background: #ffffff;
                border-radius: 24px;
                box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(226, 232, 240, 0.8);
                transform: scale(0.95) translateY(12px);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                color: #0f172a;
                padding: 2.25rem 2rem 2rem;
                box-sizing: border-box;
            }
            #lead-genius-modal.open #lead-genius-card {
                transform: scale(1) translateY(0);
            }
            .lg-close-btn {
                position: absolute;
                top: 1.25rem;
                right: 1.25rem;
                background: #f1f5f9;
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #64748b;
                transition: all 0.2s;
            }
            .lg-close-btn:hover {
                background: #e2e8f0;
                color: #0f172a;
                transform: rotate(90deg);
            }
            .lg-pill {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: #fff7ed;
                border: 1px solid #ffedd5;
                color: #f4600c;
                font-size: 0.72rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                padding: 4px 12px;
                border-radius: 100px;
                margin-bottom: 0.75rem;
            }
            .lg-title {
                font-family: 'Outfit', sans-serif;
                font-size: 1.55rem;
                font-weight: 800;
                color: #0f172a;
                margin: 0 0 0.35rem 0;
                letter-spacing: -0.02em;
            }
            .lg-subtitle {
                font-size: 0.86rem;
                color: #64748b;
                line-height: 1.5;
                margin: 0 0 1.5rem 0;
            }
            .lg-progress-bar {
                display: flex;
                height: 4px;
                background: #f1f5f9;
                border-radius: 4px;
                margin-bottom: 1.5rem;
                overflow: hidden;
            }
            .lg-progress-fill {
                background: linear-gradient(90deg, #f4600c, #2563eb);
                transition: width 0.3s ease;
            }
            .lg-grid-2 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }
            @media (max-width: 560px) {
                .lg-grid-2 { grid-template-columns: 1fr; gap: 0.75rem; }
                #lead-genius-card { padding: 1.5rem 1.25rem 1.25rem; }
            }
            .lg-label {
                display: block;
                font-size: 0.72rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: #475569;
                margin-bottom: 0.4rem;
            }
            .lg-input {
                width: 100%;
                padding: 0.75rem 0.9rem;
                border: 1.5px solid #e2e8f0;
                border-radius: 12px;
                font-size: 0.92rem;
                color: #0f172a;
                background: #f8fafc;
                transition: all 0.2s;
                box-sizing: border-box;
                font-family: inherit;
            }
            .lg-input:focus {
                outline: none;
                background: #ffffff;
                border-color: #f4600c;
                box-shadow: 0 0 0 3px rgba(244, 96, 12, 0.1);
            }
            .lg-choice-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.75rem;
                margin-bottom: 1.25rem;
            }
            .lg-choice-card {
                border: 2px solid #e2e8f0;
                background: #f8fafc;
                border-radius: 14px;
                padding: 1rem;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
                user-select: none;
            }
            .lg-choice-card:hover {
                border-color: #cbd5e1;
                background: #ffffff;
                transform: translateY(-2px);
            }
            .lg-choice-card.selected {
                border-color: #f4600c;
                background: #fff7ed;
            }
            .lg-choice-icon {
                font-size: 1.4rem;
                margin-bottom: 0.4rem;
            }
            .lg-choice-title {
                font-weight: 700;
                font-size: 0.88rem;
                color: #0f172a;
                margin-bottom: 0.2rem;
            }
            .lg-choice-desc {
                font-size: 0.75rem;
                color: #64748b;
                line-height: 1.35;
            }
            .lg-btn-next {
                width: 100%;
                background: linear-gradient(135deg, #f4600c, #ea580c);
                color: #ffffff;
                border: none;
                padding: 0.9rem 1.5rem;
                border-radius: 14px;
                font-weight: 800;
                font-size: 0.95rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.2s;
                box-shadow: 0 4px 14px rgba(244, 96, 12, 0.3);
                margin-top: 1.25rem;
            }
            .lg-btn-next:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(244, 96, 12, 0.4);
            }
            .lg-btn-secondary {
                background: #f1f5f9;
                color: #475569;
                border: none;
                padding: 0.75rem 1.25rem;
                border-radius: 12px;
                font-weight: 700;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            .lg-btn-secondary:hover {
                background: #e2e8f0;
                color: #0f172a;
            }
            /* Floating Badge Launcher */
            #lead-genius-launcher {
                position: fixed;
                bottom: 24px;
                left: 24px;
                z-index: 9998;
                background: #0f172a;
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 100px;
                padding: 10px 18px;
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                font-size: 0.82rem;
                font-weight: 700;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            #lead-genius-launcher:hover {
                background: #1e293b;
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 14px 35px rgba(244, 96, 12, 0.25);
                border-color: #f4600c;
            }
            .lg-pulse-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #22c55e;
                box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
                animation: lg-pulse 2s infinite;
            }
            @keyframes lg-pulse {
                0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
                100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
            }
            @media (max-width: 640px) {
                #lead-genius-launcher {
                    bottom: 84px;
                    left: 16px;
                    padding: 8px 14px;
                    font-size: 0.78rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function injectModalDOM() {
        modalEl = document.createElement('div');
        modalEl.id = 'lead-genius-modal';
        modalEl.setAttribute('aria-hidden', 'true');
        modalEl.innerHTML = `
            <div id="lead-genius-card" role="dialog" aria-modal="true">
                <button type="button" class="lg-close-btn" aria-label="Close Diagnostic">✕</button>
                <div class="lg-pill">✨ 30-Second AI Diagnostic</div>
                <div class="lg-progress-bar">
                    <div class="lg-progress-fill" id="lg-progress" style="width: 33%;"></div>
                </div>
                <div id="lg-step-container"></div>
            </div>
        `;
        document.body.appendChild(modalEl);

        modalEl.querySelector('.lg-close-btn').addEventListener('click', closeModal);
        modalEl.addEventListener('click', function(e) {
            if (e.target === modalEl) closeModal();
        });

        renderStep(1);
    }

    function injectFloatingBadge() {
        const badge = document.createElement('div');
        badge.id = 'lead-genius-launcher';
        badge.innerHTML = `
            <span class="lg-pulse-dot"></span>
            <span>🎯 Find Child's Coding Track <span style="color:#f4600c;font-weight:800;">(30s)</span></span>
        `;
        badge.addEventListener('click', openModal);
        document.body.appendChild(badge);
    }

    function bindGlobalTriggers() {
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a, button');
            if (target) {
                const href = target.getAttribute('href') || '';
                if (href === '#diagnostic' || target.classList.contains('btn-track-diagnostic')) {
                    e.preventDefault();
                    openModal();
                }
            }
        });
    }

    function openModal() {
        if (!modalEl) return;
        currentStep = 1;
        renderStep(1);
        modalEl.classList.add('open');
        modalEl.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modalEl) return;
        modalEl.classList.remove('open');
        modalEl.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function calculateAge(birthdayStr) {
        if (!birthdayStr) return null;
        const dob = new Date(birthdayStr);
        if (isNaN(dob.getTime())) return null;
        const diffMs = Date.now() - dob.getTime();
        return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
    }

    function determineTrack(age, interest) {
        const effectiveAge = age || 9;
        if (interest === 'games') {
            return effectiveAge <= 8 ? TRACK_MATRIX.young_games : TRACK_MATRIX.older_games;
        } else if (interest === 'web') {
            return TRACK_MATRIX.apps_web;
        } else if (interest === 'robotics') {
            return TRACK_MATRIX.robotics;
        } else if (interest === 'ai') {
            return TRACK_MATRIX.ai;
        } else if (interest === 'creative') {
            return TRACK_MATRIX.creative;
        }
        return effectiveAge <= 8 ? TRACK_MATRIX.young_games : TRACK_MATRIX.older_games;
    }

    function renderStep(step) {
        const container = document.getElementById('lg-step-container');
        const progress = document.getElementById('lg-progress');
        if (!container) return;

        if (step === 1) {
            if (progress) progress.style.width = '33%';
            container.innerHTML = `
                <h2 class="lg-title">Let's Find Your Child's Ideal Track</h2>
                <p class="lg-subtitle">Every child thinks differently. Enter their details to match their developmental stage to our 215-lesson curriculum.</p>
                
                <form id="lg-form-step1">
                    <div class="lg-grid-2">
                        <div>
                            <label class="lg-label" for="lg-child-name">Child's First Name *</label>
                            <input class="lg-input" type="text" id="lg-child-name" placeholder="e.g. Leo" required value="${diagnosticData.childName}">
                        </div>
                        <div>
                            <label class="lg-label" for="lg-child-birthday">Date of Birth *</label>
                            <input class="lg-input" type="date" id="lg-child-birthday" required max="2021-12-31" min="2008-01-01" value="${diagnosticData.childBirthday}">
                        </div>
                    </div>
                    
                    <div id="lg-age-badge" style="display:${diagnosticData.childAge ? 'flex' : 'none'}; align-items:center; gap:8px; margin-top:1rem; padding:8px 12px; background:#eff6ff; border-radius:10px; font-size:0.8rem; color:#1e40af;">
                        <span>🎂 Calculated Age: <strong id="lg-calc-age-val">${diagnosticData.childAge || ''} years old</strong></span>
                    </div>

                    <button type="submit" class="lg-btn-next">
                        <span>Continue: Discover Interests</span>
                        <span>→</span>
                    </button>
                </form>
            `;

            const bdayInput = document.getElementById('lg-child-birthday');
            const ageBadge = document.getElementById('lg-age-badge');
            const ageVal = document.getElementById('lg-calc-age-val');

            bdayInput.addEventListener('change', function() {
                const age = calculateAge(this.value);
                diagnosticData.childBirthday = this.value;
                diagnosticData.childAge = age;
                if (age && age >= 4 && age <= 18) {
                    ageBadge.style.display = 'flex';
                    ageVal.textContent = `${age} years old`;
                } else {
                    ageBadge.style.display = 'none';
                }
            });

            document.getElementById('lg-form-step1').addEventListener('submit', function(e) {
                e.preventDefault();
                diagnosticData.childName = document.getElementById('lg-child-name').value.trim();
                diagnosticData.childBirthday = document.getElementById('lg-child-birthday').value;
                diagnosticData.childAge = calculateAge(diagnosticData.childBirthday) || 9;
                currentStep = 2;
                renderStep(2);
            });

        } else if (step === 2) {
            if (progress) progress.style.width = '66%';
            container.innerHTML = `
                <h2 class="lg-title">What excites ${diagnosticData.childName || 'your child'} most?</h2>
                <p class="lg-subtitle">Pick their primary spark. Our 1-on-1 mentors tailor projects to what they already love.</p>
                
                <div class="lg-choice-grid">
                    <div class="lg-choice-card ${diagnosticData.interest === 'games' ? 'selected' : ''}" data-val="games">
                        <div class="lg-choice-icon">🎮</div>
                        <div class="lg-choice-title">Games & Arcade</div>
                        <div class="lg-choice-desc">Roblox, Minecraft, Scratch & Pygame mechanics</div>
                    </div>
                    <div class="lg-choice-card ${diagnosticData.interest === 'web' ? 'selected' : ''}" data-val="web">
                        <div class="lg-choice-icon">🌐</div>
                        <div class="lg-choice-title">Websites & Apps</div>
                        <div class="lg-choice-desc">Building real web apps, tools & custom interfaces</div>
                    </div>
                    <div class="lg-choice-card ${diagnosticData.interest === 'ai' ? 'selected' : ''}" data-val="ai">
                        <div class="lg-choice-icon">🤖</div>
                        <div class="lg-choice-title">Artificial Intelligence</div>
                        <div class="lg-choice-desc">Machine learning, vision detection & prompt labs</div>
                    </div>
                    <div class="lg-choice-card ${diagnosticData.interest === 'robotics' ? 'selected' : ''}" data-val="robotics">
                        <div class="lg-choice-icon">⚡</div>
                        <div class="lg-choice-title">Robotics & Hardware</div>
                        <div class="lg-choice-desc">Circuits, Arduino virtual sensors & automation</div>
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                    <button type="button" class="lg-btn-secondary" id="lg-btn-back-1">← Back</button>
                    <button type="button" class="lg-btn-next" id="lg-btn-to-step3" style="margin-top:0; flex:1;">
                        <span>Continue: Match Pathway</span>
                        <span>→</span>
                    </button>
                </div>
            `;

            container.querySelectorAll('.lg-choice-card').forEach(card => {
                card.addEventListener('click', function() {
                    container.querySelectorAll('.lg-choice-card').forEach(c => c.classList.remove('selected'));
                    this.classList.add('selected');
                    diagnosticData.interest = this.getAttribute('data-val');
                });
            });

            document.getElementById('lg-btn-back-1').addEventListener('click', () => { currentStep = 1; renderStep(1); });
            document.getElementById('lg-btn-to-step3').addEventListener('click', () => { currentStep = 3; renderStep(3); });

        } else if (step === 3) {
            if (progress) progress.style.width = '90%';
            container.innerHTML = `
                <h2 class="lg-title">Where should we send ${diagnosticData.childName}'s Diagnostic Roadmap?</h2>
                <p class="lg-subtitle">You'll receive their custom syllabus preview and an invitation for a free 45-minute 1-on-1 trial session.</p>
                
                <form id="lg-form-step3">
                    <div class="lg-grid-2">
                        <div>
                            <label class="lg-label" for="lg-parent-name">Parent Full Name *</label>
                            <input class="lg-input" type="text" id="lg-parent-name" placeholder="e.g. Sarah Jenkins" required value="${diagnosticData.parentName}">
                        </div>
                        <div>
                            <label class="lg-label" for="lg-email">Email Address *</label>
                            <input class="lg-input" type="email" id="lg-email" placeholder="e.g. sarah@example.com" required value="${diagnosticData.email}">
                        </div>
                    </div>
                    
                    <div class="lg-grid-2" style="margin-top:1rem;">
                        <div>
                            <label class="lg-label" for="lg-phone">WhatsApp / Phone *</label>
                            <input class="lg-input" type="tel" id="lg-phone" placeholder="e.g. +1 555 123 4567" required value="${diagnosticData.phone}">
                        </div>
                        <div>
                            <label class="lg-label" for="lg-country">Country / City</label>
                            <input class="lg-input" type="text" id="lg-country" placeholder="e.g. United Kingdom, USA" value="${diagnosticData.country || ''}">
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:1.5rem;">
                        <button type="button" class="lg-btn-secondary" id="lg-btn-back-2">← Back</button>
                        <button type="submit" class="lg-btn-next" id="lg-submit-btn" style="margin-top:0; flex:1;">
                            <span>Generate ${diagnosticData.childName}'s Learning Pathway</span>
                            <span>✨</span>
                        </button>
                    </div>
                </form>
            `;

            document.getElementById('lg-btn-back-2').addEventListener('click', () => { currentStep = 2; renderStep(2); });
            document.getElementById('lg-form-step3').addEventListener('submit', handleFinalSubmission);

        } else if (step === 4) {
            // STEP 4: INSTANT GENIUS RESULT STATE
            if (progress) progress.style.width = '100%';
            const track = diagnosticData.recommendedTrack || TRACK_MATRIX.young_games;
            
            container.innerHTML = `
                <div style="text-align:center; padding-bottom:0.5rem;">
                    <div style="display:inline-flex; align-items:center; justify-content:center; width:52px; height:52px; border-radius:50%; background:#dcfce7; color:#16a34a; font-size:1.6rem; margin-bottom:1rem;">
                        ✓
                    </div>
                    <div class="lg-pill" style="background:#f0fdf4; border-color:#bbf7d0; color:#16a34a;">
                        🎯 Pathway Matched for ${diagnosticData.childName} (Age ${diagnosticData.childAge})
                    </div>
                    <h2 class="lg-title" style="font-size:1.8rem; color:${track.color}; margin-bottom:0.5rem;">
                        ${track.name}
                    </h2>
                    <p style="font-size:0.92rem; color:#475569; max-width:480px; margin:0 auto 1.5rem; line-height:1.5;">
                        ${track.tagline}
                    </p>

                    <!-- Interactive Deck Preview Card -->
                    <div style="background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:16px; padding:1.25rem; text-align:left; margin-bottom:1.5rem;">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
                            <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#64748b; letter-spacing:0.05em;">Sample Curriculum Deck</span>
                            <span style="font-size:0.75rem; background:#dbeafe; color:#1d4ed8; padding:2px 8px; border-radius:100px; font-weight:700;">215 Decks Included</span>
                        </div>
                        <h4 style="font-size:1rem; font-weight:700; color:#0f172a; margin:0 0 0.25rem;">Lesson 1: Interactive Mission Kickoff</h4>
                        <p style="font-size:0.8rem; color:#64748b; margin:0 0 0.75rem;">Your child's first live 1-on-1 build begins with interactive visual slides and guided problem solving.</p>
                        <a href="curriculum/slides/${track.deckSlug}?role=student" target="_blank" style="display:inline-flex; align-items:center; gap:6px; font-size:0.82rem; font-weight:700; color:#2563eb; text-decoration:none;">
                            <span>Preview Lesson 1 Slides Online</span>
                            <span>→</span>
                        </a>
                    </div>

                    <!-- Next Actions -->
                    <div style="display:flex; flex-direction:column; gap:0.75rem;">
                        <a href="book-class.html" class="lg-btn-next" style="text-decoration:none; margin-top:0;">
                            <span>Claim Free 45-Min Discovery Session for ${diagnosticData.childName}</span>
                            <span>🚀</span>
                        </a>
                        <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I completed the AI Coding Diagnostic for ${diagnosticData.childName} (Age ${diagnosticData.childAge}, Track: ${track.name}). I would like to confirm our free discovery session slot.`)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:0.75rem; background:#25d366; color:#ffffff; border-radius:12px; font-weight:700; font-size:0.88rem; text-decoration:none;">
                            <span>Connect on WhatsApp for Instant Slot Confirmation</span>
                        </a>
                    </div>
                </div>
            `;
        }
    }

    async function handleFinalSubmission(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('lg-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Matching Pathway...</span>';
        }

        diagnosticData.parentName = document.getElementById('lg-parent-name').value.trim();
        diagnosticData.email = document.getElementById('lg-email').value.trim();
        diagnosticData.phone = document.getElementById('lg-phone').value.trim();
        diagnosticData.country = document.getElementById('lg-country').value.trim() || 'Global';
        
        try {
            diagnosticData.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch(e) {}

        const track = determineTrack(diagnosticData.childAge, diagnosticData.interest);
        diagnosticData.recommendedTrack = track;
        diagnosticData.sampleDeckUrl = `https://stemuluskidstech.com/curriculum/slides/${track.deckSlug}`;

        const leadId = 'diag-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

        // 1. Parallel Cloud Ingestion
        const cloudPromises = [
            // Netlify Email via send-email
            fetch(CONFIG.EMAIL_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'booking',
                    data: {
                        bookingId: leadId,
                        parentName: diagnosticData.parentName,
                        studentName: diagnosticData.childName,
                        studentBirthday: diagnosticData.childBirthday,
                        studentAge: String(diagnosticData.childAge),
                        email: diagnosticData.email,
                        phone: diagnosticData.phone,
                        country: diagnosticData.country,
                        contactPref: 'WhatsApp',
                        leadSource: 'AI Diagnostic Lead Genius',
                        program: track.name
                    }
                })
            }).catch(() => {}),

            // Direct push to Firestore leads collection
            fetch(`${CONFIG.FIRESTORE_URL}?documentId=${encodeURIComponent(leadId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        id:               { stringValue: leadId },
                        studentFirstName: { stringValue: diagnosticData.childName },
                        studentLastName:  { stringValue: 'Diagnostic' },
                        studentAge:       { stringValue: String(diagnosticData.childAge) },
                        studentBirthday:  { stringValue: diagnosticData.childBirthday },
                        program:          { stringValue: track.name },
                        parentName:       { stringValue: diagnosticData.parentName },
                        email:            { stringValue: diagnosticData.email.toLowerCase() },
                        parentEmail:      { stringValue: diagnosticData.email.toLowerCase() },
                        phone:            { stringValue: diagnosticData.phone },
                        country:          { stringValue: diagnosticData.country },
                        leadSource:       { stringValue: 'AI Diagnostic Widget' },
                        interest:         { stringValue: diagnosticData.interest },
                        isFreeTrial:      { booleanValue: true },
                        status:           { stringValue: 'pending' },
                        source:           { stringValue: 'lead_genius_diagnostic' },
                        timestamp:        { stringValue: new Date().toISOString() }
                    }
                })
            }).catch(() => {}),

            // Direct ntfy push to admissions phone
            fetch(`https://ntfy.sh/${CONFIG.NTFY_TOPIC}`, {
                method: 'POST',
                headers: {
                    'Title': `Diagnostic Lead: ${diagnosticData.childName} (${diagnosticData.childAge}y) - ${track.name}`,
                    'Priority': 'urgent',
                    'Tags': 'dart,rocket,star'
                },
                body: `Parent: ${diagnosticData.parentName}\nStudent: ${diagnosticData.childName} (DOB: ${diagnosticData.childBirthday})\nPhone: ${diagnosticData.phone}\nEmail: ${diagnosticData.email}\nTrack: ${track.name}\nCountry: ${diagnosticData.country}`
            }).catch(() => {})
        ];

        await Promise.allSettled(cloudPromises);

        // Save locally
        try {
            const diags = JSON.parse(localStorage.getItem('stemulus_diagnostic_leads') || '[]');
            diags.push({ ...diagnosticData, leadId, timestamp: new Date().toISOString() });
            localStorage.setItem('stemulus_diagnostic_leads', JSON.stringify(diags));
        } catch(e) {}

        currentStep = 4;
        renderStep(4);
    }

    return {
        init: init,
        open: openModal,
        close: closeModal
    };

})();

// Auto-boot on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', LeadGenius.init);
} else {
    LeadGenius.init();
}
