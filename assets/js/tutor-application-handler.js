/**
 * STEMulus Tutor Application Handler
 * Handles form submission, Netlify forms backup, and phone notifications via NTFY
 */

const TutorApplicationHandler = (function() {
    
    // ============ CONFIGURATION ============
    const CONFIG = {
        // NTFY Push Notification
        NTFY_TOPIC: 'stm-ttr-nb3r5y6jd1cx8ws',
        
        // Admin contact for notifications
        ADMIN_WHATSAPP: '+2347052466716'
    };
    // =======================================

    function sanitize(str) {
        const d = document.createElement('div');
        d.textContent = String(str || '');
        return d.innerHTML;
    }

    let isSubmitting = false;
    let originalBtnHTML = '';

    /**
     * Initialize the application form handler
     */
    function init() {
        const form = document.getElementById('tutorApplyForm');
        if (!form) {
            console.warn('[TutorApp] Application form not found');
            return;
        }

        // Capture original button state AFTER Lucide has processed icons
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            setTimeout(() => {
                originalBtnHTML = submitBtn.innerHTML;
            }, 500);
        }

        // Override default form submission
        form.addEventListener('submit', handleSubmit);
        
        console.log('[TutorApp] Handler initialized');
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        
        if (isSubmitting) return;
        isSubmitting = true;

        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Update button to loading state
        if (submitBtn) {
            submitBtn.innerHTML = `
                <svg class="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Processing Application...
            `;
            submitBtn.disabled = true;
        }

        try {
            // Collect form data
            const formData = new FormData(form);
            
            // Collect expertise checkboxes
            const checkedExpertise = [];
            form.querySelectorAll('input[name="expertise"]:checked').forEach(cb => {
                checkedExpertise.push(cb.value);
            });

            const applicationData = {
                fullname: formData.get('fullname'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                portfolio: formData.get('portfolio'),
                expertise: checkedExpertise,
                experience: formData.get('experience'),
                motivation: formData.get('motivation'),
                timestamp: new Date().toISOString(),
                applicationId: generateApplicationId()
            };

            // Send notifications in parallel
            const results = await Promise.allSettled([
                sendPhoneNotification(applicationData),
                submitToNetlify(form, formData)
            ]);

            // Log results
            results.forEach((result, index) => {
                const services = ['Phone Push (ntfy)', 'Netlify Forms'];
                if (result.status === 'fulfilled') {
                    console.log(`[TutorApp] ${services[index]} notification sent`);
                } else {
                    console.warn(`[TutorApp] ${services[index]} notification failed:`, result.reason);
                }
            });

            // Show success screen
            showSuccessScreen(applicationData);
            
            // Save locally as backup
            saveApplicationLocally(applicationData);

        } catch (error) {
            console.error('[TutorApp] Submission error:', error);
            showErrorMessage('Something went wrong. Please try again or reach out on WhatsApp.');
            
            // Restore button
            if (submitBtn) {
                submitBtn.innerHTML = originalBtnHTML || 'Submit Application';
                submitBtn.disabled = false;
            }
        } finally {
            isSubmitting = false;
        }
    }

    /**
     * Send push notification to phone via NTFY
     */
    async function sendPhoneNotification(data) {
        const title = `New Mentor Application: ${data.fullname}`;
        
        const message = `
Name: ${data.fullname}
Email: ${data.email}
Phone: ${data.phone}
Portfolio: ${data.portfolio}
Expertise: ${data.expertise.join(', ')}
Experience: ${data.experience}

Motivation:
${data.motivation}

Time: ${new Date().toLocaleString()}
App ID: ${data.applicationId}
        `.trim();

        // Create a pre-filled WhatsApp follow up message
        const waText = `Hi ${data.fullname}! Thanks for applying to be a mentor at STEMulus. We loved your profile and would love to schedule a short interview/demo session with you. Are you available this week?`;

        try {
            const response = await fetch('/.netlify/functions/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: 'tutor',
                    title,
                    message,
                    priority: 'high',
                    tags: 'mortar_board,sparkles',
                    click: `https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(waText)}`
                })
            });

            if (!response.ok) throw new Error('NTFY request failed');
            return { success: true };
        } catch (error) {
            console.warn('[TutorApp] Phone notification failed:', error);
            return { success: false, error };
        }
    }

    /**
     * Submit form to Netlify Forms
     */
    async function submitToNetlify(form, formData) {
        // Append Netlify form name to request body
        formData.set('form-name', 'tutor-application');
        const response = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        });
        
        if (!response.ok) throw new Error('Netlify form submission failed');
        return { success: true };
    }

    /**
     * Show success screen with confetti
     */
    function showSuccessScreen(data) {
        createConfetti();

        // Find the form container
        const container = document.getElementById('apply');
        if (!container) return;

        // An admin WhatsApp chat link
        const waText = `Hi STEMulus! I just submitted my mentor application. My Application ID is ${data.applicationId}.`;
        const waLink = `https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(waText)}`;

        container.innerHTML = `
            <div class="text-center py-8 animate-fadeIn">
                <!-- Success Icon -->
                <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30">
                    <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>

                <!-- Success Message -->
                <h2 class="text-3xl font-bold font-poppins text-white mb-3">
                    [Verified] Application Received!
                </h2>
                <p class="text-white/70 mb-6 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong class="text-white">${sanitize(data.fullname)}</strong>! We've successfully received your mentor application.
                </p>

                <!-- Application ID -->
                <div class="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-6 py-3 mb-8">
                    <span class="text-sm text-white/55">Application ID:</span>
                    <span class="font-mono font-bold text-orange-400">${sanitize(data.applicationId)}</span>
                </div>

                <!-- Next Steps -->
                <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left max-w-lg mx-auto">
                    <h3 class="font-bold text-white mb-4 flex items-center gap-2">
                        <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                        What happens next?
                    </h3>
                    <ol class="space-y-3 text-white/70 text-sm">
                        <li class="flex items-start gap-3">
                            <span class="w-6 h-6 shrink-0 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                            <span>We'll review your background and portfolio within <strong class="text-white">48 hours</strong></span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="w-6 h-6 shrink-0 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                            <span>If selected, you'll receive an invitation for a short <strong class="text-orange-400">Technical & Demo Session</strong></span>
                        </li>
                    </ol>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="${waLink}"
                       target="_blank"
                       class="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-green-500/30 transition-all">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Follow up on WhatsApp
                    </a>
                    <a href="index.html"
                       class="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold px-6 py-3 rounded-full transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                        </svg>
                        Back to Home
                    </a>
                </div>
            </div>
        `;

        // Smooth scroll to application header
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Create confetti animation
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
            confetti.style.width = (Math.random() * 8 + 4) + 'px';
            confetti.style.height = (Math.random() * 8 + 4) + 'px';
            container.appendChild(confetti);

            setTimeout(() => confetti.remove(), 4000);
        }
    }

    /**
     * Show temporary error banner
     */
    function showErrorMessage(message) {
        const errorToast = document.createElement('div');
        errorToast.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-start gap-3 animate-slideUp';
        errorToast.innerHTML = `
            <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
                <p class="font-semibold">Application Error</p>
                <p class="text-sm text-red-100">${message}</p>
            </div>
            <button onclick="this.parentElement.remove()" class="ml-auto shrink-0 text-red-100 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        `;
        document.body.appendChild(errorToast);

        setTimeout(() => errorToast.remove(), 8000);
    }

    /**
     * Generate unique application ID
     */
    function generateApplicationId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `TTR-${timestamp.slice(-4)}-${random}`;
    }

    /**
     * Save mentor application locally as backup
     */
    function saveApplicationLocally(data) {
        try {
            const applications = JSON.parse(localStorage.getItem('stemulus_mentor_applications') || '[]');
            applications.push(data);
            localStorage.setItem('stemulus_mentor_applications', JSON.stringify(applications));
            console.log('[TutorApp] Saved locally as backup');
        } catch (e) {
            console.warn('[TutorApp] Could not save locally:', e);
        }
    }

    // ==================== PUBLIC API ====================
    return {
        init,
        getLocalApplications: () => JSON.parse(localStorage.getItem('stemulus_mentor_applications') || '[]')
    };

})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', TutorApplicationHandler.init);
