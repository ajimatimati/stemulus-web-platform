/**
 * STEMulus Submission Handler
 * Connects forms to Supabase Backend
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. Enrollment Form Handler
    // ==========================================
    const enrollForm = document.getElementById('enrollForm');
    if (enrollForm) {
        enrollForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = enrollForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            try {
                // Show loading state
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Processing...';
                if (window.lucide) window.lucide.createIcons();

                // Gather Data
                const formData = new FormData(enrollForm);
                const data = Object.fromEntries(formData.entries());
                
                // Parse children data if present
                let childrenData = [];
                try {
                    if (data.children_data) {
                        childrenData = JSON.parse(data.children_data);
                    }
                } catch (err) {
                    console.error('Error parsing children data', err);
                }

                // Prepare Payload for Supabase
                const payload = {
                    student_first_name: data.student_first_name,
                    student_last_name: data.student_last_name,
                    student_age: parseInt(data.student_age) || 0,
                    student_gender: data.student_gender,
                    parent_name: data.parent_name,
                    email: data.email,
                    phone: data.phone,
                    program_interest: data.program,
                    experience_level: data.experience,
                    referral_source: data.referral,
                    status: 'pending',
                    children_data: childrenData, // Store full array
                    created_at: new Date().toISOString()
                };

                // Send to Supabase
                if (!window.supabase) throw new Error('Supabase client not initialized');

                const { error } = await window.supabase
                    .from('enrollments')
                    .insert([payload]);

                if (error) throw error;

                // Success!
                // Show Confetti
                if (window.confetti) {
                    window.confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
                
                // Redirect to Success Page (or show inline success)
                // For now, we'll replace the form with a success message
                enrollForm.innerHTML = `
                    <div class="text-center py-12">
                        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i data-lucide="check" class="w-10 h-10 text-green-600"></i>
                        </div>
                        <h2 class="text-3xl font-bold text-gray-800 mb-4">Enrollment Received! 🚀</h2>
                        <p class="text-gray-600 mb-8">Thank you, ${data.parent_name}. We have received your application. <br>Our admissions team will contact you at <strong>${data.email}</strong> shortly.</p>
                        <a href="index.html" class="bg-orange-500 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-colors">Return Home</a>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
                
                // Send Notification (Optional hook for your notification service)
                if (window.NotificationService) {
                    window.NotificationService.notifyNewEnrollment(payload);
                }

            } catch (error) {
                console.error('Enrollment Error:', error);
                alert('Something went wrong. Please try again or contact support.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }


    // ==========================================
    // 2. Contact Form Handler
    // ==========================================
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Sending...';

                const formData = new FormData(contactForm);
                const data = Object.fromEntries(formData.entries());

                const payload = {
                    first_name: data['first-name'],
                    last_name: data['last-name'],
                    email: data.email,
                    subject: data.subject,
                    message: data.message,
                    status: 'unread',
                    created_at: new Date().toISOString()
                };

                if (!window.supabase) throw new Error('Supabase client not initialized');

                const { error } = await window.supabase
                    .from('messages')
                    .insert([payload]);

                if (error) throw error;

                // Success Message
                contactForm.innerHTML = `
                    <div class="text-center py-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                            <i data-lucide="send" class="w-8 h-8 text-green-600"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800 mb-2">Message Sent!</h3>
                        <p class="text-gray-600">Thanks for reaching out. We'll get back to you soon.</p>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();

            } catch (error) {
                console.error('Contact Error:', error);
                alert('Failed to send message. Please try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

});
