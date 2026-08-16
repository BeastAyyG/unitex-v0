import { useState, useEffect } from 'react';
import {
    Shield, Zap, Star, Activity,
    Check, X, MessageSquare, User,
    Hexagon, Target, Sparkles, UserPlus, Eye,
    MoreHorizontal, Users
} from 'lucide-react';
import { Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../components/ui/empty'
import { Field } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { cn } from '../lib/utils';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { toast } from 'sonner';
import { performGlobalSearch, SearchResult as GlobalSearchResult } from '@/lib/search';
import { 
    searchUsers, 
    getTrendingUsers, 
    getUsers
} from '@/lib/firestore';
import { 
    sendConnectionRequest as apiSendRequest,
    getIncomingRequests as apiGetRequests,
    acceptConnectionRequest as apiAcceptRequest,
    rejectConnectionRequest as apiRejectRequest,
    getConnectionStatus as apiGetStatus
} from '@/lib/connections';

// Shared "Character" Data Structure
interface CharacterProfile {
    id: string;
    name: string;
    role: string;
    difficulty: 'Novice' | 'Intermediate' | 'Expert'; // Difficulty Level
    image: string;
    stats: {
        winRate: string; // Metaphor for Success Rate / Engagement
        matches: string; // Metaphor for Projects / Posts
        reputation: string; // Metaphor for Followers
    };
    abilities: { icon: any; label: string }[]; // Skills
    bio: string; // Playstyle
    story: string; // Background
    initials: string;
    usercode?: string;
    requestId?: string;
    connectionStatus?: 'none' | 'pending_sent' | 'pending_received' | 'connected';
}

const INITIAL_DISCOVERY: CharacterProfile[] = [
    {
        id: "alex-thorne",
        name: "Alex Thorne",
        initials: "AT",
        role: "Startup Founder",
        difficulty: "Expert",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "95%", matches: "4.5k", reputation: "Titan" },
        abilities: [
            { icon: Target, label: "Growth" },
            { icon: Zap, label: "Scale" },
            { icon: Shield, label: "Strategy" }
        ],
        bio: "High-velocity founder seeking technical co-founders. Specializes in rapid market penetration.",
        story: "Alex exited his last SaaS company for $50M. He is now building a decentralized identity platform."
    },
    {
        id: "priya-patel",
        name: "Priya Patel",
        initials: "PP",
        role: "Full Stack Dev",
        difficulty: "Intermediate",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "90%", matches: "560", reputation: "Diamond" },
        abilities: [
            { icon: Hexagon, label: "Node" },
            { icon: Activity, label: "APIs" },
            { icon: Eye, label: "React" }
        ],
        bio: "Versatile engineer who bridges the gap between complex backends and smooth frontends.",
        story: "Priya contributes heavily to open source. She is looking for a team that values code quality and mentorship."
    },
    {
        id: "liam-oconnor",
        name: "Liam O'Connor",
        initials: "LO",
        role: "Game DevOps",
        difficulty: "Expert",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "99%", matches: "3.2k", reputation: "Legend" },
        abilities: [
            { icon: Target, label: "CI/CD" },
            { icon: Shield, label: "Infra" },
            { icon: Zap, label: "C++" }
        ],
        bio: "Infrastructure wizard ensuring zero downtime for massive multiplayer environments.",
        story: "Liam managed the servers for a top 10 MMO. He's now consulting for indie studios scaling up."
    },
    {
        id: "sasha-ivanov",
        name: "Sasha Ivanov",
        initials: "SI",
        role: "Security Researcher",
        difficulty: "Expert",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "97%", matches: "1.2k", reputation: "Guardian" },
        abilities: [
            { icon: Shield, label: "PenTesting" },
            { icon: Zap, label: "Exploits" },
            { icon: Hexagon, label: "Rust" }
        ],
        bio: "Ex-whitehat hacker now building bulletproof authentication protocols for the Alliance.",
        story: "Sasha discovered a zero-day in a major cloud provider. He now leads some of the most secure projects on the platform."
    },
    {
        id: "maya-lin",
        name: "Maya Lin",
        initials: "ML",
        role: "UX Architect",
        difficulty: "Intermediate",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "92%", matches: "430", reputation: "Artisan" },
        abilities: [
            { icon: Eye, label: "Flows" },
            { icon: Target, label: "Metrics" },
            { icon: Sparkles, label: "Framer" }
        ],
        bio: "Designing interfaces that aren't just usable, but addictive. Specializes in hyper-fast interactions.",
        story: "Maya previously worked at a top gaming studio. She's now applying game-design principles to productivity software."
    }
];

