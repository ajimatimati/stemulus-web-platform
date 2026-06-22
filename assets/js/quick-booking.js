/**
 * STEMulus Quick Booking Modal Handler
 * Dynamic inline modal for simplified trial class booking
 */

const QuickBooking = (function() {
    
    const CONFIG = {
        NTFY_TOPIC: 'stemulus-enrollments-admin2026',
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
                const isBookingLink = href.includes('book-class.html') || target.classList.contains('btn-hero-secondary');
                
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
                z-index: 100000;
                opacity: 0;
                pointer-events: none;
                background: rgba(15, 23, 42, 0.25);
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                transition: opacity 0.3s ease;
                font-family: 'DM Sans', sans-serif;
            }
            #quick-booking-modal.open {
                opacity: 1;
                pointer-events: auto;
            }
            #quick-booking-card {
                width: 95%;
                max-width: 580px;
                background: rgba(255, 255, 255, 0.88);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: none;
                border-radius: 16px;
                padding: 2.25rem 2rem 2rem;
                box-shadow: 0 20px 40px -10px rgba(10, 25, 50, 0.08);
                transform: scale(0.9) translateY(20px);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                position: relative;
                color: #1a2332;
                box-sizing: border-box;
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
                .qb-form-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                #quick-booking-card {
                    width: 94%;
                    padding: 1.75rem 1.25rem 1.25rem;
                    border-radius: 12px;
                }
                .qb-close-btn {
                    top: 1.25rem;
                    right: 1.25rem;
                }
                .qb-title {
                    font-size: 1.4rem;
                }
                .qb-subtitle {
                    font-size: 0.78rem;
                    margin-bottom: 1.25rem;
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
            .qb-input::placeholder {
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
                z-index: 100001;
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                font-size: 0.9rem;
                box-sizing: border-box;
                animation: qb-slide-up 0.3s ease-out forwards;
            }
            @keyframes qb-slide-up {
                from { transform: translateY(100%) opacity: 0; }
                to { transform: translateY(0) opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Inject Modal HTML template into body
     */
    function injectModalHTML() {
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
                    <h2 class="qb-title">Book a Free Class</h2>
                    <p class="qb-subtitle">Fill in details below to book a trial class. A mentor will reach out within 2 hours.</p>
                    <form id="qb-booking-form" name="free-class-booking">
                        <!-- Netlify forms field -->
                        <input type="hidden" name="form-name" value="free-class-booking">
                        
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
                                <input class="qb-input" type="tel" id="qb-phone" name="phone" placeholder="e.g. +234 705 246 6716" required>
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
                            Book Free Class
                        </button>
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
        wrap.innerHTML = `
            <h2 class="qb-title">Book a Free Class</h2>
            <p class="qb-subtitle">Fill in details below to book a trial class. A mentor will reach out within 2 hours.</p>
            <form id="qb-booking-form" name="free-class-booking">
                <input type="hidden" name="form-name" value="free-class-booking">
                
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
                        <input class="qb-input" type="tel" id="qb-phone" name="phone" placeholder="e.g. +234 705 246 6716" required>
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
                    Book Free Class
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

        const bookingData = {
            bookingId: bookingId,
            parentName: formData.get('parent_name'),
            studentName: formData.get('student_name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            contactPref: formData.get('contact_pref'),
            timestamp: new Date().toISOString()
        };

        // UI loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="qb-spinner"></span> &nbsp; Processing Booking...';

        try {
            // Send notifications in parallel
            const results = await Promise.allSettled([
                sendAdminEmail(bookingData),
                sendParentEmail(bookingData),
                sendNtfyNotification(bookingData),
                submitToNetlify(form, formData)
            ]);

            results.forEach((result, idx) => {
                const services = ['Admin Email', 'Parent Email', 'NTFY Push', 'Netlify Forms'];
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
            console.error('[QuickBooking] Submission error:', error);
            showErrorToast('Failed to complete booking. Please try again or reach out on WhatsApp.');
            
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.textContent = 'Complete Booking';
        }
    }

    /**
     * Send email notification to admin (EmailJS)
     */
    async function sendAdminEmail(data) {
        if (typeof EmailService === 'undefined') {
            console.warn('[QuickBooking] EmailService not found. Admin email skipped.');
            return;
        }

        const bodyText = `A new quick free trial class booking has been received.

Booking Details:
- Booking ID: ${data.bookingId}
- Child Name & Age: ${data.studentName}
- Preferred Contact Mode: ${data.contactPref}

Parent Info:
- Parent Name: ${data.parentName}
- Email: ${data.email}
- Phone/WhatsApp: ${data.phone}
- Request Time: ${new Date(data.timestamp).toLocaleString('en-GB')}
        `;

        // Direct alert
        const sendToAdmin = EmailService.send({
            to: CONFIG.ADMIN_EMAIL,
            studentName: 'Admin',
            subject: `[Quick Booking] New Trial Request - ${data.bookingId}`,
            body: bodyText
        });

        // Copy alert to stemulusclubs@gmail.com
        const sendToCopy = EmailService.send({
            to: 'stemulusclubs@gmail.com',
            studentName: 'STEMulus Clubs',
            subject: `[Quick Booking Copy] New Trial Request - ${data.bookingId}`,
            body: bodyText
        });

        return Promise.all([sendToAdmin, sendToCopy]);
    }

    /**
     * Send confirmation email to parent (EmailJS)
     */
    async function sendParentEmail(data) {
        if (typeof EmailService === 'undefined') {
            console.warn('[QuickBooking] EmailService not found. Parent email skipped.');
            return;
        }

        const bodyText = `Hi ${data.parentName},

Thank you for requesting a free trial class with STEMulus! We have received your booking request for ${data.studentName}.

Booking Summary:
- Booking ID: ${data.bookingId}
- Preferred Communication: ${data.contactPref}

What happens next?
We are matching your request with one of our specialized coding mentors. A member of our team will contact you at ${data.phone} (or via email at ${data.email}) within 2 hours to confirm your scheduling options and provide your Zoom trial link.

If you have any questions, you can reply directly to this email or chat with us on WhatsApp at: https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent('Hi! Following up on quick trial booking ID ' + data.bookingId)}.

Best regards,
STEMulus Kids Tech Team
        `;

        return await EmailService.send({
            to: data.email,
            studentName: data.parentName,
            subject: `Free Trial Booking Requested - STEMulus Kids Tech`,
            body: bodyText,
            ccParent: 'stemulusclubs@gmail.com'
        });
    }

    /**
     * Send push notification to admin via NTFY
     */
    async function sendNtfyNotification(data) {
        const title = `Quick Booking: ${data.studentName}`;
        const message = `
Parent Name: ${data.parentName}
Email: ${data.email}
Phone: ${data.phone}
Preferred Contact: ${data.contactPref}
Booking ID: ${data.bookingId}
        `.trim();

        try {
            const response = await fetch(`https://ntfy.sh/${CONFIG.NTFY_TOPIC}`, {
                method: 'POST',
                headers: {
                    'Title': title,
                    'Priority': 'high',
                    'Tags': 'zap,sparkles,calendar',
                    'Click': `https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(`Hi! Following up on quick booking for ${data.studentName}`)}`
                },
                body: message
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
        const response = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        });

        if (!response.ok) throw new Error('Netlify form post failed');
        return { success: true };
    }

    /**
     * Swap form view with success state card
     */
    function showSuccessState(data) {
        triggerConfetti();

        const wrap = document.getElementById('quick-booking-form-wrap');
        if (!wrap) return;

        const waMsgText = `Hi! I just booked a free trial class for my child (${data.studentName}). Booking ID: ${data.bookingId}. Let's schedule it!`;
        const waLink = `https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(waMsgText)}`;

        wrap.innerHTML = `
            <div class="qb-success-card animate-qb-fade-in">
                <div class="qb-success-icon">
                    <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>
                <h3 class="qb-success-title">Booking Received!</h3>
                <p class="qb-success-text">
                    Thank you, <strong>${data.parentName}</strong>! We've received your request for <strong>${data.studentName}</strong>. A mentor will contact you within 2 hours.
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
                studentAge: data.studentName.includes('age') ? data.studentName.split('age')[1].trim() : '',
                email: data.email,
                phone: data.phone,
                timestamp: data.timestamp,
                preferredDay: 'Immediate Inquiry',
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

            container.innerHTML = `
                <div class="glass-form text-left" style="background: rgba(255, 255, 255, 0.88); border: none; border-radius: 16px; padding: 2rem; box-shadow: 0 20px 40px -10px rgba(10, 25, 50, 0.08); box-sizing: border-box;">
                    <div id="quick-booking-form-wrap">
                        <h2 class="qb-title" style="margin-top:0;">Book a Free Class</h2>
                        <p class="qb-subtitle">Fill in details below to book a trial class. A mentor will reach out within 2 hours.</p>
                        <form id="qb-booking-form" name="free-class-booking">
                            <input type="hidden" name="form-name" value="free-class-booking">
                            
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
                                    <input class="qb-input" type="tel" id="qb-phone" name="phone" placeholder="e.g. +234 705 246 6716" required>
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
                                Book Free Class
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
