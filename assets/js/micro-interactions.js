/**
 * STEMulus Micro-Interactions
 * Subtle animations for buttons, cards, and links
 */

const MicroInteractions = (function() {
    'use strict';

    // CSS for micro-interactions
    const interactionStyles = `
        /* Button ripple effect */
        .btn-ripple {
            position: relative;
            overflow: hidden;
        }
        
        .btn-ripple .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            animation: ripple-effect 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-effect {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        /* Button press effect */
        .btn-press {
            transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        
        .btn-press:active {
            transform: scale(0.97);
        }
        
        /* Card tilt effect on hover */
        .card-tilt {
            transition: transform 0.3s ease;
            transform-style: preserve-3d;
        }
        
        .card-tilt:hover {
            transform: perspective(1000px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) scale(1.02);
        }
        
        /* Link underline animation */
        .link-underline {
            position: relative;
            text-decoration: none;
        }
        
        .link-underline::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 0;
            height: 2px;
            background: currentColor;
            transition: width 0.3s ease;
        }
        
        .link-underline:hover::after {
            width: 100%;
        }
        
        /* Icon bounce on hover */
        .icon-bounce:hover i,
        .icon-bounce:hover svg {
            animation: icon-bounce 0.4s ease;
        }
        
        @keyframes icon-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
        }
        
        /* Pulse attention animation */
        .pulse-attention {
            animation: pulse-attention 2s infinite;
        }
        
        @keyframes pulse-attention {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255, 109, 0, 0.4); }
            50% { box-shadow: 0 0 0 10px rgba(255, 109, 0, 0); }
        }
        
        /* Magnetic button effect */
        .btn-magnetic {
            transition: transform 0.2s ease-out;
        }
        
        /* Glow effect on hover */
        .glow-hover {
            transition: box-shadow 0.3s ease;
        }
        
        .glow-hover:hover {
            box-shadow: 0 0 20px rgba(255, 109, 0, 0.3);
        }
        
        /* Smooth focus ring */
        .focus-ring:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(255, 109, 0, 0.3);
        }
        
        /* Float animation for decorative elements */
        .float-animation {
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        /* Shake animation for errors */
        .shake {
            animation: shake 0.5s ease;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
        }
    `;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('micro-interaction-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'micro-interaction-styles';
        style.textContent = interactionStyles;
        document.head.appendChild(style);
    }

    // Add ripple effect to buttons
    function initRippleEffect() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-ripple, button, [role="button"]');
            if (!button) return;
            
            // Don't add ripple if button already has the class but we want universal ripple
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            // Ensure button is positioned
            if (getComputedStyle(button).position === 'static') {
                button.style.position = 'relative';
            }
            button.style.overflow = 'hidden';
            
            button.appendChild(ripple);
            
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    }

    // Add tilt effect to cards
    function initCardTilt() {
        const cards = document.querySelectorAll('.card-tilt, .program-card, [class*="rounded-2xl"], [class*="rounded-3xl"]');
        
        cards.forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const tiltX = (y - centerY) / 20;
                const tiltY = (centerX - x) / 20;
                
                card.style.setProperty('--tilt-x', `${tiltX}deg`);
                card.style.setProperty('--tilt-y', `${tiltY}deg`);
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
            });
        });
    }

    // Add magnetic effect to buttons
    function initMagneticButtons() {
        const buttons = document.querySelectorAll('.btn-magnetic, .cta-btn, [class*="bg-supernova-orange"]');
        
        buttons.forEach((btn) => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0, 0)';
            });
        });
    }

    // Add press effect to all buttons
    function initButtonPress() {
        const buttons = document.querySelectorAll('button, a[class*="rounded-full"], [role="button"]');
        
        buttons.forEach((btn) => {
            btn.classList.add('btn-press');
        });
    }

    // Add underline effect to nav links
    function initLinkUnderline() {
        const navLinks = document.querySelectorAll('nav a:not([class*="bg-"]), footer a');
        
        navLinks.forEach((link) => {
            if (!link.querySelector('img')) {
                link.classList.add('link-underline');
            }
        });
    }

    // Utility: Shake element (for form errors)
    function shake(element) {
        element.classList.add('shake');
        element.addEventListener('animationend', () => {
            element.classList.remove('shake');
        }, { once: true });
    }

    // Initialize all interactions
    function init() {
        injectStyles();
        initRippleEffect();
        initButtonPress();
        
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initCardTilt();
                initMagneticButtons();
                initLinkUnderline();
            });
        } else {
            initCardTilt();
            initMagneticButtons();
            initLinkUnderline();
        }
    }

    // Public API
    return {
        init,
        shake
    };
})();

// Auto-initialize
MicroInteractions.init();
console.log('Micro: Interactions initialized');
