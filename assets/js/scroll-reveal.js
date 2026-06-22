/**
 * STEMulus Scroll Reveal - Lightweight Animation System
 * Features: Smooth scroll reveals, staggered animations, animated counters
 * Uses IntersectionObserver for performant scroll-triggered animations
 * Zero dependencies, works across all pages
 */

(function() {
    'use strict';

    // ============ CONFIGURATION ============
    const CONFIG = {
        threshold: 0.12,
        rootMargin: '0px 0px -80px 0px',
        staggerDelay: 80,
        counterDuration: 2000,  // ms for counter animation
        counterEasing: 'easeOutExpo'
    };

    // Elements to auto-animate
    const SELECTORS = [
        'section > .container',
        '.glass-card',
        '.glass-card-dark',
        '.glass-card-premium',
        '.glass-panel',
        '.glass-panel-light',
        '.program-card',
        '.arch-card',
        '.tilt-card',
        'h2',
        '.grid > div',
        '.space-y-6 > div',
        '.space-y-8 > div',
        'form',
        'footer > div > div'
    ];

    // Skip these (already animated or special)
    const SKIP_SELECTORS = [
        '.hero-title',
        '.hero-subtitle',
        '.hero-badge',
        '.hero-cta',
        '.page-loader',
        '#mobile-menu',
        '.whatsapp-float',
        '[data-no-reveal]',
        'nav'
    ];

    // Counter patterns to detect
    const COUNTER_PATTERNS = [
        /^(\d+)\+?$/,           // "150" or "150+"
        /^(\d+)%$/,             // "92%"
        /^(\d+\.?\d*)\/(\d+)$/, // "4.9/5"
        /^(\d+)K\+?$/i          // "10K+"
    ];

    // ============ EASING FUNCTIONS ============
    const easings = {
        easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
        easeOutQuart: t => 1 - Math.pow(1 - t, 4),
        easeOutCubic: t => 1 - Math.pow(1 - t, 3)
    };

    // ============ INITIALIZATION ============
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setup();
        }
    }

    function setup() {
        // Check for reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            console.log('[ScrollReveal] Reduced motion detected');
            return;
        }

        // Enable smooth scrolling on html
        document.documentElement.style.scrollBehavior = 'smooth';

        setupRevealAnimations();
        setupCounterAnimations();
        
        console.log('[ScrollReveal] Initialized');
    }

    // ============ REVEAL ANIMATIONS ============
    function setupRevealAnimations() {
        const elements = getAnimatableElements();
        if (!elements.length) return;

        const observer = new IntersectionObserver(handleReveal, {
            threshold: CONFIG.threshold,
            rootMargin: CONFIG.rootMargin
        });

        elements.forEach((el, index) => {
            if (el.classList.contains('reveal-visible') || el.classList.contains('sr-visible')) return;
            
            el.classList.add('sr-hidden');
            
            // Calculate stagger based on position in parent
            const parent = el.parentElement;
            if (parent && (parent.classList.contains('grid') || parent.className.includes('space-y'))) {
                el.dataset.stagger = Array.from(parent.children).indexOf(el);
            }
            
            observer.observe(el);
        });

        console.log(`[ScrollReveal] Watching ${elements.length} elements`);
    }

    function getAnimatableElements() {
        const allElements = [];
        
        SELECTORS.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    if (shouldSkip(el)) return;
                    
                    // Skip hero section
                    const section = el.closest('section');
                    if (section && section === document.querySelector('section:first-of-type')) return;
                    
                    if (!allElements.includes(el)) {
                        allElements.push(el);
                    }
                });
            } catch (e) {}
        });

        return allElements;
    }

    function shouldSkip(el) {
        return SKIP_SELECTORS.some(selector => {
            try {
                return el.matches(selector) || el.closest(selector);
            } catch (e) {
                return false;
            }
        });
    }

    function handleReveal(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const stagger = parseInt(el.dataset.stagger) || 0;
                
                setTimeout(() => {
                    el.classList.remove('sr-hidden');
                    el.classList.add('sr-visible');
                }, stagger * CONFIG.staggerDelay);
                
                observer.unobserve(el);
            }
        });
    }

    // ============ COUNTER ANIMATIONS ============
    function setupCounterAnimations() {
        // Find all stat elements (elements with numbers in specific patterns)
        const potentialCounters = document.querySelectorAll(
            '#difference p.font-bold, ' +
            '.glass-panel-light p.font-bold, ' +
            '[class*="text-4xl"].font-bold, ' +
            '[class*="text-5xl"].font-bold'
        );

        const counters = [];
        
        potentialCounters.forEach(el => {
            const text = el.textContent.trim();
            const parsed = parseNumber(text);
            
            if (parsed) {
                el.dataset.countTo = parsed.value;
                el.dataset.countSuffix = parsed.suffix;
                el.dataset.countPrefix = parsed.prefix;
                el.dataset.countDecimals = parsed.decimals;
                el.dataset.originalText = text;
                counters.push(el);
            }
        });

        if (!counters.length) return;

        // Observe counters
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(el => observer.observe(el));
        
        console.log(`[ScrollReveal] Found ${counters.length} counters`);
    }

    function parseNumber(text) {
        text = text.trim();
        
        // Pattern: "150+" or "150"
        let match = text.match(/^(\d+)(\+?)$/);
        if (match) {
            return { value: parseInt(match[1]), suffix: match[2], prefix: '', decimals: 0 };
        }
        
        // Pattern: "92%"
        match = text.match(/^(\d+)(%?)$/);
        if (match) {
            return { value: parseInt(match[1]), suffix: match[2], prefix: '', decimals: 0 };
        }
        
        // Pattern: "4.9/5"
        match = text.match(/^(\d+\.?\d*)\/(\d+)$/);
        if (match) {
            return { value: parseFloat(match[1]), suffix: '/' + match[2], prefix: '', decimals: 1 };
        }
        
        // Pattern: "200+"
        match = text.match(/^(\d+)\+$/);
        if (match) {
            return { value: parseInt(match[1]), suffix: '+', prefix: '', decimals: 0 };
        }
        
        return null;
    }

    function animateCounter(el) {
        const target = parseFloat(el.dataset.countTo);
        const suffix = el.dataset.countSuffix || '';
        const prefix = el.dataset.countPrefix || '';
        const decimals = parseInt(el.dataset.countDecimals) || 0;
        const duration = CONFIG.counterDuration;
        const easing = easings[CONFIG.counterEasing];
        
        let startTime = null;
        const startValue = 0;
        
        function update(currentTime) {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            
            const current = startValue + (target - startValue) * easedProgress;
            
            // Format number
            let displayValue;
            if (decimals > 0) {
                displayValue = current.toFixed(decimals);
            } else {
                displayValue = Math.round(current);
            }
            
            el.textContent = prefix + displayValue + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        // Start from 0
        el.textContent = prefix + '0' + suffix;
        requestAnimationFrame(update);
    }

    // Start
    init();

})();
