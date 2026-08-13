import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Trophy, Zap, ArrowRight, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../components/ui/empty';
import { Field } from '../components/ui/field';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/dialog";
import { getCommunities } from '@/lib/firestore';
import { useAuth } from '@/context/useAuth';
import { toast } from 'sonner';

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={cn("px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider border", className)}>
        {children}
    </span>
);

const MOCK_COMMUNITIES = [
    {
        id: '1',
        name: "React Flow",
        description: "The largest community of React developers building modern UIs.",
        members: "14.2k",
        active: "Very High",
        category: "Tech",
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop",
        logo: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=200&auto=format&fit=crop",
        rank: 1,
        tags: ["React", "Frontend", "UI"]
    },
    {
        id: '2',
        name: "Indie Hackers NYC",
        description: "Local meetup group for bootstrapped founders in the greater NY area.",
        members: "8.5k",
        active: "High",
        category: "Founders",
        image: "https://images.unsplash.com/photo-1496469888073-80de7e952517?q=80&w=600&auto=format&fit=crop",
        logo: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=200&auto=format&fit=crop",
        rank: 2,
        tags: ["Startup", "SaaS", "Networking"]
    }
];

function Communities() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [activeCategory, setActiveCategory] = useState('All');
    const [communities, setCommunities] = useState<any[]>(MOCK_COMMUNITIES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const data = await getCommunities();
                if (data.length > 0) {
                    setCommunities(data);
                }
            } catch (error) {
                console.error("Error fetching communities:", error);
                toast.error("Failed to load communities");
            } finally {
                setLoading(false);
            }
        };
        fetchCommunities();
    }, []);

    const categories = ["All", "Tech", "Design", "Founders", "AI", "Marketing", "Fintech", "Science"];

    const filteredCommunities = activeCategory === 'All'
        ? communities
        : communities.filter(c => c.category === activeCategory);

    return (
        <div className="font-outfit pt-4 pb-10 max-w-7xl mx-auto px-4 md:px-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-end mb-4 border-b border-[var(--color-surface)] pb-4 gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)] uppercase leading-none">
                        Communities
                    </h1>
                    <p className="text-xs md:text-sm text-gray-400 mt-4 font-bold uppercase tracking-widest pl-1">
                        Find your Tribe
                    </p>
                </div>
                <Button className="rounded-none font-bold uppercase tracking-widest bg-[var(--color-accent)] text-white border border-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 transition-all h-12 px-8 shadow-sm">
                    <Plus size={18} className="mr-2" /> Create Community
                </Button>
            </header>

            {/* Search & Filter Bar */}
            <div className="flex flex-col gap-6 mb-4">
                <Field>
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[var(--color-accent)] transition-colors" size={20} strokeWidth={2} />
                        <input
                            type="text"
                            placeholder="Search for Alliances..."
                            className="w-full h-14 pl-16 pr-6 bg-white border border-[var(--color-surface)] focus:border-[var(--color-accent)] focus:outline-none transition-all font-bold text-xs uppercase tracking-widest rounded-lg shadow-sm"
                        />
                    </div>
                </Field>
                <div className="flex flex-wrap gap-3">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border",
                                activeCategory === cat
                                    ? "bg-[var(--color-text)] text-white border-[var(--color-text)] shadow-sm"
                                    : "bg-white text-gray-400 border-[var(--color-surface)] hover:text-[var(--color-text)] hover:border-[var(--color-text)]"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Communities Grid */}
            {filteredCommunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCommunities.map(community => (
                        <div key={community.id} className="group border border-[var(--color-surface)] bg-white hover:border-[var(--color-accent)] transition-all duration-300 shadow-sm rounded-lg overflow-hidden flex flex-col h-[400px]">

                            {/* Hero Image */}
                            <div className="h-32 relative overflow-hidden bg-[var(--color-text)] border-b border-[var(--color-surface)]">
                                <img src={community.image} alt={community.name} className="w-full h-full object-cover transition-all duration-700 opacity-80 group-hover:opacity-100" />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-2 border border-white/10 rounded-lg">
                                    <Trophy size={10} className="text-[var(--color-accent)]" />
                                    Rank #{community.rank}
                                </div>
                            </div>

                            {/* Content */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="p-6 flex flex-col flex-1 relative cursor-pointer pt-10">
                                        {/* Floating Avatar Logo (Left) */}
                                        <div className="absolute -top-8 left-6">
                                            <Avatar className="h-16 w-16 border border-[var(--color-surface)] shadow-sm rounded-lg bg-white">
                                                <AvatarImage src={community.logo} className="object-cover transition-all" />
                                                <AvatarFallback className="rounded-lg bg-[var(--color-text)] text-white font-bold">{community.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                        </div>

                                        {/* Floating Member Stack (Right) */}
                                        <div className="absolute -top-4 right-6 flex -space-x-2 overflow-hidden bg-white border border-[var(--color-surface)] p-1 rounded-lg shadow-sm">
                                            {[1, 2, 3].map((i) => (
                                                <Avatar key={i} className="inline-block h-6 w-6 rounded-lg border border-white">
                                                    <AvatarImage src={`https://i.pravatar.cc/100?img=${community.id * 5 + i}`} className="object-cover" />
                                                    <AvatarFallback>U{i}</AvatarFallback>
                                                </Avatar>
                                            ))}
                                        </div>

                                        <div className="mb-4">
                                            <h3 className="text-xl font-bold text-[var(--color-text)] uppercase tracking-tight leading-tight">
                                                c/{community.name.toLowerCase().replace(/\s+/g, '')}
                                            </h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                {community.category} Node
                                            </p>
                                        </div>

                                        <p className="text-xs font-medium text-gray-500 leading-relaxed mb-6 line-clamp-2">
                                            {community.description}
                                        </p>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-surface)] pt-4 mb-6">
                                            <div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Citizens</div>
                                                <div className="flex items-center gap-2 text-[var(--color-text)] font-bold text-xs">
                                                    <Users size={12} /> {community.members}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Activity</div>
                                                <div className="flex items-center gap-2 text-[var(--color-text)] font-bold text-xs">
                                                    <Zap size={12} className="text-[var(--color-accent)]" /> {community.active}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex gap-2 mb-4">
                                            {community.tags?.slice(0, 3).map((tag: string) => (
                                                <span key={tag} className="text-[8px] font-bold bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-lg border border-gray-100 uppercase tracking-wide">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl p-0 overflow-hidden border-none bg-white rounded-lg shadow-md">
                                    <div className="h-48 relative">
                                        <img src={community.image} alt={community.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                        <div className="absolute bottom-6 left-6 flex items-end gap-6">
                                            <Avatar className="h-24 w-24 border border-white/20 shadow-md rounded-lg">
                                                <AvatarImage src={community.logo} className="rounded-lg object-cover" />
                                                <AvatarFallback className="rounded-lg bg-[var(--color-text)] text-white font-bold text-2xl">{community.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div className="mb-2">
                                                <Badge className="bg-[var(--color-accent)] text-white rounded-lg border-none mb-2 font-mono text-[10px] uppercase">Official Alliance</Badge>
                                                <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">c/{community.name}</h2>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 grid grid-cols-3 gap-8">
                                        <div className="col-span-2 space-y-6">
                                            <section>
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Our Mission</h4>
                                                <p className="text-sm text-gray-600 leading-relaxed font-medium">Build the future of digital interaction through "{community.name}" frameworks. We focus on decentralized state, reactive UI patterns, and hyper-efficient data fetching.</p>
                                            </section>
                                            <section>
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Recent Activity</h4>
                                                <div className="space-y-3">
                                                    {[1, 2].map(i => (
                                                        <div key={i} className="flex gap-3 p-3 bg-gray-50 border border-gray-100">
                                                            <div className="w-1.5 bg-[var(--color-accent)] shrink-0" />
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-tight mb-1">Weekly Engineering Sync v{4 + i}.0</p>
                                                                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Completed: {3 + i}h ago • 45 builders participated</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="p-4 border border-[var(--color-surface)] bg-white">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Alliance Stats</h4>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] uppercase font-mono text-gray-500">Global Rank</span>
                                                        <span className="text-xs font-bold">#{community.rank}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] uppercase font-mono text-gray-500">Uptime</span>
                                                        <span className="text-xs font-bold text-emerald-500">99.9%</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] uppercase font-mono text-gray-500">Active Nodes</span>
                                                        <span className="text-xs font-bold">{community.members}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    navigate(`/communities/${community.id}`);
                                                }}
                                                className={cn(
                                                    "w-full font-bold uppercase tracking-widest text-xs h-12 rounded-lg",
                                                    "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/90"
                                                )}>
                                                Enter Alliance
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <div className="px-4 pb-4 mt-auto">
                                {/* Action */}
                                <Button
                                    onClick={() => navigate(`/communities/${community.id}`)}
                                    className={cn(
                                        "w-full font-bold uppercase tracking-widest text-[10px] h-10 rounded-lg transition-all shadow-none border border-[var(--color-text)]",
                                        "bg-[var(--color-text)] text-white hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)]"
                                    )}
                                >
                                    Enter Alliance
                                    <ArrowRight size={14} className={cn("ml-3 transition-transform", "group-hover:translate-x-1")} />
                                </Button>
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
                        <EmptyTitle>No communities found</EmptyTitle>
                        <EmptyDescription>
                            We couldn't find any communities matching "{activeCategory}". Try adjusting your filters.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button variant="outline" onClick={() => setActiveCategory('All')}>
                            Clear Filters
                        </Button>
                    </EmptyContent>
                </Empty>
            )}
        </div>
    );
}

export default Communities;
