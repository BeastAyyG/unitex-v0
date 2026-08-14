/**
 * Upload media through authenticated, short-lived Supabase Storage URLs.
 *
 * The Firebase-authenticated API prepares the path and signs the upload, so
 * Supabase's secret key never reaches the browser. The old Docker service is
 * kept as a local-development fallback while deployments are migrated.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/useAuth';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { getMediaType, validateMediaFile, type MediaType } from '@/lib/media';

const API_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
const MEDIA_SERVICE_URL = import.meta.env.VITE_MEDIA_SERVICE_URL?.trim().replace(/\/+$/, '');
const SUPABASE_BUCKET = 'media';

interface UploadResult {
    success: boolean;
    docId: string;
    filename: string;
    mediaURL: string;
    mediaType?: MediaType;
    fileHash: string;
    txHash: string | null;
}

interface UploadPreparation {
    path: string;
    token: string;
    filename: string;
}

async function readJson(response: Response, fallback: string) {
    let payload: { error?: string } & Record<string, unknown> = {};
    try {
        payload = await response.json();
    } catch {
        // Keep the caller-facing error stable when an upstream returns HTML.
    }
    if (!response.ok) throw new Error(payload.error || fallback);
    return payload;
}

async function hashFile(file: File) {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
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
        const mediaType = getMediaType(file);
        if (validationError) {
            setError(validationError);
            return null;
        }
        if (!mediaType) {
            setError('This media type is not supported.');
            return null;
        }

        setUploading(true);
        setProgress(0);
        setError(null);
        setResult(null);

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error('Your session has expired. Please sign in again.');

            if (API_URL && supabase) {
                setProgress(10);
                const preparationResponse = await fetch(`${API_URL}/api/media/upload-url`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                    }),
                });
                const preparation = await readJson(preparationResponse, 'Unable to prepare media upload.') as UploadPreparation;

                const { error: uploadError } = await supabase.storage
                    .from(SUPABASE_BUCKET)
                    .uploadToSignedUrl(preparation.path, preparation.token, file, {
                        contentType: file.type || 'application/octet-stream',
                    });
                if (uploadError) throw uploadError;

                setProgress(85);
                const fileHash = await hashFile(file);
                const finalizeResponse = await fetch(`${API_URL}/api/media/finalize`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fileHash,
                        mediaType,
                        path: preparation.path,
                    }),
                });
                const finalized = await readJson(finalizeResponse, 'The uploaded media could not be finalized.') as UploadResult;
                const response = { ...finalized, fileHash: finalized.fileHash || fileHash };
                setResult(response);
                setProgress(100);
                return response;
            }

            if (!MEDIA_SERVICE_URL) {
                throw new Error('Media uploads are not configured. Set the Supabase storage variables in the deployment environment.');
            }

            // Local fallback for the existing Docker media service.
            const formData = new FormData();
            formData.append('file', file);
            const response = await new Promise<UploadResult>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${MEDIA_SERVICE_URL}/upload`);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        setProgress(Math.round((event.loaded / event.total) * 100));
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
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Upload failed';
            setError(message);
            console.error('[useMediaUpload]', err);
            return null;
        } finally {
            setUploading(false);
        }
    }, [currentUser]);

    return { upload, uploading, progress, result, error };
}
