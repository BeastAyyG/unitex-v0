/**
 * useMediaUpload — React hook for uploading media to the Docker media service.
 *
 * Flow:
 *   1. User selects a file
 *   2. POST to media service (/upload) with file + usercode + uid
 *   3. Media service: compresses → saves to Docker volume → saves metadata to Firestore → writes hash to blockchain
 *   4. Returns: mediaURL, fileHash, txHash (blockchain proof)
 *
 * Usage:
 *   const { upload, uploading, progress, result, error } = useMediaUpload();
 *   await upload(file);
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/useAuth';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const MEDIA_SERVICE_URL = import.meta.env.VITE_MEDIA_SERVICE_URL || 'http://localhost:4000';

interface UploadResult {
    success: boolean;
    docId: string;
    filename: string;
    mediaURL: string;
    fileHash: string;
    txHash: string | null;
}

export function useMediaUpload() {
    const { currentUser } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
        if (!currentUser) {
            setError('You must be signed in to upload media.');
            return null;
        }

        setUploading(true);
        setProgress(0);
        setError(null);
        setResult(null);

        try {
            // ── Get usercode from Firestore ──────────────────────────────────
            const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
            const usercode = userSnap.data()?.usercode;

            if (!usercode) throw new Error('Usercode not found. Please complete profile setup.');

            // ── Build form data ──────────────────────────────────────────────
            const formData = new FormData();
            formData.append('file', file);
            formData.append('uid', currentUser.uid);
            formData.append('usercode', usercode);

            // ── Upload with XHR for progress tracking ────────────────────────
            const response = await new Promise<UploadResult>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${MEDIA_SERVICE_URL}/upload`);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        setProgress(Math.round((e.loaded / e.total) * 100));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        const err = JSON.parse(xhr.responseText);
                        reject(new Error(err.error || 'Upload failed'));
                    }
                };

                xhr.onerror = () => reject(new Error('Network error during upload'));
                xhr.send(formData);
            });

            setResult(response);
            setProgress(100);
            return response;

        } catch (err: any) {
            const msg = err.message || 'Upload failed';
            setError(msg);
            console.error('[useMediaUpload]', err);
            return null;
        } finally {
            setUploading(false);
        }
    }, [currentUser]);

    return { upload, uploading, progress, result, error };
}
