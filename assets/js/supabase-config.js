/**
 * STEMulus Supabase Configuration
 * ================================
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Go to Supabase: https://supabase.com/dashboard
 * 2. Create a new project (or select existing)
 * 3. Go to Project Settings -> API
 * 4. Copy your Project URL and anon (public) key
 * 
 */

const SUPABASE_URL = 'https://uzpecrccubhfftrpldju.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6cGVjcmNjdWJoZmZ0cnBsZGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTk2MjgsImV4cCI6MjA4NjEzNTYyOH0.13aPL7V17EFQElIT9DQ-BMwkhBFg8S8TB-ozu45wZQ0';

// Initialize Supabase
let supabase;

if (typeof createClient === 'undefined' && window.supabase && window.supabase.createClient) {
    // If loaded via CDN as window.supabase object
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else if (typeof createClient !== 'undefined') {
    // If loaded via CDN global createClient
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    // Fallback or warning
     console.warn("[STEMulus] Supabase SDK not found. Make sure validation script is loaded.");
}


if (supabase) {
    console.log("[STEMulus] ✅ Supabase Client Initialized");
}
