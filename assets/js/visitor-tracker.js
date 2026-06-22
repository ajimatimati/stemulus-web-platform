/**
 * STEMulus Visitor Tracker
 * =========================
 * 
 * Enhanced visitor tracking with session management,
 * geolocation, and notification integration.
 */

const VisitorTracker = (function() {
    'use strict';

    const STORAGE_KEY = 'stemulus_visitor_data';
    const SESSION_KEY = 'stemulus_current_session';
    const DAILY_STATS_KEY = 'stemulus_daily_stats';

    let config = null;
    let sessionData = null;
    let startTime = Date.now();
    let engagementNotified = false;

    // ==================== INITIALIZATION ====================

    function init() {
        config = window.NOTIFICATION_CONFIG?.tracking || {};
        
        // Load or create session
        sessionData = loadSession();
        
        // Track page view
        trackPageView();
        
        // Set up engagement tracking
        setupEngagementTracking();
        
        // Get geolocation if enabled
        if (config.enableGeolocation) {
            fetchGeolocation();
        }
        
        // Update daily stats
        updateDailyStats('visit');
        
        // Check if should send daily digest
        checkDailyDigest();
        
        console.log('[Visitor] ✅ Tracker initialized', sessionData.isNew ? '(New visitor)' : '(Returning)');
    }

    // ==================== SESSION MANAGEMENT ====================

    function loadSession() {
        const stored = sessionStorage.getItem(SESSION_KEY);
        const visitorData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        
        if (stored) {
            // Existing session
            const session = JSON.parse(stored);
            session.isNew = false;
            session.pageViews = (session.pageViews || 0) + 1;
            session.pages = session.pages || [];
            session.pages.push(getCurrentPageName());
            saveSession(session);
            return session;
        }
        
        // New session
        const isNewVisitor = !visitorData.firstVisit;
        const session = {
            id: generateSessionId(),
            startTime: Date.now(),
            isNew: true,
            isNewVisitor: isNewVisitor,
            pageViews: 1,
            pages: [getCurrentPageName()],
            referrer: document.referrer || 'Direct',
            device: getDeviceInfo(),
            location: null, // Will be populated by geolocation
            userAgent: navigator.userAgent
        };
        
        // Update visitor data
        if (isNewVisitor) {
            visitorData.firstVisit = Date.now();
            visitorData.visitCount = 1;
        } else {
            visitorData.visitCount = (visitorData.visitCount || 0) + 1;
        }
        visitorData.lastVisit = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visitorData));
        
        saveSession(session);
        return session;
    }

    function saveSession(session) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    function generateSessionId() {
        return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // ==================== PAGE TRACKING ====================

    function trackPageView() {
        const page = getCurrentPageName();
        
        // Update page stats
        updateDailyStats('pageView', page);
        
        console.log('[Visitor] Page view:', page);
    }

    function getCurrentPageName() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.replace('.html', '').replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()) || 'Home';
    }

    // ==================== DEVICE INFO ====================

    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let os = 'Unknown';
        let device = 'Desktop';

        // Detect browser
        if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

        // Detect OS
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

        // Detect device type
        if (/Mobile|Android|iPhone/i.test(ua)) device = 'Mobile';
        else if (/iPad|Tablet/i.test(ua)) device = 'Tablet';

        return `${device}, ${os}, ${browser}`;
    }

    // ==================== GEOLOCATION ====================

    async function fetchGeolocation() {
        try {
            const token = config.ipinfoToken;
            const url = token 
                ? `https://ipinfo.io/json?token=${token}`
                : 'https://ipinfo.io/json';
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.city && data.country) {
                sessionData.location = `${data.city}, ${data.country}`;
                sessionData.locationData = {
                    city: data.city,
                    region: data.region,
                    country: data.country,
                    countryCode: data.country
                };
                saveSession(sessionData);
                
                // Update daily stats with location
                updateDailyStats('location', data.country);
                
                console.log('[Visitor] Location:', sessionData.location);
            }
        } catch (error) {
            console.log('[Visitor] Geolocation unavailable');
        }
    }

    // ==================== ENGAGEMENT TRACKING ====================

    function setupEngagementTracking() {
        const threshold = window.NOTIFICATION_CONFIG?.preferences?.engagementThreshold || 60;
        
        // Check engagement after threshold
        setTimeout(() => {
            checkEngagement();
        }, threshold * 1000);
        
        // Track scroll depth
        if (config.trackScrollDepth) {
            setupScrollTracking();
        }
        
        // Track on page leave
        window.addEventListener('beforeunload', onPageLeave);
    }

    function checkEngagement() {
        if (engagementNotified) return;
        
        const prefs = window.NOTIFICATION_CONFIG?.preferences;
        if (!prefs?.notifyOnEngagedVisitor) return;
        
        engagementNotified = true;
        
        const timeOnSite = formatTimeOnSite(Date.now() - startTime);
        
        // Send notification
        if (typeof NotificationService !== 'undefined' && NotificationService.isConfigured()) {
            NotificationService.notifyEngagedVisitor({
                location: sessionData.location || 'Unknown',
                device: sessionData.device,
                currentPage: getCurrentPageName(),
                timeOnSite: timeOnSite,
                referrer: formatReferrer(sessionData.referrer),
                pagesVisited: sessionData.pages.join(' → ')
            });
        }
        
        console.log('[Visitor] Engaged visitor notification sent');
    }

    function setupScrollTracking() {
        let maxScroll = 0;
        
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            maxScroll = Math.max(maxScroll, scrollPercent);
        }, { passive: true });
        
        // Save max scroll on leave
        window.addEventListener('beforeunload', () => {
            sessionData.maxScroll = maxScroll;
            saveSession(sessionData);
        });
    }

    function onPageLeave() {
        const timeOnPage = Date.now() - startTime;
        sessionData.totalTime = (sessionData.totalTime || 0) + timeOnPage;
        saveSession(sessionData);
        
        // Update daily stats
        updateDailyStats('timeSpent', timeOnPage);
    }

    // ==================== DAILY STATS ====================

    function updateDailyStats(type, value) {
        const today = new Date().toDateString();
        let stats = JSON.parse(localStorage.getItem(DAILY_STATS_KEY) || '{}');
        
        // Reset if new day
        if (stats.date !== today) {
            // Send digest for previous day if exists
            if (stats.date && window.NOTIFICATION_CONFIG?.preferences?.dailyDigest) {
                sendDigestForStats(stats);
            }
            
            stats = {
                date: today,
                totalVisitors: 0,
                newVisitors: 0,
                returningVisitors: 0,
                pageViews: {},
                locations: {},
                totalTimeMs: 0,
                leads: [],
                sessions: []
            };
        }
        
        switch (type) {
            case 'visit':
                if (!stats.sessions.includes(sessionData.id)) {
                    stats.sessions.push(sessionData.id);
                    stats.totalVisitors++;
                    if (sessionData.isNewVisitor) {
                        stats.newVisitors++;
                    } else {
                        stats.returningVisitors++;
                    }
                }
                break;
                
            case 'pageView':
                stats.pageViews[value] = (stats.pageViews[value] || 0) + 1;
                break;
                
            case 'location':
                stats.locations[value] = (stats.locations[value] || 0) + 1;
                break;
                
            case 'timeSpent':
                stats.totalTimeMs += value;
                break;
                
            case 'lead':
                stats.leads.push(value);
                break;
        }
        
        localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats));
    }

    function checkDailyDigest() {
        const prefs = window.NOTIFICATION_CONFIG?.preferences;
        if (!prefs?.dailyDigest) return;
        
        const digestHour = prefs.digestHour || 20;
        const now = new Date();
        
        // Check if it's digest time (within the hour)
        if (now.getHours() === digestHour) {
            const lastDigest = localStorage.getItem('stemulus_last_digest');
            const today = now.toDateString();
            
            if (lastDigest !== today) {
                // Send digest
                const stats = JSON.parse(localStorage.getItem(DAILY_STATS_KEY) || '{}');
                if (stats.totalVisitors > 0) {
                    sendDigestForStats(stats);
                    localStorage.setItem('stemulus_last_digest', today);
                }
            }
        }
    }

    function sendDigestForStats(stats) {
        if (typeof NotificationService === 'undefined' || !NotificationService.isConfigured()) {
            return;
        }
        
        // Calculate avg time
        const avgTimeMs = stats.totalVisitors > 0 
            ? stats.totalTimeMs / stats.totalVisitors 
            : 0;
        
        // Format top pages
        const topPages = Object.entries(stats.pageViews || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, views]) => ({ name, views }));
        
        // Format top locations
        const totalLocations = Object.values(stats.locations || {}).reduce((a, b) => a + b, 0);
        const topLocations = Object.entries(stats.locations || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => ({ 
                name, 
                percent: Math.round((count / totalLocations) * 100) 
            }));
        
        NotificationService.sendDailyDigest({
            totalVisitors: stats.totalVisitors || 0,
            newVisitors: stats.newVisitors || 0,
            returningVisitors: stats.returningVisitors || 0,
            avgTimeOnSite: formatTimeOnSite(avgTimeMs),
            leadsCount: stats.leads?.length || 0,
            leads: stats.leads || [],
            topPages: topPages,
            topLocations: topLocations
        });
        
        console.log('[Visitor] Daily digest sent');
    }

    // ==================== UTILITIES ====================

    function formatTimeOnSite(ms) {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }

    function formatReferrer(referrer) {
        if (!referrer || referrer === 'Direct') return 'Direct';
        try {
            const url = new URL(referrer);
            const host = url.hostname.replace('www.', '');
            if (host.includes('google')) return 'Google Search';
            if (host.includes('facebook')) return 'Facebook';
            if (host.includes('instagram')) return 'Instagram';
            if (host.includes('twitter') || host.includes('x.com')) return 'Twitter/X';
            if (host.includes('linkedin')) return 'LinkedIn';
            if (host.includes('youtube')) return 'YouTube';
            if (host.includes('whatsapp')) return 'WhatsApp';
            return host;
        } catch {
            return referrer.substring(0, 30);
        }
    }

    // ==================== PUBLIC API ====================

    return {
        init,
        getSession: () => sessionData,
        getTimeOnSite: () => formatTimeOnSite(Date.now() - startTime),
        getPagesVisited: () => sessionData?.pages || [],
        getLocation: () => sessionData?.location,
        getDevice: () => sessionData?.device,
        getReferrer: () => formatReferrer(sessionData?.referrer),
        recordLead: (leadData) => updateDailyStats('lead', leadData)
    };

})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', VisitorTracker.init);
} else {
    VisitorTracker.init();
}
