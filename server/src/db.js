const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function initializeDatabase() {
    if (!process.env.DATABASE_URL) {
        console.warn('[Database] DATABASE_URL is not set. Database operations will fail.');
        return;
    }

    try {
        const client = await pool.connect();
        console.log('[Database] Connected to PostgreSQL successfully.');
        
        try {
            const tableCheck = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'users'
                );
            `);
            
            const schemaExists = tableCheck.rows[0].exists;
            if (!schemaExists) {
                console.log('[Database] Schema not found. Initializing tables...');
                const schemaPath = path.join(__dirname, 'schema.sql');
                if (fs.existsSync(schemaPath)) {
                    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
                    await client.query(schemaSql);
                    console.log('[Database] Schema initialized successfully.');
                } else {
                    console.warn('[Database] schema.sql file not found at:', schemaPath);
                }
            } else {
                console.log('[Database] Schema already exists. Skipping initialization.');
            }
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('[Database] Failed to connect or initialize PostgreSQL:', err.message);
    }
}

module.exports = { pool, initializeDatabase };
