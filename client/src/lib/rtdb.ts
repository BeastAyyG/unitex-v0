import { ref, push, set, get, update, remove, onValue, query, orderByChild, limitToLast, serverTimestamp, DataSnapshot, Unsubscribe } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

const isFirebaseAvailable = () => {
    try { return !!rtdb && !!rtdb.app; } catch { return false; }
};
import { 
    detectNicheTags, 
    classifyIntent, 
    calculateQualityScore, 
    generateUsercode, 
    generateSafeHandle,
    calculateVpAward,
    calculateRoutingTargets 
} from '@/lib/intelligence';

// ─── UNIQUE IDENTITY ENGINE ──────────────────────────────────────────────────

export async function generateUniqueUsername(baseName: string): Promise<string> {
    try {
        const username = generateSafeHandle(baseName, 0);
        const usernameRef = ref(rtdb, `usernames/${username}`);
        const snapshot = await get(usernameRef);
        if (snapshot.exists()) {
            return generateSafeHandle(baseName, Math.floor(Math.random() * 9999));
        }
        return username;
    } catch {
        return generateSafeHandle(baseName, Math.floor(Math.random() * 9999));
    }
}

// ─── POSTS ────────────────────────────────────────────────────────────────────

export async function createRealtimePost(data: {
    uid: string;
    displayName: string;
    photoURL: string;
    role: string;
    content: string;
    mediaURL?: string;
}) {
    try {
        const postsRef = ref(rtdb, 'posts');
        const newPostRef = push(postsRef);
        const userRef = ref(rtdb, `users/${data.uid}`);
        const userSnap = await get(userRef);
        const userData = userSnap.exists() ? userSnap.val() : null;
        const authorUsername = userData?.username || '';
        const authorUsercode = userData?.usercode || '';
        const authorVp = userData?.vp || 0;
        const qualityAnalysis = calculateQualityScore(data.content, authorVp);
        const tags = detectNicheTags(data.content);
        const intentAnalysis = classifyIntent(data.content);
        const vpAward = calculateVpAward(
            { type: 'post_created', qualityScore: qualityAnalysis.qScore },
            authorVp
        );
        if (vpAward !== 0) {
            await awardVPPoints(data.uid, vpAward);
        }
        await set(newPostRef, {
            id: newPostRef.key,
            uid: data.uid,
            author: {
                id: data.uid,
                name: data.displayName,
                username: authorUsername,
                usercode: authorUsercode,
                avatar: data.photoURL,
                role: data.role,
            },
            content: data.content,
            label: intentAnalysis.intent,
            level: intentAnalysis.level,
            media: data.mediaURL ? { type: 'image', url: data.mediaURL } : null,
            stats: { likes: 0, support: 0, comments: 0 },
            ai: { qualityScore: qualityAnalysis.qScore, isSpam: qualityAnalysis.isSpam, tags },
            timestamp: serverTimestamp(),
            createdAtMillis: Date.now()
        });
        return newPostRef.key;
    } catch (err) {
        console.warn('Firebase RTDB unavailable, post not saved:', err);
        return 'demo-' + Date.now();
    }
}

export function subscribeToRealtimePosts(callback: (posts: any[]) => void): Unsubscribe {
    try {
        const postsRef = query(ref(rtdb, 'posts'), orderByChild('createdAtMillis'), limitToLast(50));
        const listener = onValue(postsRef, (snapshot) => {
            const posts: any[] = [];
            snapshot.forEach((childSnapshot) => {
                posts.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
            callback(posts.reverse());
        });
        return () => listener();
    } catch {
        callback([]);
        return () => {};
    }
}

export function subscribeToTrendingPosts(callback: (posts: any[]) => void): Unsubscribe {
    try {
        const postsRef = query(ref(rtdb, 'posts'), orderByChild('ai/qualityScore'), limitToLast(5));
        const listener = onValue(postsRef, (snapshot) => {
            const posts: any[] = [];
            snapshot.forEach((childSnapshot) => {
                posts.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
            callback(posts.reverse());
        });
        return () => listener();
    } catch {
        callback([]);
        return () => {};
    }
}

export async function likeRealtimePost(postId: string, currentLikes: number) {
    try {
        const postRef = ref(rtdb, `posts/${postId}/stats`);
        await update(postRef, { likes: currentLikes + 1 });
    } catch {
        console.warn('Firebase RTDB unavailable');
    }
}

// ─── USERS & VP (Value Points) ───────────────────────────────────────────────

export async function awardVPPoints(uid: string, points: number) {
    try {
        const userRef = ref(rtdb, `users/${uid}/vp`);
        const snapshot = await get(userRef);
        const currentVP = snapshot.exists() ? snapshot.val() : 0;
        await set(userRef, currentVP + points);
    } catch {
        console.warn('Firebase RTDB unavailable');
    }
}

export async function syncUserToRTDB(user: any, profileData?: any) {
    try {
        const userRef = ref(rtdb, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const baseName = profileData?.displayName || user.displayName || (user.isAnonymous ? 'Guest' : 'UniteX User');
        const username = profileData?.username || (snapshot.exists() ? snapshot.val().username : await generateUniqueUsername(baseName));
        const usercode = profileData?.userId || profileData?.usercode || (snapshot.exists() ? snapshot.val().usercode : generateUsercode());
        const updateData: any = {
            uid: user.uid,
            displayName: baseName,
            username: username.replace(/^@/, ''),
            usercode: usercode,
            email: user.email || (snapshot.exists() ? snapshot.val().email : null),
            photoURL: profileData?.photoURL || user.photoURL || (snapshot.exists() ? snapshot.val().photoURL : ''),
            role: profileData?.role || (snapshot.exists() ? snapshot.val().role : 'Member'),
            updatedAt: serverTimestamp()
        };
        if (!snapshot.exists()) {
            updateData.vp = 0;
            updateData.createdAt = serverTimestamp();
            await set(userRef, updateData);
            await set(ref(rtdb, `usernames/${username.replace(/^@/, '')}`), user.uid);
        } else {
            await update(userRef, updateData);
        }
    } catch {
        console.warn('Firebase RTDB unavailable, sync skipped');
    }
}
