/**
 * STEMulus Supabase Client Configuration
 * Singleton client connection using public anonymous key.
 * All sensitive operations are guarded by Row Level Security (RLS) on PostgreSQL.
 */

// Default configuration from environment or fallback
const SUPABASE_URL = window.__STEMULUS_SUPABASE_URL__ || 'https://ihqjlybxdslvbtmivjic.supabase.co';
const SUPABASE_ANON_KEY = window.__STEMULUS_SUPABASE_ANON_KEY__ || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy-anon-key-placeholder';

let clientInstance = null;

/**
 * Initializes and returns the shared Supabase client.
 * Uses window.supabase if loaded via CDN, or mock client for offline development.
 */
export function getSupabase() {
  if (clientInstance) {
    return clientInstance;
  }

  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    clientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'stemulus_auth_token'
      }
    });
    return clientInstance;
  }

  // Graceful fallback logger if library is not yet injected
  console.warn('[STEMulus Supabase] Client library not yet detected on window.');
  return null;
}
