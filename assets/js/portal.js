/**
 * STEMulus Portal Logic
 * Handles authentication state and portal navigation.
 */

const Portal = (function() {
    /**
     * Check if user is logged in
     */
    function init() {
        if (typeof supabase === 'undefined') return;

        supabase.auth.onAuthStateChange((event, session) => {
            const portalLinks = document.querySelectorAll('.portal-link');
            const user = session ? session.user : null;
            
            if (user) {
                // console.log("[STEMulus] User signed in:", user.email);
                portalLinks.forEach(link => {
                    link.textContent = 'Go to Portal';
                    link.href = 'portal-dashboard.html';
                });
            } else {
                // console.log("[STEMulus] User signed out.");
                portalLinks.forEach(link => {
                    link.textContent = 'Parent Portal';
                    link.href = 'parent-login.html';
                });
            }
        });
    }

    /**
     * Handle Login
     */
    async function login(email, password) {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            if (error) throw error;
            window.location.href = 'portal-dashboard.html';
        } catch (error) {
            throw error;
        }
    }

    /**
     * Handle Logout
     */
    async function logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Logout Error:", error);
        }
    }

    return { init, login, logout };
})();

document.addEventListener('DOMContentLoaded', Portal.init);
