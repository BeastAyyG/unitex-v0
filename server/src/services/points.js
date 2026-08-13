const fs = require('fs');
const path = require('path');
const os = require('os');
const { pool } = require('../db');

// Local storage fallback for development
const VAULT_DIR = process.env.VERCEL === '1'
    ? path.join(os.tmpdir(), 'unitex')
    : path.join(__dirname, '../../data');
const VAULT_PATH = path.join(VAULT_DIR, 'points_vault.json');
if (!fs.existsSync(VAULT_DIR)) {
    fs.mkdirSync(VAULT_DIR, { recursive: true });
}

function readVault() {
    if (!fs.existsSync(VAULT_PATH)) return {};
    try {
        return JSON.parse(fs.readFileSync(VAULT_PATH, 'utf8'));
    } catch { return {}; }
}

function writeVault(data) {
    fs.writeFileSync(VAULT_PATH, JSON.stringify(data, null, 2));
}

/**
 * Rules Engine for VP/EXP Distribution
 */
const Rules = {
    POST_CREATED: { exp: 50, vp: 5 },
    CONTENT_LIKED: { exp: 10, vp: 1 },
    REFERRAL_SUCCESS: { exp: 500, vp: 100 },
    DAILY_LOGIN: { exp: 100, vp: 0 },
    PROFILE_COMPLETED: { exp: 200, vp: 50 },
};

async function awardPoints(uid, action) {
    const rule = Rules[action];
    if (!rule) throw new Error('Invalid action protocol');

    try {
        console.log(`Awarding ${action} to ${uid}...`);
        // Attempt Postgres Update
        const query = `
            INSERT INTO user_points (uid, exp, vp, last_updated)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (uid) 
            DO UPDATE SET 
                exp = user_points.exp + EXCLUDED.exp,
                vp = user_points.vp + EXCLUDED.vp,
                last_updated = NOW()
            RETURNING *;
        `;
        const result = await pool.query(query, [uid, rule.exp, rule.vp]);
        return result.rows[0];
    } catch (err) {
        process.env.DEBUG && console.warn('Database unreachable. Falling back to JSON Vault.');
        
        // JSON Vault Fallback
        const vault = readVault();
        if (!vault[uid]) vault[uid] = { uid, exp: 0, vp: 0, last_updated: new Date() };
        
        vault[uid].exp += rule.exp;
        vault[uid].vp += rule.vp;
        vault[uid].last_updated = new Date();
        
        writeVault(vault);
        return vault[uid];
    }
}

async function getStats(uid) {
    try {
        const result = await pool.query('SELECT * FROM user_points WHERE uid = $1', [uid]);
        if (result.rows[0]) return result.rows[0];
        throw new Error('Not found in DB');
    } catch (err) {
        const vault = readVault();
        return vault[uid] || { uid, exp: 0, vp: 0 };
    }
}

module.exports = {
    awardPoints,
    getStats,
    Rules
};
