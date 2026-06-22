/**
 * STEMulus Referral Tracking System
 * Tracks influencer leads via URL parameters and promo codes
 */

const ReferralTracker = (function() {
    'use strict';

    const STORAGE_KEY = 'stemulus_referral';
    const COOKIE_DAYS = 30; // Attribution window

    // Influencer registry (add new influencers here)
    const influencers = {
        // Format: code -> { name, platform, campaign }
        'sarah_ig': { name: 'Sarah', platform: 'Instagram', campaign: 'Feb 2026' },
        'john_tiktok': { name: 'John', platform: 'TikTok', campaign: 'Feb 2026' },
        'ada_youtube': { name: 'Ada', platform: 'YouTube', campaign: 'Feb 2026' },
        'mike_twitter': { name: 'Mike', platform: 'Twitter/X', campaign: 'Feb 2026' },
        'lisa_facebook': { name: 'Lisa', platform: 'Facebook', campaign: 'Feb 2026' },
        // Add more influencers as needed
    };

    // Promo codes (can offer discounts)
    const promoCodes = {
        'SARAH10': { influencer: 'sarah_ig', discount: 10, type: 'percent' },
        'JOHNVIP': { influencer: 'john_tiktok', discount: 5000, type: 'fixed' },
        'ADACODE': { influencer: 'ada_youtube', discount: 10, type: 'percent' },
        'STEM2026': { influencer: 'general', discount: 5, type: 'percent' },
        // Add more promo codes as needed
    };

    // Get URL parameters
    function getURLParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            ref: params.get('ref') || params.get('referral') || params.get('source'),
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            utm_content: params.get('utm_content'),
            utm_term: params.get('utm_term')
        };
    }

    // Store referral data
    function storeReferral(data) {
        const existing = getReferral();
        
        // Don't overwrite if we already have attribution (first-touch)
        // Change to last-touch by removing this check
        if (existing && existing.ref) {
            console.log('Referral: Existing attribution preserved (first-touch)');
            return existing;
        }

        const referralData = {
            ...data,
            timestamp: new Date().toISOString(),
            landingPage: window.location.pathname,
            userAgent: navigator.userAgent
        };

        // Store in localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(referralData));
        
        // Also set cookie for cross-domain tracking
        setCookie(STORAGE_KEY, JSON.stringify(referralData), COOKIE_DAYS);

        console.log('Referral: Attribution stored', referralData);
        return referralData;
    }

    // Get stored referral
    function getReferral() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    }

    // Clear referral (after successful enrollment)
    function clearReferral() {
        localStorage.removeItem(STORAGE_KEY);
        setCookie(STORAGE_KEY, '', -1);
    }

    // Cookie helpers
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/`;
    }

    // Validate promo code
    function validatePromoCode(code) {
        const upperCode = code.toUpperCase().trim();
        const promo = promoCodes[upperCode];
        
        if (!promo) {
            return { valid: false, message: 'Invalid promo code' };
        }

        return {
            valid: true,
            code: upperCode,
            discount: promo.discount,
            type: promo.type,
            influencer: promo.influencer,
            message: promo.type === 'percent' 
                ? `${promo.discount}% discount applied!` 
                : `₦${promo.discount.toLocaleString()} discount applied!`
        };
    }

    // Get influencer info
    function getInfluencerInfo(refCode) {
        return influencers[refCode] || { name: refCode, platform: 'Unknown', campaign: 'Direct' };
    }

    // Get full attribution data for form submission
    function getAttributionData() {
        const referral = getReferral() || {};
        const influencer = referral.ref ? getInfluencerInfo(referral.ref) : null;

        return {
            referralCode: referral.ref || 'direct',
            influencerName: influencer?.name || 'Direct',
            platform: influencer?.platform || 'Website',
            campaign: influencer?.campaign || referral.utm_campaign || 'Organic',
            utmSource: referral.utm_source || '',
            utmMedium: referral.utm_medium || '',
            utmCampaign: referral.utm_campaign || '',
            utmContent: referral.utm_content || '',
            landingPage: referral.landingPage || window.location.pathname,
            firstVisit: referral.timestamp || new Date().toISOString()
        };
    }

    // Add hidden fields to form
    function addHiddenFieldsToForm(form) {
        const attribution = getAttributionData();
        
        // Remove existing hidden referral fields
        form.querySelectorAll('.referral-hidden-field').forEach(f => f.remove());

        // Add new hidden fields
        Object.entries(attribution).forEach(([key, value]) => {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = `referral_${key}`;
            hidden.value = value;
            hidden.className = 'referral-hidden-field';
            form.appendChild(hidden);
        });

        console.log('Referral: Hidden fields added to form', attribution);
    }

    // Create promo code input UI
    function createPromoCodeUI() {
        const container = document.createElement('div');
        container.className = 'promo-code-container';
        container.innerHTML = `
            <div style="margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
                <label style="display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">
                    🎁 Have a promo code?
                </label>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="promo-code-input" placeholder="Enter code" 
                           style="flex: 1; padding: 10px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; text-transform: uppercase;">
                    <button type="button" id="apply-promo-btn" 
                            style="padding: 10px 20px; background: #1A237E; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Apply
                    </button>
                </div>
                <div id="promo-message" style="margin-top: 8px; font-size: 13px; display: none;"></div>
            </div>
        `;
        return container;
    }

    // Initialize promo code functionality
    function initPromoCode() {
        const applyBtn = document.getElementById('apply-promo-btn');
        const input = document.getElementById('promo-code-input');
        const message = document.getElementById('promo-message');

        if (!applyBtn || !input) return;

        applyBtn.addEventListener('click', () => {
            const code = input.value.trim();
            if (!code) {
                message.textContent = 'Please enter a code';
                message.style.color = '#ef4444';
                message.style.display = 'block';
                return;
            }

            const result = validatePromoCode(code);
            message.textContent = result.message;
            message.style.color = result.valid ? '#10b981' : '#ef4444';
            message.style.display = 'block';

            if (result.valid) {
                input.disabled = true;
                applyBtn.disabled = true;
                applyBtn.textContent = '✓ Applied';
                applyBtn.style.background = '#10b981';

                // Store promo code with referral
                const referral = getReferral() || {};
                referral.promoCode = result.code;
                referral.promoInfluencer = result.influencer;
                referral.discount = result.discount;
                referral.discountType = result.type;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(referral));
            }
        });

        // Apply on Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyBtn.click();
            }
        });
    }

    // Show referral badge if came from influencer
    function showReferralBadge() {
        const referral = getReferral();
        if (!referral || !referral.ref) return;

        const influencer = getInfluencerInfo(referral.ref);
        
        const badge = document.createElement('div');
        badge.className = 'referral-badge';
        badge.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; 
                         background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                         color: white; font-size: 13px; font-weight: 600; border-radius: 20px;
                         position: fixed; top: 100px; right: 20px; z-index: 1000; 
                         box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                ✨ Referred by ${influencer.name}
            </span>
        `;
        document.body.appendChild(badge);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            badge.style.transition = 'opacity 0.5s ease';
            badge.style.opacity = '0';
            setTimeout(() => badge.remove(), 500);
        }, 5000);
    }

    // Generate referral links for influencers
    function generateInfluencerLinks(baseUrl = 'https://stemuluskidstech.com/Enroll.html') {
        const links = {};
        Object.keys(influencers).forEach(code => {
            links[code] = `${baseUrl}?ref=${code}`;
        });
        return links;
    }

    // Initialize
    function init() {
        // Capture URL parameters on page load
        const params = getURLParams();
        
        if (params.ref || params.utm_source) {
            storeReferral(params);
        }

        // Show referral badge if applicable
        showReferralBadge();

        // If on enrollment page, setup form integration
        if (window.location.pathname.toLowerCase().includes('enroll')) {
            // Wait for form to be ready
            const setupForm = () => {
                const form = document.querySelector('form');
                if (form) {
                    // Add hidden fields before form submission
                    form.addEventListener('submit', (e) => {
                        addHiddenFieldsToForm(form);
                    });

                    // NOTE: Promo code UI is now built into Enroll.html
                    // We just need to initialize the existing elements
                    // Check if promo code input exists (added in HTML)
                    const existingPromoInput = document.getElementById('promo-code-input');
                    if (existingPromoInput && !existingPromoInput.dataset.initialized) {
                        existingPromoInput.dataset.initialized = 'true';
                        // The promo code functionality is handled by inline script in Enroll.html
                        console.log('Referral: Promo code field found (handled by page script)');
                    }
                }
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupForm);
            } else {
                setTimeout(setupForm, 100);
            }
        }
    }

    // Public API
    return {
        init,
        getReferral,
        getAttribution: getAttributionData,
        validatePromo: validatePromoCode,
        clearReferral,
        generateLinks: generateInfluencerLinks,
        addInfluencer: (code, name, platform, campaign) => {
            influencers[code] = { name, platform, campaign };
        },
        addPromoCode: (code, influencer, discount, type) => {
            promoCodes[code.toUpperCase()] = { influencer, discount, type };
        }
    };
})();

// Auto-initialize
ReferralTracker.init();
console.log('Referral: Tracker initialized');
