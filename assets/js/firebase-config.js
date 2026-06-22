/**
 * STEMulus Firebase Configuration
 * ================================
 */

const firebaseConfig = {
    apiKey: "AIzaSyBwiBfq11WfgQTPIqvPzxhv3Evz5gN4IUk",
    authDomain: "stemulus-kidstech.firebaseapp.com",
    projectId: "stemulus-kidstech",
    storageBucket: "stemulus-kidstech.firebasestorage.app",
    messagingSenderId: "952737499924",
    appId: "1:952737499924:web:2e0aa1b24df748d0b81001",
    measurementId: "G-M8D7M4P595"
};

// Initialize Firebase if not already initialized
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    
    // Enable Offline Caching (Spark plan read saving loophole)
    firebase.firestore().enablePersistence().catch(err => {
        console.warn("[Firebase Config] Offline persistence failed to enable:", err.code);
    });
}

// Export db if firebase is loaded
let db;
if (typeof firebase !== 'undefined') {
    db = firebase.firestore();
    console.log("[STEMulus] ✅ Firebase Client & Firestore Initialized");
} else {
    console.warn("[STEMulus] Firebase SDK not found. Make sure configuration scripts are loaded.");
}
