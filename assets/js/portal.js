/**
 * STEMulus Portal Logic (Firebase Edition)
 * Handles authentication state and portal navigation.
 */

const Portal = (function() {
    /**
     * Check if user is logged in
     */
    function init() {
        if (typeof firebase === 'undefined' || !firebase.auth) return;

        firebase.auth().onAuthStateChanged(user => {
            const portalLinks = document.querySelectorAll('.portal-link');
            
            if (user) {
                // If logged in, point portal links to the login page which auto-redirects to their dashboard
                portalLinks.forEach(link => {
                    link.textContent = 'Go to Portal';
                    link.href = 'parent-login.html';
                });
            } else {
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
            if (typeof firebase === 'undefined' || !firebase.auth) {
                throw new Error("Firebase Auth SDK not initialized.");
            }
            await firebase.auth().signInWithEmailAndPassword(email, password);
            window.location.href = 'parent-login.html';
        } catch (error) {
            throw error;
        }
    }

    /**
     * Handle Logout
     */
    async function logout() {
        try {
            if (typeof firebase === 'undefined' || !firebase.auth) {
                throw new Error("Firebase Auth SDK not initialized.");
            }
            await firebase.auth().signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Logout Error:", error);
        }
    }

    return { init, login, logout };
})();

document.addEventListener('DOMContentLoaded', Portal.init);
