require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { pool, initializeDatabase } = require('./db');
const scraper = require('./scraper');
const { requireFirebaseAuth, requireInternalKey } = require('./auth');
const { createDownloadUrl, createUploadUrl } = require('./services/storage');

const app = express();
const port = process.env.PORT || 5002;

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const MAX_MEDIA_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/3gpp', 'video/x-m4v',
    'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac', 'audio/flac', 'audio/x-m4a',
]);

function safeMediaName(name) {
    return String(name || 'file')
        .normalize('NFKC')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/^\.+/, '')
        .slice(-120) || 'file';
}

function safeUserPath(uid) {
    return String(uid).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function rateLimit({ windowMs, max }) {
    const requests = new Map();
    return (req, res, next) => {
        const key = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const state = requests.get(key) || { count: 0, resetAt: now + windowMs };
        if (now > state.resetAt) {
            state.count = 0;
            state.resetAt = now + windowMs;
        }
        state.count += 1;
        requests.set(key, state);
        res.set('RateLimit-Limit', String(max));
        res.set('RateLimit-Remaining', String(Math.max(0, max - state.count)));
        if (state.count > max) {
            return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
        }
        next();
    };
}

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-site',
    });
    if (process.env.VERCEL_ENV === 'production') {
        res.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }
    next();
});

app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Origin is not allowed by CORS policy.'));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Internal-Api-Key'],
    maxAge: 86400,
}));
app.use(express.json({ limit: '64kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, max: 120 }));

// Request logger (debug only)
app.use((req, res, next) => {
    if (process.env.DEBUG) console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Private media storage. The Firebase-authenticated server creates the short-lived
// upload URL, while the browser sends the file directly to Supabase Storage.
app.post('/api/media/upload-url', requireFirebaseAuth, rateLimit({ windowMs: 60_000, max: 10 }), async (req, res) => {
    const { name, type, size } = req.body || {};
    const fileSize = Number(size);

    if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'A file name is required.' });
    }
    if (!ALLOWED_MEDIA_TYPES.has(type)) {
        return res.status(415).json({ error: 'This media type is not supported.' });
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_MEDIA_FILE_SIZE) {
        return res.status(413).json({ error: 'Media files must be 50 MB or smaller.' });
    }

    const path = `${safeUserPath(req.user.uid)}/${crypto.randomUUID()}-${safeMediaName(name)}`;

    try {
        const data = await createUploadUrl(path);
        res.json({
            path,
            token: data.token,
            signedUploadUrl: data.signedUrl,
            filename: safeMediaName(name),
        });
    } catch (error) {
        console.error('[Media] Unable to create upload URL:', error.message);
        const status = error.message?.includes('not configured') ? 503 : 500;
        res.status(status).json({ error: status === 503 ? error.message : 'Unable to prepare media upload.' });
    }
});

app.post('/api/media/finalize', requireFirebaseAuth, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
    const { path, fileHash, mediaType } = req.body || {};
    const ownerPrefix = `${safeUserPath(req.user.uid)}/`;

    if (typeof path !== 'string' || !path.startsWith(ownerPrefix) || path.includes('..')) {
        return res.status(403).json({ error: 'You can only finalize your own media.' });
    }
    if (!['image', 'video', 'audio'].includes(mediaType)) {
        return res.status(400).json({ error: 'A valid media type is required.' });
    }

    try {
        const mediaURL = await createDownloadUrl(path);
        const filename = path.slice(path.lastIndexOf('/') + 1);
        res.json({
            success: true,
            docId: path,
            filename,
            mediaURL,
            mediaType,
            fileHash: typeof fileHash === 'string' && /^[a-f0-9]{64}$/i.test(fileHash) ? fileHash : '',
            txHash: null,
        });
    } catch (error) {
        console.error('[Media] Unable to finalize upload:', error.message);
        res.status(500).json({ error: 'The uploaded media could not be finalized.' });
    }
});

// Rewards & Points System
const pointsService = require('./services/points');
const connectionsService = require('./services/connections');

// Connection System API
app.post('/api/connect/send', requireFirebaseAuth, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
    const { receiverId } = req.body;
    try {
        const result = await connectionsService.sendRequest(req.user.uid, receiverId);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/connect/requests/:uid', requireFirebaseAuth, async (req, res) => {
    if (req.params.uid !== req.user.uid) {
        return res.status(403).json({ error: 'You can only view your own connection requests.' });
    }
    try {
        const requests = await connectionsService.getIncomingRequests(req.params.uid);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/connect/accept', requireFirebaseAuth, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
    const { requestId } = req.body;
    try {
        const result = await connectionsService.acceptRequest(requestId, req.user.uid);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/connect/reject', requireFirebaseAuth, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
    const { requestId } = req.body;
    try {
        const result = await connectionsService.rejectRequest(requestId, req.user.uid);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/connect/status', requireFirebaseAuth, async (req, res) => {
    const { receiverId } = req.query;
    try {
        const status = await connectionsService.getConnectionStatus(req.user.uid, receiverId);
        res.json({ status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/connect/remove', requireFirebaseAuth, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
    const { userId } = req.body;
    try {
        const result = await connectionsService.removeConnection(req.user.uid, userId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/points/:uid', requireFirebaseAuth, async (req, res) => {
    if (req.params.uid !== req.user.uid) {
        return res.status(403).json({ error: 'You can only view your own points.' });
    }
    try {
        const stats = await pointsService.getStats(req.params.uid);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/points/award', requireInternalKey, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
    const { uid, action } = req.body;
    try {
        const result = await pointsService.awardPoints(uid, action);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Basic error handling
app.use((err, req, res, next) => {
    if (err.message === 'Origin is not allowed by CORS policy.') {
        return res.status(403).json({ error: err.message });
    }
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Vercel runs this module as a serverless function, so we export the Express app.
// Keep the local listener only for direct Node execution.
async function bootstrap() {
    await initializeDatabase();
    if (process.env.DEBUG) console.log(`Server ready on port ${port}`);
}

bootstrap().catch((err) => {
    console.error('[Server] Failed to bootstrap:', err);
});

if (require.main === module) {
    app.listen(port, () => {
        if (process.env.DEBUG) console.log(`Server running on port ${port}`);
    });
}

module.exports = app;
