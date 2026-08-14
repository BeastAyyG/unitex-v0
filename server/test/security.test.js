process.env.VERCEL = '1';

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const http = require('node:http');
const app = require('../src/index');

let server;
let baseUrl;

function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(`${baseUrl}${path}`, options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on('error', reject);
        req.end(options.body);
    });
}

before(() => new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
    });
}));

after(() => new Promise((resolve) => server.close(resolve)));

test('health endpoint sends defensive headers', async () => {
    const response = await request('/api/health');
    assert.equal(response.status, 200);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['x-frame-options'], 'DENY');
    assert.equal(response.headers['referrer-policy'], 'strict-origin-when-cross-origin');
});

test('connection mutations reject unauthenticated requests', async () => {
    const response = await request('/api/connect/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
    });
    assert.equal(response.status, 401);
    assert.match(response.body, /Firebase ID token/i);
});

test('points cannot be awarded by a public browser request', async () => {
    const response = await request('/api/points/award', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
    });
    assert.equal(response.status, 403);
});

test('media upload preparation rejects unauthenticated requests', async () => {
    const response = await request('/api/media/upload-url', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'photo.png', size: 1024, type: 'image/png' }),
    });
    assert.equal(response.status, 401);
    assert.match(response.body, /Firebase ID token/i);
});
