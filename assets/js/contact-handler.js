/**
 * STEMulus Contact Form Handler
 * Handles AJAX form submission to Netlify and push notifications via NTFY
 */

(function() {
    'use strict';

    const CONFIG = {
        EMAIL_ENDPOINT: '/.netlify/functions/send-email',
        NTFY_TOPIC: 'stemulus-messages-admin2026'
    };

    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('contact-form');
        if (!form) return;

        form.addEventListener('submit', handleFormSubmit);
    });

    async function handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn ? submitBtn.innerHTML : 'Send Message';

        // Show loading spinner
        if (submitBtn) {
            submitBtn.innerHTML = `
                <svg class="animate-spin w-5 h-5 text-white mr-2 inline-block align-middle" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Sending...
            `;
            submitBtn.disabled = true;
        }

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const messageData = {
                firstName: data['first-name'],
                lastName: data['last-name'],
                email: data.email,
                subject: data.subject,
                message: data.message,
                timestamp: new Date().toISOString()
            };

            // Send all notifications in parallel
            const results = await Promise.allSettled([
                sendEmailNotification(messageData),
                sendNTFYNotification(messageData),
                submitToNetlify(form, formData),
                (typeof WhatsAppNotify !== 'undefined'
                    ? WhatsAppNotify.sendContactNotification({
                        parentName: `${messageData.firstName} ${messageData.lastName}`,
                        email: messageData.email,
                        phone: '2347052466716',
                        subject: messageData.subject,
                        message: messageData.message
                    })
                    : Promise.resolve({ success: false, skipped: 'WhatsAppNotify not loaded' }))
            ]);

            // Log results
            results.forEach((result, index) => {
                const services = ['Email (Resend)', 'NTFY Push', 'Netlify Forms', 'WhatsApp Notify'];
                if (result.status === 'fulfilled') {
                    console.log(`[ContactForm] ${services[index]} success`);
                } else {
                    console.warn(`[ContactForm] ${services[index]} failed:`, result.reason);
                }
            });

            // Show success screen
            showSuccessScreen(form, messageData);

        } catch (error) {
            console.error('[ContactForm] Submission error:', error);
            alert('Something went wrong. Please try again or reach out on WhatsApp.');
            
            // Restore button
            if (submitBtn) {
                submitBtn.innerHTML = originalBtnHTML;
                submitBtn.disabled = false;
            }
        }
    }

    async function sendEmailNotification(data) {
        const resp = await fetch(CONFIG.EMAIL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'contact',
                data: {
                    firstName: data.firstName,
                    lastName:  data.lastName,
                    email:     data.email,
                    subject:   data.subject,
                    message:   data.message,
                }
            })
        });
        const json = await resp.json();
        if (!json.ok) console.warn('[ContactForm] Email send issue:', json);
        return json;
    }

    async function sendNTFYNotification(data) {
        const title = `New Message: ${data.firstName} ${data.lastName}`;
        const message = `
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

Time: ${new Date().toLocaleString()}
        `.trim();

        const mailtoLink = `mailto:${data.email}?subject=${encodeURIComponent('Re: ' + data.subject)}`;

        try {
            const response = await fetch('/.netlify/functions/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: 'contact',
                    title,
                    message,
                    priority: 'high',
                    tags: 'speech_balloon,envelope',
                    click: mailtoLink
                })
            });

            if (!response.ok) throw new Error('NTFY post failed');
            return { success: true };
        } catch (error) {
            console.warn('[ContactForm] NTFY failed:', error);
            return { success: false, error };
        }
    }

    async function submitToNetlify(form, formData) {
        // Netlify forms require the form-name parameter
        formData.set('form-name', 'contact');
        
        // Extract method and action
        const method = form.getAttribute('method') || 'POST';
        const action = form.getAttribute('action') || '/';

        // URL encode the form data
        const body = new URLSearchParams(formData).toString();

        const response = await fetch(action, {
            method: method,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body
        });

        // Treat only server-side errors as failures. Netlify Forms returns 3xx
        // redirects on success, and fetch follows them to a 200 homepage — both
        // are acceptable outcomes, so only throw on 5xx.
        if (response.status >= 500) throw new Error('Netlify form submission failed');
        return { success: true };
    }

    function showSuccessScreen(form, data) {
        // Animate success screen replacement
        form.style.opacity = '0';
        form.style.transition = 'opacity 0.4s ease';

        setTimeout(() => {
            form.innerHTML = `
                <div class="text-center py-12 animate-fadeIn">
                    <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold font-nunito text-slate-800 mb-2">Message Received! <span data-icon-3d="rocket" data-icon-size="24"></span></h3>
                    <p class="text-slate-600 mb-8">Thanks for reaching out, ${data.firstName}. We have received your inquiry and our team will get back to you at <strong>${data.email}</strong> within 2 hours.</p>
                    <a href="index.html" class="inline-block bg-orange-600 text-white font-bold py-3 px-8 rounded-xl hover:brightness-110 shadow-lg hover:shadow-orange-500/20 transition-all">Return Home</a>
                </div>
            `;
        }, 400);
    }
})();
