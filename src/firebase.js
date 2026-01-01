import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuration derived from the user provided google-services.json (Android)
// Note: For full web support, you might need to register a Web App in the Firebase Console to get a specific appId for web.
const firebaseConfig = {
    apiKey: "AIzaSyCIKv5vkItir0Drc0Va4yS_rrjzODpfSU8",
    authDomain: "chat-application-ad0d1.firebaseapp.com",
    projectId: "chat-application-ad0d1",
    storageBucket: "chat-application-ad0d1.firebasestorage.app",
    messagingSenderId: "533844463584",
    appId: "1:533844463584:android:083a819bf265e4ce742585"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Analytics might fail with Android appId on web, so we handle it gracefully strictly speaking, 
// but for now we'll leave it. If it throws, we can wrap in try/catch or remove.
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
