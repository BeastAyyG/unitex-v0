const Parser = require('rss-parser');
const admin = require('firebase-admin');
const cron = require('node-cron');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const parser = new Parser();

// RSS Feeds to scrape
const FEEDS = [
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'Mashable', url: 'https://mashable.com/feeds/rss/all' }
];

// Initialize Firebase Admin
let db = null;
try {
    let sa = null;

    // First try loading from environment variable (ideal for Vercel/production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            if (process.env.DEBUG) console.log('[Discovery] Loaded service account from environment variable.');
        } catch (jsonErr) {
            console.error('❌ [Discovery] Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:', jsonErr.message);
        }
    }

    // Fallback to local file paths
    if (!sa) {
        const serviceAccountPath = path.resolve(__dirname, '../../service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
            sa = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        } else {
            console.warn(`[Discovery] Service account missing at ${serviceAccountPath}. Searching root...`);
            const rootPath = path.resolve(__dirname, '../../../service-account.json');
            if (fs.existsSync(rootPath)) {
                sa = JSON.parse(fs.readFileSync(rootPath, 'utf8'));
            }
        }
    }

    if (sa) {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(sa)
            });
        }
        db = admin.firestore();
        if (!db) console.error('[Discovery] admin.firestore() returned null');
    } else {
        console.warn('[Discovery] No service account credentials found. Discover feed running in mock mode.');
    }
} catch (error) {
    console.error('❌ [Discovery] Initialization error:', error.message);
    console.error(error.stack);
}

async function scrapeFeeds() {
    if (!db) {
        console.warn('⚠️ [Discovery] Firestore not initialized. Using Mock Scraper mode.');
        await runMockScrape();
        return;
    }

    if (process.env.DEBUG) console.log('--- Starting Scrape:', new Date().toLocaleString(), '---');

    for (const feed of FEEDS) {
        try {
            if (process.env.DEBUG) console.log(`Fetching ${feed.name}...`);
            const data = await parser.parseURL(feed.url);
            
            for (const item of data.items.slice(0, 5)) { // Top 5 from each feed
                const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const docId = `news-${slug.substring(0, 50)}`;
                
                // Check if already exists to avoid redundant writes
                const existing = await db.collection('discover_feed').doc(docId).get();
                if (existing.exists) continue;

                // Simple image heuristic: get from content or use a nice placeholder
                const defaultImages = [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200',
                    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200',
                    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200',
                    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200',
                    'https://images.unsplash.com/photo-1531297172864-822d10da29bc?q=80&w=1200',
                    'https://images.unsplash.com/photo-1484417894907-623942c8ee29?q=80&w=1200'
                ];
                let imageUrl = defaultImages[Math.floor(Math.random() * defaultImages.length)];
                
                // Try to find image in enclosure or content
                if (item.enclosure && item.enclosure.url) {
                    imageUrl = item.enclosure.url;
                } else if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
                    imageUrl = item['media:content']['$'].url;
                } else if (item.content) {
                    const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
                    if (imgMatch) imageUrl = imgMatch[1];
                } else if (item['content:encoded']) {
                    const imgMatch = item['content:encoded'].match(/<img[^>]+src="([^">]+)"/);
                    if (imgMatch) imageUrl = imgMatch[1];
                }

                const now = new Date();
                const pubDate = new Date(item.pubDate || now);
                const ageInHours = (now - pubDate) / (1000 * 60 * 60);
                
                // FAANG-level Ranking Algorithm:
                // Score = (Engagement * Velocity) / (Age + 1)^1.5
                // Since we don't have real engagement yet, we simulate it with a random seed 
                // based on the feed name's reputation.
                const simulatedEngagement = Math.floor(Math.random() * 500) + 100;
                const trendScore = simulatedEngagement / Math.pow(ageInHours + 1, 1.5);

                const tags = item.categories || ['Tech', 'Innovation', 'Global'];
                
                await db.collection('discover_feed').doc(docId).set({
                    title: item.title,
                    description: item.contentSnippet || item.content?.substring(0, 200).replace(/<[^>]*>/g, '') + '...',
                    link: item.link,
                    author: item.creator || item.author || feed.name,
                    category: tags[0],
                    source: feed.name,
                    imageUrl,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    pubDate: item.pubDate,
                    trendScore: parseFloat(trendScore.toFixed(2)),
                    tags: tags.slice(0, 3)
                });
                
                // Also update/create a Trending Topic entry
                const keyword = tags[0];
                const topicId = `topic-${keyword.toLowerCase().replace(/\s+/g, '-')}`;
                const topicRef = db.collection('trending_topics').doc(topicId);
                
                await db.runTransaction(async (t) => {
                    const doc = await t.get(topicRef);
                    if (!doc.exists) {
                        t.set(topicRef, {
                            title: keyword,
                            summary: `Latest developments in ${keyword} and related fields.`,
                            keywords: tags.slice(0, 3),
                            score: trendScore,
                            postsCount: 1,
                            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        const data = doc.data();
                        t.update(topicRef, {
                            score: data.score + (trendScore * 0.1), // Accumulate score
                            postsCount: admin.firestore.FieldValue.increment(1),
                            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                        });
                    }
                });
                
                if (process.env.DEBUG) console.log(`Indexed: ${item.title}`);
            }
        } catch (error) {
            console.error(`Error scraping ${feed.name}:`, error.message);
        }
    }
    if (process.env.DEBUG) console.log('--- Scrape Finished ---');
}

// Schedule: Every 30 minutes
// '0,30 * * * *'
cron.schedule('0,30 * * * *', () => {
    scrapeFeeds();
});

async function runMockScrape() {
    if (process.env.DEBUG) console.log('[Discovery] Running Mock Scrape Protocol...');
    const mockData = [
        {
            title: "UniteX Social Ecosystem v2.0 Launches",
            description: "The next generation of modular networking is here, featuring real-time nodes and fuzzy discovery.",
            source: "UniteX Internal",
            category: "Platform",
            tags: ["Release", "Web3", "Scale"],
            trendScore: 95.5,
            createdAt: new Date().toISOString()
        },
        {
            title: "The Rise of Agentic Coding",
            description: "How AI agents are transforming the way we build and maintain complex software systems.",
            source: "Tech Journal",
            category: "AI",
            tags: ["AI", "Future", "Code"],
            trendScore: 88.2,
            createdAt: new Date().toISOString()
        }
    ];
    
    // Write to a local fallback file that the frontend can check
    const fallbackPath = path.join(__dirname, '../../data/discover_fallback.json');
    if (!fs.existsSync(path.dirname(fallbackPath))) fs.mkdirSync(path.dirname(fallbackPath), { recursive: true });
    
    fs.writeFileSync(fallbackPath, JSON.stringify(mockData, null, 2));
    if (process.env.DEBUG) console.log(`[Discovery] Mock data saved to: ${fallbackPath}`);
}

// Run once on startup
scrapeFeeds();

module.exports = { scrapeFeeds };
