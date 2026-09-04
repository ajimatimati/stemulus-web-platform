/**
 * STEMulus Notification Service
 * ==============================
 * 
 * Sends push notifications to your phone via Pushover or Telegram.
 * Configure credentials in notification-config.js
 */

const NotificationService = (function() {
    'use strict';

    let config = null;
    let notificationQueue = [];
    let isProcessing = false;

    // ==================== INITIALIZATION ====================

    function init() {
        if (typeof NOTIFICATION_CONFIG === 'undefined') {
            console.warn('[Notifications] Config not loaded. Include notification-config.js first.');
            return;
        }
        
        config = NOTIFICATION_CONFIG;
        
        // Check if configured
        if (config.pushover.userKey === 'YOUR_PUSHOVER_USER_KEY' && 
            config.telegram.botToken === 'YOUR_TELEGRAM_BOT_TOKEN') {
            console.warn('[Notifications] [Warning] Not configured. Update notification-config.js with your credentials.');
            return;
        }
        
        console.log('[Notifications] [Ready] Service initialized with provider:', config.provider);
        
        // Process any queued notifications
        processQueue();
    }

    // ==================== QUIET HOURS CHECK ====================

    function isQuietHours() {
        if (!config?.preferences?.quietHoursEnabled) return false;
        
        const now = new Date();
        const hour = now.getHours();
        const start = config.preferences.quietHoursStart;
        const end = config.preferences.quietHoursEnd;
        
        // Handle overnight quiet hours (e.g., 23:00 - 07:00)
        if (start > end) {
            return hour >= start || hour < end;
        }
        return hour >= start && hour < end;
    }

    // ==================== SEND NOTIFICATIONS ====================

    /**
     * Send notification via configured provider(s)
     * @param {Object} options - Notification options
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification body
     * @param {string} options.priority - 'high', 'normal', or 'silent'
     * @param {string} options.url - Optional URL to open on tap
     */
    async function send(options) {
        if (!config) {
            console.warn('[Notifications] Service not initialized');
            return false;
        }

        // Check quiet hours (skip for high priority)
        if (isQuietHours() && options.priority !== 'high') {
            console.log('[Notifications] Quiet hours active, notification queued for later');
            notificationQueue.push({ ...options, queuedAt: Date.now() });
            return true;
        }

        const provider = config.provider;
        let success = false;

        try {
            if (provider === 'pushover' || provider === 'both') {
                success = await sendPushover(options);
            }
            
            if (provider === 'telegram' || provider === 'both') {
                success = await sendTelegram(options) || success;
            }
            
            if (success) {
                console.log('[Notifications] [Sent] Sent:', options.title);
            }
        } catch (error) {
            console.error('[Notifications] Failed to send:', error.message);
        }

        return success;
    }

    /**
     * Send via Pushover API
     */
    async function sendPushover(options) {
        const { userKey, appToken } = config.pushover;
        
        if (userKey === 'YOUR_PUSHOVER_USER_KEY' || appToken === 'YOUR_PUSHOVER_APP_TOKEN') {
            console.warn('[Notifications] Pushover not configured');
            return false;
        }

        // Map priority
        let priority = 0; // normal
        if (options.priority === 'high') priority = 1;
        if (options.priority === 'silent') priority = -1;

        const payload = {
            token: appToken,
            user: userKey,
            title: options.title || 'STEMulus Alert',
            message: options.message,
            priority: priority,
            sound: options.priority === 'high' ? 'pushover' : 'none',
            html: 1
        };

        if (options.url) {
            payload.url = options.url;
            payload.url_title = 'View Details';
        }

        try {
            const response = await fetch('https://api.pushover.net/1/messages.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            return result.status === 1;
        } catch (error) {
            console.error('[Notifications] Pushover error:', error);
            return false;
        }
    }

    /**
     * Send via Telegram Bot API
     */
    async function sendTelegram(options) {
        const { botToken, chatId } = config.telegram;
        
        if (botToken === 'YOUR_TELEGRAM_BOT_TOKEN' || chatId === 'YOUR_TELEGRAM_CHAT_ID') {
            console.warn('[Notifications] Telegram not configured');
            return false;
        }

        // Format message for Telegram
        let text = `<b>${options.title || 'STEMulus Alert'}</b>\n\n${options.message}`;
        
        if (options.url) {
            text += `\n\n<a href="${options.url}">View Details</a>`;
        }

        const payload = {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            disable_notification: options.priority === 'silent'
        };

        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            return result.ok === true;
        } catch (error) {
            console.error('[Notifications] Telegram error:', error);
            return false;
        }
    }

    // ==================== QUEUE PROCESSING ====================

    async function processQueue() {
        if (isProcessing || notificationQueue.length === 0) return;
        
        isProcessing = true;
        
        while (notificationQueue.length > 0 && !isQuietHours()) {
            const notification = notificationQueue.shift();
            await send(notification);
            // Small delay between notifications
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        isProcessing = false;
    }

    // Check queue every hour during non-quiet hours
    setInterval(() => {
        if (!isQuietHours()) {
            processQueue();
        }
    }, 60 * 60 * 1000);

    // ==================== CONVENIENCE METHODS ====================

    /**
     * Send a new lead notification
     */
    function notifyNewLead(leadData) {
        const message = formatLeadMessage(leadData);
        return send({
            title: '[NEW LEAD CAPTURED]',
            message: message,
            priority: config?.preferences?.highPriorityLeads ? 'high' : 'normal',
            url: leadData.pageUrl
        });
    }

    /**
     * Send engaged visitor notification
     */
    function notifyEngagedVisitor(visitorData) {
        const message = formatVisitorMessage(visitorData);
        return send({
            title: '[Engaged Visitor]',
            message: message,
            priority: config?.preferences?.silentAnalytics ? 'silent' : 'normal'
        });
    }

    /**
     * Send daily digest
     */
    function sendDailyDigest(stats) {
        const message = formatDigestMessage(stats);
        return send({
            title: `[Report] STEMulus Daily Report - ${new Date().toLocaleDateString()}`,
            message: message,
            priority: 'normal'
        });
    }

    /**
     * Send form submission notification
     */
    function notifyFormSubmission(formData) {
        const message = formatFormMessage(formData);
        return send({
            title: `[Submission] ${formData.formType || 'Form'}`,
            message: message,
            priority: 'high'
        });
    }

    // ==================== MESSAGE FORMATTERS ====================

    function formatLeadMessage(data) {
        const lines = [];
        if (data.email) lines.push(`Email: ${data.email}`);
        if (data.name) lines.push(`Name: ${data.name}`);
        if (data.location) lines.push(`Location: ${data.location}`);
        if (data.device) lines.push(`Device: ${data.device}`);
        if (data.timeOnSite) lines.push(`Time on site: ${data.timeOnSite}`);
        if (data.pagesVisited) lines.push(`Pages: ${data.pagesVisited}`);
        if (data.referrer) lines.push(`Referrer: ${data.referrer}`);
        lines.push(`\n⏰ Captured: ${new Date().toLocaleTimeString()}`);
        return lines.join('\n');
    }

    function formatVisitorMessage(data) {
        const lines = [];
        if (data.location) lines.push(`Location: ${data.location}`);
        if (data.device) lines.push(`Device: ${data.device}`);
        if (data.currentPage) lines.push(`Viewing: ${data.currentPage}`);
        if (data.timeOnSite) lines.push(`Time: ${data.timeOnSite}`);
        if (data.referrer) lines.push(`From: ${data.referrer}`);
        return lines.join('\n');
    }

    function formatDigestMessage(stats) {
        const lines = [
            `Total Visitors: ${stats.totalVisitors || 0}`,
            `🆕 New Visitors: ${stats.newVisitors || 0}`,
            `Returning: ${stats.returningVisitors || 0}`,
            `Avg Time: ${stats.avgTimeOnSite || '0m'}`,
            ''
        ];

        if (stats.leadsCount > 0) {
            lines.push(`Leads Captured: ${stats.leadsCount}`);
            if (stats.leads && stats.leads.length > 0) {
                stats.leads.slice(0, 5).forEach(lead => {
                    lines.push(`  • ${lead.email}${lead.location ? ` (${lead.location})` : ''}`);
                });
            }
            lines.push('');
        }

        if (stats.topPages && stats.topPages.length > 0) {
            lines.push('Top Pages:');
            stats.topPages.slice(0, 3).forEach((page, i) => {
                lines.push(`  ${i + 1}. ${page.name} (${page.views} views)`);
            });
            lines.push('');
        }

        if (stats.topLocations && stats.topLocations.length > 0) {
            lines.push('Top Locations:');
            lines.push(`  ${stats.topLocations.slice(0, 3).map(l => `${l.name} (${l.percent}%)`).join(', ')}`);
        }

        return lines.join('\n');
    }

    function formatFormMessage(data) {
        const lines = [];
        if (data.formType) lines.push(`Form: ${data.formType}`);
        if (data.name) lines.push(`Name: ${data.name}`);
        if (data.email) lines.push(`Email: ${data.email}`);
        if (data.phone) lines.push(`Phone: ${data.phone}`);
        if (data.message) lines.push(`Message: ${data.message.substring(0, 100)}${data.message.length > 100 ? '...' : ''}`);
        if (data.program) lines.push(`Program: ${data.program}`);
        lines.push(`\n⏰ Submitted: ${new Date().toLocaleTimeString()}`);
        return lines.join('\n');
    }

    // ==================== TEST FUNCTION ====================

    /**
     * Test notification - call from console: NotificationService.test()
     */
    function test() {
        console.log('[Notifications] Sending test notification...');
        return send({
            title: '[Test] Notification',
            message: 'If you see this on your phone, notifications are working!\n\n[Verified] STEMulus notification system is configured correctly.',
            priority: 'high'
        });
    }

    // ==================== PUBLIC API ====================

    return {
        init,
        send,
        notifyNewLead,
        notifyEngagedVisitor,
        notifyFormSubmission,
        sendDailyDigest,
        test,
        isConfigured: () => config !== null && (
            config.pushover.userKey !== 'YOUR_PUSHOVER_USER_KEY' ||
            config.telegram.botToken !== 'YOUR_TELEGRAM_BOT_TOKEN'
        )
    };

})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', NotificationService.init);
} else {
    NotificationService.init();
}
