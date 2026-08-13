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
import { validateMediaFile, type MediaType } from '@/lib/media';

const MEDIA_SERVICE_URL = import.meta.env.VITE_MEDIA_SERVICE_URL?.trim().replace(/\/+$/, '');

interface UploadResult {
    success: boolean;
    docId: string;
    filename: string;
    mediaURL: string;
    mediaType?: MediaType;
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

        const validationError = validateMediaFile(file);
        if (validationError) {
            setError(validationError);
            return null;
        }

        setUploading(true);
        setProgress(0);
        setError(null);
        setResult(null);

        try {
            if (!MEDIA_SERVICE_URL) {
                throw new Error('Media uploads are not configured. Set VITE_MEDIA_SERVICE_URL in the deployment environment.');
            }

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
                    let payload: UploadResult & { error?: string };
                    try {
                        payload = JSON.parse(xhr.responseText);
                    } catch {
                        reject(new Error('The media service returned an invalid response.'));
                        return;
                    }
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve({
                            ...payload,
                            mediaURL: new URL(payload.mediaURL, `${MEDIA_SERVICE_URL}/`).toString(),
                        });
                    } else {
                        reject(new Error(payload.error || 'Upload failed'));
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
