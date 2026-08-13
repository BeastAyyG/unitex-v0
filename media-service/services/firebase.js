/**
 * Firebase Admin Service
 * ─────────────────────────────────────────────
 * Initializes firebase-admin and exposes helpers
 * for writing media metadata to Firestore.
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';

let db = null;

/**
 * Initialize Firebase Admin SDK.
 * Uses GOOGLE_APPLICATION_CREDENTIALS env variable
 * pointing to a service account JSON file.
 */
export function initFirebase() {
    if (admin.apps.length > 0) return;

    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });

    db = admin.firestore();
    console.log('[Firebase] Admin initialized, project:', process.env.FIREBASE_PROJECT_ID);
}

/**
 * Save media upload metadata to Firestore.
 * Collection: media/{docId}
 * Also appended to users/{uid}/media subcollection.
 *
 * @param {object} data
 * @returns {string} Firestore document ID
 */
export async function saveMediaMetadata(data) {
    if (!db) throw new Error('Firebase not initialized');

    const { uid, usercode, filename, mediaURL, fileHash, fileSizeBytes, mimeType, mediaType, isVideo, createdAt } = data;

    const payload = {
        uid,
        usercode,          // ← The primary identity reference (4-char alphanumeric)
        filename,
        mediaURL,
        fileHash,          // SHA-256 — used for blockchain proof + duplicate detection
        fileSizeBytes,
        mimeType,
        mediaType,
        isVideo,
        createdAt,
        blockchainProof: null, // Updated after tx is confirmed
    };

    // Write to global media collection
    const ref = await db.collection('media').add(payload);

    // Also index under the user's own subcollection for fast lookups
    await db.collection('users').doc(uid).collection('media').doc(ref.id).set({
        filename,
        mediaURL,
        fileHash,
        createdAt,
    });

    console.log(`[Firebase] Media metadata saved: ${ref.id} for user ${usercode}`);
    return ref.id;
}

/**
 * Update the blockchainProof field once the TX hash is known.
 */
export async function updateBlockchainProof(docId, txHash) {
    if (!db) return;
    await db.collection('media').doc(docId).update({ blockchainProof: txHash });
}
