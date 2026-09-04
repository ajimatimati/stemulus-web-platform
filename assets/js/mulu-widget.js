/**
 * Mulu the STEMulus Mascot Component
 * Includes One-Time Guided Tour & Interactive Assistant
 * Compact, non-intrusive floating design for dashboard portals
 */

class MuluMascot {
    constructor(options = {}) {
        this.containerId = options.containerId || 'mulu-root';
        this.interactive = options.interactive !== false;
        this.tourSteps = [
            { text: "Hi! I'm Mulu, your STEMulus AI Guide! Welcome to your Portal!", highlight: null },
            { text: "Track your classes, logs, and student performance here.", highlight: '.dash-card, .data-panel, main' },
            { text: "Floating tools are available anytime for quick actions!", highlight: '.pill-toolbar, .portal-nav' },
            { text: "Click me anytime for tips. Have fun learning!", highlight: '#mulu-character' }
        ];
        this.currentStep = 0;
        this.autoHideTimer = null;
        this.init();
    }

    init() {
        this.injectStyles();
        this.render();
        if (this.interactive) {
            this.bindEvents();
            this.checkFirstTimeTour();
            this.scheduleAutoHide();
        }
    }

    injectStyles() {
        if (document.getElementById('mulu-styles')) return;
        const style = document.createElement('style');
        style.id = 'mulu-styles';
        style.textContent = `
            .mulu-floating-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                pointer-events: none;
                font-family: 'Nunito', sans-serif;
            }

            .mulu-bubble {
                background: #FFFFFF;
                color: #1E293B;
                padding: 10px 14px;
                border-radius: 16px 16px 4px 16px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                font-size: 12px;
                font-weight: 700;
                margin-bottom: 8px;
                max-width: 210px;
                pointer-events: auto;
                animation: muluPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                border: 1px solid #E2E8F0;
                line-height: 1.35;
                position: relative;
            }

            .mulu-close-btn {
                position: absolute;
                top: -6px;
                right: -6px;
                width: 18px;
                height: 18px;
                background: #F1F5F9;
                color: #64748B;
                border: 1px solid #CBD5E1;
                border-radius: 50%;
                font-size: 11px;
                font-weight: 800;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                line-height: 1;
            }
            .mulu-close-btn:hover { background: #EF4444; color: #FFFFFF; border-color: #EF4444; }

            .mulu-tour-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 8px;
                padding-top: 6px;
                border-top: 1px solid #F1F5F9;
            }

            .mulu-btn {
                background: #4FC3F7;
                color: white;
                border: none;
                padding: 4px 10px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 800;
                cursor: pointer;
                transition: transform 0.15s, background 0.15s;
            }
            .mulu-btn:hover { background: #0288D1; transform: scale(1.04); }

            .mulu-btn-sec {
                background: none;
                border: none;
                color: #94A3B8;
                font-size: 10px;
                font-weight: 700;
                cursor: pointer;
            }
            .mulu-btn-sec:hover { color: #64748B; }

            .mulu-body {
                width: 64px;
                height: 64px;
                position: relative;
                cursor: pointer;
                pointer-events: auto;
                transition: transform 0.2s ease;
                filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.15));
            }

            .mulu-body:hover {
                transform: scale(1.1) translateY(-2px);
            }

            .mulu-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                animation: muluFloat 3.5s ease-in-out infinite;
            }

            .mulu-highlight {
                outline: 3px solid #4FC3F7 !important;
                outline-offset: 4px;
                transition: outline 0.3s ease;
            }

            @keyframes muluFloat {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-5px) rotate(2deg); }
            }

            @keyframes muluPop {
                from { opacity: 0; transform: scale(0.85) translateY(6px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            @media (max-width: 640px) {
                .mulu-floating-widget { bottom: 16px; right: 16px; }
                .mulu-body { width: 52px; height: 52px; }
                .mulu-bubble { max-width: 180px; font-size: 11px; }
            }
        `;
        document.head.appendChild(style);
    }

