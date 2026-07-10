import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, connectAuthEmulator, Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, Firestore } from "firebase/firestore";
import { getDatabase, connectDatabaseEmulator, Database } from "firebase/database";

const requiredEnv = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isDemoMode = !requiredEnv.apiKey || !requiredEnv.projectId;

let app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _rtdb: Database | null = null;

if (!isDemoMode) {
    const firebaseConfig = {
        apiKey: requiredEnv.apiKey!,
        authDomain: requiredEnv.authDomain,
        databaseURL: requiredEnv.databaseURL,
        projectId: requiredEnv.projectId,
        storageBucket: requiredEnv.storageBucket,
        messagingSenderId: requiredEnv.messagingSenderId,
        appId: requiredEnv.appId,
    };

    try {
        app = initializeApp(firebaseConfig);
        _auth = getAuth(app);
        _db = getFirestore(app);
        _rtdb = getDatabase(app);

        if (import.meta.env.DEV) {
            try {
                connectAuthEmulator(_auth, "http://localhost:9099");
                connectFirestoreEmulator(_db, "localhost", 8080);
                connectDatabaseEmulator(_rtdb, "localhost", 9000);
            } catch {
                // Emulators may already be connected
            }
        }
    } catch (err) {
        console.warn('Firebase init failed, falling back to demo mode:', err);
    }
} else if (import.meta.env.DEV) {
    console.info('[Firebase] Running in demo mode. Set VITE_FIREBASE_* env vars to connect to a real project.');
}

export const auth = _auth as Auth;
export const db = _db as Firestore;
export const rtdb = _rtdb as Database;
export const googleProvider = _auth ? new GoogleAuthProvider() : null;

export { RecaptchaVerifier, signInWithPhoneNumber };
export default app;
