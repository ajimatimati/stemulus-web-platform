/**
 * STEMulus Enrollment Handler
 * Handles form submission, email notifications via EmailJS, and phone notifications via NTFY
 */

const EnrollmentHandler = (function() {
    
    // ============ CONFIGURATION ============
    const CONFIG = {
        // EmailJS settings (uses email-service.js config)
        EMAILJS_PUBLIC_KEY: 'T5jVjnlOABDwBNXbt', 
        EMAILJS_SERVICE_ID: 'service_7v7j9u5',
        EMAILJS_TEMPLATE_ID: 'template_duun9x7',

        // NTFY Push Notification
        NTFY_TOPIC: 'stemulus-enrollments-admin2026',
        
        // Admin contact for notifications
        ADMIN_EMAIL: 'admin@stemuluskidstech.com',
        ADMIN_WHATSAPP: '+2347052466716'
    };
    // =======================================

    let isSubmitting = false;
    let originalBtnHTML = ''; // Capture once to avoid ripple accumulation

    /**
     * Initialize the enrollment form handler
     */
    function init() {
        const form = document.getElementById('enrollForm');
        if (!form) {
            console.warn('[Enrollment] Form not found');
            return;
        }

        // Capture original button state AFTER Lucide has processed icons
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            // Delay capture so Lucide has time to convert <i> tags to <svg>
            setTimeout(() => {
                originalBtnHTML = submitBtn.innerHTML;
            }, 500);
        }

        // Override default form submission
        form.addEventListener('submit', handleSubmit);
        
        console.log('[Enrollment] Handler initialized');
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        
        // Check for validation errors from form-validation.js or native validation
        // form-validation.js adds .is-invalid class to invalid inputs
        const invalidInputs = form.querySelectorAll('.is-invalid');
        if (invalidInputs.length > 0) {
            // Validation failed, simplify let form-validation.js handle the UI
            // We just stop here so we don't submit invalid data
            console.log('[Enrollment] Submission blocked: Form has validation errors');
            // Shake the button to indicate error?
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn && window.MicroInteractions) window.MicroInteractions.shake(submitBtn);
            return;
        }

        if (isSubmitting) return;
        isSubmitting = true;

        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Update button to loading state
        if (submitBtn) {
            submitBtn.innerHTML = `
                <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Processing...
            `;
            submitBtn.disabled = true;
        }

        try {
            // Collect form data
            const formData = new FormData(form);
            
            // Parse children data from hidden field
            let childrenArray = [];
            try {
                const childrenDataStr = formData.get('children_data') || '[]';
                childrenArray = JSON.parse(childrenDataStr);
            } catch (e) {
                console.warn('[Enrollment] Could not parse children data:', e);
            }
            
            // If no children in array, create one from form fields
            if (childrenArray.length === 0) {
                childrenArray.push({
                    firstName: formData.get('student_first_name') || '',
                    lastName: formData.get('student_last_name') || '',
                    age: formData.get('student_age') || '',
                    gender: formData.get('student_gender') || '',
                    experience: formData.get('experience') || '',
                    program: formData.get('program') || ''
                });
            }
            
            const enrollmentData = {
                // Primary child info (for backwards compatibility)
                studentFirstName: childrenArray[0]?.firstName || formData.get('student_first_name'),
                studentLastName: childrenArray[0]?.lastName || formData.get('student_last_name'),
                studentAge: childrenArray[0]?.age || formData.get('student_age'),
                studentGender: childrenArray[0]?.gender || formData.get('student_gender'),
                experience: childrenArray[0]?.experience || formData.get('experience'),
                program: childrenArray[0]?.program || formData.get('program'),
                // Parent info
                parentName: formData.get('parent_name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                referral: formData.get('referral') || 'Not specified',
                // All children data
                children: childrenArray,
                totalChildren: childrenArray.length,
                // Metadata
                timestamp: new Date().toISOString(),
                enrollmentId: generateEnrollmentId()
            };

            // Send notifications in parallel
            const results = await Promise.allSettled([
                sendEmailNotification(enrollmentData),
                sendPhoneNotification(enrollmentData),
                submitToNetlify(form, formData)
            ]);

            // Log results
            results.forEach((result, index) => {
                const services = ['Email', 'Phone Push', 'Netlify'];
                if (result.status === 'fulfilled') {
                    console.log(`[Enrollment] ${services[index]} notification sent`);
                } else {
                    console.warn(`[Enrollment] ${services[index]} notification failed:`, result.reason);
                }
            });

            // Show success screen
            showSuccessScreen(enrollmentData);
            
            // Save to localStorage
            saveEnrollmentLocally(enrollmentData);

        } catch (error) {
            console.error('[Enrollment] Submission error:', error);
            showErrorMessage('Something went wrong. Please try again or contact us via WhatsApp.');
            
            // Restore button — plain text, no SVGs
            if (submitBtn) {
                submitBtn.textContent = 'Complete Enrollment';
                submitBtn.disabled = false;
            }
        } finally {
            isSubmitting = false;
        }
    }

    /**
     * Send email notification via EmailJS
     */
    async function sendEmailNotification(data) {
        if (!CONFIG.EMAILJS_PUBLIC_KEY || CONFIG.EMAILJS_PUBLIC_KEY === 'Pending_User_Input') {
             // Silently skip if not configured to avoid error spam, but log it
            console.log('[Enrollment] EmailJS Public Key missing. Email notification skipped.');
            return { skipped: true };
        }

        // Load EmailJS if not present
        if (typeof emailjs === 'undefined') {
            await loadScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js');
            emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
        }

        const templateParams = {
            to_email: CONFIG.ADMIN_EMAIL,
            enrollment_id: data.enrollmentId,
            student_first_name: data.studentFirstName,
            student_last_name: data.studentLastName,
            student_age: data.studentAge,
            program: data.program,
            parent_name: data.parentName,
            email: data.email,
            phone: data.phone,
            referral: data.referral,
            timestamp: new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })
        };

        // Send to main admin email
        const sendToAdmin = emailjs.send(
            CONFIG.EMAILJS_SERVICE_ID,
            CONFIG.EMAILJS_TEMPLATE_ID,
            templateParams
        );

        // Always send a copy to stemulusclubs@gmail.com as well
        const copyParams = { ...templateParams, to_email: 'stemulusclubs@gmail.com' };
        const sendToCopy = emailjs.send(
            CONFIG.EMAILJS_SERVICE_ID,
            CONFIG.EMAILJS_TEMPLATE_ID,
            copyParams
        );

        return await Promise.all([sendToAdmin, sendToCopy]);
    }

    /**
     * Send push notification to phone via NTFY (free service)
     * No signup needed! Just install ntfy app and subscribe to topic
     */
    async function sendPhoneNotification(data) {
        const title = data.totalChildren > 1 
            ? `New Enrollment: ${data.totalChildren} Children` 
            : `New Enrollment: ${data.studentFirstName} ${data.studentLastName}`;
        
        // Build children summary
        let childrenSummary = '';
        if (data.children && data.children.length > 0) {
            childrenSummary = data.children.map((child, i) => 
                `${i + 1}. ${child.firstName} ${child.lastName} (${child.age}yrs) - ${child.program}`
            ).join('\n');
        } else {
            childrenSummary = `1. ${data.studentFirstName} ${data.studentLastName} (${data.studentAge}yrs) - ${data.program}`;
        }
        
        const message = `
Children:
${childrenSummary}

Parent: ${data.parentName}
Email: ${data.email}
Phone: ${data.phone}
Source: ${data.referral}
Time: ${new Date().toLocaleTimeString()}
        `.trim();

        try {
            const response = await fetch(`https://ntfy.sh/${CONFIG.NTFY_TOPIC}`, {
                method: 'POST',
                headers: {
                    'Title': title,
                    'Priority': 'high',
                    'Tags': 'tada,student',
                    'Click': `https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(`Hi! Following up on enrollment for ${data.studentFirstName}`)}`
                },
                body: message
            });
            
            if (!response.ok) throw new Error('NTFY request failed');
            return { success: true };
        } catch (error) {
            console.warn('[Enrollment] Phone notification failed:', error);
            // Don't throw here, just return failure so Promise.allSettled treats other tasks as fine
            return { success: false, error };
        }
    }

    /**
     * Submit form to Netlify Forms
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
     * Show success screen with confetti
     */
    function showSuccessScreen(data) {
        // Create confetti
        createConfetti();

        // Replace form with success message
        const formContainer = document.querySelector('.glass-form');
        formContainer.innerHTML = `
            <div class="text-center py-8 animate-fadeIn">
                <!-- Success Icon -->
                <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30">
                    <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>

                <!-- Success Message -->
                <h2 class="text-3xl font-bold font-poppins text-white mb-3">
                    ✅ Enrollment Submitted!
                </h2>
                <p class="text-white/70 mb-6 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong class="text-white">${data.parentName}</strong>! We've received your enrollment.
                </p>

                <!-- Enrollment ID -->
                <div class="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-6 py-3 mb-8">
                    <span class="text-sm text-white/55">Enrollment ID:</span>
                    <span class="font-mono font-bold text-orange-400">${data.enrollmentId}</span>
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
                            <span>We'll review your enrollment within <strong class="text-white">24 hours</strong></span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="w-6 h-6 shrink-0 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                            <span>You'll receive a confirmation email at <strong class="text-orange-400">${data.email}</strong></span>
                        </li>
                    </ol>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(`Hi! I just enrolled my child ${data.studentFirstName}. Enrollment ID: ${data.enrollmentId}`)}"
                       target="_blank"
                       class="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-green-500/30 transition-all">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Chat on WhatsApp
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

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Create confetti animation
     */
    function createConfetti() {
        const colors = ['#FF6D00', '#A855F7', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'];
        const container = document.body;

        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            confetti.style.width = (Math.random() * 10 + 5) + 'px';
            confetti.style.height = (Math.random() * 10 + 5) + 'px';
            container.appendChild(confetti);

            // Remove after animation
            setTimeout(() => confetti.remove(), 4000);
        }
    }

    /**
     * Show error message
     */
    function showErrorMessage(message) {
        const errorToast = document.createElement('div');
        errorToast.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-start gap-3 animate-slideUp';
        errorToast.innerHTML = `
            <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
                <p class="font-semibold">Submission Error</p>
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
     * Generate unique enrollment ID
     */
    function generateEnrollmentId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `STM-${timestamp.slice(-4)}-${random}`;
    }

    /**
     * Save enrollment locally as backup
     */
    function saveEnrollmentLocally(data) {
        try {
            const enrollments = JSON.parse(localStorage.getItem('stemulus_enrollments') || '[]');
            enrollments.push(data);
            localStorage.setItem('stemulus_enrollments', JSON.stringify(enrollments));
            console.log('[Enrollment] Saved locally as backup');

            // Sync with central DashboardEngine database
            if (typeof DashboardEngine !== 'undefined') {
                const enrData = {
                    studentFirstName: data.studentFirstName,
                    studentLastName: data.studentLastName,
                    studentAge: data.studentAge,
                    studentGender: data.studentGender,
                    experience: data.experience,
                    program: data.program,
                    parentName: data.parentName,
                    email: data.email,
                    phone: data.phone
                };
                DashboardEngine.addEnrollment(enrData);
                console.log('[Enrollment] Synced with DashboardEngine');
            }
        } catch (e) {
            console.warn('[Enrollment] Could not save locally:', e);
        }
    }

    /**
     * Load external script dynamically
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // ==================== PUBLIC API ====================
    return {
        init,
        getLocalEnrollments: () => JSON.parse(localStorage.getItem('stemulus_enrollments') || '[]')
    };

})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', EnrollmentHandler.init);
