/**
 * STEMulus Email Service
 * Wrapper for EmailJS integration with template support
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a free account at https://www.emailjs.com/
 * 2. Create an Email Service (e.g., Gmail, Outlook)
 * 3. Create Email Templates for each type (welcome, reminder, etc.)
 * 4. Copy your Service ID, Template IDs, and Public Key below
 */

const EmailService = (function() {
    
    // ============ CONFIGURE THESE VALUES ============
    const CONFIG = {
        PUBLIC_KEY: 'T5jVjnlOABDwBNXbt',   // EmailJS public key
        SERVICE_ID: 'service_7v7j9u5',     // EmailJS service ID
        TEMPLATES: {
            WELCOME: 'template_welcome',         // Welcome email template ID
            REMINDER_24H: 'template_reminder24', // 24-hour reminder template ID
            REMINDER_1H: 'template_reminder1',   // 1-hour reminder template ID
            SCHEDULE_CHANGE: 'template_schedule',// Schedule change template ID
            CERTIFICATE: 'template_certificate', // Completion certificate template ID
            CUSTOM: 'template_custom'            // Generic custom email template ID
        }
    };
    // ================================================

    let initialized = false;

    /**
     * Initialize EmailJS with public key
     */
    function init() {
        if (CONFIG.PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
            console.warn('[STEMulus Email] EmailJS not configured. Please update email-service.js with your credentials.');
            return false;
        }

        if (typeof emailjs === 'undefined') {
            // Load EmailJS SDK dynamically
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.onload = () => {
                emailjs.init(CONFIG.PUBLIC_KEY);
                initialized = true;
                console.log('[STEMulus Email] EmailJS initialized.');
            };
            document.head.appendChild(script);
        } else {
            emailjs.init(CONFIG.PUBLIC_KEY);
            initialized = true;
        }
        return true;
    }

    /**
     * Send a custom email
     * @param {Object} options - Email options
     * @param {string} options.to - Recipient email
     * @param {string} options.subject - Email subject
     * @param {string} options.body - Email body (HTML or text)
     * @param {string} options.studentName - Student's name
     * @param {string} options.ccParent - Parent email to CC (optional)
     */
    async function send(options) {
        if (!initialized) {
            const initResult = init();
            if (!initResult) {
                console.error('[STEMulus Email] Cannot send - EmailJS not configured.');
                return { success: false, error: 'EmailJS not configured' };
            }
            // Wait for SDK to load
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const templateParams = {
            to_email: options.to,
            to_name: options.studentName || 'Student',
            subject: options.subject || 'Message from STEMulus',
            message: options.body || '',
            cc_email: options.ccParent || '',
            from_name: 'STEMulus Kids Tech',
            reply_to: 'stemulusclubs@gmail.com, support@stemuluskidstech.com',
            bcc_email: 'ajimatimati@gmail.com'
        };

        try {
            const response = await emailjs.send(
                CONFIG.SERVICE_ID,
                CONFIG.TEMPLATES.CUSTOM,
                templateParams
            );
            console.log('[STEMulus Email] Email sent:', response);
            return { success: true, response };
        } catch (error) {
            console.error('[STEMulus Email] Send failed:', error);
            return { success: false, error: error.text || error.message };
        }
    }

    /**
     * Send a welcome email to a new student
     * @param {Object} student - Student data object
     */
    async function sendWelcomeEmail(student) {
        const templateParams = {
            to_email: student.parentEmail || student.email,
            to_name: student.parentName || student.name,
            student_name: student.name,
            course_name: getCourseLabel(student.course),
            from_name: 'STEMulus Kids Tech',
            reply_to: 'stemulusclubs@gmail.com, support@stemuluskidstech.com',
            bcc_email: 'ajimatimati@gmail.com'
        };

        try {
            await emailjs.send(CONFIG.SERVICE_ID, CONFIG.TEMPLATES.WELCOME, templateParams);
            console.log('[STEMulus Email] Welcome email sent to:', student.name);
            return { success: true };
        } catch (error) {
            console.error('[STEMulus Email] Welcome email failed:', error);
            return { success: false, error };
        }
    }

    /**
     * Send a class reminder email
     * @param {Object} options - Reminder options
     * @param {Object} options.student - Student data
     * @param {Object} options.schedule - Schedule data
     * @param {string} options.type - '24h' or '1h'
     */
    async function sendReminderEmail(options) {
        const { student, schedule, type } = options;
        const templateId = type === '24h' ? CONFIG.TEMPLATES.REMINDER_24H : CONFIG.TEMPLATES.REMINDER_1H;

        const templateParams = {
            to_email: student.parentEmail || student.email,
            to_name: student.parentName || student.name,
            student_name: student.name,
            course_name: getCourseLabel(schedule.course),
            class_date: formatDate(schedule.date),
            class_time: schedule.time,
            class_duration: schedule.duration || 60,
            zoom_link: schedule.link || 'Link will be provided',
            mentor_name: schedule.mentor || 'Your Instructor',
            from_name: 'STEMulus Kids Tech',
            reply_to: 'stemulusclubs@gmail.com, support@stemuluskidstech.com',
            bcc_email: 'ajimatimati@gmail.com'
        };

        try {
            await emailjs.send(CONFIG.SERVICE_ID, templateId, templateParams);
            console.log(`[STEMulus Email] ${type} reminder sent to:`, student.name);
            return { success: true };
        } catch (error) {
            console.error(`[STEMulus Email] ${type} reminder failed:`, error);
            return { success: false, error };
        }
    }

    /**
     * Send a schedule change notification
     * @param {Object} options - Change options
     */
    async function sendScheduleChangeEmail(options) {
        const { student, oldSchedule, newSchedule, message } = options;

        const templateParams = {
            to_email: student.parentEmail || student.email,
            to_name: student.parentName || student.name,
            student_name: student.name,
            course_name: getCourseLabel(newSchedule.course),
            old_date: formatDate(oldSchedule.date),
            old_time: oldSchedule.time,
            new_date: formatDate(newSchedule.date),
            new_time: newSchedule.time,
            change_message: message || 'Please note the updated schedule for your upcoming class.',
            from_name: 'STEMulus Kids Tech',
            reply_to: 'stemulusclubs@gmail.com, support@stemuluskidstech.com',
            bcc_email: 'ajimatimati@gmail.com'
        };

        try {
            await emailjs.send(CONFIG.SERVICE_ID, CONFIG.TEMPLATES.SCHEDULE_CHANGE, templateParams);
            console.log('[STEMulus Email] Schedule change email sent to:', student.name);
            return { success: true };
        } catch (error) {
            console.error('[STEMulus Email] Schedule change email failed:', error);
            return { success: false, error };
        }
    }

    /**
     * Send a certificate of completion email
     * @param {Object} student - Student data
     * @param {string} courseName - Course completed
     */
    async function sendCertificateEmail(student, courseName) {
        const templateParams = {
            to_email: student.parentEmail || student.email,
            to_name: student.parentName || student.name,
            student_name: student.name,
            course_name: courseName,
            completion_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            from_name: 'STEMulus Kids Tech',
            reply_to: 'stemulusclubs@gmail.com, support@stemuluskidstech.com',
            bcc_email: 'ajimatimati@gmail.com'
        };

        try {
            await emailjs.send(CONFIG.SERVICE_ID, CONFIG.TEMPLATES.CERTIFICATE, templateParams);
            console.log('[STEMulus Email] Certificate email sent to:', student.name);
            return { success: true };
        } catch (error) {
            console.error('[STEMulus Email] Certificate email failed:', error);
            return { success: false, error };
        }
    }

    // ==================== UTILITIES ====================

    function getCourseLabel(courseId) {
        const labels = {
            'junior-robotics': 'Junior Robotics',
            'python-programming': 'Python Programming',
            'web-design': 'Web Design & Development',
            'scratch-creators': 'Scratch Creators',
            'ai-explorers': 'AI Explorers'
        };
        return labels[courseId] || courseId;
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    // ==================== PUBLIC API ====================

    return {
        init,
        send,
        sendWelcomeEmail,
        sendReminderEmail,
        sendScheduleChangeEmail,
        sendCertificateEmail
    };

})();

// Auto-initialize
document.addEventListener('DOMContentLoaded', EmailService.init);
