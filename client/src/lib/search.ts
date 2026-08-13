import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase';

export interface SearchResult {
    id: string;
    type: 'user' | 'post' | 'topic';
    title: string;
    subtitle?: string;
    image?: string;
    score: number;
    data: any;
}

// Custom Fuzzy Search Algorithm
function fuzzyMatch(text: string, query: string): number {
    if (!text || !query) return 1;
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    
    if (t === q) return 0;
    if (t.startsWith(q)) return 0.1;
    if (t.includes(q)) return 0.3;
    
    // Simple substring distance for multi-word queries
    const qWords = q.split(/\s+/);
    const matches = qWords.filter(word => t.includes(word)).length;
    if (matches > 0) return 0.5 - (matches / qWords.length) * 0.2;
    
    return 1; // No match
}

export async function performGlobalSearch(term: string): Promise<SearchResult[]> {
    if (!term || term.length < 2) return [];

    try {
        const [usersSnap, postsSnap, topicsSnap] = await Promise.all([
            getDocs(query(collection(db, 'users'), limit(50))),
            getDocs(query(collection(db, 'posts'), limit(50))),
            getDocs(query(collection(db, 'trending_topics'), limit(50)))
        ]);

        const users = usersSnap.docs.map(d => ({ id: d.id, type: 'user', ...d.data() }));
        const posts = postsSnap.docs.map(d => ({ id: d.id, type: 'post', ...d.data() }));
        const topics = topicsSnap.docs.map(d => ({ id: d.id, type: 'topic', ...d.data() }));

        const allData = [...users, ...posts, ...topics];
        const results = allData
            .map(item => {
                const data = item as any;
                const fields = [
                    data.displayName,
                    data.username,
                    data.content,
                    data.title,
                    data.summary
                ].filter(Boolean).join(' ');
                
                let score = fuzzyMatch(fields, term);
                
                // Boost for Verified Profiles/Authors
                if (data.isVerified || data.author?.isVerified) {
                    score -= 0.15; // Significant boost
                }

                // Boost for Established Accounts (simplified)
                if (data.connectionsCount > 50 || data.postsCount > 10) {
                    score -= 0.05;
                }

                return { item, score };
            })
            .filter(res => res.score < 0.8) // Relaxed slightly to catch boosted near-matches
            .sort((a, b) => a.score - b.score);

        return results.map((res): SearchResult => {
            const item = res.item as any;
            let title = '';
            let subtitle = '';
            const type: 'user' | 'post' | 'topic' = item.type;

            if (type === 'user') {
                title = item.displayName || 'Anonymous';
                subtitle = item.username || '@user';
            } else if (type === 'post') {
                title = item.content?.substring(0, 60) + '...';
                subtitle = `Post by ${item.author?.name || 'Unknown'}`;
            } else if (type === 'topic') {
                title = item.title;
                subtitle = item.summary;
            }

            return {
                id: item.id,
                type,
                title,
                subtitle,
                image: item.photoURL || item.author?.avatar,
                score: res.score,
                data: item
            };
        });
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}
