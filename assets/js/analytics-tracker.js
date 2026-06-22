/**
 * STEMulus Analytics Integration
 * Microsoft Clarity (heatmaps) + Custom funnel tracking
 */

const AnalyticsTracker = (function() {
    'use strict';

    // Microsoft Clarity Project ID (replace with actual ID)
    const CLARITY_ID = 'your-clarity-id'; // TODO: Replace with actual Clarity ID
    
    // Funnel stages
    const funnelStages = {
        'index.html': 'homepage_visit',
        'programs.html': 'programs_view',
        'pricing.html': 'pricing_view',
        'enroll.html': 'enrollment_start',
        'contact.html': 'contact_view'
    };

    // Initialize Microsoft Clarity (free heatmaps)
    function initClarity() {
        // Skip if already loaded or no ID
        if (window.clarity || CLARITY_ID === 'your-clarity-id') {
            console.log('Analytics: Clarity skipped (no ID configured)');
            return;
        }
        
        (function(c, l, a, r, i, t, y) {
            c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
            t = l.createElement(r);
            t.async = 1;
            t.src = "https://www.clarity.ms/tag/" + i;
            y = l.getElementsByTagName(r)[0];
            y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", CLARITY_ID);
        
        console.log('Analytics: Microsoft Clarity initialized');
    }

    // Track custom events
    function trackEvent(category, action, label = null, value = null) {
        // Send to Clarity if available
        if (window.clarity) {
            window.clarity('set', `${category}_${action}`, label || 'true');
        }
        
        // Send to Google Analytics if available
        if (window.gtag) {
            window.gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value
            });
        }
        
        // Log for debugging
        console.log(`Analytics: ${category} - ${action}`, label ? `(${label})` : '');
    }

    // Track page view with funnel stage
    function trackPageView() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const stage = funnelStages[page.toLowerCase()];
        
        if (stage) {
            trackEvent('funnel', stage, page);
        }
        
        trackEvent('pageview', 'view', page);
    }

    // Track button clicks
    function trackClicks() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button');
            if (!target) return;
            
            // CTA buttons
            if (target.href && target.href.includes('enroll')) {
                trackEvent('cta', 'enroll_click', window.location.pathname);
            }
            
            // WhatsApp clicks
            if (target.href && target.href.includes('wa.me')) {
                trackEvent('cta', 'whatsapp_click', window.location.pathname);
            }
            
            // Program page clicks
            if (target.href && target.href.includes('-')) {
                const program = target.href.split('/').pop().replace('.html', '');
                if (['scratch', 'python', 'web', 'arduino', 'robotics', 'ai'].some(p => program.includes(p))) {
                    trackEvent('program', 'click', program);
                }
            }
        });
    }

    // Track scroll depth
    function trackScrollDepth() {
        const depths = [25, 50, 75, 90];
        const tracked = new Set();
        
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            for (const depth of depths) {
                if (scrollPercent >= depth && !tracked.has(depth)) {
                    tracked.add(depth);
                    trackEvent('engagement', 'scroll_depth', `${depth}%`);
                }
            }
        }, { passive: true });
    }

    // Track time on page
    function trackTimeOnPage() {
        let startTime = Date.now();
        const timeThresholds = [30, 60, 120, 300]; // seconds
        const tracked = new Set();
        
        setInterval(() => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            
            for (const threshold of timeThresholds) {
                if (timeSpent >= threshold && !tracked.has(threshold)) {
                    tracked.add(threshold);
                    trackEvent('engagement', 'time_on_page', `${threshold}s`);
                }
            }
        }, 10000);
        
        // Track on page leave
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            trackEvent('engagement', 'session_end', `${timeSpent}s`);
        });
    }

    // Track form interactions
    function trackForms() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach((form, index) => {
            // Track form start
            form.addEventListener('focusin', () => {
                if (!form.dataset.started) {
                    form.dataset.started = 'true';
                    trackEvent('form', 'start', form.id || `form_${index}`);
                }
            }, { once: true });
            
            // Track form submit
            form.addEventListener('submit', () => {
                trackEvent('form', 'submit', form.id || `form_${index}`);
            });
        });
    }

    // Track outbound links
    function trackOutboundLinks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;
            
            const url = new URL(link.href, window.location.origin);
            if (url.origin !== window.location.origin) {
                trackEvent('outbound', 'click', url.hostname);
            }
        });
    }

    // Initialize all tracking
    function init() {
        initClarity();
        trackPageView();
        trackClicks();
        trackScrollDepth();
        trackTimeOnPage();
        trackForms();
        trackOutboundLinks();
    }

    // Public API
    return {
        init,
        track: trackEvent,
        page: trackPageView
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AnalyticsTracker.init);
} else {
    AnalyticsTracker.init();
}
console.log('Analytics: Tracker initialized');
