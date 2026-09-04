/**
 * STEMulus Exit Intent Popup
 * Shows popup when user is about to leave the page
 */

const ExitIntent = (function() {
    'use strict';

    // Config
    // Config
    const config = {
        cookieName: 'stemulus_exit_shown',
        cookieDays: 30, // Increased from 7 -> 30 days (shows less often)
        sensitivity: 20,
        delay: 10000, // Increased from 3s -> 10s (won't show immediately)
        showOnMobile: true
    };

    // CSS for popup
    const popupStyles = `
        .exit-intent-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        
        .exit-intent-overlay.show {
            opacity: 1;
            visibility: visible;
        }
        
        .exit-intent-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            background: white;
            border-radius: 24px;
            max-width: 500px;
            width: 90%;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
            opacity: 0;
            transition: transform 0.4s ease, opacity 0.4s ease;
            z-index: 10001;
        }
        
        .dark .exit-intent-popup {
            background: #1f2937;
        }
        
        .exit-intent-overlay.show .exit-intent-popup {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        
        .exit-intent-header {
            background: linear-gradient(135deg, #1A237E 0%, #4F46E5 100%);
            padding: 32px 24px;
            text-align: center;
            position: relative;
        }
        
        .exit-intent-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s ease;
        }
        
        .exit-intent-close:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .exit-intent-emoji {
            font-size: 48px;
            margin-bottom: 12px;
        }
        
        .exit-intent-header h2 {
            color: white;
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            font-family: 'Poppins', sans-serif;
        }
        
        .exit-intent-body {
            padding: 32px 24px;
            text-align: center;
        }
        
        .exit-intent-body p {
            color: #6b7280;
            font-size: 16px;
            margin: 0 0 24px;
            line-height: 1.6;
        }
        
        .dark .exit-intent-body p {
            color: #9ca3af;
        }
        
        .exit-intent-offer {
            background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
        }
        
        .dark .exit-intent-offer {
            background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
        }
        
        .exit-intent-offer-label {
            font-size: 12px;
            font-weight: 600;
            color: #FF6D00;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        
        .exit-intent-offer-text {
            font-size: 20px;
            font-weight: 700;
            color: #1A237E;
            margin: 0;
        }
        
        .dark .exit-intent-offer-text {
            color: white;
        }
        
        .exit-intent-cta {
            background: linear-gradient(135deg, #FF6D00 0%, #FF8F00 100%);
            color: white;
            font-weight: 700;
            font-size: 16px;
            padding: 16px 32px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .exit-intent-cta:hover {
            transform: scale(1.02);
            box-shadow: 0 10px 30px rgba(255, 109, 0, 0.3);
        }
        
        .exit-intent-skip {
            background: none;
            border: none;
            color: #9ca3af;
            font-size: 14px;
            margin-top: 16px;
            cursor: pointer;
            transition: color 0.2s ease;
        }
        
        .exit-intent-skip:hover {
            color: #6b7280;
        }
    `;

    let isShown = false;
    let startTime = Date.now();

    // Inject styles
    function injectStyles() {
        if (document.getElementById('exit-intent-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'exit-intent-styles';
        style.textContent = popupStyles;
        document.head.appendChild(style);
    }

    // Check if cookie exists
    function hasCookie() {
        return document.cookie.includes(config.cookieName);
    }

    // Set cookie
    function setCookie() {
        const date = new Date();
        date.setTime(date.getTime() + (config.cookieDays * 24 * 60 * 60 * 1000));
        document.cookie = `${config.cookieName}=true; expires=${date.toUTCString()}; path=/`;
    }

    // Create popup HTML
    function createPopup() {
        const overlay = document.createElement('div');
        overlay.className = 'exit-intent-overlay';
        overlay.innerHTML = `
            <div class="exit-intent-popup">
                <div class="exit-intent-header">
                    <button class="exit-intent-close" aria-label="Close">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div class="exit-intent-emoji" style="display:flex;justify-content:center;margin-bottom:12px;"><span data-icon-3d="rocket" data-icon-size="48"></span></div>
                    <h2>Wait! Don't Miss Out</h2>
                </div>
                <div class="exit-intent-body">
                    <p>Before you go, here's something special to help your child get started on their coding journey!</p>
                    
                    <div class="exit-intent-offer">
                        <div class="exit-intent-offer-label">Free Resource</div>
                        <p class="exit-intent-offer-text">Download our "Parents Guide to Kids Coding" PDF</p>
                    </div>
                    
                    <a href="https://wa.me/2347052466716?text=Hi%20STEMulus!%20I'd%20like%20to%20get%20the%20free%20Parents%20Guide%20to%20Kids%20Coding%20PDF" target="_blank" class="exit-intent-cta">
                        Get Free Guide
                    </a>
                    
                    <button class="exit-intent-skip">No thanks, I'll pass</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Event listeners
        overlay.querySelector('.exit-intent-close').addEventListener('click', hide);
        overlay.querySelector('.exit-intent-skip').addEventListener('click', hide);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) hide();
        });
        
        // Track CTA click
        overlay.querySelector('.exit-intent-cta').addEventListener('click', () => {
            setCookie();
            hide();
        });
        
        return overlay;
    }

    // Show popup
    function show() {
        if (isShown || hasCookie()) return;
        if (Date.now() - startTime < config.delay) return;
        
        const overlay = createPopup();
        
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
        
        isShown = true;
        setCookie();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    // Hide popup
    function hide() {
        const overlay = document.querySelector('.exit-intent-overlay');
        if (!overlay) return;
        
        overlay.classList.remove('show');
        document.body.style.overflow = '';
        
        setTimeout(() => overlay.remove(), 300);
    }

    // Mouse leave detection (desktop)
    function handleMouseLeave(e) {
        if (e.clientY <= config.sensitivity) {
            show();
        }
    }

    // Back button detection (mobile)
    function handlePopState() {
        if (config.showOnMobile) {
            show();
        }
    }

    // Scroll detection for mobile
    let lastScrollY = 0;
    let scrollUpCount = 0;
    
    function handleScroll() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY < lastScrollY && currentScrollY > 200) {
            scrollUpCount++;
            if (scrollUpCount > 3) {
                show();
            }
        } else {
            scrollUpCount = 0;
        }
        
        lastScrollY = currentScrollY;
    }

    // Initialize
    function init() {
        // Don't show on enrollment or contact pages
        const excludePages = ['enroll', 'contact', 'thank'];
        const currentPage = window.location.pathname.toLowerCase();
        
        if (excludePages.some(page => currentPage.includes(page))) {
            return;
        }
        
        if (hasCookie()) return;
        
        injectStyles();
        
        // Desktop: mouse leave
        document.addEventListener('mouseleave', handleMouseLeave);
        
        // Mobile: scroll up detection
        if (config.showOnMobile && 'ontouchstart' in window) {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') hide();
        });
    }

    // Public API
    return {
        init,
        show,
        hide
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ExitIntent.init);
} else {
    ExitIntent.init();
}
console.log('Exit: Intent popup initialized');
