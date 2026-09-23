/**
 * STEMulus Quick Booking Modal Handler
 * Dynamic inline modal for simplified trial class booking
 */

const QuickBooking = (function() {
    
    const CONFIG = {
        EMAIL_ENDPOINT: '/.netlify/functions/send-email',
        NTFY_TOPIC: 'stm-enr-lx7k9w2mq8vp4tz',
        ADMIN_EMAIL: 'admin@stemuluskidstech.com',
        ADMIN_WHATSAPP: '+2347052466716'
    };

    let modalEl = null;
    let cardEl = null;

    /**
     * Initialize the global quick booking interceptor
     */
    function init() {
        // Prevent double initialization
        if (document.getElementById('quick-booking-modal')) return;

        // Inject modal CSS stylesheet and HTML elements
        injectStyles();
        injectModalHTML();

        // Register click event interceptors for all "Book a Free Class" links/buttons
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a');
            if (target) {
                const href = target.getAttribute('href') || '';
                const isBookingLink = href.includes('book-class.html') || href.includes('book-class') || target.classList.contains('btn-book-class');
                
                if (isBookingLink) {
                    e.preventDefault();
                    openModal();
                }
            }
        });

        console.log('[QuickBooking] Service initialized successfully.');
    }

    /**
     * Inject CSS rules dynamically into the document head
     */
    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'quick-booking-styles';
        style.textContent = `
            #quick-booking-modal {
                position: fixed;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000050 !important;
                opacity: 0;
                pointer-events: none;
                background: rgba(15, 23, 42, 0.45);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                transition: opacity 0.3s ease;
                font-family: 'DM Sans', sans-serif;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                padding: 1.5rem 1rem;
                box-sizing: border-box;
            }
            #quick-booking-modal.open {
                opacity: 1;
                pointer-events: auto;
            }
            #quick-booking-card {
                width: 100%;
                max-width: 580px;
                max-height: calc(100vh - 3rem);
                overflow-y: auto;
                background: rgba(255, 255, 255, 0.96);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.4);
                border-radius: 20px;
                padding: 2.25rem 2rem 2rem;
                box-shadow: 0 24px 48px -12px rgba(10, 25, 50, 0.2);
                transform: scale(0.95) translateY(16px);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                color: #1a2332;
                box-sizing: border-box;
                margin: auto;
            }
            #quick-booking-modal.open #quick-booking-card {
                transform: scale(1) translateY(0);
            }
            .qb-close-btn {
                position: absolute;
                top: 1.5rem;
                right: 1.5rem;
                background: none;
                border: none;
                color: #64748b;
                cursor: pointer;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.2s, transform 0.2s;
            }
            .qb-close-btn:hover {
                color: #0f172a;
                transform: scale(1.1);
            }
            .qb-title {
                font-family: 'Outfit', sans-serif;
                font-size: 1.65rem;
                font-weight: 700;
                margin-top: 0;
                margin-bottom: 0.35rem;
                color: #1a2332;
                letter-spacing: -0.02em;
            }
            .qb-subtitle {
                font-size: 0.85rem;
                color: #64748b;
                margin-bottom: 1.75rem;
                margin-top: 0;
                line-height: 1.5;
            }
            .qb-form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.25rem 1.25rem;
            }
            @media (max-width: 600px) {
                #quick-booking-modal {
                    padding: 0.75rem 0.5rem;
                    align-items: flex-start;
                }
                .qb-form-grid {
                    grid-template-columns: 1fr;
                    gap: 0.85rem;
                }
                #quick-booking-card {
                    width: 100%;
                    max-height: calc(100vh - 1.5rem);
                    padding: 1.5rem 1.15rem 1.15rem;
                    border-radius: 16px;
                }
                .qb-close-btn {
                    top: 1rem;
                    right: 1rem;
                }
                .qb-title {
                    font-size: 1.35rem;
                }
                .qb-subtitle {
                    font-size: 0.78rem;
                    margin-bottom: 1rem;
                }
            }
            .qb-field-group {
                text-align: left;
            }
            .qb-label {
                display: block;
                font-size: 0.72rem;
                font-weight: 700;
                color: #475569;
                margin-bottom: 0.4rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .qb-input {
                width: 100%;
                padding: 0.75rem 0.85rem;
                border-radius: 8px;
                border: none;
                background-color: rgba(240, 244, 248, 0.6);
                color: #0f172a;
                font-size: 0.92rem;
                font-family: 'DM Sans', sans-serif;
                transition: all 0.2s ease;
                box-sizing: border-box;
            }
            .qb-input:focus {
                outline: none;
                background-color: rgba(240, 244, 248, 0.9);
                box-shadow: 0 0 0 3px rgba(244, 96, 12, 0.15);
            }
            .qb-input:placeholder {
                color: #94a3b8;
            }
            .qb-pref-row {
                display: flex;
                gap: 1rem;
                margin-top: 0.25rem;
            }
            .qb-pref-label {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.75rem;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.85rem;
                font-weight: 600;
                color: #475569;
                background-color: rgba(240, 244, 248, 0.6);
                transition: all 0.2s ease;
                user-select: none;
            }
            .qb-pref-label input {
                position: absolute;
                opacity: 0;
                width: 0;
                height: 0;
            }
            .qb-pref-label:hover {
                background-color: rgba(240, 244, 248, 0.9);
            }
            .qb-pref-label.selected {
                background-color: rgba(244, 96, 12, 0.15);
                color: #f4600c;
                font-weight: 700;
            }
            .qb-submit-btn {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                background: #f4600c;
                color: white;
                font-family: 'Outfit', sans-serif;
                font-size: 0.92rem;
                font-weight: 700;
                padding: 0.85rem;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-top: 1.5rem;
            }
            .qb-submit-btn:hover {
                background: #e05306;
                transform: scale(1.01) translateY(-1px);
            }
            .qb-submit-btn:active {
                transform: scale(0.99) translateY(1px);
            }
            .qb-submit-btn:disabled {
                background: #cbd5e1;
                color: #94a3b8;
                cursor: not-allowed;
                transform: none;
            }
            .qb-success-card {
                text-align: center;
                padding: 1rem 0.5rem 0.5rem;
            }
            .qb-success-icon {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: rgba(34, 197, 94, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.25rem;
                color: #22c55e;
            }
            .qb-success-title {
                font-family: 'Outfit', sans-serif;
                font-size: 1.5rem;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 0.5rem;
            }
            .qb-success-text {
                font-size: 0.88rem;
                color: #475569;
                line-height: 1.5;
                margin-bottom: 1.25rem;
            }
            .qb-success-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                background-color: #f8fafc;
                border: 1px dashed #cbd5e1;
                border-radius: 6px;
                padding: 0.4rem 1rem;
                font-size: 0.8rem;
                margin-bottom: 1.5rem;
            }
            .qb-success-badge span:first-child {
                color: #64748b;
                font-weight: 600;
            }
            .qb-success-badge span:last-child {
                font-family: monospace;
                font-weight: 700;
                color: #2563eb;
            }
            .qb-wa-btn {
                width: 100%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                background-color: #25D366;
                color: white;
                text-decoration: none;
                font-family: 'Outfit', sans-serif;
                font-weight: 700;
                font-size: 0.92rem;
                padding: 0.85rem;
                border-radius: 12px;
                transition: all 0.2s;
            }
            .qb-wa-btn:hover {
                background-color: #128C7E;
                transform: scale(1.01) translateY(-1px);
            }
            .qb-wa-btn:active {
                transform: scale(0.99) translateY(1px);
            }
            .qb-spinner {
                animation: qb-spin 1s linear infinite;
                width: 1.2rem;
                height: 1.2rem;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #ffffff;
                display: inline-block;
            }
            @keyframes qb-spin {
                to { transform: rotate(360deg); }
            }
            .qb-error-toast {
                position: fixed;
                bottom: 1.5rem;
                right: 1.5rem;
                left: 1.5rem;
                max-width: 400px;
                background: #ef4444;
                color: white;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.2);
                z-index: 1000060 !important;
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                font-size: 0.9rem;
                box-sizing: border-box;
                animation: qb-slide-up 0.3s ease-out forwards;
            }
            @keyframes qb-slide-up {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Helper to retrieve country, age, and UTM attribution parameters
     */
    function getAttributionData() {
        const urlParams = new URLSearchParams(window.location.search);
        let country = urlParams.get('country') || '';
        let timeZone = '';
        try {
            timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            if (!country) {
                if (/America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Detroit|Indiana)/i.test(timeZone)) {
                    country = 'USA';
                } else if (/Europe\/London|GMT|BST/i.test(timeZone)) {
                    country = 'UK';
                } else if (/America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Montreal)/i.test(timeZone)) {
                    country = 'Canada';
                } else if (/Australia|Sydney|Melbourne|Brisbane|Perth|Adelaide/i.test(timeZone)) {
                    country = 'Australia';
                } else if (/Africa\/Lagos/i.test(timeZone)) {
                    country = 'Nigeria';
                } else {
                    country = 'Global';
                }
            }
        } catch(e) {
            country = country || 'Global';
        }

        return {
            country: country,
            ageGroup: urlParams.get('age') || '',
            plan: urlParams.get('plan') || '',
            utmSource: urlParams.get('utm_source') || '',
            utmMedium: urlParams.get('utm_medium') || '',
            utmCampaign: urlParams.get('utm_campaign') || '',
            referrer: document.referrer || 'direct',
            timeZone: timeZone
        };
    }

    /**
     * Inject Modal HTML template into body
     */
    function injectModalHTML() {
        const attr = getAttributionData();
        modalEl = document.createElement('div');
        modalEl.id = 'quick-booking-modal';
        modalEl.setAttribute('aria-hidden', 'true');
        modalEl.innerHTML = `
            <div id="quick-booking-card">
                <button type="button" class="qb-close-btn" aria-label="Close modal">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                <div id="quick-booking-form-wrap">
                    <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(244,96,12,0.1);color:#f4600c;border:1px solid rgba(244,96,12,0.2);padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.75rem;">
                        <span>45-Minute Discovery Session</span>
                    </div>
                    <h2 class="qb-title">Free Coding Discovery Session</h2>
                    <p class="qb-subtitle">Private 1-on-1 lesson with a vetted mentor. 100% free · No credit card · Scheduled in your time zone.</p>
                    
                    <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:0.74rem;color:#475569;margin-bottom:1.25rem;">
                        <strong style="color:#f4600c;">45 Mins:</strong> 10m Goal Assessment · 25m Live Build · 10m Parent Debrief
                    </div>

                    <form id="qb-booking-form" name="free-class-booking">
                        <!-- Netlify forms field -->
                        <input type="hidden" name="form-name" value="free-class-booking">
                        <input type="hidden" name="country" value="${attr.country}">
                        <input type="hidden" name="age_group" value="${attr.ageGroup}">
                        <input type="hidden" name="utm_source" value="${attr.utmSource}">
                        <input type="hidden" name="utm_medium" value="${attr.utmMedium}">
                        <input type="hidden" name="utm_campaign" value="${attr.utmCampaign}">
                        <input type="hidden" name="referrer" value="${attr.referrer}">
                        <input type="hidden" name="time_zone" value="${attr.timeZone}">
                        
                        <div class="qb-form-grid">
                            <div class="qb-field-group">
                                <label class="qb-label" for="qb-parent-name">Parent Full Name</label>
                                <input class="qb-input" type="text" id="qb-parent-name" name="parent_name" placeholder="e.g. Sarah Jenkins" required>
                            </div>
                            
                            <div class="qb-field-group">
                                <label class="qb-label" for="qb-student-name">Child's Name &amp; Age</label>
                                <input class="qb-input" type="text" id="qb-student-name" name="student_name" placeholder="e.g. Liam, age 9" required>
                            </div>
                            
                            <div class="qb-field-group">
                                <label class="qb-label" for="qb-email">Email Address</label>
                                <input class="qb-input" type="email" id="qb-email" name="email" placeholder="e.g. sarah@example.com" required>
                            </div>
                            
                            <div class="qb-field-group">
                                <label class="qb-label" for="qb-phone">Phone / WhatsApp (with country code)</label>
                                <input class="qb-input" type="tel" id="qb-phone" name="phone" placeholder="e.g. +1 555 123 4567" required>
                            </div>
                        </div>
                        
                        <div class="qb-field-group" style="margin-top: 1.25rem;">
                            <label class="qb-label">Preferred Confirmation Channel</label>
                            <div class="qb-pref-row">
                                <label class="qb-pref-label selected" id="qb-pref-wa-label">
                                    <input type="radio" name="contact_pref" value="WhatsApp" checked>
                                    <span>WhatsApp</span>
                                </label>
                                <label class="qb-pref-label" id="qb-pref-email-label">
                                    <input type="radio" name="contact_pref" value="Email">
                                    <span>Email</span>
                                </label>
                            </div>
                        </div>
                        
                        <button type="submit" class="qb-submit-btn">
                            Book Free 45-Min Discovery Session
                        </button>
                        <div style="margin:1rem 0;display:flex;align-items:center;gap:0.75rem;">
                            <div style="flex:1;height:1px;background:rgba(0,0,0,0.1);"></div>
                            <span style="font-size:0.72rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">or</span>
                            <div style="flex:1;height:1px;background:rgba(0,0,0,0.1);"></div>
                        </div>
                        <a href="https://wa.me/2347052466716?text=Hi%2C%20I%27d%20like%20to%20book%20a%20free%20discovery%20session%20for%20my%20child!" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;gap:0.6rem;width:100%;padding:0.85rem;background:#25D366;color:#fff;border-radius:10px;font-weight:700;font-size:0.88rem;text-decoration:none;border:none;box-sizing:border-box;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.529 5.843L0 24l6.345-1.5A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.357-.213-3.764.891.9-3.67-.233-.378A9.792 9.792 0 012.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z"/></svg>
                            Book Instantly via WhatsApp
                        </a>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modalEl);
        cardEl = document.getElementById('quick-booking-card');

        // Close button listener
        modalEl.querySelector('.qb-close-btn').addEventListener('click', closeModal);
        
        // Modal outer area listener
        modalEl.addEventListener('click', function(e) {
            if (e.target === modalEl) {
                closeModal();
            }
        });

        // Contact preference styling handlers
        const waLabel = document.getElementById('qb-pref-wa-label');
        const emailLabel = document.getElementById('qb-pref-email-label');

        waLabel.querySelector('input').addEventListener('change', function() {
            if (this.checked) {
                waLabel.classList.add('selected');
                emailLabel.classList.remove('selected');
            }
        });

        emailLabel.querySelector('input').addEventListener('change', function() {
            if (this.checked) {
                emailLabel.classList.add('selected');
                waLabel.classList.remove('selected');
            }
        });

        // Form submit interceptor
        document.getElementById('qb-booking-form').addEventListener('submit', handleFormSubmit);
    }

    /**
     * Show the booking modal
     */
    function openModal() {
        if (!modalEl) return;
        modalEl.classList.add('open');
        modalEl.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the booking modal
     */
    function closeModal() {
        if (!modalEl) return;
        modalEl.classList.remove('open');
        modalEl.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // After transition completes, reset form content if it was a success state
        setTimeout(() => {
            const wrap = document.getElementById('quick-booking-form-wrap');
            if (wrap && wrap.querySelector('.qb-success-card')) {
                resetFormHTML();
            }
        }, 300);
    }

    /**
     * Reset form HTML content back to inputs
     */
    function resetFormHTML() {
        const wrap = document.getElementById('quick-booking-form-wrap');
        if (!wrap) return;
        const attr = getAttributionData();
        wrap.innerHTML = `
            <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(244,96,12,0.1);color:#f4600c;border:1px solid rgba(244,96,12,0.2);padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.75rem;">
                <span>45-Minute Discovery Session</span>
            </div>
            <h2 class="qb-title">Free Coding Discovery Session</h2>
            <p class="qb-subtitle">Private 1-on-1 lesson with a vetted mentor. 100% free · No credit card · Scheduled in your time zone.</p>
            
            <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:0.74rem;color:#475569;margin-bottom:1.25rem;">
                <strong style="color:#f4600c;">45 Mins:</strong> 10m Goal Assessment · 25m Live Build · 10m Parent Debrief
            </div>

            <form id="qb-booking-form" name="free-class-booking">
                <input type="hidden" name="form-name" value="free-class-booking">
                <input type="hidden" name="country" value="${attr.country}">
                <input type="hidden" name="age_group" value="${attr.ageGroup}">
                <input type="hidden" name="utm_source" value="${attr.utmSource}">
                <input type="hidden" name="utm_medium" value="${attr.utmMedium}">
                <input type="hidden" name="utm_campaign" value="${attr.utmCampaign}">
                <input type="hidden" name="referrer" value="${attr.referrer}">
                <input type="hidden" name="time_zone" value="${attr.timeZone}">
                
                <div class="qb-form-grid">
                    <div class="qb-field-group">
                        <label class="qb-label" for="qb-parent-name">Parent Full Name</label>
                        <input class="qb-input" type="text" id="qb-parent-name" name="parent_name" placeholder="e.g. Sarah Jenkins" required>
                    </div>
                    
                    <div class="qb-field-group">
                        <label class="qb-label" for="qb-student-name">Child's Name &amp; Age</label>
                        <input class="qb-input" type="text" id="qb-student-name" name="student_name" placeholder="e.g. Liam, age 9" required>
                    </div>
                    
                    <div class="qb-field-group">
                        <label class="qb-label" for="qb-email">Email Address</label>
                        <input class="qb-input" type="email" id="qb-email" name="email" placeholder="e.g. sarah@example.com" required>
                    </div>
                    
                    <div class="qb-field-group">
                        <label class="qb-label" for="qb-phone">Phone / WhatsApp (with country code)</label>
                        <input class="qb-input" type="tel" id="qb-phone" name="phone" placeholder="e.g. +1 555 123 4567" required>
                    </div>
                </div>
                
                <div class="qb-field-group" style="margin-top: 1.25rem;">
                    <label class="qb-label">Preferred Confirmation Channel</label>
                    <div class="qb-pref-row">
                        <label class="qb-pref-label selected" id="qb-pref-wa-label">
                            <input type="radio" name="contact_pref" value="WhatsApp" checked>
                            <span>WhatsApp</span>
                        </label>
                        <label class="qb-pref-label" id="qb-pref-email-label">
                            <input type="radio" name="contact_pref" value="Email">
                            <span>Email</span>
                        </label>
                    </div>
                </div>
                
                <button type="submit" class="qb-submit-btn">
                    Book Free 45-Min Discovery Session
                </button>
            </form>
        `;
        
        // Re-attach preference listeners
        const waLabel = document.getElementById('qb-pref-wa-label');
        const emailLabel = document.getElementById('qb-pref-email-label');

        waLabel.querySelector('input').addEventListener('change', function() {
            if (this.checked) {
                waLabel.classList.add('selected');
                emailLabel.classList.remove('selected');
            }
        });

        emailLabel.querySelector('input').addEventListener('change', function() {
            if (this.checked) {
                emailLabel.classList.add('selected');
                waLabel.classList.remove('selected');
            }
        });

        // Re-attach form listener
        document.getElementById('qb-booking-form').addEventListener('submit', handleFormSubmit);
    }

    /**
     * Submit handler for the quick booking form
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('.qb-submit-btn');

        // Collect parameters
        const formData = new FormData(form);
        const bookingId = generateBookingId();
        const attr = getAttributionData();

        const country = formData.get('country') || attr.country || 'Global';
        const utmSource = formData.get('utm_source') || attr.utmSource || 'direct';
        const utmCampaign = formData.get('utm_campaign') || attr.utmCampaign || '';
        const referrer = formData.get('referrer') || attr.referrer || 'direct';
        const timeZone = formData.get('time_zone') || attr.timeZone || '';
        const ageGroup = formData.get('age_group') || attr.ageGroup || '';

        // Guarantee hidden attributes exist in formData for Netlify forms
        formData.set('country', country);
        formData.set('utm_source', utmSource);
        formData.set('utm_campaign', utmCampaign);
        formData.set('referrer', referrer);
        formData.set('time_zone', timeZone);
        formData.set('age_group', ageGroup);

        const bookingData = {
            bookingId: bookingId,
            parentName: formData.get('parent_name'),
            studentName: formData.get('student_name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            contactPref: formData.get('contact_pref'),
            country: country,
            utmSource: utmSource,
            utmCampaign: utmCampaign,
            referrer: referrer,
            timeZone: timeZone,
            ageGroup: ageGroup,
            timestamp: new Date().toISOString()
        };

        // UI loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="qb-spinner"></span> &nbsp; Reserving Discovery Session...';

        try {
            // Send notifications in parallel
            const results = await Promise.allSettled([
                sendAdminEmail(bookingData),
                sendParentEmail(bookingData),
                sendNtfyNotification(bookingData),
                submitToNetlify(form, formData),
                (typeof WhatsAppNotify !== 'undefined'
                    ? WhatsAppNotify.sendBookingNotification({
                        parentName: bookingData.parentName,
                        studentName: bookingData.studentName,
                        email: bookingData.email,
                        phone: bookingData.phone,
                        bookingId: bookingData.bookingId,
                        contactPref: bookingData.contactPref
                    })
                    : Promise.resolve({ success: false, skipped: 'WhatsAppNotify not loaded' }))
            ]);

            results.forEach((result, idx) => {
                const services = ['Admin Email', 'Parent Email', 'NTFY Push', 'Netlify Forms', 'WhatsApp Notify'];
                if (result.status === 'fulfilled') {
                    console.log(`[QuickBooking] ${services[idx]} notification sent`);
                } else {
                    console.warn(`[QuickBooking] ${services[idx]} failed:`, result.reason);
                }
            });

            // Trigger success card layout
            showSuccessState(bookingData);
            saveBookingLocally(bookingData);

        } catch (error) {
            console.warn('[QuickBooking] Submission error:', error);
            showErrorToast('Failed to complete booking. Please try again or reach out on WhatsApp.');
            
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reserve Free Discovery Session';
        }
    }

    /**
     * Send booking emails (admin alert + parent confirmation) via Netlify Function.
     */
    async function sendAdminEmail(data) {
        const resp = await fetch(CONFIG.EMAIL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'booking',
                data: {
                    bookingId:   data.bookingId,
                    parentName:  data.parentName,
                    studentName: data.studentName,
                    email:       data.email,
                    phone:       data.phone,
                    contactPref: data.contactPref,
                    country:     data.country,
                    ageGroup:    data.ageGroup,
                    utmSource:   data.utmSource
                }
            })
        });
        const json = await resp.json();
        if (!json.ok) console.warn('[QuickBooking] Email partial failure:', json.results);
        return json;
    }

    // sendParentEmail is now handled inside the same 'booking' type call above.
    // Kept as no-op so the Promise.allSettled call index stays compatible.
    async function sendParentEmail(_data) { return { skipped: true }; }

    /**
     * Send push notification to admin via NTFY
     */
    async function sendNtfyNotification(data) {
        const title = `Discovery Session: ${data.studentName} [${data.country || 'Global'}]`;
        const message = `
Parent Name: ${data.parentName}
Email: ${data.email}
Phone: ${data.phone}
Country: ${data.country || 'Global'}
Age Group: ${data.ageGroup || 'N/A'}
Contact Pref: ${data.contactPref}
Source: ${data.utmSource || 'direct'}
Booking ID: ${data.bookingId}
        `.trim();

        try {
            const response = await fetch('/.netlify/functions/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: 'enroll',
                    title,
                    message,
                    priority: 'high',
                    tags: 'zap,sparkles,calendar',
                    click: `https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(`Hi! Following up on discovery session for ${data.studentName}`)}`
                })
            });

            if (!response.ok) throw new Error('NTFY post failed');
            return { success: true };
        } catch (error) {
            console.warn('[QuickBooking] NTFY failed:', error);
            return { success: false, error };
        }
    }

    /**
     * POST payload to Netlify
     */
    async function submitToNetlify(form, formData) {
        // Ensure form-name is always present, even if the hidden input is somehow absent.
        if (typeof formData.set === 'function') {
            formData.set('form-name', 'free-class-booking');
        }
        const response = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        });

        // Treat only server-side errors as failures. Netlify Forms returns 3xx
        // redirects on success, and fetch follows them to a 200 homepage: both
        // are acceptable outcomes, so only throw on 5xx.
        if (response.status >= 500) throw new Error('Netlify form post failed');
        return { success: true };
    }

    /**
     * Swap form view with success state card
     */
    function showSuccessState(data) {
        triggerConfetti();

        const wrap = document.getElementById('quick-booking-form-wrap');
        if (!wrap) return;

        const waMsgText = `Hi! I just reserved a Free Discovery Session for my child (${data.studentName}) [${data.country || 'Global'}]. Booking ID: ${data.bookingId}. Let's schedule our 45-minute session!`;
        const waLink = `https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(waMsgText)}`;

        wrap.innerHTML = `
            <div class="qb-success-card animate-qb-fade-in">
                <div class="qb-success-icon">
                    <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>
                <h3 class="qb-success-title">Discovery Session Reserved!</h3>
                <p class="qb-success-text">
                    Thank you, <strong>${data.parentName}</strong>! We've received your request for <strong>${data.studentName}</strong>. An academic mentor will review your child's profile and match the ideal curriculum before contacting you within 2 hours.
                </p>
                <div class="qb-success-badge">
                    <span>Booking ID:</span>
                    <span>${data.bookingId}</span>
                </div>
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="qb-wa-btn">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Chat on WhatsApp for Instant Setup
                </a>
            </div>
        `;
    }

    /**
     * Show custom error alert toast
     */
    function showErrorToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'qb-error-toast';
        toast.innerHTML = `
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div style="flex:1;">
                <p style="font-weight:700;margin:0 0 0.25rem 0;">Booking Error</p>
                <p style="margin:0;opacity:0.9;font-size:0.8rem;">${msg}</p>
            </div>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;padding:0.25rem;">&times;</button>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 6000);
    }

    /**
     * Generate unique Booking ID
     */
    function generateBookingId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `BK-${timestamp.slice(-4)}-${rand}`;
    }

    /**
     * Run confetti animation inside modal
     */
    function triggerConfetti() {
        const colors = ['#FF6D00', '#A855F7', '#10B981', '#3B82F6', '#EC4899'];
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: ${Math.random() * 8 + 4}px;
                height: ${Math.random() * 8 + 4}px;
                background-color: ${colors[Math.floor(Math.random() * colors.length)]};
                top: 20%;
                left: ${Math.random() * 100}vw;
                z-index: 100002;
                pointer-events: none;
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                animation: qb-confetti-fall ${Math.random() * 2 + 2}s linear forwards;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 4000);
        }

        // Add confetti animation style rule if not already present
        if (!document.getElementById('qb-confetti-keyframes')) {
            const kf = document.createElement('style');
            kf.id = 'qb-confetti-keyframes';
            kf.textContent = `
                @keyframes qb-confetti-fall {
                    0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
                }
            `;
            document.head.appendChild(kf);
        }
    }

    /**
     * Save booking locally as fallback sync
     */
    function saveBookingLocally(data) {
        try {
            const bookings = JSON.parse(localStorage.getItem('stemulus_bookings') || '[]');
            bookings.push({
                bookingId: data.bookingId,
                parentName: data.parentName,
                studentFirstName: data.studentName.split(',')[0].trim(),
                studentLastName: '',
                studentAge: data.studentName.includes('age') ? data.studentName.split('age')[1].trim() : (data.ageGroup || ''),
                email: data.email,
                phone: data.phone,
                country: data.country || 'Global',
                utmSource: data.utmSource || 'direct',
                utmCampaign: data.utmCampaign || '',
                referrer: data.referrer || '',
                timeZone: data.timeZone || '',
                ageGroup: data.ageGroup || '',
                timestamp: data.timestamp,
                preferredDay: 'Discovery Session Inquiry',
                preferredTime: data.contactPref
            });
            localStorage.setItem('stemulus_bookings', JSON.stringify(bookings));

            // Central DashboardEngine sync
            if (typeof DashboardEngine !== 'undefined') {
                DashboardEngine.addEnrollment({
                    studentFirstName: data.studentName.split(',')[0].trim(),
                    studentLastName: 'Inquiry',
                    parentName: data.parentName,
                    email: data.email,
                    phone: data.phone,
                    country: data.country || 'Global',
                    isFreeTrial: true
                });
            }
        } catch (e) {
            console.warn('[QuickBooking] Localstorage sync skipped:', e);
        }
    }

    // ==================== PUBLIC API ====================
    return {
        init: init,
        open: openModal,
        close: closeModal,
        injectFormInline: function(containerId) {
            // Render the same simple form inline on a container (for standalone fallback page)
            const container = document.getElementById(containerId);
            if (!container) return;

            const attr = getAttributionData();

            container.innerHTML = `
                <div class="glass-form text-left" style="background: rgba(255, 255, 255, 0.88); border: none; border-radius: 16px; padding: 2rem; box-shadow: 0 20px 40px -10px rgba(10, 25, 50, 0.08); box-sizing: border-box;">
                    <div id="quick-booking-form-wrap">
                        <div class="qb-header-badge" style="display:inline-flex; align-items:center; gap:6px; background:#eff6ff; color:#2563eb; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; padding:4px 10px; border-radius:100px; margin-bottom:0.75rem;">
                            <span>⏱️ 45-Minute 1-on-1 Assessment</span>
                        </div>
                        <h2 class="qb-title" style="margin-top:0;">Free Coding Discovery Session</h2>
                        <p class="qb-subtitle">A live 1-on-1 session with a senior mentor: 10m assessment & goals, 25m interactive build, 10m personalized learning roadmap.</p>
                        <form id="qb-booking-form" name="free-class-booking">
                            <input type="hidden" name="form-name" value="free-class-booking">
                            <input type="hidden" name="country" value="${attr.country}">
                            <input type="hidden" name="utm_source" value="${attr.utmSource}">
                            <input type="hidden" name="utm_medium" value="${attr.utmMedium}">
                            <input type="hidden" name="utm_campaign" value="${attr.utmCampaign}">
                            <input type="hidden" name="referrer" value="${attr.referrer}">
                            <input type="hidden" name="time_zone" value="${attr.timeZone}">
                            <input type="hidden" name="age_group" value="${attr.ageGroup}">
                            
                            <div class="qb-form-grid">
                                <div class="qb-field-group">
                                    <label class="qb-label" for="qb-parent-name">Your Full Name</label>
                                    <input class="qb-input" type="text" id="qb-parent-name" name="parent_name" placeholder="e.g. Juliette Karapetyan" required>
                                </div>
                                
                                <div class="qb-field-group">
                                    <label class="qb-label" for="qb-student-name">Child's Name & Age</label>
                                    <input class="qb-input" type="text" id="qb-student-name" name="student_name" placeholder="e.g. Amara, age 8" required>
                                </div>
                                
                                <div class="qb-field-group">
                                    <label class="qb-label" for="qb-email">Email Address</label>
                                    <input class="qb-input" type="email" id="qb-email" name="email" placeholder="e.g. parent@example.com" required>
                                </div>
                                
                                <div class="qb-field-group">
                                    <label class="qb-label" for="qb-phone">Phone / WhatsApp Number</label>
                                    <input class="qb-input" type="tel" id="qb-phone" name="phone" placeholder="e.g. +1 (555) 234-5678" required>
                                </div>
                            </div>
                            
                            <div class="qb-field-group" style="margin-top: 1.25rem;">
                                <label class="qb-label">Preferred Contact Channel</label>
                                <div class="qb-pref-row">
                                    <label class="qb-pref-label selected" id="qb-pref-wa-label">
                                        <input type="radio" name="contact_pref" value="WhatsApp" checked>
                                        <span>WhatsApp</span>
                                    </label>
                                    <label class="qb-pref-label" id="qb-pref-email-label">
                                        <input type="radio" name="contact_pref" value="Email">
                                        <span>Email</span>
                                    </label>
                                </div>
                            </div>
                            
                            <button type="submit" class="qb-submit-btn">
                                Reserve Free Discovery Session
                            </button>
                        </form>
                    </div>
                </div>
            `;

            // Style listeners
            const waLabel = document.getElementById('qb-pref-wa-label');
            const emailLabel = document.getElementById('qb-pref-email-label');

            waLabel.querySelector('input').addEventListener('change', function() {
                if (this.checked) {
                    waLabel.classList.add('selected');
                    emailLabel.classList.remove('selected');
                }
            });

            emailLabel.querySelector('input').addEventListener('change', function() {
                if (this.checked) {
                    emailLabel.classList.add('selected');
                    waLabel.classList.remove('selected');
                }
            });

            // Form submit listener
            document.getElementById('qb-booking-form').addEventListener('submit', handleFormSubmit);
        }
    };

})();

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', QuickBooking.init);
