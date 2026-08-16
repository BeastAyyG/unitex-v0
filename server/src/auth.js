const admin = require('firebase-admin');

function getAdminAuth() {
    if (admin.apps.length > 0) return admin.auth();

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) return null;

    try {
        const credential = admin.credential.cert(JSON.parse(serviceAccountJson));
        admin.initializeApp({ credential });
        return admin.auth();
    } catch (error) {
        console.error('[Auth] Firebase Admin configuration is invalid:', error.message);
        return null;
    }
}

function getBearerToken(header) {
    if (!header || !header.startsWith('Bearer ')) return null;
    const token = header.slice('Bearer '.length).trim();
    return token || null;
}

async function requireFirebaseAuth(req, res, next) {
    const token = getBearerToken(req.get('authorization'));
    if (!token) {
        return res.status(401).json({ error: 'A Firebase ID token is required.' });
    }

    const firebaseAuth = getAdminAuth();
    if (!firebaseAuth) {
        return res.status(503).json({ error: 'Authentication is not configured on this service.' });
    }

    try {
        req.user = await firebaseAuth.verifyIdToken(token, true);
        next();
    } catch {
        res.status(401).json({ error: 'The Firebase ID token is invalid or expired.' });
    }
}

function requireInternalKey(req, res, next) {
    const configuredKey = process.env.INTERNAL_API_KEY;
    if (!configuredKey || req.get('x-internal-api-key') !== configuredKey) {
        return res.status(403).json({ error: 'This endpoint is reserved for trusted services.' });
    }
    next();
}

module.exports = { requireFirebaseAuth, requireInternalKey };
