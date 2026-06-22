/**
 * Accessibility Enhancements for STEMulus
 * Provides skip-links, focus management, and ARIA improvements
 */
const AccessibilityEnhancements = (function() {
    
    function createSkipLink() {
        // Check if skip link already exists
        if (document.querySelector('.skip-to-content')) return;
        
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-to-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.setAttribute('aria-label', 'Skip to main content');
        
        // Insert at the very beginning of body
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add main content ID if missing
        const main = document.querySelector('main') || document.querySelector('[role="main"]');
        if (main && !main.id) {
            main.id = 'main-content';
        }
    }
    
    function addFocusStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Skip to content link */
            .skip-to-content {
                position: absolute;
                top: -100%;
                left: 50%;
                transform: translateX(-50%);
                background: #FF6D00;
                color: white;
                padding: 12px 24px;
                border-radius: 0 0 8px 8px;
                font-weight: 600;
                text-decoration: none;
                z-index: 10000;
                transition: top 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .skip-to-content:focus {
                top: 0;
                outline: 3px solid #1A237E;
                outline-offset: 2px;
            }
            
            /* Enhanced focus styles for accessibility */
            *:focus-visible {
                outline: 3px solid #FF6D00;
                outline-offset: 2px;
            }
            
            /* Remove focus outline for mouse users */
            *:focus:not(:focus-visible) {
                outline: none;
            }
            
            /* Reduced motion for users who prefer it */
            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                    scroll-behavior: auto !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    function enhanceAriaLabels() {
        // Add aria-labels to buttons without accessible names
        document.querySelectorAll('button:not([aria-label])').forEach(button => {
            if (!button.textContent.trim() && !button.getAttribute('aria-labelledby')) {
                // Try to infer label from icon or title
                const icon = button.querySelector('[data-lucide]');
                if (icon) {
                    const iconName = icon.getAttribute('data-lucide');
                    button.setAttribute('aria-label', iconName.replace(/-/g, ' '));
                }
            }
        });
        
        // Add aria-labels to links that only have icons
        document.querySelectorAll('a:not([aria-label])').forEach(link => {
            if (!link.textContent.trim() && link.querySelector('svg, img, i')) {
                const title = link.getAttribute('title');
                if (title) {
                    link.setAttribute('aria-label', title);
                }
            }
        });
        
        // Mark decorative images
        document.querySelectorAll('img[alt=""]').forEach(img => {
            img.setAttribute('role', 'presentation');
        });
        
        // Add role="img" to inline SVGs that need it
        document.querySelectorAll('svg:not([role])').forEach(svg => {
            if (!svg.closest('button') && !svg.closest('a')) {
                svg.setAttribute('role', 'img');
                if (!svg.getAttribute('aria-label') && !svg.getAttribute('aria-hidden')) {
                    svg.setAttribute('aria-hidden', 'true');
                }
            }
        });
    }
    
    function enhanceFocusManagement() {
        // Trap focus in modals when open
        document.querySelectorAll('[role="dialog"], .modal, #mobile-menu').forEach(modal => {
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const closeBtn = modal.querySelector('[id*="close"], [aria-label*="close"]');
                    if (closeBtn) closeBtn.click();
                }
            });
        });
        
        // Handle mobile menu focus trap
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            const focusableElements = mobileMenu.querySelectorAll(
                'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                const firstFocusable = focusableElements[0];
                const lastFocusable = focusableElements[focusableElements.length - 1];
                
                mobileMenu.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey && document.activeElement === firstFocusable) {
                            e.preventDefault();
                            lastFocusable.focus();
                        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                            e.preventDefault();
                            firstFocusable.focus();
                        }
                    }
                });
            }
        }
    }
    
    function addLandmarks() {
        // Ensure proper landmark roles
        const header = document.querySelector('header:not([role])');
        if (header) header.setAttribute('role', 'banner');
        
        const main = document.querySelector('main:not([role])');
        if (main) main.setAttribute('role', 'main');
        
        const footer = document.querySelector('footer:not([role])');
        if (footer) footer.setAttribute('role', 'contentinfo');
        
        const nav = document.querySelector('nav:not([role])');
        if (nav) nav.setAttribute('role', 'navigation');
    }
    
    return {
        init: function() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    addFocusStyles();
                    createSkipLink();
                    enhanceAriaLabels();
                    enhanceFocusManagement();
                    addLandmarks();
                });
            } else {
                addFocusStyles();
                createSkipLink();
                enhanceAriaLabels();
                enhanceFocusManagement();
                addLandmarks();
            }
        }
    };
})();

// Initialize
AccessibilityEnhancements.init();
console.log('A11Y: Accessibility enhancements loaded.');
