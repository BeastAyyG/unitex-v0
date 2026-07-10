require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./db');
const scraper = require('./scraper');

const app = express();
const port = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Request logger (debug only)
app.use((req, res, next) => {
    if (process.env.DEBUG) console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Rewards & Points System
const pointsService = require('./services/points');
const connectionsService = require('./services/connections');

// Connection System API
app.post('/api/connect/send', async (req, res) => {
    const { senderId, receiverId } = req.body;
    try {
        const result = await connectionsService.sendRequest(senderId, receiverId);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/connect/requests/:uid', async (req, res) => {
    try {
        const requests = await connectionsService.getIncomingRequests(req.params.uid);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/connect/accept', async (req, res) => {
    const { requestId, senderId, receiverId } = req.body;
    try {
        const result = await connectionsService.acceptRequest(requestId, senderId, receiverId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/connect/reject', async (req, res) => {
    const { requestId } = req.body;
    try {
        const result = await connectionsService.rejectRequest(requestId);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/connect/status', async (req, res) => {
    const { senderId, receiverId } = req.query;
    try {
        const status = await connectionsService.getConnectionStatus(senderId, receiverId);
        res.json({ status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/connect/remove', async (req, res) => {
    const { user1Id, user2Id } = req.body;
    try {
        const result = await connectionsService.removeConnection(user1Id, user2Id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/points/:uid', async (req, res) => {
    try {
        const stats = await pointsService.getStats(req.params.uid);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/points/award', async (req, res) => {
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
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, async () => {
    if (process.env.DEBUG) console.log(`Server running on port ${port}`);
    await initializeDatabase();
});
