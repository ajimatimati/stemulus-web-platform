/**
 * STEMulus Free Class Booking Handler
 * Handles form submission, email notifications via EmailJS (admin + parent auto-reply), and push alerts via NTFY
 */

const BookingHandler = (function() {
    
    // ============ CONFIGURATION ============
    const CONFIG = {
        // NTFY Push Notification Topic
        NTFY_TOPIC: 'stm-enr-lx7k9w2mq8vp4tz',
        
        // Admin contact details
        ADMIN_EMAIL: 'admin@stemuluskidstech.com',
        ADMIN_WHATSAPP: '+2347052466716'
    };
    // =======================================

    function sanitize(str) {
        const d = document.createElement('div');
        d.textContent = String(str || '');
        return d.innerHTML;
    }

    let isSubmitting = false;

    /**
     * Initialize the booking form handler
     */
    function init() {
        const form = document.getElementById('bookingForm');
        if (!form) {
            console.warn('[Booking] Form not found');
            return;
        }

        form.addEventListener('submit', handleSubmit);
        console.log('[Booking] Handler initialized');
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        if (isSubmitting) return;
        isSubmitting = true;

        // Update button to loading state
        if (submitBtn) {
            submitBtn.innerHTML = `
                <svg class="animate-spin w-5 h-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" style="animation: spin 1s linear infinite; width: 1.25rem; height: 1.25rem; vertical-align: middle;">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity: 0.25;"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style="opacity: 0.75;"></path>
                </svg>
                Processing Booking...
            `;
            submitBtn.disabled = true;
        }

        try {
            const formData = new FormData(form);
            const bookingId = generateBookingId();
            
            const bookingData = {
                bookingId: bookingId,
                studentFirstName: formData.get('student_first_name'),
                studentLastName: formData.get('student_last_name'),
                studentAge: formData.get('student_age'),
                studentGender: formData.get('student_gender'),
                experience: formData.get('experience'),
                program: formData.get('program'),
                parentName: formData.get('parent_name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                referral: formData.get('referral') || 'Not specified',
                preferredDay: formData.get('preferred_day'),
                preferredTime: formData.get('preferred_time'),
                timestamp: new Date().toISOString()
            };

            // Send notifications in parallel
            const results = await Promise.allSettled([
                sendAdminEmail(bookingData),
                sendParentEmail(bookingData),
                sendNtfyNotification(bookingData),
                submitToNetlify(form, formData)
            ]);

            // Log results
            results.forEach((result, index) => {
                const services = ['Admin Email', 'Parent Email', 'NTFY Push', 'Netlify'];
                if (result.status === 'fulfilled') {
                    console.log(`[Booking] ${services[index]} succeeded`);
                } else {
                    console.warn(`[Booking] ${services[index]} failed:`, result.reason);
                }
            });

            // Show success screen
            showSuccessScreen(bookingData);
            
            // Save locally
            saveBookingLocally(bookingData);

        } catch (error) {
            console.error('[Booking] Submission error:', error);
            showErrorMessage('Something went wrong. Please try again or contact us via WhatsApp.');
            
            // Restore button
            if (submitBtn) {
                submitBtn.innerHTML = `
                    <i data-lucide="check-circle" style="width:18px;height:18px;"></i>
                    Complete Booking
                `;
                submitBtn.disabled = false;
                if (window.lucide) lucide.createIcons();
            }
        } finally {
            isSubmitting = false;
        }
    }

    /**
     * Send email alert to admin via EmailJS
     */
    async function sendAdminEmail(data) {
        if (typeof EmailService === 'undefined') {
            console.warn('[Booking] EmailService is not loaded. Admin email skipped.');
            return;
        }

        const bodyText = `A new free trial class has been booked.

Booking Details:
- Booking ID: ${data.bookingId}
- Student Name: ${data.studentFirstName} ${data.studentLastName}
- Age: ${data.studentAge}
- Gender: ${data.studentGender}
- Coding Experience: ${data.experience}
- Program: ${data.program}
- Preferred Schedule: ${capitalize(data.preferredDay)} (${capitalize(data.preferredTime)})

Parent Info:
- Parent Name: ${data.parentName}
- Email: ${data.email}
- Phone: ${data.phone}
- Referral Source: ${data.referral}
- Time of Request: ${new Date(data.timestamp).toLocaleString('en-GB')}
        `;

        return EmailService.send({
            to: CONFIG.ADMIN_EMAIL,
            studentName: 'Admin',
            subject: `[Free Class Booking] New Request - ${data.bookingId}`,
            body: bodyText
        });
    }

    /**
     * Send automatic confirmation email to parent via EmailJS
     */
    async function sendParentEmail(data) {
        if (typeof EmailService === 'undefined') {
            console.warn('[Booking] EmailService is not loaded. Parent email skipped.');
            return;
        }

        const bodyText = `Hi ${data.parentName},

Thank you for booking a free trial class with STEMulus! We have received your booking request for ${data.studentFirstName} ${data.studentLastName}.

Here are the details we received:
- Booking ID: ${data.bookingId}
- Program: ${data.program}
- Preferred Schedule: ${capitalize(data.preferredDay)} (${capitalize(data.preferredTime)})

What happens next?
We are currently reviewing your request. A member of our team will reach out to you within 24 hours at ${data.phone} or via email to confirm the exact Zoom link, date, and coordinate your first trial class.

If you have any questions, you can reply directly to this email or chat with us on WhatsApp: https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent('Hi! Following up on free class booking ID ' + data.bookingId)}.

Warm regards,
STEMulus Kids Tech Team
        `;

        return await EmailService.send({
            to: data.email,
            studentName: data.parentName,
            subject: `Free Class Booking Confirmed - STEMulus Kids Tech`,
            body: bodyText,
            ccParent: 'admin@stemuluskidstech.com'
        });
    }

    /**
     * Send push notification alert via NTFY
     */
    async function sendNtfyNotification(data) {
        const title = `New Trial Booking: ${data.studentFirstName} ${data.studentLastName}`;
        const message = `
Program: ${data.program}
Age: ${data.studentAge}yrs | Exp: ${data.experience}
Schedule: ${capitalize(data.preferredDay)} (${capitalize(data.preferredTime)})

Parent: ${data.parentName}
Email: ${data.email}
Phone: ${data.phone}
Source: ${data.referral}
ID: ${data.bookingId}
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
                    tags: 'gift,student,calendar',
                    click: `https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(`Hi! Following up on booking for ${data.studentFirstName}`)}`
                })
            });

            if (!response.ok) throw new Error('NTFY request failed');
            return { success: true };
        } catch (error) {
            console.warn('[Booking] NTFY notification failed:', error);
            return { success: false, error };
        }
    }

    /**
     * Submit form data to Netlify Forms POST
     */
    async function submitToNetlify(form, formData) {
        const response = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        });
        
        if (!response.ok) throw new Error('Netlify form submission failed');
        return { success: true };
    }

    /**
     * Display a successful booking prompt to the user
     */
    function showSuccessScreen(data) {
        createConfetti();

        const formContainer = document.querySelector('.glass-form') || document.querySelector('.form-card');
        if (!formContainer) return;

        formContainer.innerHTML = `
            <div class="text-center py-8 animate-fadeUp">
                <!-- Success Icon -->
                <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg" style="width: 6rem; height: 6rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; background: linear-gradient(135deg, #4ade80 0%, #059669 100%);">
                    <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 3rem; height: 3rem; color: #ffffff;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>

                <!-- Success Message -->
                <h2 class="text-3xl font-bold font-poppins text-slate-800 mb-3" style="font-size: 1.875rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">
                    [Confirmed] Free Class Booked!
                </h2>
                <p class="text-slate-600 mb-6 max-w-md mx-auto leading-relaxed" style="color: #475569; margin-bottom: 1.5rem; line-height: 1.625;">
                    Thank you, <strong style="color: #0f172a;">${sanitize(data.parentName)}</strong>! We have received your trial booking for <strong style="color: #0f172a;">${sanitize(data.studentFirstName)}</strong>.
                </p>

                <!-- Booking ID -->
                <div class="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-6 py-3 mb-8" style="display: inline-flex; align-items: center; gap: 0.5rem; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 0.75rem 1.5rem; margin-bottom: 2rem;">
                    <span style="font-size: 0.875rem; color: #64748b;">Booking ID:</span>
                    <span style="font-family: monospace; font-weight: 700; color: #2563eb;">${sanitize(data.bookingId)}</span>
                </div>

                <!-- Next Steps -->
                <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 text-left max-w-lg mx-auto" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; margin: 0 auto 2rem; text-align: left; max-width: 32rem;">
                    <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2" style="font-weight: 700; color: #0f172a; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 1.25rem; height: 1.25rem; color: #2563eb;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                        What happens next?
                    </h3>
                    <ol class="space-y-3 text-slate-600 text-sm" style="list-style-type: decimal; padding-left: 1.25rem; color: #475569; font-size: 0.875rem; line-height: 1.5;">
                        <li style="margin-bottom: 0.5rem;">We'll review your preferred schedule and match you with a mentor.</li>
                        <li style="margin-bottom: 0.5rem;">You'll receive a confirmation email and Zoom link at <strong style="color: #2563eb;">${sanitize(data.email)}</strong> within <strong style="color: #0f172a;">24 hours</strong>.</li>
                        <li style="margin-bottom: 0.5rem;">We will reach out to you via phone/WhatsApp at <strong style="color: #0f172a;">${sanitize(data.phone)}</strong> to confirm the exact details.</li>
                    </ol>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center" style="display: flex; flex-direction: row; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <a href="https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(`Hi! I just booked a free class for ${data.studentFirstName}. Booking ID: ${data.bookingId}`)}"
                       target="_blank"
                       class="btn" style="background-color: #25D366; color: #ffffff; padding: 0.75rem 1.5rem; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 0.5rem;">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style="width: 1.25rem; height: 1.25rem; fill: #ffffff;">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Chat on WhatsApp
                    </a>
                    <a href="index.html" class="btn" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; padding: 0.75rem 1.5rem; border-radius: 12px; text-decoration: none; font-weight: 700;">
                        Back to Home
                    </a>
                </div>
            </div>
        `;

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Create falling confetti particles
     */
    function createConfetti() {
        const colors = ['#FF6D00', '#A855F7', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'];
        const container = document.body;

        for (let i = 0; i < 80; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            confetti.style.width = (Math.random() * 10 + 5) + 'px';
            confetti.style.height = (Math.random() * 10 + 5) + 'px';
            container.appendChild(confetti);

            setTimeout(() => confetti.remove(), 4000);
        }
    }

    /**
     * Show custom error toast message
     */
    function showErrorMessage(message) {
        const errorToast = document.createElement('div');
        errorToast.style.cssText = 'position: fixed; bottom: 1rem; right: 1rem; left: 1rem; background-color: #ef4444; color: #ffffff; padding: 1rem; border-radius: 0.75rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); z-index: 9999; display: flex; align-items: flex-start; gap: 0.75rem;';
        errorToast.innerHTML = `
            <svg style="width: 1.5rem; height: 1.5rem; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div style="flex: 1;">
                <p style="font-weight: 600;">Booking Error</p>
                <p style="font-size: 0.875rem; opacity: 0.9;">${message}</p>
            </div>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer;">
                <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        `;
        document.body.appendChild(errorToast);

        setTimeout(() => errorToast.remove(), 8000);
    }

    /**
     * Generate unique booking ID
     */
    function generateBookingId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `BK-${timestamp.slice(-4)}-${random}`;
    }

    /**
     * Save booking locally as fallback backup
     */
    function saveBookingLocally(data) {
        try {
            const bookings = JSON.parse(localStorage.getItem('stemulus_bookings') || '[]');
            bookings.push(data);
            localStorage.setItem('stemulus_bookings', JSON.stringify(bookings));
            console.log('[Booking] Saved locally successfully');

            // Sync with central database DashboardEngine if it exists
            if (typeof DashboardEngine !== 'undefined') {
                const bData = {
                    studentFirstName: data.studentFirstName,
                    studentLastName: data.studentLastName,
                    studentAge: data.studentAge,
                    studentGender: data.studentGender,
                    experience: data.experience,
                    program: data.program,
                    parentName: data.parentName,
                    email: data.email,
                    phone: data.phone,
                    isFreeTrial: true,
                    preferredDay: data.preferredDay,
                    preferredTime: data.preferredTime
                };
                DashboardEngine.addEnrollment(bData);
                console.log('[Booking] Synced with DashboardEngine');
            }
        } catch (e) {
            console.warn('[Booking] Could not save locally:', e);
        }
    }

    /**
     * Utility helpers
     */
    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ==================== PUBLIC API ====================
    return {
        init,
        getLocalBookings: () => JSON.parse(localStorage.getItem('stemulus_bookings') || '[]')
    };

})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', BookingHandler.init);
