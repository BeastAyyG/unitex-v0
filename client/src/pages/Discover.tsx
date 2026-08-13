import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Users, Radio, Zap, ArrowUpRight, Clock, Star, MessageSquare, Heart, Share2, MoreHorizontal, Settings, Flame, Globe, Plus, Shield, Cpu, ChevronUp, ChevronDown, CheckCircle2, Navigation, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Carousel } from '@/components/ui/carousel';
import { NavLink } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { subscribeToTrendingPosts } from '@/lib/rtdb';
import { calculateTrendingVelocity, generateNicheVector } from '@/lib/intelligence';
import { subscribeToDiscoverFeed, getTrendingUsers, subscribeToEvents, getCommunities, subscribeToTrendingTopics } from '@/lib/firestore';
import { useNavigate } from 'react-router-dom';
import { performGlobalSearch, SearchResult as GlobalSearchResult } from '@/lib/search';
import { calculateEngagementScore, applyTimeDecay, getRecommendationReason } from '@/lib/intelligence';

// --------------------------------------------------------------------------
// COMPONENT: News Post (Main Feed)
// --------------------------------------------------------------------------
const NewsPost = ({ category, source, time, title, content, image, tags, readTime, reason }: { category: string, source: string, time: string, title: string, content: string, image?: string, tags: string[], readTime: string, reason?: string }) => (
    <div className="bg-white border border-[var(--color-surface)] p-4 md:p-6 shadow-sm rounded-lg text-[var(--color-text)] flex flex-col md:flex-row gap-4 group hover:border-gray-300 transition-colors">
        <div className="flex-1 w-full min-w-0 flex flex-col">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                        {reason && (
                            <>
                                <span className="font-bold text-[var(--color-accent)] tracking-tight bg-[var(--color-accent)]/5 px-2 py-0.5 border border-[var(--color-accent)]/10">{reason}</span>
                                <span className="w-1 h-px bg-gray-200"></span>
                            </>
                        )}
                        <span className="font-bold text-[var(--color-text)] tracking-tight">{category}</span>
                        <span className="w-1 h-px bg-gray-200"></span>
                        <span>{source}</span>
                        <span className="w-1 h-px bg-gray-200"></span>
                        <span>{time}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <h3 className="text-base md:text-lg font-bold text-[var(--color-text)] capitalize tracking-tight leading-snug group-hover:text-[var(--color-accent)] transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-normal capitalize tracking-tight line-clamp-3">{content}</p>
            </div>

            {image && (
                <div className="mb-4 border border-[var(--color-surface)] rounded-lg w-full relative overflow-hidden group/media">
                    <img src={image} alt="Media" className="w-full h-auto max-h-[300px] object-cover mix-blend-multiply group-hover/media:opacity-90 transition-opacity duration-300" />
                </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--color-surface)]/50">
                <div className="flex gap-2">
                    {tags?.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-50 text-gray-500 text-[9px] font-bold uppercase tracking-wider border border-gray-100 rounded-lg">
                            {tag}
                        </span>
                    ))}
                </div>
                
                <div className="flex items-center gap-3 text-gray-400">
                    <span className="text-xs font-bold capitalize tracking-tight flex items-center gap-1.5"><Clock size={14} />{readTime}</span>
                    <button className="flex items-center gap-1.5 hover:text-[var(--color-accent)] transition-colors text-xs font-bold capitalize tracking-tight">
                        <Share2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// --------------------------------------------------------------------------
