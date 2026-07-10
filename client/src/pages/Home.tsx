import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import PostCard, { Post } from '@/components/PostCard';
import CreatePost, { CreatePostMedia } from '@/components/CreatePost';
import { UnifiedProfileCard } from '@/components/UnifiedProfileCard';
import { TrendingUp, Users, ArrowUpRight, Image as ImageIcon, Link, Plus, Rocket, UserPlus, Activity, ShieldCheck, Zap, Globe, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/useAuth';
import { subscribeToRealtimePosts, createRealtimePost } from '@/lib/rtdb';
import { calculateRankScore, calculateTrendingVelocity, generateNicheVector } from '@/lib/intelligence';
import { getUser, updateUser, createNotification } from '@/lib/firestore';
import { toast } from 'sonner';

function Home() {
    const { currentUser } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [activeSort, setActiveSort] = useState('new');
    const [feedType, setFeedType] = useState('for-you');
    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            getUser(currentUser.uid).then((data: any) => {
                if (data) {
                    setUserData(data);
                    if (data.onboardingCompleted === false || data.hasSeenCredentials === false) {
                        navigate('/onboarding');
                    }
                }
            });
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        const unsub = subscribeToRealtimePosts((livePosts) => {
            if (livePosts.length > 0) {
                setPosts(livePosts as Post[]);
            } else if (posts.length === 0) {
                setPosts([
                    { id: 'demo-1', author: { id: 'system', name: 'UniteX', avatar: '', role: 'Admin' }, timestamp: '1m ago', content: 'Welcome to UniteX! This is a demo instance running without Firebase. Sign up for a real account to unlock all features.', stats: { likes: 42, support: 12, comments: 7, shares: 0 }, ai: { qualityScore: 95, tags: [] }, createdAtMillis: Date.now() - 1000 },
                    { id: 'demo-2', author: { id: 'system', name: 'Hermes Agent', avatar: '', role: 'AI' }, timestamp: '2m ago', content: 'Hermes Agent is online. Running Ponytail analysis on community engagement patterns. All systems nominal.', stats: { likes: 28, support: 8, comments: 3, shares: 0 }, ai: { qualityScore: 88, tags: [] }, createdAtMillis: Date.now() - 2000 },
                    { id: 'demo-3', author: { id: 'system', name: 'UnitexBot', avatar: '', role: 'Bot' }, timestamp: '3m ago', content: 'VP Engine active. Quality scoring, anti-spam, and niche routing are operational. Start posting to earn Value Points!', stats: { likes: 15, support: 5, comments: 2, shares: 0 }, ai: { qualityScore: 72, tags: [] }, createdAtMillis: Date.now() - 3000 },
                ] as Post[]);
            }
        });
        return () => unsub();
    }, []);

    const userVector = React.useMemo(() => generateNicheVector(['Frontend', 'React', 'AI/ML']), []);

    const sortedPosts = React.useMemo(() => {
        const now = Date.now();
        let postsToSort = [...posts];

        if (activeSort === 'hot') {
            postsToSort.sort((a, b) => {
                const velA = calculateTrendingVelocity(
                    { postNicheVector: a.ai?.tags ? generateNicheVector(a.ai.tags) : [], qScore: a.ai?.qualityScore || 50, interactions: a.stats, authorVp: 100, createdAtMillis: a.createdAtMillis || now },
                    { likes: Math.floor(a.stats.likes / 2), comments: Math.floor(a.stats.comments / 2), shares: 0 },
                    now
                );
                const velB = calculateTrendingVelocity(
                    { postNicheVector: b.ai?.tags ? generateNicheVector(b.ai.tags) : [], qScore: b.ai?.qualityScore || 50, interactions: b.stats, authorVp: 100, createdAtMillis: b.createdAtMillis || now },
                    { likes: Math.floor(b.stats.likes / 2), comments: Math.floor(b.stats.comments / 2), shares: 0 },
                    now
                );
                return velB - velA;
            });
        } else if (activeSort === 'top') {
            postsToSort.sort((a, b) => {
                const rankA = calculateRankScore(
                    userVector,
                    { postNicheVector: a.ai?.tags ? generateNicheVector(a.ai.tags) : [], qScore: a.ai?.qualityScore || 50, interactions: a.stats, authorVp: 500, createdAtMillis: a.createdAtMillis || now },
                    now
                );
                const rankB = calculateRankScore(
                    userVector,
                    { postNicheVector: b.ai?.tags ? generateNicheVector(b.ai.tags) : [], qScore: b.ai?.qualityScore || 50, interactions: b.stats, authorVp: 500, createdAtMillis: b.createdAtMillis || now },
                    now
                );
                return rankB - rankA;
            });
        }
        return postsToSort;
    }, [posts, activeSort, userVector]);

    const handleCreatePost = async (content: string, label: string | null, media?: CreatePostMedia) => {
        setIsPostDialogOpen(false);
        try {
            await createRealtimePost({
                uid: currentUser?.uid || 'anonymous',
                displayName: userData?.displayName || currentUser?.displayName || 'Anonymous',
                photoURL: userData?.photoURL || currentUser?.photoURL || '',
                role: 'Member',
                content,
                mediaURL: media ? media.url : undefined,
            });
            await createNotification({
                recipientUid: currentUser?.uid || 'anonymous',
                senderUid: 'system',
                senderName: 'UniteX Intelligence',
                type: 'system',
                content: `Your post has been analyzed and routed to the network.`,
                actionUrl: '/'
            });
            toast.success("Post published successfully");
        } catch (err) {
            console.error('Failed to create post:', err);
            const newPost: Post = {
                id: Date.now().toString(),
                author: {
                    id: currentUser?.uid || 'anon',
                    name: userData?.displayName || currentUser?.displayName || 'Anonymous',
                    role: 'Member',
                    avatar: userData?.photoURL || currentUser?.photoURL || ''
                },
                timestamp: 'Just now',
                content,
                label: label ? (label as Post['label']) : undefined,
                media: media ? { type: media.type, url: media.url } : undefined,
                stats: { likes: 0, support: 0, comments: 0, shares: 0 }
            };
            setPosts(prev => [newPost, ...prev]);
        }
    };

    const TRENDING_TOPICS = [
        { name: "Design Systems", count: "2.4k posts" },
        { name: "UniteX V3", count: "1.8k posts" },
        { name: "Mesh States", count: "956 posts" },
        { name: "Latency Optimization", count: "432 posts" }
    ];

    const COMMUNITIES = [
        { name: "Core Architecture", members: "12.4k", logo: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=100&auto=format&fit=crop" },
        { name: "Frontend Elites", members: "8.2k", logo: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=100&auto=format&fit=crop" },
        { name: "UI/UX Strategists", members: "15.7k", logo: "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=100&auto=format&fit=crop" }
    ];

    const MARQUEE_ITEMS = [
        { text: "REAL-TIME ROSTER", icon: Activity },
        { text: "VP ENGINE", icon: Zap },
        { text: "HYBRID STORAGE", icon: Globe },
        { text: "HERMES NODE", icon: MessageSquare },
        { text: "NICHE INTELLIGENCE", icon: ShieldCheck },
    ];

    return (
        <div className="w-full flex flex-col items-center">
            {/* HERO SECTION */}
            <section className="relative w-full h-[60vh] md:h-[70vh] bg-[var(--color-text)] flex items-center justify-center overflow-hidden border-b-2 border-[var(--color-text)]">
                <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                    <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop" alt="Hero Background" className="w-full h-full object-cover" />
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
                    <h1 className="font-syne text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 uppercase tracking-tighter max-w-5xl leading-[0.9]">
                        Nodes of the uniquely intelligent.
                    </h1>
                    <p className="font-outfit text-xl md:text-2xl text-[var(--color-bg)] max-w-2xl font-light mb-10 opacity-90">
                        An all-inclusive intelligence network providing everything you need to connect, build, and deploy.
                    </p>
                    <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                        <DialogTrigger asChild>
                            <button className="group relative px-8 py-4 bg-[var(--color-accent-yellow)] text-[var(--color-text)] font-syne font-bold uppercase tracking-widest text-lg md:text-xl border-2 border-[var(--color-text)] shadow-brutal hover-lift overflow-hidden">
                                <span className="relative z-10">Initialize Sequence</span>
                                <div className="absolute inset-0 bg-[var(--color-accent-red)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
                            </button>
                        </DialogTrigger>
                    </Dialog>
                </div>
            </section>

            {/* MARQUEE SECTION */}
            <section className="w-full bg-[var(--color-accent-green)] border-b-2 border-[var(--color-text)] overflow-hidden flex items-center py-4">
                <div className="flex whitespace-nowrap animate-marquee">
                    {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
                        <div key={idx} className="flex items-center mx-8 text-[var(--color-bg)]">
                            <span className="font-syne font-bold uppercase tracking-widest text-xl">{item.text}</span>
                            <item.icon className="ml-4 w-6 h-6 text-[var(--color-accent-yellow)]" strokeWidth={2.5} />
                        </div>
                    ))}
                </div>
            </section>

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_6fr_3fr] gap-8 w-full max-w-7xl px-4 md:px-8 py-12">
                
                {/* Left Sidebar - Profile & Connections */}
                <aside className="hidden lg:flex flex-col gap-8">
                    <div className="bg-[var(--color-bg)] border-2 border-[var(--color-text)] p-6 shadow-brutal">
                        <UnifiedProfileCard />
                    </div>

                    <div className="bg-[var(--color-bg)] border-2 border-[var(--color-text)] p-6 shadow-brutal">
                        <div className="flex items-center justify-between mb-6 border-b-2 border-[var(--color-text)] pb-2">
                            <h3 className="font-syne font-bold uppercase tracking-widest text-[var(--color-text)]">Network Links</h3>
                            <UserPlus size={20} className="text-[var(--color-accent-purple)]" />
                        </div>
                        <div className="flex flex-col gap-4">
                            {[
                                { id: 'alex-thorne', name: "Alex Thorne", role: "Startup Founder", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop" },
                                { id: 'priya-patel', name: "Priya Patel", role: "Full Stack Dev", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop" },
                                { id: 'liam-oconnor', name: "Liam O'Connor", role: "Game DevOps", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop" }
                            ].map((person, i) => (
                                <NavLink key={i} to={`/profile/${person.id}`} className="flex items-center justify-between group cursor-pointer p-2 border-2 border-transparent hover:border-[var(--color-text)] hover:bg-[var(--color-accent-yellow)] transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 border-2 border-[var(--color-text)] bg-white overflow-hidden shrink-0">
                                            <img src={person.avatar} className="w-full h-full object-cover grayscale mix-blend-multiply" alt={person.name} />
                                        </div>
                                        <div>
                                            <div className="font-syne font-bold text-sm uppercase tracking-tight text-[var(--color-text)] group-hover:text-[var(--color-text)]">{person.name}</div>
                                            <div className="font-mono text-[10px] text-[var(--color-text)] opacity-70 uppercase tracking-wider">{person.role}</div>
                                        </div>
                                    </div>
                                    <Plus size={16} className="text-[var(--color-text)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </NavLink>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 font-syne font-bold uppercase tracking-widest text-[var(--color-text)] border-2 border-[var(--color-text)] hover:bg-[var(--color-accent-red)] hover:text-white transition-colors">Expand Network</button>
                    </div>
                </aside>

                {/* Main Feed */}
                <main className="flex flex-col gap-8">
                    {/* Feed Tabs */}
                    <div className="flex border-2 border-[var(--color-text)] bg-[var(--color-bg)] shadow-brutal-sm">
                        <button
                            onClick={() => setFeedType('for-you')}
                            className={cn(
                                "flex-1 py-4 font-syne font-bold uppercase tracking-widest transition-all border-r-2 border-[var(--color-text)]",
                                feedType === 'for-you' ? "bg-[var(--color-accent-purple)] text-white" : "hover:bg-[var(--color-surface)] text-[var(--color-text)]"
                            )}>
                            For you
                        </button>
                        <button
                            onClick={() => setFeedType('following')}
                            className={cn(
                                "flex-1 py-4 font-syne font-bold uppercase tracking-widest transition-all",
                                feedType === 'following' ? "bg-[var(--color-accent-purple)] text-white" : "hover:bg-[var(--color-surface)] text-[var(--color-text)]"
                            )}>
                            Following
                        </button>
                    </div>

                    {/* Create Post Interface */}
                    <div className="bg-[var(--color-bg)] border-2 border-[var(--color-text)] p-4 flex flex-col gap-4 shadow-brutal">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 border-2 border-[var(--color-text)] bg-[var(--color-accent-yellow)] shrink-0 overflow-hidden cursor-pointer">
                                {userData?.photoURL ? (
                                    <img src={userData.photoURL} className="w-full h-full object-cover grayscale mix-blend-multiply" alt="You" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-syne font-bold text-xl">
                                        {(userData?.displayName || currentUser?.displayName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                                <DialogTrigger asChild>
                                    <input
                                        type="text"
                                        placeholder="Transmit to network..."
                                        className="flex-1 bg-white border-2 border-[var(--color-text)] px-4 py-3 font-outfit text-lg text-[var(--color-text)] placeholder:text-gray-400 focus:outline-none focus:ring-0 cursor-pointer shadow-[2px_2px_0px_0px_rgba(25,25,25,1)]"
                                        readOnly
                                    />
                                </DialogTrigger>
                            </Dialog>
                            <div className="flex gap-2">
                                <button onClick={() => setIsPostDialogOpen(true)} className="p-3 border-2 border-[var(--color-text)] bg-white hover:bg-[var(--color-accent-yellow)] hover:-translate-y-1 transition-all shadow-[2px_2px_0px_0px_rgba(25,25,25,1)]" title="Upload Media">
                                    <ImageIcon size={20} strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Feed Content */}
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row items-center justify-between border-b-2 border-[var(--color-text)] pb-4">
                            <div className="flex items-center gap-3">
                                <Activity size={28} className="text-[var(--color-accent-red)]" />
                                <h2 className="font-syne font-bold text-2xl uppercase tracking-widest text-[var(--color-text)]">Live Feed</h2>
                            </div>
                            <div className="flex bg-[var(--color-surface)] border-2 border-[var(--color-text)] mt-4 md:mt-0 shadow-brutal-sm">
                                {['new', 'hot', 'top'].map((sort) => (
                                    <button
                                        key={sort}
                                        onClick={() => setActiveSort(sort)}
                                        className={cn(
                                            "px-4 py-2 font-syne font-bold text-sm uppercase tracking-widest transition-all",
                                            activeSort === sort
                                                ? "bg-[var(--color-text)] text-white"
                                                : "text-[var(--color-text)] hover:bg-[var(--color-accent-yellow)]"
                                        )}>
                                        {sort === 'new' ? 'Recent' : sort}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            {(feedType === 'for-you' ? sortedPosts : []).map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </div>
                </main>

                {/* Right Sidebar - Trending & Communities */}
                <aside className="hidden lg:flex flex-col gap-8">
                    {/* Trending */}
                    <div className="bg-[var(--color-bg)] border-2 border-[var(--color-text)] p-6 shadow-brutal">
                        <div className="flex items-center justify-between mb-6 border-b-2 border-[var(--color-text)] pb-2">
                            <h3 className="font-syne font-bold uppercase tracking-widest text-[var(--color-text)]">Trending</h3>
                            <TrendingUp size={20} className="text-[var(--color-accent-orange)]" />
                        </div>
                        <div className="flex flex-col gap-4">
                            {TRENDING_TOPICS.slice(0, 3).map((topic) => (
                                <div key={topic.name} className="group cursor-pointer p-2 border-2 border-transparent hover:border-[var(--color-text)] hover:bg-white transition-all">
                                    <div className="font-mono text-[10px] text-[var(--color-text)] opacity-70 uppercase tracking-wider mb-1">Architecture</div>
                                    <div className="font-syne font-bold uppercase tracking-tight text-[var(--color-text)] mb-1 group-hover:text-[var(--color-accent-orange)] transition-colors">#{topic.name.replace(/\s+/g, '')}</div>
                                    <div className="font-outfit text-xs font-medium">{topic.count}</div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 font-syne font-bold uppercase tracking-widest text-[var(--color-text)] border-2 border-[var(--color-text)] hover:bg-[var(--color-accent-orange)] hover:text-white transition-colors">View All Metrics</button>
                    </div>

                    {/* Recommended Communities */}
                    <div className="bg-[var(--color-bg)] border-2 border-[var(--color-text)] p-6 shadow-brutal">
                        <div className="flex items-center justify-between mb-6 border-b-2 border-[var(--color-text)] pb-2">
                            <h3 className="font-syne font-bold uppercase tracking-widest text-[var(--color-text)]">Alliances</h3>
                            <Users size={20} className="text-[var(--color-accent-green)]" />
                        </div>
                        <div className="flex flex-col gap-4">
                            {COMMUNITIES.map((community) => (
                                <div key={community.name} className="flex items-center justify-between group cursor-pointer p-2 border-2 border-transparent hover:border-[var(--color-text)] hover:bg-white transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 border-2 border-[var(--color-text)] bg-[var(--color-surface)] shrink-0 overflow-hidden">
                                            <img src={community.logo} className="w-full h-full object-cover grayscale mix-blend-multiply" alt={community.name} />
                                        </div>
                                        <div>
                                            <div className="font-syne font-bold uppercase tracking-tight text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent-green)] transition-colors">/{community.name.toLowerCase().replace(/\s+/g, '')}</div>
                                            <div className="font-mono text-[10px] text-[var(--color-text)] opacity-70 uppercase tracking-wider">{community.members} nodes</div>
                                        </div>
                                    </div>
                                    <Plus size={16} className="text-[var(--color-text)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 font-syne font-bold uppercase tracking-widest text-[var(--color-text)] border-2 border-[var(--color-text)] hover:bg-[var(--color-accent-green)] hover:text-white transition-colors">Browse Directory</button>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default Home;
