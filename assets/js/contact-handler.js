/**
 * STEMulus Contact Form Handler
 * Handles AJAX form submission to Netlify and push notifications via NTFY
 */

(function() {
    'use strict';

    const CONFIG = {
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

            // Send AJAX to Netlify and NTFY in parallel
            const results = await Promise.allSettled([
                sendNTFYNotification(messageData),
                submitToNetlify(form, formData)
            ]);

            // Log results
            results.forEach((result, index) => {
                const services = ['NTFY Push', 'Netlify Forms'];
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
            const response = await fetch(`https://ntfy.sh/${CONFIG.NTFY_TOPIC}`, {
                method: 'POST',
                headers: {
                    'Title': title,
                    'Priority': 'high',
                    'Tags': 'speech_balloon,envelope',
                    'Click': mailtoLink
                },
                body: message
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

        if (!response.ok) throw new Error('Netlify form submission failed');
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
                    <h3 class="text-2xl font-bold font-nunito text-slate-800 mb-2">Message Received! 🚀</h3>
                    <p class="text-slate-600 mb-8">Thanks for reaching out, ${data.firstName}. We have received your inquiry and our team will get back to you at <strong>${data.email}</strong> within 2 hours.</p>
                    <a href="index.html" class="inline-block bg-orange-600 text-white font-bold py-3 px-8 rounded-xl hover:brightness-110 shadow-lg hover:shadow-orange-500/20 transition-all">Return Home</a>
                </div>
            `;
        }, 400);
    }
})();