// COMPONENT: Trending Carousel Slide
// --------------------------------------------------------------------------
const TrendingSlide = ({ title, desc, image, tag, linkTo, isBreaking }: { title: string, desc: string, image: string, tag: string, linkTo: string, isBreaking?: boolean }) => (
    <div 
        className="w-full h-[280px] md:h-[340px] rounded-lg relative overflow-hidden group border border-[var(--color-surface)] bg-white hover:border-[var(--color-accent)] transition-all cursor-pointer"
        onClick={() => { window.location.href = linkTo; }}
    >
        <img src={image} alt={title} className="absolute right-0 top-0 w-2/3 md:w-1/2 h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out mix-blend-multiply [mask-image:linear-gradient(to_left,black_50%,transparent_100%)]" />
        
        <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-center bg-gradient-to-r from-white via-white/90 to-transparent w-full md:w-2/3 pointer-events-none">
            <div className="flex items-center gap-2 mb-4">
                <span className="inline-block px-2.5 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-bold capitalize tracking-wider w-max border border-[var(--color-accent)]/20 shadow-sm">
                    {tag}
                </span>
                {isBreaking && (
                    <span className="inline-block px-2.5 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest w-max shadow-sm">
                        Breaking
                    </span>
                )}
            </div>
            <h2 className="text-[var(--color-text)] text-2xl md:text-4xl font-bold leading-tight mb-3 capitalize tracking-tight max-w-lg">
                {title}
            </h2>
            <p className="text-gray-500 text-sm md:text-base font-normal max-w-md capitalize tracking-tight mb-6">
                {desc}
            </p>
            <div className="pointer-events-auto">
                <button 
                    onClick={(e) => { e.stopPropagation(); window.location.href = linkTo; }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[var(--color-text)] text-xs font-bold capitalize tracking-wider hover:bg-gray-100 transition-colors rounded-lg w-max group/btn border border-[var(--color-surface)] shadow-sm"
                >
                    Read Full Story
                    <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </button>
            </div>
        </div>
    </div>
);

// --------------------------------------------------------------------------
// COMPONENT: Category Filter (Interactive Chips)
// --------------------------------------------------------------------------
const CategoryFilter = ({ topics, selectedCategory, onSelect }: { topics: any[], selectedCategory: string | null, onSelect: (cat: string | null) => void }) => {
    // Standard categories to ensure we always have some filters even if topics are loading
    const defaultCategories = ['All', 'Tech', 'AI', 'Gear', 'Robotics', 'Startups', 'Web3', 'Business'];
    const displayCategories = topics.length > 0 
        ? ['All', ...Array.from(new Set(topics.map(t => t.title)))]
        : defaultCategories;

    return (
        <div className="w-full overflow-hidden py-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1">
                {displayCategories.map((cat, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(cat === 'All' ? null : cat)}
                        className={cn(
                            "flex-shrink-0 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border rounded-lg flex items-center gap-2",
                            (selectedCategory === cat || (cat === 'All' && !selectedCategory))
                                ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm scale-105"
                                : "bg-white text-gray-500 border-[var(--color-surface)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                        )}
                    >
                        {cat === 'All' ? <Globe size={12} /> : <Zap size={12} />}
                        {cat}
                        {(selectedCategory === cat || (cat === 'All' && !selectedCategory)) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
interface MiniWidgetProps {
    title: string;
    icon: React.ReactNode;
    items: { label: string; sub: string; stat?: string }[];
    linkTo: string;
    className?: string;
}

const MiniWidget = ({ title, icon, items, linkTo, className }: MiniWidgetProps) => (
    <div className={cn("bg-white border border-[var(--color-surface)] p-5 shadow-sm rounded-lg text-[var(--color-text)] relative overflow-hidden group/mirror cursor-default shrink-0 flex flex-col justify-between", className)}>
        {/* Windows Widget Mirror Reflection Effect */}
        <div className="absolute top-0 bottom-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12 group-hover/mirror:animate-[shine_1.5s_ease-in-out_infinite] pointer-events-none z-0 mix-blend-overlay group-active/mirror:-translate-x-full transition-all duration-700" style={{ backgroundImage: 'linear-gradient(110deg, transparent 20%, rgba(200,200,220,0.4) 40%, rgba(255,255,255,0.6) 50%, rgba(200,200,220,0.4) 60%, transparent 80%)', transform: 'translateX(-150%)' }} />
        
        <style>{`
            @keyframes shine { 0% { transform: translateX(-150%); } 50% { transform: translateX(250%); } 100% { transform: translateX(-150%); } }
        `}</style>

        <div className="relative z-10 transition-transform duration-200 group-active/mirror:scale-[0.98] h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-surface)] shrink-0">
                <h3 className="text-xs font-bold capitalize tracking-wider text-[var(--color-text)] flex items-center gap-2">
                    <span className="text-[var(--color-accent)]">{icon}</span>
                    {title}
                </h3>
            </div>
            <div className="flex flex-col gap-4 flex-1">
                {items.map((item, i) => (
                    <div key={i} className="group/item cursor-pointer">
                        <div className="text-[10px] font-mono text-gray-400 capitalize tracking-wider mb-1 group-hover/item:text-[var(--color-accent)] transition-colors">{item.sub}</div>
                        <div className="text-xs font-bold text-[var(--color-text)] leading-tight mb-1 group-hover/item:text-[var(--color-accent)] transition-colors line-clamp-2">{item.label}</div>
                        {item.stat && <div className="text-[10px] text-gray-400 font-medium capitalize tracking-normal">{item.stat}</div>}
                    </div>
                ))}
            </div>
            <NavLink to={linkTo} className="block w-full shrink-0 text-center mt-5 py-2 text-xs font-bold capitalize tracking-wider text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-colors border border-[var(--color-accent)]/20 rounded-lg hover:shadow-inner active:scale-95 active:bg-[var(--color-accent)]/10 flex items-center justify-center gap-1">
                View More {title.split(' ')[0]} <span className="opacity-70"><ArrowUpRight size={12}/></span>
            </NavLink>
        </div>
    </div>
);


// --------------------------------------------------------------------------
// MAIN DISCOVER PAGE
// --------------------------------------------------------------------------
// Curated fallback content for when the live feed is empty
const STATIC_FEED = [
    { id: 'sf1', title: "DeepSeek R2: The New Open-Source Frontier", description: "Open-source AI continues to challenge closed models. DeepSeek's latest marks a turning point in accessible high-performance reasoning.", source: "AI Digest", category: "AI", tags: ["AI", "LLMs", "OpenSource"], trendScore: 91, imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200", recommendationReason: "Trending in your niche", finalScore: 91 },
    { id: 'sf2', title: "The Architecture of High-Performance Social Feeds", description: "How top platforms like X, LinkedIn, and Reddit balance freshness vs quality to build feeds that users actually come back to.", source: "Engineering Weekly", category: "Engineering", tags: ["SocialTech", "Algorithms", "Scale"], trendScore: 85, imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200", recommendationReason: "Highly engaging across the network", finalScore: 85 },
    { id: 'sf3', title: "Vibe Coding Is Rewriting Startup Culture", description: "A new generation of founders are shipping products faster than ever using AI pair programmers. Is this the future of building?", source: "Tech Crunch", category: "Startups", tags: ["AI", "Founder", "Startup"], trendScore: 78, imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200", recommendationReason: "Relevant to your interests", finalScore: 78 },
    { id: 'sf4', title: "Web3 Meets Real-World Utility: Projects That Actually Shipped", description: "Beyond the hype, these are the blockchain-based products delivering genuine user value in 2026.", source: "Decentralized Times", category: "Web3", tags: ["Web3", "Blockchain", "DApps"], trendScore: 72, imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200", recommendationReason: "Widely shared in your community", finalScore: 72 },
    { id: 'sf5', title: "India's Startup Ecosystem Hits $100B Milestone", description: "From Bangalore to Gurgaon, India's tech ecosystem is producing world-class exits. Here's what's driving the momentum.", source: "Medial Reports", category: "Business", tags: ["India", "Startup", "Growth"], trendScore: 68, imageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1200", recommendationReason: "Breaking news in your niche", finalScore: 68 },
];

export default function Discover() {
    const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
    const [discoverFeed, setDiscoverFeed] = useState<any[]>([]);
    const [trendingUsers, setTrendingUsers] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [communities, setCommunities] = useState<any[]>([]);
    const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const navigate = useNavigate();
    const [localSearch, setLocalSearch] = useState('');
    const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (localSearch.length >= 2) {
            setIsSearching(true);
            const delayDebounceFn = setTimeout(async () => {
                const results = await performGlobalSearch(localSearch);
                setSearchResults(results);
                setIsSearching(false);
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    }, [localSearch]);

    useEffect(() => {
        const unsubPosts = subscribeToTrendingPosts((posts) => {
            setTrendingPosts(posts);
        });

        const unsubFeed = subscribeToDiscoverFeed((feed) => {
            // Apply advanced ranking logic
            const processedFeed = feed.map(item => {
                const metadata = {
                    likes: item.likes || 0,
                    commentsCount: item.commentsCount || 0,
                    shares: item.shares || 0,
                    createdAt: item.createdAt?.toDate ? item.createdAt.toDate() : (item.createdAt || new Date())
                };
                const baseScore = calculateEngagementScore(metadata);
                const finalScore = applyTimeDecay(baseScore, metadata.createdAt);
                return {
                    ...item,
                    finalScore,
                    recommendationReason: getRecommendationReason(finalScore, metadata)
                };
            }).sort((a, b) => b.finalScore - a.finalScore);

            setDiscoverFeed(processedFeed);
        });

        const unsubEvents = subscribeToEvents((data) => {
            setEvents(data);
        });

        const unsubTrends = subscribeToTrendingTopics((data) => {
            setTrendingTopics(data);
        });
        
        getTrendingUsers(10).then(setTrendingUsers);
        getCommunities().then(setCommunities);
        
        return () => {
            unsubPosts();
            unsubFeed();
            unsubEvents();
            unsubTrends();
        };
    }, []);

    // Apply Trending Velocity Algorithm mathematically to rank the News Feed
    const rankedTrendingPosts = React.useMemo(() => {
        if (trendingPosts.length === 0) return [];
        const now = Date.now();
        return [...trendingPosts].sort((a, b) => {
            const velA = calculateTrendingVelocity(
                { 
                    postNicheVector: a.ai?.tags ? generateNicheVector(a.ai.tags) : [], 
                    qScore: a.ai?.qualityScore || 50, 
                    interactions: a.stats, 
                    authorVp: a.author?.vp || 100, 
                    createdAtMillis: a.createdAtMillis || now 
                },
                { likes: Math.floor((a.stats?.likes || 0) / 2), comments: Math.floor((a.stats?.comments || 0) / 2), shares: 0 },
                now
            );
            const velB = calculateTrendingVelocity(
                { 
                    postNicheVector: b.ai?.tags ? generateNicheVector(b.ai.tags) : [], 
                    qScore: b.ai?.qualityScore || 50, 
                    interactions: b.stats, 
                    authorVp: b.author?.vp || 100, 
                    createdAtMillis: b.createdAtMillis || now 
                },
                { likes: Math.floor((b.stats?.likes || 0) / 2), comments: Math.floor((b.stats?.comments || 0) / 2), shares: 0 },
                now
            );
            return velB - velA;
        });
    }, [trendingPosts]);

    return (
        <div className="font-outfit max-w-[1536px] mx-auto px-6 pt-2 pb-8">
            {/* Header Area: Improved Hierarchy (Title → Search) */}
            <header className="mb-4 space-y-3">
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-[var(--color-text)] leading-none">
                        Discovery Grid
                    </h1>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                
                {/* LEFT-MIDDLE MAIN AREA (75% approx) */}
                <div className="lg:col-span-3 flex flex-col gap-6 min-w-0">
                    
                    <div className="space-y-4">
                        {/* Search Bar: Aligned with Carousel Width */}
                        <div className="w-full relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-accent)] transition-colors">
                                <Search size={18} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Search the network..." 
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        navigate(`/search?q=${encodeURIComponent(localSearch)}`);
                                    }
                                }}
                                className="w-full bg-white border border-[var(--color-surface)] rounded-lg py-3.5 pl-12 pr-4 text-sm font-bold focus:bg-white focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-gray-400 text-[var(--color-text)] shadow-sm"
                            />
                            
                            {/* INLINE SEARCH RESULTS */}
                            {localSearch.length >= 2 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--color-surface)] shadow-xl z-50 max-h-[400px] overflow-y-auto no-scrollbar">
                                    {isSearching ? (
                                        <div className="p-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                                            Scanning Network...
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div className="flex flex-col">
                                            {searchResults.map((res) => (
                                                <div 
                                                    key={`${res.type}-${res.id}`}
                                                    onClick={() => {
                                                        if (res.type === 'user') navigate(`/profile/${res.id}`);
                                                        else if (res.type === 'topic') setLocalSearch(res.title);
                                                        setSearchResults([]);
                                                    }}
                                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-[var(--color-surface)] last:border-0 flex items-center gap-3 group"
                                                >
                                                    <div className="w-8 h-8 shrink-0 bg-gray-100 flex items-center justify-center">
                                                        {res.type === 'user' ? <Users size={14} className="text-[var(--color-accent)]" /> : 
                                                         res.type === 'post' ? <MessageSquare size={14} className="text-blue-500" /> : 
                                                         <Radio size={14} className="text-orange-500" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-bold text-[var(--color-text)] truncate group-hover:text-[var(--color-accent)] transition-colors">{res.title}</div>
                                                        <div className="text-[10px] text-gray-400 truncate">{res.subtitle}</div>
                                                    </div>
                                                    <div className="text-[9px] font-black uppercase tracking-tighter text-gray-300 group-hover:text-[var(--color-accent)]/30">{res.type}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-xs font-bold text-gray-400">
                                            No local matches found.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* CATEGORY FILTERS (REPLACED TRENDING TOPICS SLIDER) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={18} className="text-[var(--color-accent)]" />
                                    <h2 className="text-xl font-bold capitalize tracking-tight text-[var(--color-text)]">Explore Categories</h2>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-ping" />
                                    <span className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest">Active Filters</span>
                                </div>
                            </div>
                            <CategoryFilter 
                                topics={trendingTopics} 
                                selectedCategory={selectedCategory} 
                                onSelect={setSelectedCategory} 
                            />
                        </div>

                        {/* News Feed Heading (Primary Category Label) */}
                        <div className="flex items-center gap-2 px-1 pb-1">
                            <Globe size={18} className="text-[var(--color-accent)]" />
                            <h2 className="text-xl font-bold capitalize tracking-tight text-[var(--color-text)]">News Feed</h2>
                        </div>
                    </div>
                    
                    {/* HERO CAROUSEL: TRENDING NOW */}
                    <section className="space-y-4">
                        <Carousel.Root autoScroll={true} interval={6000} className="w-full relative group -ml-2">
                            <Carousel.Content className="no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {discoverFeed.slice(0, 10).map((item, i) => (
                                    <Carousel.Item key={i}>
                                        <TrendingSlide 
                                            tag={item.category || "Intelligence"} 
                                            title={item.title} 
                                            desc={item.description?.substring(0, 120) + '...'} 
                                            image={item.imageUrl || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop`} 
                                            linkTo={item.link}
                                            isBreaking={item.trendScore > 50}
                                        />
                                    </Carousel.Item>
                                ))}
                                {discoverFeed.length === 0 && Array.from({ length: 3 }).map((_, i) => (
                                    <Carousel.Item key={i}>
                                        <div className="w-full h-[280px] md:h-[340px] bg-gray-50 flex items-center justify-center border border-[var(--color-surface)]">
                                            <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Syncing Global Feed...</p>
                                        </div>
                                    </Carousel.Item>
                                ))}
                            </Carousel.Content>

                            {/* Dots navigation */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-max px-4 py-2 bg-white/50 backdrop-blur-md rounded-lg border border-white">
                                <Carousel.Dots count={discoverFeed.length > 0 ? Math.min(10, discoverFeed.length) : 3} />
                            </div>

                            {/* Arrow Navigation (Always visible for click-based moments, with active scale) */}
                            <Carousel.PrevTrigger className="hidden md:flex border-[var(--color-surface)] bg-white/90 shadow-sm transition-all hover:bg-gray-100 hover:scale-105 active:scale-90 active:bg-gray-200" />
                            <Carousel.NextTrigger className="hidden md:flex border-[var(--color-surface)] bg-white/90 shadow-sm transition-all hover:bg-gray-100 hover:scale-105 active:scale-90 active:bg-gray-200" />
                        </Carousel.Root>
                    </section>

                    {/* TWO COLUMN FEED LAYOUT */}
                    <div className="grid grid-cols-1 xl:grid-cols-[2.2fr_1fr] gap-8 items-start">
                        {/* MAIN NEWS FEED */}
                        <section className="space-y-4 pt-2">
                            <div className="flex flex-col gap-4">
                                {(() => {
                                    let feed: any[] = discoverFeed.length > 0
                                        ? discoverFeed
                                        : rankedTrendingPosts.length > 0
                                            ? rankedTrendingPosts.map((p: any) => ({
                                                id: p.id,
                                                category: p.ai?.tags?.[0] || 'Community',
                                                source: p.author?.name || 'Member',
                                                title: (p.content || '').split('. ')[0] + '...',
                                                description: p.content,
                                                imageUrl: p.media?.url,
                                                tags: p.ai?.tags || [],
                                                recommendationReason: p.recommendationReason,
                                                pubDate: null
                                            }))
                                            : STATIC_FEED;

                                    // Apply Category Filtering
                                    if (selectedCategory) {
                                        feed = feed.filter(item => 
                                            item.category?.toLowerCase() === selectedCategory.toLowerCase() || 
                                            item.tags?.some((t: string) => t.toLowerCase() === selectedCategory.toLowerCase())
                                        );
                                    }

                                    if (feed.length === 0) {
                                        return (
                                            <div className="py-20 text-center border border-dashed border-[var(--color-surface)]">
                                                <div className="flex justify-center mb-4">
                                                    <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-full">
                                                        <Search size={24} className="text-gray-300" />
                                                    </div>
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">No Signals Found</h3>
                                                <p className="text-xs text-gray-400 mt-1">Try selecting a different category or clearing the filter.</p>
                                                <button 
                                                    onClick={() => setSelectedCategory(null)}
                                                    className="mt-4 text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest hover:underline"
                                                >
                                                    Clear Filter
                                                </button>
                                            </div>
                                        );
                                    }

                                    return feed.map((item: any, idx: number) => (
                                        <NewsPost
                                            key={item.id || idx}
                                            category={item.category || 'Intelligence'}
                                            source={item.source || 'Alliance Core'}
                                            time={item.pubDate ? new Date(item.pubDate).toLocaleTimeString() : 'Recent'}
                                            title={item.title}
                                            content={(item.description || '').substring(0, 160) + '...'}
                                            image={item.imageUrl}
                                            readTime="3 min read"
                                            tags={item.tags || ['Intelligence']}
                                            reason={item.recommendationReason}
                                        />
                                    ));
                                })()}

                                <button className="w-full mt-4 py-3 border border-[var(--color-surface)] text-xs font-bold capitalize tracking-wider text-gray-500 hover:text-[var(--color-text)] hover:bg-gray-50 transition-all rounded-lg flex items-center justify-center gap-2 group">
                                    View More News
                                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        </section>

                        {/* INLINE SIDE PANEL (TRENDING / EVENTS) */}
                        <aside className="hidden xl:flex flex-col gap-6">
                            <MiniWidget 
                                title="Top Agents"
                                icon={<Users size={14} />}
                                linkTo="/networking"
                                items={trendingUsers.map(u => ({
                                    label: u.displayName || u.username || "Anonymous Agent",
                                    sub: `@${(u.username || u.userId || 'node').replace(/^@/, '')}`,
                                    stat: `${u.connectionsCount || 0} Conn`
                                }))}
                            />

                            <MiniWidget 
                                title="Events"
                                icon={<Clock size={14} />}
                                linkTo="/discover/events"
                                items={events.slice(0, 4).map(e => ({
                                    sub: `${e.date || 'Soon'} • Hosted by ${e.organizer || 'Core'}`,
                                    label: e.title || "Upcoming Event",
                                    stat: e.location || "Virtual"
                                }))}
                            />
                        </aside>
                    </div>

                    {/* DISCOVERY HIGHLIGHTS: Moved to Sidebar */}
                </div>

                {/* RIGHT COLUMN: SECONDARY PANELS (~25% width, non-sticky) */}
                <aside className="hidden lg:block space-y-6">
                    
                    {/* WIDGET: FOR YOU */}
                    <MiniWidget 
                        title="For You"
                        icon={<Star size={14} />}
                        linkTo="/discover/foryou"
                        items={[
                            { sub: "Recommended Signal", label: "Optimizing State Management in React", stat: "1.2k signals" },
                            { sub: "Suggested Community", label: "c/FrontendElites", stat: "Active now" },
                            { sub: "Network Update", label: "Your routing paths have improved latency.", stat: "Auto-tuned" },
                            { sub: "New Contributor", label: "You unlocked 'Early Adopter' badge", stat: "Just now" },
                        ]}
                    />

                    {/* WIDGET: TRENDING */}
                    <MiniWidget 
                        title="Trending"
                        icon={<TrendingUp size={14} />}
                        linkTo="/discover/trending"
                        items={[
                            { sub: "Hardware #1", label: "GPU Clusters", stat: "14.2k posts" },
                            { sub: "Culture #2", label: "Cyber_Goth Fashion", stat: "9.1k posts" },
                            { sub: "Gaming #3", label: "Mesh League Final", stat: "6.5k posts" },
                            { sub: "Development #4", label: "Wait-Free Architecture", stat: "5.8k posts" },
                        ]}
                    />

                    {/* WIDGET: TOP PEOPLE */}
                    <MiniWidget 
                        title="Top People"
                        icon={<Users size={14} />}
                        linkTo="/discover/people"
                        items={trendingUsers.slice(0, 4).map(u => ({
                            sub: `Field: ${u.role || 'Contributor'}`,
                            label: u.displayName || u.username || 'Anonymous',
                            stat: `${u.connectionsCount || 0} connections`
                        }))}
                    />

                    {/* WIDGET: TOP COMMUNITIES */}
                    <MiniWidget 
                        title="Top Communities"
                        icon={<Users size={14} />}
                        linkTo="/discover/communities"
                        items={communities.slice(0, 4).map(c => ({
                            sub: `${c.members || 0} online`,
                            label: c.name || "Community",
                            stat: "Join Alliance"
                        }))}
                    />

                    {/* WIDGET: NETWORK ACTIVITY */}
                    <MiniWidget 
                        title="Network Activity"
                        icon={<Activity size={14} />}
                        linkTo="/discover/activity"
                        items={[
                            { sub: "Node 4.2.1", label: "Patching consensus relay", stat: "Succeeded" },
                            { sub: "Protocol V3", label: "Deployment sequence started", stat: "85% complete" },
                            { sub: "Governance", label: "Proposal #451 voting active", stat: "High volume" },
                            { sub: "Mesh Health", label: "Packet drop reduced by 12%", stat: "Stable" },
                        ]}
                    />

                </aside>
            </div>
        </div>
    );
}

// Activity Icon
const ActivityIcon = () => (
    <div className="flex items-end gap-[2px] h-3">
        <div className="w-1 h-2 bg-[var(--color-accent)] animate-pulse" />
        <div className="w-1 h-2.5 bg-[var(--color-accent)] animate-pulse delay-75" />
        <div className="w-1 h-3 bg-[var(--color-accent)] animate-pulse delay-150" />
    </div>
);
