/**
 * STEMulus Lead Magnet Popup
 * ===========================
 * 
 * High-converting popup to capture visitor emails
 * with immediate phone notification on submission.
 */

const LeadMagnet = (function() {
    'use strict';

    const STORAGE_KEY = 'stemulus_lead_captured';
    const SHOWN_KEY = 'stemulus_leadpopup_shown';
    const POPUP_ID = 'lead-magnet-popup';

    let isShown = false;
    let startTime = Date.now();

    // ==================== POPUP STYLES ====================

    const popupStyles = `
        .lead-magnet-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            z-index: 10001;
            opacity: 0;
            visibility: hidden;
            transition: all 0.4s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .lead-magnet-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        
        .lead-magnet-popup {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 24px;
            max-width: 440px;
            width: 100%;
            overflow: hidden;
            transform: scale(0.9) translateY(20px);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .lead-magnet-overlay.active .lead-magnet-popup {
            transform: scale(1) translateY(0);
        }
        
        .dark .lead-magnet-popup {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }
        
        .lead-magnet-header {
            background: linear-gradient(135deg, #FF6D00 0%, #FF8F00 50%, #FFB300 100%);
            padding: 32px 24px;
            text-align: center;
            position: relative;
        }
        
        .lead-magnet-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
            animation: shimmer 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
            0%, 100% { transform: translateX(-30%) translateY(-30%); }
            50% { transform: translateX(30%) translateY(30%); }
        }
        
        .lead-magnet-icon {
            width: 64px;
            height: 64px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 32px;
            animation: bounce 2s ease infinite;
            position: relative;
            z-index: 1;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        
        .lead-magnet-title {
            color: white;
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 8px;
            font-family: 'Poppins', sans-serif;
            text-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: relative;
            z-index: 1;
        }
        
        .lead-magnet-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin: 0;
            position: relative;
            z-index: 1;
        }
        
        .lead-magnet-close {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(255, 255, 255, 0.25);
            border: 2px solid rgba(255,255,255,0.5);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            z-index: 100;
        }
        
        .lead-magnet-close:hover {
            background: rgba(255, 255, 255, 0.45);
            transform: rotate(90deg) scale(1.1);
        }
        
        .lead-magnet-close svg {
            width: 18px;
            height: 18px;
            color: white;
            stroke: white;
        }
        
        .lead-magnet-body {
            padding: 28px 24px;
        }
        
        .lead-magnet-value {
            background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
            border: 1px solid rgba(255, 109, 0, 0.1);
        }
        
        .dark .lead-magnet-value {
            background: linear-gradient(135deg, rgba(255,109,0,0.1) 0%, rgba(255,109,0,0.05) 100%);
            border-color: rgba(255, 109, 0, 0.2);
        }
        
        .lead-magnet-value h4 {
            color: #1A237E;
            font-size: 16px;
            font-weight: 700;
            margin: 0 0 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .dark .lead-magnet-value h4 {
            color: #FF8F00;
        }
        
        .lead-magnet-benefits {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .lead-magnet-benefits li {
            color: #4B5563;
            font-size: 14px;
            padding: 6px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .dark .lead-magnet-benefits li {
            color: #9CA3AF;
        }
        
        .lead-magnet-benefits li::before {
            content: '✓';
            color: #10B981;
            font-weight: bold;
            font-size: 16px;
        }
        
        .lead-magnet-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .lead-magnet-input {
            width: 100%;
            padding: 16px 20px;
            border: 2px solid #E5E7EB;
            border-radius: 12px;
            font-size: 16px;
            outline: none;
            transition: all 0.2s ease;
            background: white;
        }
        
        .dark .lead-magnet-input {
            background: #1e293b;
            border-color: #374151;
            color: white;
        }
        
        .lead-magnet-input:focus {
            border-color: #FF6D00;
            box-shadow: 0 0 0 4px rgba(255, 109, 0, 0.1);
        }
        
        .lead-magnet-input::placeholder {
            color: #9CA3AF;
        }
        
        .lead-magnet-submit {
            width: 100%;
            padding: 16px 24px;
            background: linear-gradient(135deg, #FF6D00 0%, #FF8F00 100%);
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .lead-magnet-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(255, 109, 0, 0.3);
        }
        
        .lead-magnet-submit:active {
            transform: translateY(0);
        }
        
        .lead-magnet-submit.loading {
            opacity: 0.7;
            pointer-events: none;
        }
        
        .lead-magnet-footer {
            text-align: center;
            padding-top: 16px;
        }
        
        .lead-magnet-trust {
            color: #9CA3AF;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        
        .lead-magnet-success {
            text-align: center;
            padding: 20px 0;
        }
        
        .lead-magnet-success-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 40px;
            animation: success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes success-pop {
            0% { transform: scale(0); }
            100% { transform: scale(1); }
        }
        
        .lead-magnet-success h3 {
            color: #1A237E;
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px;
        }
        
        .dark .lead-magnet-success h3 {
            color: white;
        }
        
        .lead-magnet-success p {
            color: #6B7280;
            font-size: 14px;
            margin: 0;
        }
        
        .dark .lead-magnet-success p {
            color: #9CA3AF;
        }
        
        .lead-magnet-skip {
            background: none;
            border: none;
            color: #9CA3AF;
            font-size: 13px;
            margin-top: 12px;
            cursor: pointer;
            transition: color 0.2s ease;
        }
        
        .lead-magnet-skip:hover {
            color: #6B7280;
        }
    `;

    // ==================== POPUP HTML ====================

    function createPopupHTML() {
        return `
            <div id="${POPUP_ID}" class="lead-magnet-overlay">
                <div class="lead-magnet-popup">
                    <button class="lead-magnet-close" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div class="lead-magnet-header">
                        <div class="lead-magnet-icon"><i class="fa-solid fa-gift text-white"></i></div>
                        <h2 class="lead-magnet-title">FREE STEM Resources!</h2>
                        <p class="lead-magnet-subtitle">Exclusive for Parents of Future Innovators</p>
                    </div>
                    
                    <div class="lead-magnet-body">
                        <div class="lead-magnet-value">
                            <h4>📚 What You'll Get:</h4>
                            <ul class="lead-magnet-benefits">
                                <li>10 Fun Coding Projects for Kids</li>
                                <li>Age-by-Age Tech Learning Guide</li>
                                <li>Weekly STEM Activity Ideas</li>
                                <li>Early Access to New Programs</li>
                            </ul>
                        </div>
                        
                        <form class="lead-magnet-form" id="lead-magnet-form">
                            <input type="email" class="lead-magnet-input" placeholder="Your email address" required id="lead-email">
                            <input type="text" class="lead-magnet-input" placeholder="Your name (optional)" id="lead-name">
                            <button type="submit" class="lead-magnet-submit">
                                📩 Send Me The Resources
                            </button>
                        </form>
                        
                        <div class="lead-magnet-footer">
                            <p class="lead-magnet-trust">
                                🔒 We respect your privacy. Unsubscribe anytime.
                            </p>
                            <button class="lead-magnet-skip">Maybe later</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== INITIALIZATION ====================

    function init() {
        // Check if already captured a lead
        if (localStorage.getItem(STORAGE_KEY)) {
            console.log('[LeadMagnet] User already subscribed');
            return;
        }
        
        // Check if shown recently (within 24 hours)
        const lastShown = localStorage.getItem(SHOWN_KEY);
        if (lastShown) {
            const hoursSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
            if (hoursSince < 24) {
                console.log('[LeadMagnet] Shown recently, waiting');
                return;
            }
        }
        
        // Inject styles
        injectStyles();
        
        // Create popup
        document.body.insertAdjacentHTML('beforeend', createPopupHTML());
        
        // Setup triggers
        setupTriggers();
        
        // Setup event handlers
        setupEventHandlers();
        
        console.log('[LeadMagnet] ✅ Initialized');
    }

    function injectStyles() {
        if (document.getElementById('lead-magnet-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'lead-magnet-styles';
        style.textContent = popupStyles;
        document.head.appendChild(style);
    }

    // ==================== TRIGGERS ====================

    function setupTriggers() {
        // Trigger 1: After 30 seconds on page
        setTimeout(() => {
            if (!isShown) show();
        }, 30000);
        
        // Trigger 2: On 50% scroll
        let scrollTriggered = false;
        window.addEventListener('scroll', () => {
            if (scrollTriggered || isShown) return;
            
            const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent > 50) {
                scrollTriggered = true;
                // Small delay after scroll threshold
                setTimeout(() => {
                    if (!isShown) show();
                }, 2000);
            }
        }, { passive: true });
        
        // Trigger 3: Exit intent (desktop)
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY < 0 && !isShown) {
                show();
            }
        });
    }

    // ==================== SHOW/HIDE ====================

    function show() {
        if (isShown) return;
        if (localStorage.getItem(STORAGE_KEY)) return;
        
        isShown = true;
        const popup = document.getElementById(POPUP_ID);
        if (popup) {
            popup.classList.add('active');
            localStorage.setItem(SHOWN_KEY, Date.now().toString());
        }
        
        console.log('[LeadMagnet] Popup shown');
    }

    function hide() {
        const popup = document.getElementById(POPUP_ID);
        if (popup) {
            popup.classList.remove('active');
        }
    }

    // ==================== EVENT HANDLERS ====================

    function setupEventHandlers() {
        const popup = document.getElementById(POPUP_ID);
        if (!popup) return;
        
        // Close button
        const closeBtn = popup.querySelector('.lead-magnet-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hide);
        }
        
        // Skip button
        const skipBtn = popup.querySelector('.lead-magnet-skip');
        if (skipBtn) {
            skipBtn.addEventListener('click', hide);
        }
        
        // Overlay click
        popup.addEventListener('click', (e) => {
            if (e.target === popup) hide();
        });
        
        // Form submission
        const form = document.getElementById('lead-magnet-form');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isShown) hide();
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('lead-email');
        const nameInput = document.getElementById('lead-name');
        const submitBtn = e.target.querySelector('.lead-magnet-submit');
        
        const email = emailInput.value.trim();
        const name = nameInput.value.trim();
        
        if (!email) return;
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Sending...';
        
        // Gather visitor data
        const leadData = {
            email: email,
            name: name || 'Not provided',
            timestamp: new Date().toISOString(),
            location: typeof VisitorTracker !== 'undefined' ? VisitorTracker.getLocation() : null,
            device: typeof VisitorTracker !== 'undefined' ? VisitorTracker.getDevice() : null,
            timeOnSite: typeof VisitorTracker !== 'undefined' ? VisitorTracker.getTimeOnSite() : null,
            pagesVisited: typeof VisitorTracker !== 'undefined' ? VisitorTracker.getPagesVisited().join(' → ') : null,
            referrer: typeof VisitorTracker !== 'undefined' ? VisitorTracker.getReferrer() : document.referrer,
            pageUrl: window.location.href
        };
        
        try {
            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(leadData));
            
            // Record in visitor tracker for daily digest
            if (typeof VisitorTracker !== 'undefined') {
                VisitorTracker.recordLead(leadData);
            }
            
            // Send phone notification
            if (typeof NotificationService !== 'undefined' && NotificationService.isConfigured()) {
                await NotificationService.notifyNewLead(leadData);
            }
            
            // Try to save to Firebase if available
            // Try to save to Supabase if available
            if (typeof supabase !== 'undefined') {
                try {
                    const { error } = await supabase.from('leads').insert([{
                        ...leadData,
                        source: 'lead_magnet_popup',
                        createdAt: new Date().toISOString()
                    }]);
                    
                    if (error) throw error;
                } catch (sbError) {
                    console.log('[LeadMagnet] Supabase save skipped:', sbError.message);
                }
            }
            
            // Show success state
            showSuccess();
            
            console.log('[LeadMagnet] ✅ Lead captured:', email);
            
        } catch (error) {
            console.error('[LeadMagnet] Error:', error);
            submitBtn.classList.remove('loading');
            submitBtn.textContent = '📩 Send Me The Resources';
        }
    }

    function showSuccess() {
        const popup = document.querySelector('.lead-magnet-popup');
        if (!popup) return;
        
        popup.innerHTML = `
            <div class="lead-magnet-header">
                <button class="lead-magnet-close" aria-label="Close" onclick="document.getElementById('${POPUP_ID}').classList.remove('active')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="lead-magnet-icon"><i class="fa-solid fa-circle-check text-white"></i></div>
                <h2 class="lead-magnet-title">You're In!</h2>
                <p class="lead-magnet-subtitle">Check your inbox for the resources</p>
            </div>
            <div class="lead-magnet-body">
                <div class="lead-magnet-success">
                    <div class="lead-magnet-success-icon"><i class="fa-solid fa-check text-white"></i></div>
                    <h3>Welcome to STEMulus!</h3>
                    <p>Your free STEM resources are on their way. We can't wait to help your child become a future innovator!</p>
                </div>
            </div>
        `;
        
        // Auto-close after 4 seconds
        setTimeout(hide, 4000);
    }

    // ==================== PUBLIC API ====================

    return {
        init,
        show,
        hide
    };

})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', LeadMagnet.init);
} else {
    // Small delay to ensure other scripts are loaded
    setTimeout(LeadMagnet.init, 1000);
}
