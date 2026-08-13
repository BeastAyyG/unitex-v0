const fs = require('fs');
const path = require('path');
const os = require('os');
const { pool } = require('../db');

const LOCAL_STORE_DIR = process.env.VERCEL === '1'
    ? path.join(os.tmpdir(), 'unitex')
    : path.join(__dirname, '../../data');
const LOCAL_STORE_PATH = path.join(LOCAL_STORE_DIR, 'connections_vault.json');

if (!fs.existsSync(LOCAL_STORE_DIR)) {
    fs.mkdirSync(LOCAL_STORE_DIR, { recursive: true });
}

let dbAvailable = !!process.env.DATABASE_URL;

function readLocalStore() {
    if (!fs.existsSync(LOCAL_STORE_PATH)) {
        return { requests: [], connections: [], nextRequestId: 1 };
    }
    try {
        const raw = JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, 'utf8'));
        return {
            requests: Array.isArray(raw.requests) ? raw.requests : [],
            connections: Array.isArray(raw.connections) ? raw.connections : [],
            nextRequestId: Number.isInteger(raw.nextRequestId) ? raw.nextRequestId : 1,
        };
    } catch {
        return { requests: [], connections: [], nextRequestId: 1 };
    }
}

function writeLocalStore(data) {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data, null, 2));
}

function normalizePair(a, b) {
    return a < b ? [a, b] : [b, a];
}

function localSendRequest(senderId, receiverId) {
    const store = readLocalStore();
    if (senderId === receiverId) {
        throw new Error('Cannot connect to yourself');
    }

    const [u1, u2] = normalizePair(senderId, receiverId);
    const alreadyConnected = store.connections.some(c => c.user1_id === u1 && c.user2_id === u2);
    if (alreadyConnected) {
        throw new Error('Already connected');
    }

    const existingRequest = store.requests.find(r =>
        r.sender_id === senderId &&
        r.receiver_id === receiverId &&
        r.status === 'pending'
    );
    if (existingRequest) {
        throw new Error('Request already sent');
    }

    const request = {
        id: store.nextRequestId++,
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending',
        created_at: new Date().toISOString(),
    };

    store.requests.push(request);
    writeLocalStore(store);
    return request;
}

function localGetIncomingRequests(userId) {
    const store = readLocalStore();
    return store.requests
        .filter(r => r.receiver_id === userId && r.status === 'pending')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function localAcceptRequest(requestId, senderId, receiverId) {
    const store = readLocalStore();
    const req = store.requests.find(r => Number(r.id) === Number(requestId));
    if (!req) {
        throw new Error('Request not found');
    }

    req.status = 'accepted';
    req.updated_at = new Date().toISOString();

    const [u1, u2] = normalizePair(senderId, receiverId);
    if (!store.connections.some(c => c.user1_id === u1 && c.user2_id === u2)) {
        store.connections.push({
            user1_id: u1,
            user2_id: u2,
            created_at: new Date().toISOString(),
        });
    }

    writeLocalStore(store);
    return { success: true };
}

function localRejectRequest(requestId) {
    const store = readLocalStore();
    const req = store.requests.find(r => Number(r.id) === Number(requestId));
    if (!req) {
        throw new Error('Request not found');
    }
    req.status = 'rejected';
    req.updated_at = new Date().toISOString();
    writeLocalStore(store);
    return req;
}

function localGetConnectionStatus(myId, targetId) {
    const store = readLocalStore();
    const [u1, u2] = normalizePair(myId, targetId);
    if (store.connections.some(c => c.user1_id === u1 && c.user2_id === u2)) return 'connected';

    const sent = store.requests.some(r => r.sender_id === myId && r.receiver_id === targetId && r.status === 'pending');
    if (sent) return 'pending_sent';

    const received = store.requests.some(r => r.sender_id === targetId && r.receiver_id === myId && r.status === 'pending');
    if (received) return 'pending_received';

    return 'none';
}

function localRemoveConnection(u1_raw, u2_raw) {
    const store = readLocalStore();
    const [u1, u2] = normalizePair(u1_raw, u2_raw);
    store.connections = store.connections.filter(c => !(c.user1_id === u1 && c.user2_id === u2));
    store.requests = store.requests.filter(r =>
        !((r.sender_id === u1 && r.receiver_id === u2) || (r.sender_id === u2 && r.receiver_id === u1))
    );
    writeLocalStore(store);
    return { success: true };
}

/**
 * Send a connection request
 */
async function sendRequest(senderId, receiverId) {
    if (dbAvailable) {
        try {
            if (senderId === receiverId) {
                throw new Error('Cannot connect to yourself');
            }

            // Check if already connected
            const connCheck = await pool.query(
                'SELECT * FROM connections WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
                [senderId, receiverId]
            );
            if (connCheck.rows.length > 0) {
                throw new Error('Already connected');
            }

            // Check if request already exists
            const reqCheck = await pool.query(
                'SELECT * FROM connection_requests WHERE sender_id = $1 AND receiver_id = $2 AND status = \'pending\'',
                [senderId, receiverId]
            );
            if (reqCheck.rows.length > 0) {
                throw new Error('Request already sent');
            }

            // Create request
            const result = await pool.query(
                'INSERT INTO connection_requests (sender_id, receiver_id, status) VALUES ($1, $2, \'pending\') ON CONFLICT (sender_id, receiver_id) DO UPDATE SET status = \'pending\', created_at = CURRENT_TIMESTAMP RETURNING *',
                [senderId, receiverId]
            );
            return result.rows[0];
        } catch (err) {
            dbAvailable = false;
        }
    }

    return localSendRequest(senderId, receiverId);
}

/**
 * Get pending requests for a user
 */
async function getIncomingRequests(userId) {
    if (dbAvailable) {
        try {
            const result = await pool.query(
                'SELECT * FROM connection_requests WHERE receiver_id = $1 AND status = \'pending\' ORDER BY created_at DESC',
                [userId]
            );
            return result.rows;
        } catch (err) {
            dbAvailable = false;
        }
    }

    return localGetIncomingRequests(userId);
}

/**
 * Accept a connection request
 */
async function acceptRequest(requestId, senderId, receiverId) {
    if (dbAvailable) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Update request status
            await client.query(
                'UPDATE connection_requests SET status = \'accepted\' WHERE id = $1',
                [requestId]
            );

            // Create connection (bidirectional entry not needed since we check both ways, but user1 < user2 is a good pattern)
            const [u1, u2] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];
            await client.query(
                'INSERT INTO connections (user1_id, user2_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [u1, u2]
            );

            await client.query('COMMIT');
            return { success: true };
        } catch (err) {
            await client.query('ROLLBACK');
            dbAvailable = false;
        } finally {
            client.release();
        }
    }

    return localAcceptRequest(requestId, senderId, receiverId);
}