const INITIAL_REQUESTS: CharacterProfile[] = [
    {
        id: "elena-fisher",
        name: "Elena Fisher",
        initials: "EF",
        role: "Product Designer",
        difficulty: "Expert",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "98%", matches: "1.2k", reputation: "Diamond" },
        abilities: [
            { icon: Hexagon, label: "Systems" },
            { icon: Zap, label: "Prototyping" },
            { icon: Eye, label: "Visuals" }
        ],
        bio: "A high-precision designer who excels at complex system architecture. Balances speed with pixel-perfect execution.",
        story: "Formerly lead design at TechGiant, Elena moved to freelance to pursue experimental UI patterns. She is looking for collaborators on a new fintech engine."
    },
    {
        id: "david-chen",
        name: "David Chen",
        initials: "DC",
        role: "Solutions Architect",
        difficulty: "Intermediate",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "92%", matches: "850", reputation: "Platinum" },
        abilities: [
            { icon: Shield, label: "Security" },
            { icon: Target, label: "Scalability" },
            { icon: Activity, label: "Perf" }
        ],
        bio: "Strategic builder focusing on robust backend infrastructures. great at tanking heavy traffic loads.",
        story: "David spent 5 years optimizing cloud clusters. He now mentors junior devs and builds open-source tools for load balancing."
    },
    {
        id: "zoe-wang",
        name: "Zoe Wang",
        initials: "ZW",
        role: "Contract Engineer",
        difficulty: "Intermediate",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "91%", matches: "210", reputation: "Gold" },
        abilities: [
            { icon: Zap, label: "Solidity" },
            { icon: Shield, label: "Audit" },
            { icon: Activity, label: "Web3" }
        ],
        bio: "Specialist in smart contract security and DeFi protocol architecture.",
        story: "Zoe has audited some of the largest liquidity pools in the space. She's looking to join a DAO-governed project."
    }
];

const INITIAL_NETWORK: CharacterProfile[] = [
    {
        id: "sarah-jenkins",
        name: "Sarah Jenkins",
        initials: "SJ",
        role: "Creative Director",
        difficulty: "Expert",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "99%", matches: "2.1k", reputation: "Legend" },
        abilities: [
            { icon: Star, label: "Brand" },
            { icon: Sparkles, label: "Motion" },
            { icon: User, label: "Leadership" }
        ],
        bio: "Visionary leader who transforms abstract concepts into compelling visual narratives. strong team buffer.",
        story: "Sarah has led campaigns for global brands. She is currently exploring the intersection of AR and traditional advertising."
    },
    {
        id: "marcus-reed",
        name: "Marcus Reed",
        initials: "MR",
        role: "Frontend Specialist",
        difficulty: "Novice",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "88%", matches: "320", reputation: "Gold" },
        abilities: [
            { icon: Zap, label: "React" },
            { icon: Activity, label: "Perf" },
            { icon: Hexagon, label: "CSS" }
        ],
        bio: "Agile developer with a focus on micro-interactions and smooth state management.",
        story: "Marcus is a self-taught prodigy who won three hackathons last year. He's looking to join a high-velocity startup."
    },
    {
        id: "jordan-smith",
        name: "Jordan Smith",
        initials: "JS",
        role: "AI Scientist",
        difficulty: "Expert",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "96%", matches: "120", reputation: "Titan" },
        abilities: [
            { icon: Sparkles, label: "LLMs" },
            { icon: Target, label: "Training" },
            { icon: Shield, label: "Safety" }
        ],
        bio: "Specializing in alignment and prompt architecture. Turning black boxes into reliable tools.",
        story: "Jordan lead the research for a top open source model. Now he is building an AI-first coding assistant."
    },
    {
        id: "nina-vo",
        name: "Nina Vo",
        initials: "NV",
        role: "UI Engineer",
        difficulty: "Intermediate",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "94%", matches: "890", reputation: "Diamond" },
        abilities: [
            { icon: Eye, label: "Design" },
            { icon: Zap, label: "Three.js" },
            { icon: Activity, label: "Physics" }
        ],
        bio: "Crafting tactile digital experiences that feel physical. Expert in bespoke animations.",
        story: "Nina worked on high-end luxury brand websites. She's now open to innovative fintech projects."
    },
    {
        id: "kenji-tanaka",
        name: "Kenji Tanaka",
        initials: "KT",
        role: "Product Lead",
        difficulty: "Expert",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "96%", matches: "1.5k", reputation: "Elite" },
        abilities: [
            { icon: Target, label: "Roadmaps" },
            { icon: Users, label: "Mentoring" },
            { icon: Star, label: "Strategy" }
        ],
        bio: "Leading cross-functional teams to build products that define markets. Obsessed with velocity.",
        story: "Kenji scaled his previous startup from 0 to 1M users in 12 months. He's looking for the next big challenge."
    },
    {
        id: "elena-vasquez",
        name: "Elena Vasquez",
        initials: "EV",
        role: "Growth Marketer",
        difficulty: "Intermediate",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
        stats: { winRate: "93%", matches: "620", reputation: "Catalyst" },
        abilities: [
            { icon: Zap, label: "Virality" },
            { icon: Target, label: "Funnels" },
            { icon: Activity, label: "Analysis" }
        ],
        bio: "Turning early-stage projects into global names through data-driven growth loops.",
        story: "Elena leads growth for some of the most prominent projects in the Alliance. She's an expert at finding the 'magic' in a product."
    }
];

