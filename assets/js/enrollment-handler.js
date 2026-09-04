/**
 * STEMulus Enrollment Handler
 * Handles form submission, email notifications via EmailJS, and phone notifications via NTFY
 */

const EnrollmentHandler = (function() {
    
    // ============ CONFIGURATION ============
    const CONFIG = {
        EMAIL_ENDPOINT: '/.netlify/functions/send-email',

        NTFY_TOPIC: 'stm-enr-lx7k9w2mq8vp4tz',

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
                    birthday: formData.get('student_birthday') || '',
                    gender: formData.get('student_gender') || '',
                    email: formData.get('student_email') || '',
                    experience: formData.get('experience') || '',
                    program: formData.get('program') || ''
                });
            }

            // Capture any unsaved child still in the form fields (e.g. child 2 that was
            // never clicked "Add Another Child" for, so it never entered childrenArray).
            var lastFirst = formData.get('student_first_name') || '';
            var lastLast = formData.get('student_last_name') || '';
            if (lastFirst.trim()) {
                var alreadySaved = childrenArray.some(function(c){
                    return c.firstName === lastFirst.trim() && c.lastName === lastLast.trim();
                });
                if (!alreadySaved) {
                    childrenArray.push({
                        firstName: lastFirst.trim(),
                        lastName: lastLast.trim(),
                        age: formData.get('student_age') || '',
                        birthday: formData.get('student_birthday') || '',
                        gender: formData.get('student_gender') || '',
                        email: formData.get('student_email') || '',
                        experience: formData.get('experience') || '',
                        program: formData.get('program') || ''
                    });
                }
            }
            
            const enrollmentData = {
                // Primary child info (for backwards compatibility)
                studentFirstName: childrenArray[0]?.firstName || formData.get('student_first_name'),
                studentLastName: childrenArray[0]?.lastName || formData.get('student_last_name'),
                studentAge: childrenArray[0]?.age || formData.get('student_age'),
                studentGender: childrenArray[0]?.gender || formData.get('student_gender'),
                experience: childrenArray[0]?.experience || formData.get('experience'),
                program: childrenArray[0]?.program || formData.get('program'),
                studentBirthday: childrenArray[0]?.birthday || formData.get('student_birthday') || '',
                studentEmail: childrenArray[0]?.email || formData.get('student_email') || '',
                // Parent info
                parentName: formData.get('parent_name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                referral: formData.get('referral') || 'Not specified',
                // Father & Mother detailed info
                fatherName: formData.get('father_name') || '',
                fatherPhone: formData.get('father_phone') || '',
                motherName: formData.get('mother_name') || '',
                motherPhone: formData.get('mother_phone') || '',
                // All children data
                children: childrenArray,
                totalChildren: childrenArray.length,
                // Metadata
                timestamp: new Date().toISOString(),
                enrollmentId: generateEnrollmentId()
            };

            // Save enrollment data immediately so it's never lost even if
            // notifications or the success screen throw an error.
            saveEnrollmentLocally(enrollmentData);

            // Send notifications in parallel
            const results = await Promise.allSettled([
                sendEmailNotification(enrollmentData),
                sendPhoneNotification(enrollmentData),
                submitToNetlify(form, formData),
                (typeof WhatsAppNotify !== 'undefined'
                    ? WhatsAppNotify.sendEnrollmentNotification({
                        parentName: enrollmentData.parentName,
                        studentName: enrollmentData.children[0] ? `${enrollmentData.children[0].firstName} ${enrollmentData.children[0].lastName}` : 'Student',
                        email: enrollmentData.email,
                        phone: enrollmentData.phone,
                        enrollmentId: enrollmentData.enrollmentId,
                        program: enrollmentData.children[0] ? enrollmentData.children[0].program : 'STEM Program',
                        age: enrollmentData.children[0] ? enrollmentData.children[0].age : ''
                    })
                    : Promise.resolve({ success: false, skipped: 'WhatsAppNotify not loaded' }))
            ]);

            // Log results
            results.forEach((result, index) => {
                const services = ['Email', 'Phone Push', 'Netlify', 'WhatsApp Notify'];
                if (result.status === 'fulfilled') {
                    console.log(`[Enrollment] ${services[index]} notification sent`);
                } else {
                    console.warn(`[Enrollment] ${services[index]} notification failed:`, result.reason);
                }
            });

            // Show success screen
            showSuccessScreen(enrollmentData);

        } catch (error) {
            console.error('[Enrollment] Submission error:', error);
            showErrorMessage('Something went wrong. Please try again or contact us via WhatsApp.');
            
            // Restore button to original state
            if (submitBtn) {
                if (originalBtnHTML) {
                    submitBtn.innerHTML = originalBtnHTML;
                } else {
                    submitBtn.textContent = 'Complete Enrollment';
                }
                submitBtn.disabled = false;
            }
        } finally {
            isSubmitting = false;
        }
    }

    /**
     * Send enrollment email notifications via Netlify Function (Resend API).
     * Sends admin alert + parent confirmation in a single request.
     */
    async function sendEmailNotification(data) {
        const resp = await fetch(CONFIG.EMAIL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'enrollment',
                data: {
                    enrollmentId:      data.enrollmentId,
                    studentFirstName:  data.studentFirstName,
                    studentLastName:   data.studentLastName,
                    studentAge:        data.studentAge,
                    program:           data.program,
                    parentName:        data.parentName,
                    email:             data.email,
                    phone:             data.phone,
                    referral:          data.referral,
                    children:          data.children || [],
                }
            })
        });
        // Guard against non-JSON responses (e.g. HTML error pages) so the
        // function never throws and always returns gracefully.
        let json;
        try {
            json = await resp.json();
        } catch (_) {
            json = { ok: false, error: 'Non-JSON response from email endpoint' };
        }
        if (!json.ok) console.warn('[Enrollment] Email partial failure:', json.results || json.error);
        return json;
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
            const response = await fetch('/.netlify/functions/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: 'enroll',
                    title,
                    message,
                    priority: 'high',
                    tags: 'tada,student',
                    click: `https://wa.me/${CONFIG.ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(`Hi! Following up on enrollment for ${data.studentFirstName}`)}`
                })
            });
            if (!response.ok) throw new Error('Notify request failed');
            return { success: true };
        } catch (error) {
            console.warn('[Enrollment] Phone notification failed:', error);
            return { success: false, error };
        }
    }

    /**
     * Submit form to Netlify Forms
     */
    async function submitToNetlify(form, formData) {
        formData.set('form-name', 'enrollment'); // explicit guard in case hidden input is absent
        const response = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        });
        
        // Treat only server-side errors as failures. Netlify Forms returns 3xx
        // redirects on success, and fetch follows them to a 200 homepage — both
        // are acceptable outcomes, so only throw on 5xx.
        if (response.status >= 500) throw new Error('Netlify form submission failed');
        return { success: true };
    }

    /**
     * Show success screen with confetti
     */
    function showSuccessScreen(data) {
        // Create confetti
        createConfetti();

        // Replace form with success message
        const formContainer = document.querySelector('.form-card');
        if (!formContainer) return; // guard: don't throw if selector fails
        const successHTML = `<div style="text-align:center;padding:2rem 1rem;">
  <div style="width:80px;height:80px;margin:0 auto 1.5rem;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  </div>
  <h2 style="font-family:'Fredoka',sans-serif;font-size:1.8rem;font-weight:700;color:#2d2d4e;margin:0 0 0.75rem;">Enrollment Submitted!</h2>
  <p style="font-family:'Inter',sans-serif;color:#6b6b8a;margin:0 0 1.5rem;line-height:1.6;max-width:400px;margin-left:auto;margin-right:auto;">
    Thank you! We'll review your application and contact you within 24 hours to schedule your <strong>FREE trial class</strong>.
  </p>
  <p style="font-family:'Inter',sans-serif;font-size:0.875rem;color:#6b6b8a;margin:0 0 2rem;">
    A confirmation email has been sent to your inbox.
  </p>
</div>`;
        formContainer.innerHTML = successHTML;

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

            // Secondary save for admin portal to read
            try {
                var pending = JSON.parse(localStorage.getItem('stemulus_pending_enrollments') || '[]');
                pending.push({
                    id: data.enrollmentId || ('enr-'+Date.now()),
                    studentFirstName: data.studentFirstName,
                    studentLastName: data.studentLastName,
                    studentAge: data.studentAge,
                    studentGender: data.studentGender,
                    experience: data.experience,
                    program: data.program,
                    parentName: data.parentName,
                    email: data.email,
                    phone: data.phone,
                    children: data.children || [],
                    timestamp: new Date().toISOString(),
                    source: 'public_form',
                    status: 'pending'
                });
                localStorage.setItem('stemulus_pending_enrollments', JSON.stringify(pending));
            } catch(pendErr) { console.warn('pending save failed', pendErr); }

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
