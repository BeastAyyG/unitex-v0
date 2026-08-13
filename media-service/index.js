/**
 * UniteX Media Service
 * ─────────────────────────────────────────────
 * Responsibilities:
 *  1. Accept file uploads (images/videos) via POST /upload
 *  2. Compress images using sharp
 *  3. Store files in Docker volume (/app/uploads)
 *  4. Generate SHA-256 hash for blockchain proof
 *  5. Save metadata to Firebase Firestore
 *  6. Write hash + owner (usercode) to blockchain
 */

import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';

import { initFirebase, saveMediaMetadata, updateBlockchainProof } from './services/firebase.js';
import { storeMediaRecord } from './services/blockchain.js';

dotenv.config();

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 4001;
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/3gpp', 'video/x-m4v',
    'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac', 'audio/flac', 'audio/x-m4a',
]);
const MIME_EXTENSIONS = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'video/ogg': '.ogv',
    'video/3gpp': '.3gp',
    'video/x-m4v': '.m4v',
    'audio/mpeg': '.mp3',
    'audio/mp4': '.m4a',
    'audio/ogg': '.ogg',
    'audio/wav': '.wav',
    'audio/webm': '.weba',
    'audio/aac': '.aac',
    'audio/flac': '.flac',
    'audio/x-m4a': '.m4a',
};

function getMediaType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return null;
}

app.use(cors());
app.use(express.json());

// Ensure upload directory exists (backed by Docker volume)
const UPLOAD_DIR = '/app/uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Initialize Firebase Admin
initFirebase();

// ─── Multer Config (in-memory, then we process with sharp) ────────────────────
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: MAX_UPLOAD_BYTES,
    },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    }
});

// ─── Helper: Hash file buffer ─────────────────────────────────────────────────
function hashBuffer(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ─── ROUTE: Health check ──────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'unitex-media-service', ts: Date.now() });
});

// ─── ROUTE: Upload media ──────────────────────────────────────────────────────
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { usercode, uid } = req.body;

        if (!usercode || !uid) {
            return res.status(400).json({ error: 'usercode and uid are required' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const mediaType = getMediaType(req.file.mimetype);
        const isVideo = mediaType === 'video';
        const timestamp = Date.now();
        const ext = mediaType === 'image' ? '.webp' : (MIME_EXTENSIONS[req.file.mimetype] || '.bin');
        const safeUsercode = String(usercode).replace(/[^a-z0-9_-]/gi, '_').slice(0, 64) || 'user';
        const filename = `${safeUsercode}_${timestamp}${ext}`;
        const filePath = path.join(UPLOAD_DIR, filename);

        // ── Process file ──────────────────────────────────────────────────────
        let finalBuffer = req.file.buffer;

        if (mediaType === 'image') {
            // Compress and convert image to WebP
            finalBuffer = await sharp(req.file.buffer)
                .resize({ width: 1920, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();
        }

        // ── Write to Docker volume ────────────────────────────────────────────
        fs.writeFileSync(filePath, finalBuffer);

        // ── Generate SHA-256 hash ─────────────────────────────────────────────
        const fileHash = hashBuffer(finalBuffer);
        const fileSizeBytes = finalBuffer.byteLength;
        const mediaURL = `/media/${filename}`; // served by nginx or this express server

        // ── Duplicate detection ───────────────────────────────────────────────
        // (Future: query Firestore for existing hash before writing)

        // ── Save metadata to Firestore ─────────────────────────────────────────
        const docId = await saveMediaMetadata({
            uid,
            usercode,
            filename,
            mediaURL,
            fileHash,
            fileSizeBytes,
            mimeType: req.file.mimetype,
            mediaType,
            isVideo,
            createdAt: new Date().toISOString(),
        });

        // ── Store proof on blockchain ─────────────────────────────────────────
        let txHash = null;
        try {
            txHash = await storeMediaRecord({ fileHash, usercode, docId });
            if (txHash) {
                await updateBlockchainProof(docId, txHash);
                console.log(`[Blockchain] Proof updated in Firestore: ${txHash}`);
            }
        } catch (err) {
            // Blockchain is best-effort — don't fail the upload for it
            console.warn('[Blockchain] Store failed (non-fatal):', err.message);
        }

        res.json({
            success: true,
            docId,
            filename,
            mediaURL,
            fileHash,
            txHash,
            mediaType,
        });

    } catch (err) {
        console.error('[Upload Error]', err);
        res.status(500).json({ error: err.message || 'Upload failed' });
    }
});

// ─── ROUTE: Serve uploaded files ──────────────────────────────────────────────
app.use('/media', express.static(UPLOAD_DIR, {
    maxAge: '1y',
    immutable: true,
}));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[Unhandled Error]', err);
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Media files must be 100 MB or smaller.' });
    }
    if (err.message?.startsWith('Unsupported file type:')) {
        return res.status(415).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Upload failed' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[UniteX Media Service] Running on port ${PORT}`);
});