function Networking() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'discovery' | 'requests' | 'network'>('discovery');
    const [discoveryList, setDiscoveryList] = useState<CharacterProfile[]>(INITIAL_DISCOVERY);
    const [requestsList, setRequestsList] = useState<CharacterProfile[]>(INITIAL_REQUESTS);
    const [networkList, setNetworkList] = useState<CharacterProfile[]>(INITIAL_NETWORK);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Convert Firestore user to CharacterProfile format for UI
    const mapUserToProfile = (u: any): CharacterProfile => ({
        id: u.id,
        name: u.displayName || u.username || 'Unknown',
        initials: (u.displayName || u.username || 'U').substring(0, 2).toUpperCase(),
        role: u.bio ? u.bio.substring(0, 40) : 'Node Agent',
        difficulty: u.xp > 5000 ? 'Expert' : u.xp > 1000 ? 'Intermediate' : 'Novice',
        image: u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop',
        stats: { winRate: `${u.xp || 0} XP`, matches: `${u.vp || 0} VP`, reputation: `${u.connectionsCount || 0} Conn` },
        abilities: [{ icon: Target, label: "Core" }],
        bio: u.bio || 'A mysterious node in the network.',
        story: 'Awaiting data synchronization.',
        usercode: u.userId || u.usercode,
    });

    useEffect(() => {
        if (!currentUser) return;
        
        const fetchData = async () => {
            // 1. Get Trending Users
            const trending = await getTrendingUsers(20);
            const discovery = trending.length > 0
                ? trending.filter(u => u.id !== currentUser.uid).map(mapUserToProfile)
                : INITIAL_DISCOVERY;
            
            // 2. Get Incoming Requests
            const requests = await apiGetRequests(currentUser.uid);
            const requestProfiles = await getUsers(requests.map((r: any) => r.sender_id));
            const mappedRequests = requestProfiles.length > 0
                ? requestProfiles.map(s => {
                    const req = requests.find((r: any) => r.sender_id === s.id);
                    return { ...mapUserToProfile(s), requestId: req?.id, connectionStatus: 'pending_received' as const };
                })
                : INITIAL_REQUESTS;

            // 3. Get Network (this part is tricky because the SQL backend returns ids, we need profiles)
            // For now, let's just fetch all users and filter (in a real app, you'd have a specific endpoint)
            // Actually, let's assume getTrendingUsers gives enough context or add a proper fetch connections endpoint if needed.
            // Since I added removeConnection, I should probably add getConnections to the service later, but for now I'll use simple mapping.
            
            setDiscoveryList(discovery);
            setRequestsList(mappedRequests);
            setNetworkList(INITIAL_NETWORK);
            
            // 4. Fetch status for each discovery user to show correct button
            const updatedDiscovery = await Promise.all(discovery.map(async (p) => {
                try {
                    const status = await apiGetStatus(p.id);
                    return { ...p, connectionStatus: status };
                } catch {
                    return { ...p, connectionStatus: 'none' as const };
                }
            }));
            setDiscoveryList(updatedDiscovery.length > 0 ? updatedDiscovery : INITIAL_DISCOVERY);
        };

        fetchData().catch(() => {
            setDiscoveryList(INITIAL_DISCOVERY);
            setRequestsList(INITIAL_REQUESTS);
            setNetworkList(INITIAL_NETWORK);
        });

        // Note: Real-time subscriptions are replaced by the new request-based API.
        // In a production app, we would use WebSockets or React Query for sync.
    }, [currentUser]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                setIsSearching(true);
                try {
                    const results = await performGlobalSearch(searchTerm);
                    setSearchResults(results.map(res => ({
                        ...res.data,
                        type: res.type,
                        // Fix for mapping to character profile if needed
                        name: res.title,
                        image: res.image,
                        stats: res.data.stats || { winRate: "0%", matches: "0", reputation: "Node" }
                    })));
                } catch (err) {
                    console.error("Search failed:", err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleConnect = async (profile: CharacterProfile) => {
        if (!currentUser) return;
        
        // Optimistic UI update
        setDiscoveryList(prev => prev.map(p => 
            p.id === profile.id ? { ...p, connectionStatus: 'pending_sent' } : p
        ));
        
        try {
            await apiSendRequest(profile.id);
            toast.success("Connection request sent", { description: `To ${profile.name}` });
        } catch (err: any) {
            toast.error("Failed to send request", { description: err.message });
            // Revert state
            setDiscoveryList(prev => prev.map(p => 
                p.id === profile.id ? { ...p, connectionStatus: 'none' } : p
            ));
        }
    };

    const handleAccept = async (profile: CharacterProfile) => {
        if (!currentUser || !profile.requestId) return;
        
        // Optimistic UI update
        setRequestsList(prev => prev.filter(p => p.id !== profile.id));
        
        try {
            await apiAcceptRequest(Number(profile.requestId));
            toast.success("Connection accepted");
            // Add to network list
            setNetworkList(prev => [...prev, { ...profile, connectionStatus: 'connected' }]);
        } catch (err: any) {
            toast.error("Failed to accept request");
            // Revert state
            setRequestsList(prev => [...prev, profile]);
        }
    };

    const handleReject = async (profile: CharacterProfile) => {
        if (!profile.requestId) return;
        
        setRequestsList(prev => prev.filter(p => p.id !== profile.id));
        try {
            await apiRejectRequest(Number(profile.requestId));
            toast.success("Connection rejected");
        } catch (err: any) {
            toast.error("Failed to reject request");
            setRequestsList(prev => [...prev, profile]);
        }
    };

    // Helper to get ability icon
    const AbilityIcon = ({ icon: Icon, label }: { icon: any, label: string }) => (
        <div className="flex flex-col items-center gap-1 group/icon cursor-default relative">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center border border-transparent group-hover/icon:border-[var(--color-accent)] group-hover/icon:bg-[var(--color-accent)]/10 transition-all duration-300">
                <Icon size={14} className="text-[var(--color-text)] group-hover/icon:text-[var(--color-accent)]" />
            </div>
            {/* Tooltip-like label on hover for cleaner look */}
            <span className="hidden group-hover/icon:block absolute bottom-full mb-2 text-[9px] font-bold uppercase bg-black text-white px-2 py-1 rounded-lg tracking-widest whitespace-nowrap z-10 animate-in fade-in slide-in-from-bottom-1 pointer-events-none">
                {label}
            </span>
        </div>
    );


    const filteredDiscoveryList = discoveryList.filter(d => 
        !networkList.some(n => n.id === d.id) &&
        !requestsList.some(r => r.id === d.id)
    );

    let activeList = filteredDiscoveryList;
    if (activeTab === 'requests') activeList = requestsList;
    if (activeTab === 'network') activeList = networkList;

    return (
        <div className="pt-6 pb-20 max-w-7xl mx-auto px-4 md:px-8">
            <header className="mb-6 border-b border-[var(--color-surface)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-[var(--color-text)] uppercase leading-none mb-2">
                        Roster
                    </h1>
                    <p className="text-xs md:text-sm text-[var(--color-text)] opacity-60 font-mono uppercase tracking-widest">
                        Manage your Alliance
                    </p>
                </div>

                {/* Search & Tab Switcher */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:w-80 group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-accent)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, @code or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-[var(--color-surface)] pl-10 pr-4 py-2 text-xs font-medium outline-none focus:border-[var(--color-accent)] shadow-brutal-sm transition-all rounded-lg"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Activity size={12} className="text-[var(--color-accent)] animate-spin" />
                            </div>
                        )}
                    </div>

                    <div className="flex bg-[var(--color-surface)]/30 p-1 rounded-lg">
                        {['discovery', 'requests', 'network'].map((tab) => (
                            <button
                                key={tab}
                                className={cn(
                                    "px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300",
                                    activeTab === tab
                                        ? "bg-[var(--color-accent)] text-white shadow-brutal-sm"
                                        : "text-[var(--color-text)] opacity-60 hover:opacity-100 hover:bg-white/50"
                                )}
                                onClick={() => setActiveTab(tab as any)}
                            >
                                {tab === 'network' ? 'Member Network' : tab}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* View Content */}
            {activeTab === 'discovery' ? (
                // Compact Card Grid for Discovery
                (searchTerm.length >= 2 ? searchResults : activeList).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {(searchTerm.length >= 2 ? searchResults : activeList).map((char: any) => (
                            <div key={char.id} className="flex flex-col h-[480px] border border-[var(--color-surface)] bg-white group hover:border-[var(--color-text)] transition-all duration-300 rounded-lg overflow-hidden relative shadow-brutal-sm hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">


                                <NavLink to={`/profile/${char.id}`} className="h-[48%] relative overflow-hidden bg-[var(--color-text)] block">
                                    <img src={char.photoURL || char.image} alt={char.displayName || char.name} className="w-full h-full object-cover opacity-80 mix-blend-overlay transition-transform duration-700 group-hover:scale-105 filter grayscale group-hover:grayscale-0" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-text)] via-transparent to-transparent" />

                                    <div className="absolute bottom-4 left-4 right-4 animate-in slide-in-from-bottom-2 duration-500">
                                        <h2 className="text-xl font-bold text-white uppercase tracking-tight leading-none mb-1 drop-shadow-brutal-sm">
                                            {char.displayName || char.name}
                                        </h2>
                                        <p className="text-white/80 font-mono text-[10px] uppercase tracking-wider bg-[var(--color-text)] inline-block px-2 py-1">
                                            {char.role} {char.usercode && (
                                                <span className="ml-1 opacity-50">• {char.usercode}</span>
                                            )}
                                        </p>
                                    </div>
                                </NavLink>

                                {/* 2. Character Information Zone (Bottom) */}
                                <div className="h-[52%] flex flex-col p-5 relative bg-white">
                                    <div className="flex-grow">
                                        {/* Stats Mini-Bar */}
                                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--color-surface)]">
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-1 text-[var(--color-accent)]" title="Win Rate">
                                                    <Target size={12} />
                                                    <span className="text-xs font-bold font-mono">{char.stats.winRate}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[var(--color-text)] opacity-60" title="Matches">
                                                    <Activity size={12} />
                                                    <span className="text-xs font-bold font-mono">{char.stats.matches}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 bg-[var(--color-surface)] px-2 py-1 border border-transparent">
                                                <Hexagon size={10} className="text-[var(--color-text)]" />
                                                <span className="text-[9px] font-bold text-[var(--color-text)] uppercase tracking-wider">{char.difficulty}</span>
                                            </div>
                                        </div>

                                        <p className="text-[11px] leading-relaxed text-[var(--color-text)] mb-6 line-clamp-3 font-medium opacity-80">
                                            {char.bio || "No profile bio available for this node identifier."}
                                        </p>

                                        <div className="flex gap-2 mt-auto">
                                            {(char.abilities || [
                                                { icon: Target, label: "Core" },
                                                { icon: Shield, label: "Verified" }
                                            ]).map((ability: any, i: number) => (
                                                <AbilityIcon key={i} icon={ability.icon} label={ability.label} />
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => char.connectionStatus === 'none' && handleConnect(char)}
                                        disabled={char.connectionStatus !== 'none'}
                                        className={cn(
                                            "w-full h-10 mt-6 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-lg border border-transparent shadow-brutal-sm",
                                            char.connectionStatus === 'none' && "bg-orange-500 hover:bg-orange-600 text-white hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]",
                                            char.connectionStatus === 'pending_sent' && "bg-gray-100 text-gray-400 cursor-not-allowed",
                                            char.connectionStatus === 'connected' && "bg-emerald-500 text-white cursor-default"
                                        )}
                                    >
                                        {char.connectionStatus === 'none' && <><UserPlus size={14} /> Connect</>}
                                        {char.connectionStatus === 'pending_sent' && <><Activity size={14} className="animate-pulse" /> Requested</>}
                                        {char.connectionStatus === 'connected' && <><Check size={14} /> Connected</>}
                                        {char.connectionStatus === 'pending_received' && <><Sparkles size={14} /> Accept Request</>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Search />
                            </EmptyMedia>
                            <EmptyTitle>No Profiles Found</EmptyTitle>
                            <EmptyDescription>
                                There are no profiles matching your current criteria in Discovery.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )
            ) : (
                // LIST View for Requests and Network utilizing Avatars
                activeList.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {activeList.map(char => (
                            <div key={char.id} className="flex items-center p-4 bg-white border border-[var(--color-surface)] hover:border-[var(--color-accent)] transition-all duration-300 rounded-lg group hover:shadow-brutal-sm">
                                <NavLink to={`/profile/${char.id}`} className="mr-4 shrink-0">
                                    <Avatar className="h-14 w-14 border border-[var(--color-surface)] shadow-brutal-sm rounded-lg">
                                        <AvatarImage src={char.image} alt={char.name} className="rounded-lg" />
                                        <AvatarFallback className="rounded-lg">{char.initials}</AvatarFallback>
                                    </Avatar>
                                </NavLink>

                                {/* Info */}
                                <div className="flex-grow min-w-0 mr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <NavLink to={`/profile/${char.id}`}>
                                            <h3 className="text-base font-bold text-[var(--color-text)] uppercase tracking-tight truncate group-hover:text-[var(--color-accent)] transition-colors">
                                                {char.name}
                                            </h3>
                                        </NavLink>
                                        {activeTab === 'network' && (
                                            <div className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-100 rounded-lg">
                                                <span className="w-1.5 h-1.5 rounded-lg bg-emerald-500" />
                                                Online
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-[var(--color-text)] opacity-60 font-mono uppercase tracking-wide truncate mb-2">
                                        {char.role}
                                    </p>
                                    <div className="flex gap-3">
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                            <Target size={10} className="text-[var(--color-accent)]" />
                                            {char.stats.winRate} WR
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                            <Activity size={10} className="text-blue-500" />
                                            {char.stats.matches} Matches
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 shrink-0">
                                    {activeTab === 'requests' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReject(char)}
                                                className="h-8 w-8 flex items-center justify-center bg-gray-50 border border-gray-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-lg transition-colors text-gray-400" title="Reject"
                                            >
                                                <X size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleAccept(char)}
                                                className="h-8 w-8 flex items-center justify-center bg-[var(--color-text)] hover:bg-[var(--color-accent)] text-white rounded-lg transition-colors shadow-brutal-sm" title="Accept"
                                            >
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button className="px-3 h-8 border border-gray-200 hover:border-[var(--color-text)] hover:bg-gray-50 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2">
                                                <MessageSquare size={12} />
                                                <span className="hidden sm:inline">Message</span>
                                            </button>
                                            <button className="h-8 w-8 flex items-center justify-center border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-[var(--color-text)]">
                                                <MoreHorizontal size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div >
                        ))
                        }
                    </div >
                ) : (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                {activeTab === 'requests' ? <UserPlus /> : <Users />}
                            </EmptyMedia>
                            <EmptyTitle>
                                {activeTab === 'requests' ? 'No Pending Requests' : 'Your Network is Empty'}
                            </EmptyTitle>
                            <EmptyDescription>
                                {activeTab === 'requests'
                                    ? "You're all caught up! Check back later for new connection requests."
                                    : "You haven't connected with anyone yet. Go to Discovery to find people."}
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )
            )}
        </div >
    );
}

export default Networking;