/**
 * Reject a connection request
 */
async function rejectRequest(requestId) {
    if (dbAvailable) {
        try {
            const result = await pool.query(
                'UPDATE connection_requests SET status = \'rejected\' WHERE id = $1 RETURNING *',
                [requestId]
            );
            return result.rows[0];
        } catch (err) {
            dbAvailable = false;
        }
    }

    return localRejectRequest(requestId);
}

/**
 * Get connection status between two users
 */
async function getConnectionStatus(myId, targetId) {
    if (dbAvailable) {
        try {
            // Check if connected
            const [u1, u2] = myId < targetId ? [myId, targetId] : [targetId, myId];
            const conn = await pool.query(
                'SELECT * FROM connections WHERE user1_id = $1 AND user2_id = $2',
                [u1, u2]
            );
            if (conn.rows.length > 0) return 'connected';

            // Check sent request
            const sent = await pool.query(
                'SELECT * FROM connection_requests WHERE sender_id = $1 AND receiver_id = $2 AND status = \'pending\'',
                [myId, targetId]
            );
            if (sent.rows.length > 0) return 'pending_sent';

            // Check received request
            const received = await pool.query(
                'SELECT * FROM connection_requests WHERE sender_id = $1 AND receiver_id = $2 AND status = \'pending\'',
                [targetId, myId]
            );
            if (received.rows.length > 0) return 'pending_received';

            return 'none';
        } catch (err) {
            dbAvailable = false;
        }
    }

    return localGetConnectionStatus(myId, targetId);
}

/**
 * Remove a connection
 */
async function removeConnection(u1_raw, u2_raw) {
    if (dbAvailable) {
        try {
            const [u1, u2] = u1_raw < u2_raw ? [u1_raw, u2_raw] : [u2_raw, u1_raw];
            await pool.query(
                'DELETE FROM connections WHERE user1_id = $1 AND user2_id = $2',
                [u1, u2]
            );
            // Also clean up any lingering requests
            await pool.query(
                'DELETE FROM connection_requests WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)',
                [u1, u2]
            );
            return { success: true };
        } catch (err) {
            dbAvailable = false;
        }
    }

    return localRemoveConnection(u1_raw, u2_raw);
}

module.exports = {
    sendRequest,
    getIncomingRequests,
    acceptRequest,
    rejectRequest,
    getConnectionStatus,
    removeConnection
};
