import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDdbWuXNMWVeb9IG6qVDgvv4MFPCzLcF8g",
    authDomain: "diwa-39ea4.firebaseapp.com",
    projectId: "diwa-39ea4",
    storageBucket: "diwa-39ea4.firebasestorage.app",
    messagingSenderId: "229969700778",
    appId: "1:229969700778:web:ed1738c77a908188b06dd3",
    measurementId: "G-96C6R3NMYS"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let analytics;

if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, analytics };
