/**
 * STEMulus Classroom Rejoin Beacon (Production)
 * 
 * Functions:
 * 1. Monitors for active mid-class dropouts across all portal views.
 * 2. Mounts an attention-grabbing, 3D Playful Minimalist Rejoin Banner on the user's screen.
 * 3. Triggers native OS laptop notifications when disconnected from a live class.
 * 4. Enables 1-click rejoining straight into Google Meet and the Companion tab.
 */

const ClassroomRejoinBeacon = (function() {
  'use strict';

  const STORAGE_KEY = 'stemulus_active_rejoin_prompts';
  let checkInterval = null;

  function init() {
    if (typeof window === 'undefined') return;
    
    // Check for active dropouts immediately and periodically
    checkActiveRejoinPrompts();
    if (!checkInterval) {
      checkInterval = setInterval(checkActiveRejoinPrompts, 6000);
    }

    // Listen for storage changes across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        checkActiveRejoinPrompts();
      }
    });

    // Request notification permission opportunistically on first user interaction
    const requestOnce = () => {
      requestDesktopPermission();
      window.removeEventListener('click', requestOnce);
      window.removeEventListener('keydown', requestOnce);
    };
    window.addEventListener('click', requestOnce, { once: true });
    window.addEventListener('keydown', requestOnce, { once: true });
  }

  function requestDesktopPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }

  function checkActiveRejoinPrompts() {
    try {
      const prompts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const keys = Object.keys(prompts);
      if (keys.length === 0) {
        dismissRejoinBanner();
        return;
      }

      const now = Date.now();
      // Find the most recent active prompt within the last 25 minutes
      const activeKey = keys.find(k => {
        const p = prompts[k];
        if (!p || !p.disconnectedAt) return false;
        const diffMs = now - new Date(p.disconnectedAt).getTime();
        return diffMs < (25 * 60 * 1000); // 25 minutes window
      });

      if (activeKey) {
        const promptData = prompts[activeKey];
        mountRejoinBanner(promptData, activeKey);
      } else {
        dismissRejoinBanner();
      }
    } catch (e) {
      console.warn('[RejoinBeacon] Error checking prompts:', e);
    }
  }

  function renderBeaconHTML(data, key = 'active_session') {
    const elapsedMins = Math.max(1, Math.round((Date.now() - new Date(data.disconnectedAt || Date.now()).getTime()) / 60000));
    const joinHref = data.joinUrl || `join-class.html?id=${encodeURIComponent(data.scheduleId || data.sessionId || key)}`;

    return `
      <div class="bg-white rounded-[1.6rem] p-4 sm:p-5 border border-slate-100 shadow-sm text-slate-900">
        <!-- Header -->
        <div class="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
            <span class="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
              <span>🚨</span> Live Class Disconnected
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              T+${elapsedMins}m
            </span>
            <button type="button" onclick="ClassroomRejoinBeacon.dismissPrompt('${key}')" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors" title="Dismiss">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex items-start gap-3 mb-4">
          <div class="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex-shrink-0 flex items-center justify-center text-xl shadow-xs">
            🚀
          </div>
          <div class="min-w-0">
            <h4 class="font-bold text-sm text-slate-900 truncate">
              ${data.courseName || 'Coding Track'}
            </h4>
            <p class="text-xs text-slate-600 leading-snug mt-0.5">
              Coach <span class="font-bold text-slate-800">${data.tutorName || 'Coach'}</span> is waiting in the virtual classroom for <span class="font-bold text-slate-800">${data.studentName || 'you'}</span>!
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <a href="${joinHref}" class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all text-center flex items-center justify-center gap-2 no-underline">
            <span>🚀 Rejoin Class Now</span>
          </a>
          <button type="button" onclick="ClassroomRejoinBeacon.dismissPrompt('${key}')" class="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors">
            Later
          </button>
        </div>
      </div>
    `;
  }

  function isBannerDismissed(key) {
    try {
      return sessionStorage.getItem('rejoin_dismissed_' + key) === 'true';
    } catch (e) {
      return false;
    }
  }

  function mountRejoinBanner(data, key) {
    if (typeof document === 'undefined') return;
    if (typeof window !== 'undefined' && window.location && window.location.pathname && window.location.pathname.includes('join-class.html')) {
      const urlParams = new URLSearchParams(window.location.search);
      const curSession = urlParams.get('sessionId') || urlParams.get('id');
      if (curSession && (curSession === data.sessionId || curSession === data.scheduleId)) {
        return;
      }
    }
    if (isBannerDismissed(key)) return;

    let banner = document.getElementById('stemulus-rejoin-active-class-beacon');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'stemulus-rejoin-active-class-beacon';
      document.body.appendChild(banner);
    }

    const joinHref = data.joinUrl || `join-class.html?sessionId=${encodeURIComponent(data.sessionId || key)}&scheduleId=${encodeURIComponent(data.scheduleId || key)}`;

    banner.className = 'fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] max-w-sm sm:max-w-md w-[calc(100%-2.5rem)] sm:w-full bg-slate-900/90 border-2 border-orange-500 rounded-[2rem] p-2 shadow-2xl backdrop-blur-xl animate-bounce-once transition-all';
    banner.innerHTML = renderBeaconHTML(data, key);

    // Trigger local desktop notification on laptop
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(`🚨 Class Disconnected: ${data.courseName || 'Coding Session'}`, {
          body: `Coach ${data.tutorName || 'Coach'} is waiting for you in class. Click to rejoin immediately!`,
          icon: 'favicon.png',
          tag: `rejoin-${key}`
        });
        notif.onclick = () => {
          window.focus();
          window.location.href = joinHref;
        };
      } catch (e) {}
    }
  }

  function dismissPrompt(key) {
    try {
      const prompts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      delete prompts[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    } catch (e) {}
    dismissRejoinBanner();
  }

  function dismissRejoinBanner() {
    if (typeof document === 'undefined') return;
    const banner = document.getElementById('stemulus-rejoin-active-class-beacon');
    if (banner) banner.remove();
  }

  function triggerManualTestPrompt(studentName = 'Junayd Kari', courseName = 'Scratch Creators', tutorName = 'Coach Olalekan') {
    const testKey = 'test-rejoin-' + Date.now();
    const testData = {
      sessionId: testKey,
      scheduleId: 'sch_test',
      courseName,
      disconnectedParty: studentName,
      disconnectedRole: 'student',
      disconnectedAt: new Date().toISOString(),
      tutorName,
      studentName,
      joinUrl: 'join-class.html?id=sch_103&role=student'
    };
    try {
      const prompts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      prompts[testKey] = testData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
      mountRejoinBanner(testData, testKey);
    } catch(e) {}
    return testData;
  }

  return {
    init,
    checkActiveRejoinPrompts,
    mountRejoinBanner,
    renderBeaconHTML,
    dismissPrompt,
    dismissRejoinBanner,
    requestDesktopPermission,
    triggerManualTestPrompt
  };
})();

// Auto-init on script load in browser
if (typeof window !== 'undefined') {
  window.ClassroomRejoinBeacon = ClassroomRejoinBeacon;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ClassroomRejoinBeacon.init);
  } else {
    ClassroomRejoinBeacon.init();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClassroomRejoinBeacon;
}