    render() {
        let root = document.getElementById('mulu-container');
        if (!root) {
            root = document.createElement('div');
            root.id = 'mulu-container';
            root.className = 'mulu-floating-widget';
            document.body.appendChild(root);
        }

        root.innerHTML = `
            <div class="mulu-bubble" id="mulu-speech">
                <button class="mulu-close-btn" onclick="window.muluInstance.closeBubble()" title="Close">×</button>
                <span id="mulu-text">Hi! I'm Mulu, your STEMulus AI guide!</span>
                <div class="mulu-tour-actions" id="mulu-actions" style="display:none;">
                    <button class="mulu-btn-sec" onclick="window.muluInstance.skipTour()">Skip</button>
                    <button class="mulu-btn" id="mulu-next-btn" onclick="window.muluInstance.nextTourStep()">Next →</button>
                </div>
            </div>
            <div class="mulu-body" id="mulu-character" onclick="window.muluInstance.handleClick()">
                <img src="images/portal/mulu_mascot_nobg.png" alt="Mulu Mascot" class="mulu-img" id="mulu-img">
            </div>
        `;
    }

    bindEvents() {
        this.tips = [
            "Need help? Check your scheduled classes on the dashboard!",
            "Pro-Tip: Attendance logs can be submitted right after class!",
            "Mulu is here to make STEM learning fun and smooth!",
            "Click on any session card to view details!",
            "Have feedback? Message your coordinator on WhatsApp!"
        ];
        window.muluInstance = this;
    }

    scheduleAutoHide() {
        clearTimeout(this.autoHideTimer);
        this.autoHideTimer = setTimeout(() => {
            const actions = document.getElementById('mulu-actions');
            if (actions && actions.style.display !== 'flex') {
                this.closeBubble();
            }
        }, 5000);
    }

    closeBubble() {
        const bubble = document.getElementById('mulu-speech');
        if (bubble) bubble.style.display = 'none';
    }

    showBubble() {
        const bubble = document.getElementById('mulu-speech');
        if (bubble) bubble.style.display = 'block';
    }

    checkFirstTimeTour() {
        const tourDone = localStorage.getItem('mulu_tour_completed');
        if (!tourDone) {
            setTimeout(() => {
                this.startTour();
            }, 800);
        }
    }

    startTour() {
        this.currentStep = 0;
        this.showStep(0);
    }

    showStep(index) {
        if (index >= this.tourSteps.length) {
            this.finishTour();
            return;
        }

        this.showBubble();
        const step = this.tourSteps[index];
        document.getElementById('mulu-text').innerText = step.text;
        document.getElementById('mulu-actions').style.display = 'flex';
        
        const nextBtn = document.getElementById('mulu-next-btn');
        if (index === this.tourSteps.length - 1) {
            nextBtn.innerText = "Got it!";
        } else {
            nextBtn.innerText = "Next →";
        }

        // Clear existing highlights
        document.querySelectorAll('.mulu-highlight').forEach(el => el.classList.remove('mulu-highlight'));
        if (step.highlight) {
            const target = document.querySelector(step.highlight);
            if (target) target.classList.add('mulu-highlight');
        }
    }

    nextTourStep() {
        this.currentStep++;
        this.showStep(this.currentStep);
    }

    skipTour() {
        this.finishTour();
    }

    finishTour() {
        localStorage.setItem('mulu_tour_completed', 'true');
        document.querySelectorAll('.mulu-highlight').forEach(el => el.classList.remove('mulu-highlight'));
        document.getElementById('mulu-actions').style.display = 'none';
        document.getElementById('mulu-text').innerText = "Tour complete! Click me anytime for tips.";
        this.scheduleAutoHide();
    }

    handleClick() {
        const actions = document.getElementById('mulu-actions');
        if (actions.style.display === 'flex') {
            this.nextTourStep();
            return;
        }

        this.showBubble();
        const speech = document.getElementById('mulu-text');
        const img = document.getElementById('mulu-img');
        const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
        speech.innerText = randomTip;

        img.style.transform = 'scale(1.15) rotate(-5deg)';
        setTimeout(() => { img.style.transform = 'none'; }, 250);
        this.scheduleAutoHide();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.mulu) {
        window.mulu = new MuluMascot();
    }
});
