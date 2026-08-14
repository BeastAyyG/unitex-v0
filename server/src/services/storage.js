const { createClient } = require('@supabase/supabase-js');

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const client = supabaseUrl && supabaseSecretKey
    ? createClient(supabaseUrl, supabaseSecretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
    : null;

function assertConfigured() {
    if (!client) {
        throw new Error('Supabase storage is not configured on this service.');
    }
}

async function createUploadUrl(path) {
    assertConfigured();
    const { data, error } = await client.storage
        .from(bucket)
        .createSignedUploadUrl(path, { upsert: false });

    if (error) throw error;
    return data;
}

async function createDownloadUrl(path, expiresIn = 3600) {
    assertConfigured();
    const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
}

module.exports = {
    bucket,
    createDownloadUrl,
    createUploadUrl,
};
