import React, { createContext, useEffect, useState } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult,
    signInAnonymously
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, isDemoMode } from '@/lib/firebase';
import { syncUserToRTDB } from '@/lib/rtdb';
import { generateUsercode, generateSafeHandle } from '@/lib/intelligence/identity';

export interface AuthContextType {
    currentUser: User | null;
    userData: any | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    signInWithPhone: (phoneNumber: string, recaptchaContainerId: string) => Promise<void>;
    verifyOtp: (otp: string) => Promise<void>;
    signInAsGuest: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER = {
    uid: 'demo-guest-001',
    displayName: 'Demo User',
    email: 'demo@unitex.io',
    photoURL: '',
    isAnonymous: true,
} as any;

const MOCK_USER_DATA = {
    uid: 'demo-guest-001',
    displayName: 'Demo User',
    userId: 'DEMO01',
    usercode: 'DEMO01',
    xp: 500,
    vp: 300,
    badges: ['early-adopter', 'explorer'],
    role: 'Member',
    bio: 'Exploring UniteX in demo mode',
    followers: 0,
    following: 0,
    onboardingCompleted: true,
};

async function createUserDocument(user: User) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            const userId = generateUsercode();
            const username = generateSafeHandle(user.displayName || (user.isAnonymous ? 'guest' : 'unitex'));
            await setDoc(userRef, {
                uid: user.uid,
                userId,
                usercode: userId,
                displayName: user.displayName || (user.isAnonymous ? 'Guest User' : 'UniteX User'),
                username,
                email: user.email || null,
                photoURL: user.photoURL || '',
                role: 'Member',
                bio: '',
                followers: 0,
                following: 0,
                profileViews: 0,
                xp: 100,
                vp: 100,
                badges: [],
                hasSeenCredentials: false,
                onboardingCompleted: false,
                createdAt: serverTimestamp(),
            });
        }
        await syncUserToRTDB(user);
    } catch (err) {
        console.warn('Could not create user document:', err);
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(isDemoMode ? MOCK_USER : null);
    const [userData, setUserData] = useState<any | null>(isDemoMode ? MOCK_USER_DATA : null);
    const [loading, setLoading] = useState(true);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    useEffect(() => {
        if (isDemoMode) {
            setLoading(false);
            return;
        }

        let unsubscribeData: (() => void) | null = null;

        try {
            const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
                if (unsubscribeData) {
                    unsubscribeData();
                    unsubscribeData = null;
                }
                setCurrentUser(user);
                if (user) {
                    const userDocRef = doc(db, 'users', user.uid);
                    unsubscribeData = onSnapshot(userDocRef, (snap) => {
                        if (snap.exists()) setUserData(snap.data());
                    });
                } else {
                    setUserData(null);
                }
                setLoading(false);
            }, (error) => {
                console.warn('Firebase auth unavailable:', error.message);
                setCurrentUser(null);
                setUserData(null);
                setLoading(false);
            });

            return () => {
                if (unsubscribeData) unsubscribeData();
                unsubscribeAuth();
            };
        } catch (err) {
            console.warn('Firebase init failed, running in demo mode');
            setLoading(false);
        }
    }, []);

    const signInWithGoogle = async () => {
        if (!googleProvider) throw new Error('Google Provider not initialized');
        const result = await signInWithPopup(auth, googleProvider);
        await createUserDocument(result.user);
    };

    const signInWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUpWithEmail = async (email: string, password: string, displayName: string) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName });
        await createUserDocument(result.user);
    };

    const signInWithPhone = async (phoneNumber: string, recaptchaContainerId: string) => {
        const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
        const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
        setConfirmationResult(result);
    };

    const verifyOtp = async (otp: string) => {
        if (!confirmationResult) throw new Error('No pending phone verification');
        const result = await confirmationResult.confirm(otp);
        await createUserDocument(result.user);
    };

    const signInAsGuest = async () => {
        try {
            const result = await signInAnonymously(auth);
            await createUserDocument(result.user);
        } catch (err) {
            console.warn('Firebase unavailable, entering demo mode');
            setCurrentUser(MOCK_USER);
            setUserData(MOCK_USER_DATA);
            setLoading(false);
        }
    };

    const signOut = async () => {
        if (isDemoMode) {
            setCurrentUser(null);
            setUserData(null);
            return;
        }
        await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{
            currentUser,
            userData,
            loading,
            signInWithGoogle,
            signInWithEmail,
            signUpWithEmail,
            signInWithPhone,
            verifyOtp,
            signInAsGuest,
            signOut
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
