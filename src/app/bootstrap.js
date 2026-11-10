/**
 * STEMulus Portal Modular Application Bootstrap
 * Coordinates authentication state, role verification, and dynamic feature loading.
 */

import { getSupabase } from '../services/supabase-client.js';
import { showToast } from '../components/notification-toast.js';

export class PortalApp {
  constructor() {
    this.session = null;
    this.supabase = getSupabase();
  }

  /**
   * Initializes application session and enforces route role requirements.
   * @param {string|null} requiredRole - 'admin' | 'tutor' | 'parent' | null
   */
  async init(requiredRole = null) {
    // 1. Check active session (sessionStorage or Supabase auth)
    const sessionJson = sessionStorage.getItem('stemulus_session');
    if (sessionJson) {
      try {
        this.session = JSON.parse(sessionJson);
      } catch (e) {
        this.session = null;
      }
    }

    // 2. Enforce role requirements
    if (requiredRole) {
      if (!this.session || !this.session.role) {
        this.redirectToLogin(requiredRole);
        return false;
      }
      if (this.session.role !== requiredRole && this.session.role !== 'admin') {
        this.redirectToLogin(requiredRole);
        return false;
      }
    }

    // 3. Salvage legacy localStorage if needed
    this.salvageLegacyStorage();

    console.log(`[STEMulus Portal] Bootstrap initialized for role: ${this.session?.role || 'guest'}`);
    return true;
  }

  redirectToLogin(role) {
    if (role === 'admin') {
      window.location.href = 'admin-login.html';
    } else if (role === 'tutor') {
      window.location.href = 'tutor-login.html';
    } else {
      window.location.href = 'parent-login.html';
    }
  }

  salvageLegacyStorage() {
    try {
      const raw = localStorage.getItem('stemulus_db');
      if (raw && !localStorage.getItem('stemulus_db_salvaged')) {
        // Tag local storage so user data remains available during migration
        localStorage.setItem('stemulus_db_salvaged', new Date().toISOString());
        console.log('[STEMulus Portal] Legacy localStorage cataloged for migration.');
      }
    } catch (e) {
      // Storage access blocked or restricted
    }
  }

  /**
   * Dynamic on-demand loader for portal feature controllers.
   * @param {string} featureName 
   * @param {HTMLElement|string} container 
   */
  async loadFeature(featureName, container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    try {
      switch (featureName) {
        case 'toast':
          return showToast;
        default:
          console.log(`[STEMulus Portal] Feature ${featureName} requested.`);
      }
    } catch (err) {
      console.error(`[STEMulus Portal] Failed to load feature ${featureName}:`, err);
      showToast(`Failed to load ${featureName}`, 'error');
    }
  }
}

// Global singleton instance for non-ESM compatibility bridge
if (typeof window !== 'undefined') {
  window.STEMulusApp = new PortalApp();
}
