import { useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { 
    MapPin, 
    Target, 
    Clock, 
    BarChart3, 
    Check, 
    Mail, 
    Bookmark, 
    ChevronRight, 
    Star, 
    Users, 
    Calendar, 
    MessageSquare,
    ArrowUpRight,
    TrendingUp,
    ShieldCheck,
    Briefcase,
    GraduationCap,
    Info,
    Layout,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MOCK_USERS } from '@/utils/mockData';

function OtherProfile() {
    const [activeTab, setActiveTab] = useState('Overview');
    const [isFollowing, setIsFollowing] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const { userId } = useParams();
    const navigate = useNavigate();
    const user = MOCK_USERS[userId || ""];
    
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
                <div className="p-12 bg-white border border-[var(--color-surface)] shadow-sm text-center space-y-6 max-w-md rounded-lg">
                    <h1 className="text-4xl font-bold tracking-tight text-red-500 leading-tight">404: Node Missing</h1>
                    <p className="font-medium text-sm opacity-60">The user node you are seeking is either offline or has been purged from the mesh.</p>
                    <NavLink to="/" className="inline-block px-8 py-3 bg-[var(--color-text)] text-white font-bold uppercase tracking-widest hover:bg-[var(--color-accent)] transition-all rounded-lg">Return to Home</NavLink>
                </div>
            </div>
        );
    }

    const TABS = [
        { name: 'Overview', count: null },
        { name: 'Contributions', count: user.posts.length },
        { name: 'Portfolio', count: 18 },
        { name: 'Sessions', count: 6 },
        { name: 'Activity', count: null }
    ];

    const posts = user.posts;

    const SignalBar = ({ label, value }: { label: string, value: number }) => (
        <div className="space-y-1 flex-1">
            <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider opacity-40">
                <span>{label}</span>
                <span>{value}</span>
            </div>
            <div className="h-1 bg-gray-50 rounded-lg overflow-hidden">
                <div 
                    className="h-full bg-[var(--color-accent)] rounded-lg transition-all duration-1000"
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );

    return (
        <TooltipProvider>
        <div className="max-w-7xl mx-auto px-6 pb-10 pt-4 animate-in fade-in duration-700">
            {/* Back Button */}
            <button 
                onClick={() => navigate(-1)} 
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity mb-6 group"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
            </button>
            {/* 1. HERO SECTION (Identity Layer) */}
            <div className="bg-white border border-[var(--color-surface)] shadow-sm overflow-hidden mb-4 rounded-lg text-[var(--color-text)]">
                <div className="h-48 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 relative">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
                </div>
                
                <div className="px-8 pb-4 -mt-16 relative flex flex-col md:flex-row items-end justify-between gap-4">
                    <div className="flex flex-col md:flex-row items-end gap-4 text-center md:text-left">
                        <div className="w-40 h-40 border-8 border-white shadow-lg rounded-lg overflow-hidden bg-white">
                            <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                        </div>
                        
                        <div className="pb-2 space-y-2">
                            <div>
                                <h1 className="text-4xl font-bold text-[var(--color-text)] tracking-tight">{user.name}</h1>
                                <p className="text-lg font-semibold text-[var(--color-accent)]">{user.role}</p>
                            </div>
                            <p className="max-w-xl text-sm font-medium opacity-60 italic leading-relaxed">
                                “{user.bio}”
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-6 pt-2">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest opacity-60">
                                    <MapPin size={14} className="text-[#6366f1]" /> {user.location}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest opacity-60">
                                    <Target size={14} className="text-[#6366f1]" /> {user.expertise[0]} • {user.expertise[1]}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest opacity-60">
                                    <Clock size={14} className="text-[#6366f1]" /> 8+ years experience
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest opacity-60">
                                    <BarChart3 size={14} className="text-[#6366f1]" /> Score: {user.stats.score}
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-4">
                                {user.expertise.map((chip: string) => (
                                    <span key={chip} className="px-3 py-1 bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-100 rounded-lg">
                                        {chip}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    
                    <div className="flex gap-3 pb-4">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    className={cn(
                                        "h-12 px-8 rounded-none font-bold uppercase tracking-widest text-xs transition-all shadow-sm active:scale-95",
                                        isFollowing ? "bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50" : "bg-[var(--color-text)] text-white hover:bg-[var(--color-accent)]"
                                    )}
                                    onClick={() => setIsFollowing(!isFollowing)}
                                >
                                    {isFollowing ? <><Check size={16} className="mr-2" /> Following</> : "Follow"}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-lg border border-[var(--color-surface)] bg-white text-[var(--color-text)] shadow-xl">
                                <p className="text-[10px] font-bold uppercase tracking-wider">Stay updated</p>
                            </TooltipContent>
                        </Tooltip>
 
                        <Button variant="outline" className="h-12 px-6 rounded-lg border border-[var(--color-surface)] font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors bg-white text-[var(--color-text)]">
                            <Mail size={16} className="mr-2" /> Message
                        </Button>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    className={cn(
                                        "h-12 w-12 p-0 rounded-lg font-bold border border-[var(--color-surface)] transition-all shadow-sm active:scale-95",
                                        isSaved ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-white text-[var(--color-text)] hover:bg-gray-50"
                                    )}
                                    onClick={() => setIsSaved(!isSaved)}
                                >
                                    <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-lg border border-[var(--color-surface)] bg-white text-[var(--color-text)] shadow-xl">
                                <p className="text-[10px] font-bold uppercase tracking-wider">Save to vault</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* 3. TAB NAVIGATION */}
            <div className="flex border-b border-[var(--color-surface)] mb-4 px-2 overflow-x-auto scrollbar-hide bg-gray-50/30 rounded-t-none">
                {TABS.map(tab => (
                    <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.name)}
                        className={cn(
                            "px-6 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all relative whitespace-nowrap",
                            activeTab === tab.name 
                                ? "border-[var(--color-accent)] text-[var(--color-text)]" 
                                : "border-transparent text-gray-400 hover:text-gray-600"
                        )}
                    >
                        {tab.name}
                        {tab.count !== null && (
                            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-lg text-[8px] font-bold text-gray-500 border border-gray-100">
                                {tab.count}
                            </span>
                        )}
                        {activeTab === tab.name && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)] animate-in slide-in-from-left-full"></div>}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* 4. LEFT PANEL (Credibility Layer) */}
                <aside className="lg:col-span-3 space-y-4">
                    <div className="bg-white border border-[var(--color-surface)] shadow-sm rounded-lg p-4 space-y-6 text-[var(--color-text)]">
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-gray-400">
                                <ShieldCheck size={14} className="text-[#6366f1]" /> Credibility
                            </h3>
                            <div className="space-y-4">
                                <div className="group">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Insight Score</span>
                                        <span className="text-xl font-bold text-[var(--color-text)]">{user.stats.score}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Top 10% Contributors</p>
                                </div>
                                <div className="group">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Response</span>
                                        <span className="text-xl font-bold text-[var(--color-text)]">{user.stats.response}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Highly Responsive</p>
                                </div>
                                <div className="group">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Community Rank</span>
                                    </div>
                                    <p className="text-xs font-bold text-[var(--color-text)] opacity-80">{user.stats.rank}</p>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-gray-50" />

                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-gray-400">
                                <TrendingUp size={14} className="text-[#6366f1]" /> Expertise
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {['UX Design', 'Design Systems', 'SaaS Products', 'User Research', 'Interaction Design'].map(skill => (
                                    <span key={skill} className="px-3 py-1.5 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-500 border border-gray-100 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all cursor-default">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <Separator className="bg-gray-50" />

                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-gray-400">
                                <Calendar size={14} className="text-[#6366f1]" /> Availability
                            </h3>
                            <p className="text-xs font-medium opacity-60 mb-4">Available for mentorship and collaborative sessions</p>
                            <div className="flex items-center gap-2 p-3 bg-blue-50/50 text-blue-600 rounded-lg border border-blue-100">
                                <Clock size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Next slot: Today, 9:00 PM</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* 5. CENTER FEED (Core Content) */}
                <main className="lg:col-span-6 space-y-4">
                    {activeTab === 'Overview' || activeTab === 'Contributions' ? (
                        <>
                            {posts.map((post: any, i: number) => (
                                <div key={i} className="bg-white border border-[var(--color-surface)] shadow-sm rounded-lg p-8 space-y-6 hover:shadow-md transition-all group text-[var(--color-text)]">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-[var(--color-surface)] text-[var(--color-text)] text-[9px] font-bold uppercase tracking-widest rounded-lg">
                                                {post.type}
                                            </span>
                                            <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{post.time}</span>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-30 transition-opacity">
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-[var(--color-accent)] transition-colors leading-tight uppercase">
                                            {post.title}
                                        </h3>
                                        <p className="text-sm font-bold text-[#6366f1] mb-4 bg-indigo-50/50 px-4 py-2 border border-indigo-100 rounded-lg inline-block">
                                            {post.highlight}
                                        </p>
                                        <p className="text-sm font-medium opacity-60 leading-relaxed line-clamp-3">
                                            {post.preview}
                                        </p>
                                    </div>

                                    {/* Signal Bar Section */}
                                    <div className="pt-4 flex gap-6">
                                        <SignalBar label="Insight" value={post.signals.insight} />
                                        <SignalBar label="Depth" value={post.signals.depth} />
                                        <SignalBar label="Relevance" value={post.signals.relevance} />
                                    </div>

                                    {post.topResponse && (
                                        <div className="mt-4 p-5 bg-gray-50 border border-gray-100 rounded-lg">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-1.5 h-1.5 rounded-lg bg-emerald-500"></div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Top Response</span>
                                            </div>
                                            <p className="text-sm font-medium italic opacity-70">
                                                {post.topResponse}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    ) : activeTab === 'Portfolio' ? (
                        /* 6. PORTFOLIO TAB (Case Engine) */
                        <div className="space-y-8 animate-in fade-in duration-500 text-[var(--color-text)]">
                            {/* Featured Case */}
                            <div className="bg-white border border-[var(--color-surface)] shadow-sm rounded-lg p-10 space-y-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 text-black opacity-5 group-hover:scale-110 transition-transform">
                                    <Briefcase size={120} strokeWidth={1} />
                                </div>
                                <div className="relative">
                                    <span className="px-4 py-1.5 bg-[#6366f1] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg mb-6 inline-block">
                                        Featured Case
                                    </span>
                                    <h2 className="text-4xl font-bold tracking-tight mb-4 leading-none uppercase">Scaling a Design System Across 5 Product Teams</h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest underline underline-offset-4 decoration-red-100">Problem</h4>
                                            <p className="text-sm font-medium opacity-70">Inconsistent UI patterns slowed down development cycles</p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest underline underline-offset-4 decoration-blue-100">Approach</h4>
                                            <p className="text-sm font-medium opacity-70">Built a modular component system with shared design tokens</p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest underline underline-offset-4 decoration-emerald-100">Outcome</h4>
                                            <ul className="text-sm font-bold space-y-1">
                                                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" strokeWidth={3} /> 35% faster cycles</li>
                                                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" strokeWidth={3} /> Improved parity</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <Button className="mt-10 h-14 w-full rounded-lg font-bold bg-[var(--color-text)] hover:bg-[var(--color-accent)] text-white uppercase tracking-widest text-xs transition-all shadow-sm">View Full Case Study</Button>
                                </div>
                            </div>
                            
                            {/* Other Projects */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { title: 'Improving Onboarding Conversion', res: '+18% activation rate' },
                                    { title: 'Mobile UX Optimization', res: 'Reduced drop-offs by 22%' },
                                    { title: 'SaaS Dashboard Redesign', res: 'Increased completion speed' },
                                ].map((proj, i) => (
                                    <div key={i} className="bg-white border border-[var(--color-surface)] p-8 rounded-lg hover:shadow-md transition-all group">
                                        <h4 className="text-lg font-bold tracking-tight mb-4 leading-tight group-hover:text-[var(--color-accent)] transition-colors uppercase">{proj.title}</h4>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg inline-block">
                                            {proj.res}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Empty States */
                        <div className="bg-gray-50/50 border border-dashed border-[var(--color-surface)] rounded-lg p-20 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white rounded-lg border border-[var(--color-surface)] flex items-center justify-center text-gray-300 shadow-sm">
                                <Info size={32} />
                            </div>
                            <h3 className="text-xl font-bold opacity-40 uppercase tracking-widest text-[var(--color-text)]">
                                {activeTab === 'Contributions' ? 'No Contributions Yet' : 
                                 activeTab === 'Portfolio' ? 'No Portfolio Added' :
                                 `No ${activeTab} data available`}
                            </h3>
                            <p className="text-xs font-medium opacity-30 max-w-xs uppercase tracking-widest leading-relaxed">
                                {activeTab === 'Contributions' ? 'Start sharing insights to build your profile presence.' : 
                                 activeTab === 'Portfolio' ? 'Showcase your work to highlight your expertise.' :
                                 'This section is currently empty.'}
                            </p>
                        </div>
                    )}
                </main>

                {/* 7. RIGHT PANEL (Decision Layer) */}
                <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-8 text-[var(--color-text)]">
                    {/* Signal Dashboard */}
                    <div className="bg-white border border-[var(--color-surface)] shadow-sm rounded-lg p-8 space-y-8">
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-gray-400">
                                <BarChart3 size={14} className="text-[#6366f1]" /> Dashboard
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Total Insights', val: '482', color: 'text-blue-500' },
                                    { label: 'Avg Insight Score', val: '84', color: 'text-indigo-500' },
                                    { label: 'Engagement Quality', val: '91%', highlight: 'Top rated', color: 'text-emerald-500' }
                                ].map(sig => (
                                    <div key={sig.label}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{sig.label}</span>
                                            <span className={cn("text-xl font-bold", sig.color)}>{sig.val}</span>
                                        </div>
                                        {sig.highlight && <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{sig.highlight}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator className="bg-gray-50/50" />

                        {/* Community Presence */}
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-gray-400">
                                <Users size={14} className="text-[#6366f1]" /> Presence
                            </h3>
                            <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-4">Active in:</p>
                            <div className="space-y-3">
                                {['Product Builders Hub', 'UX Innovators', 'SaaS Growth Circle'].map(hub => (
                                    <div key={hub} className="flex items-center justify-between group cursor-pointer">
                                        <span className="text-xs font-bold opacity-70 group-hover:text-[var(--color-accent)] transition-colors uppercase">{hub}</span>
                                        <ChevronRight size={14} className="opacity-20 translate-x-0 group-hover:translate-x-1 group-hover:opacity-100 transition-all text-[#6366f1]" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator className="bg-gray-50/50" />

                        {/* Book Session */}
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-gray-400">
                                <Calendar size={14} className="text-[#6366f1]" /> Sessions
                            </h3>
                            <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-4">Available for 1:1 sessions</p>
                            
                            <div className="space-y-4">
                                <div className="text-center p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#6366f1]">Today</span>
                                    <div className="flex gap-2 mt-3 text-[var(--color-text)]">
                                        <Button variant="outline" className="flex-1 h-10 rounded-lg text-[10px] font-bold border border-gray-200 bg-white hover:bg-gray-50 transition-all uppercase tracking-widest">9:00 PM</Button>
                                        <Button variant="outline" className="flex-1 h-10 rounded-lg text-[10px] font-bold border border-gray-200 bg-white hover:bg-gray-50 transition-all uppercase tracking-widest">10:00 PM</Button>
                                    </div>
                                </div>
                                <Button className="w-full h-12 rounded-lg bg-[var(--color-text)] text-white font-bold uppercase tracking-widest text-[10px] shadow-sm hover:bg-[var(--color-accent)] transition-all">Book Session</Button>
                            </div>
                        </div>
                    </div>

                    {/* Suggested Profiles */}
                    <div className="bg-white border border-[var(--color-surface)] shadow-sm rounded-lg p-8">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest mb-6 text-gray-400">Suggested</h3>
                        <div className="space-y-0">
                            {[
                                { id: 'diana-kumar', name: 'Diana Kumar', role: 'Product Designer', img: 'https://i.pravatar.cc/100?img=32' },
                                { id: 'jared-watts', name: 'Jared Watts', role: 'Growth PM', img: 'https://i.pravatar.cc/100?img=12' }
                            ].map(suggest => (
                                <NavLink key={suggest.id} to={`/profile/${suggest.id}`} className="flex items-center gap-4 group cursor-pointer border-b border-gray-50 last:border-0 pb-4 last:pb-0 pt-4 first:pt-0">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 transition-all group-hover:scale-105">
                                        <img src={suggest.img} className="w-full h-full object-cover" alt={suggest.name} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="text-sm font-bold tracking-tight group-hover:text-[var(--color-accent)] transition-colors truncate uppercase">{suggest.name}</h4>
                                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest truncate">{suggest.role}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border border-gray-100 group-hover:bg-gray-50 group-hover:text-[var(--color-accent)] text-gray-300">
                                        <Plus className="opacity-40 group-hover:opacity-100" size={14} />
                                    </Button>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
        </TooltipProvider>
    );
}

const Separator = ({ className }: { className?: string }) => <div className={cn("h-px w-full my-6", className)} />;

const Plus = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export default OtherProfile;
