/**
 * STEMulus Notification Configuration
 * ====================================
 * 
 * Configure your phone notification service here.
 * Supports Pushover (recommended) and Telegram.
 * 
 * SETUP INSTRUCTIONS:
 * 
 * OPTION A - PUSHOVER (Recommended, $5 one-time):
 * 1. Download Pushover app on your phone (iOS/Android)
 * 2. Create account at https://pushover.net
 * 3. Copy your User Key from the dashboard
 * 4. Create an Application at https://pushover.net/apps/build
 * 5. Copy the API Token/Key
 * 6. Paste both values below
 * 
 * OPTION B - TELEGRAM (Free):
 * 1. Message @BotFather on Telegram, send /newbot
 * 2. Follow prompts to create bot, copy the Bot Token
 * 3. Start a chat with your new bot (send any message)
 * 4. Visit: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
 * 5. Find your chat_id in the response
 * 6. Paste both values below
 */

const NOTIFICATION_CONFIG = {
    // ============================================================
    // PROVIDER SELECTION
    // Choose: 'pushover', 'telegram', or 'both'
    // ============================================================
    provider: 'pushover',

    // ============================================================
    // PUSHOVER CREDENTIALS (https://pushover.net)
    // ============================================================
    pushover: {
        userKey: 'YOUR_PUSHOVER_USER_KEY',      // Your user key from dashboard
        appToken: 'YOUR_PUSHOVER_APP_TOKEN'     // Your application API token
    },

    // ============================================================
    // TELEGRAM CREDENTIALS
    // ============================================================
    telegram: {
        botToken: 'YOUR_TELEGRAM_BOT_TOKEN',    // Token from @BotFather
        chatId: 'YOUR_TELEGRAM_CHAT_ID'         // Your chat ID
    },

    // ============================================================
    // NOTIFICATION PREFERENCES
    // ============================================================
    preferences: {
        // Visitor notifications
        notifyOnNewVisitor: false,              // Every single visitor (can be spammy!)
        notifyOnEngagedVisitor: true,           // Visitors spending 60+ seconds
        engagementThreshold: 60,                // Seconds before considered "engaged"
        
        // Lead notifications
        notifyOnLeadCapture: true,              // When someone submits their email
        notifyOnFormSubmission: true,           // Enrollment/contact form submissions
        
        // Summary notifications
        dailyDigest: true,                      // Daily summary at specified time
        digestHour: 20,                         // Hour to send digest (24h format, e.g., 20 = 8 PM)
        
        // Quiet hours (no notifications during sleep)
        quietHoursEnabled: true,
        quietHoursStart: 23,                    // 11 PM
        quietHoursEnd: 7,                       // 7 AM
        
        // Sound/Priority settings
        highPriorityLeads: true,                // Loud notification for new leads
        silentAnalytics: true                   // Silent notification for analytics
    },

    // ============================================================
    // VISITOR TRACKING SETTINGS
    // ============================================================
    tracking: {
        // IP Geolocation (free tier: 50k requests/month)
        enableGeolocation: true,
        geolocationProvider: 'ipinfo',          // 'ipinfo' or 'ipapi'
        ipinfoToken: '',                        // Optional: Get free token at ipinfo.io
        
        // Session settings
        sessionTimeout: 30,                     // Minutes of inactivity = new session
        trackPageViews: true,
        trackScrollDepth: true,
        trackTimeOnPage: true,
        trackReferrer: true,
        trackDeviceInfo: true
    }
};

// Make config globally available
window.NOTIFICATION_CONFIG = NOTIFICATION_CONFIG;
