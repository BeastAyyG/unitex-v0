import { useState, useMemo, useEffect } from 'react';
import { 
    Zap, 
    Gift, 
    Lock, 
    ArrowRight, 
    CheckCircle, 
    Coins, 
    Copy,
    Users,
    TrendingUp,
    Bookmark,
    Tag,
    ShoppingBag,
    Package,
    Ticket,
    Shield,
    HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/context/useAuth';
import { ref, onValue, set } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

interface VaultItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: any;
    category: 'Merchandise' | 'Coupons' | 'Access';
    status: 'Available' | 'Locked' | 'Redeemed';
}

const VAULT_ITEMS: VaultItem[] = [
    { 
        id: 'hoodie', 
        name: 'UnitX "Builder" Hoodie',
        description: 'Heavyweight premium cotton with tactical node embroidery.', 
        cost: 4500, 
        icon: ShoppingBag,
        category: 'Merchandise',
        status: 'Locked'
    },
    { 
        id: 'tech-kit', 
        name: 'UnitX Tech Kit',
        description: 'Branded cable organizers, node key, and microfiber cloth.', 
        cost: 1200, 
        icon: Package,
        category: 'Merchandise',
        status: 'Available'
    },
    { 
        id: 'hardware-key', 
        name: 'Node.js Hardware Key', 
        description: 'Custom hardware authenticator for secure node access.', 
        cost: 7500, 
        icon: Shield,
        category: 'Merchandise',
        status: 'Locked'
    },
    { 
        id: 'sticker-pack', 
        name: 'UnitX Sticker Pack',
        description: 'Limited edition holographic node and brand stickers.', 
        cost: 100, 
        icon: Tag,
        category: 'Merchandise',
        status: 'Available'
    },
    { 
        id: 'cloud-coupon', 
        name: '$100 Cloud Credits', 
        description: 'Partner discount for AWS/Vercel compute resources.', 
        cost: 800, 
        icon: Ticket,
        category: 'Coupons',
        status: 'Available'
    },
    { 
        id: 'expert-audit', 
        name: 'Partner Tool Discount (20%)', 
        description: 'Exclusive coupon for professional dev-tooling subscriptions.', 
        cost: 350, 
        icon: Tag,
        category: 'Coupons',
        status: 'Available'
    },
    { 
        id: 'terminal-theme', 
        name: 'Custom Terminal Theme', 
        description: 'Exclusive "UnitX Dark" configuration for VSCode & Terminal.',
        cost: 150, 
        icon: ArrowRight,
        category: 'Access',
        status: 'Available'
    },
    { 
        id: 'beta-access', 
        name: 'Beta Feature Access', 
        description: 'Early access to upcoming UnitX node tools and research.',
        cost: 1000, 
        icon: Zap,
        category: 'Access',
        status: 'Available'
    },
    { 
        id: 'event-pass', 
        name: 'UnitX Pro Summit Pass',
        description: 'Priority access to all major 2024 summits.', 
        cost: 2000, 
        icon: Zap,
        category: 'Access',
        status: 'Available'
    },
    { 
        id: 'priority-support', 
        name: 'Priority Support Access', 
        description: 'Direct line to the UnitX core engineering team.',
        cost: 5000, 
        icon: HelpCircle,
        category: 'Access',
        status: 'Locked'
    }
];

function Vault() {
    const { currentUser } = useAuth();
    const [vp, setVp] = useState(0);

    useEffect(() => {
        if (!currentUser?.uid || !rtdb) return;
        
        try {
            const userRef = ref(rtdb, `users/${currentUser.uid}/vp`);
            const unsubscribe = onValue(userRef, (snapshot) => {
                const data = snapshot.val();
                setVp(data || 0);
            });
            
            return () => unsubscribe();
        } catch (err) {
            console.warn("RTDB VP fetch failed:", err);
        }
    }, [currentUser]);
    const [activeTab, setActiveTab] = useState<'store' | 'instructions'>('store');
    const [activeCategory, setActiveCategory] = useState<'All' | VaultItem['category']>('All');
    const [items, setItems] = useState<VaultItem[]>(VAULT_ITEMS);

    // Dynamic Milestone Logic: Find the nearest locked item
    const nextMilestone = useMemo(() => {
        const locked = items
            .filter(i => i.cost > vp && i.status !== 'Redeemed')
            .sort((a, b) => a.cost - b.cost)[0];
        
        if (!locked) return null;

        return {
            name: locked.name,
            needs: locked.cost - vp,
            total: locked.cost,
            progress: (vp / locked.cost) * 100
        };
    }, [vp, items]);

    const handleRedeem = (item: VaultItem) => {
        if (vp < item.cost) {
            toast.error(`Insufficient points. You need ${item.cost - vp} more VP.`);
            return;
        }
        if (currentUser?.uid) {
            set(ref(rtdb, `users/${currentUser.uid}/vp`), vp - item.cost);
        }
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'Redeemed' } : i));
        toast.success(`Success! ${item.name} added to your inventory.`);
    };

    const copyReferral = () => {
        navigator.clipboard.writeText(`${window.location.origin}/join/${currentUser?.uid || ''}`);
        toast.success('Referral link copied!');
    };

    const CATEGORIES: Array<'All' | VaultItem['category']> = ['All', 'Merchandise', 'Coupons', 'Access'];
    const displayedItems = items.filter(i => i.status !== 'Redeemed' && (activeCategory === 'All' || i.category === activeCategory));

    return (
        <div className="min-h-screen bg-[var(--color-bg)] pt-20 pb-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
                
                {/* 1. Vault Store Header (Non-Sticky as requested) */}
                <div className="bg-white border border-[var(--color-surface)] shadow-sm">
                    <div className="p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <Coins size={14} className="text-[var(--color-accent)]" />
                                <span className="text-[10px] font-bold capitalize tracking-wider">Vault currency</span>
                            </div>
                            <h1 className="text-5xl font-bold tracking-tighter text-[var(--color-text)]">
                                {vp.toLocaleString()} <span className="text-xl opacity-20 font-mono ml-1">VP</span>
                            </h1>
                        </div>
                        
                        {nextMilestone && (
                            <div className="flex-1 max-w-sm">
                                <div className="flex justify-between text-[10px] font-bold capitalize tracking-wider mb-3">
                                    <span className="text-gray-400">Next unlock</span>
                                    <span className="text-[var(--color-accent)]">{nextMilestone.name}</span>
                                </div>
                                <div className="h-2 bg-gray-50 w-full overflow-hidden border border-gray-100">
                                    <div 
                                        className="h-full bg-[var(--color-accent)] transition-all duration-1000" 
                                        style={{ width: `${nextMilestone.progress}%` }} 
                                    />
                                </div>
                                <p className="mt-2 text-[9px] font-bold text-gray-400 capitalize tracking-wider">
                                    {nextMilestone.needs.toLocaleString()} VP remains
                                </p>
                            </div>
                        )}

                        <div className="flex p-1 bg-gray-50 border border-gray-100 rounded-lg self-start md:self-center">
                            <button 
                                onClick={() => setActiveTab('store')}
                                className={cn(
                                    "px-6 py-2.5 text-[10px] font-bold capitalize tracking-wider transition-all",
                                    activeTab === 'store' ? "bg-white shadow-sm text-[var(--color-text)]" : "text-gray-400 hover:text-[var(--color-text)]"
                                )}
                            >
                                Store
                            </button>
                            <button 
                                onClick={() => setActiveTab('instructions')}
                                className={cn(
                                    "px-6 py-2.5 text-[10px] font-bold capitalize tracking-wider transition-all",
                                    activeTab === 'instructions' ? "bg-white shadow-sm text-[var(--color-text)]" : "text-gray-400 hover:text-[var(--color-text)]"
                                )}
                            >
                                How to earn
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'store' ? (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 🛒 Store Section: Unified Inventory */}
                        <section>
                            <div className="flex items-center justify-between gap-4 mb-10">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xs font-bold capitalize tracking-wider text-[var(--color-text)]">Available inventory</h2>
                                    <div className="h-px w-16 bg-[var(--color-surface)] opacity-30" />
                                </div>
                                {/* Category Filter */}
                                <div className="flex p-1 bg-gray-50 border border-gray-100">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={cn(
                                                "px-4 py-2 text-[10px] font-bold capitalize tracking-wider transition-all",
                                                activeCategory === cat ? "bg-white shadow-sm text-[var(--color-text)]" : "text-gray-400 hover:text-[var(--color-text)]"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {displayedItems.map(item => {
                                    const isAffordable = vp >= item.cost;
                                    return (
                                        <div 
                                            key={item.id} 
                                            className={cn(
                                                "bg-white border p-8 group transition-all shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[340px]",
                                                isAffordable ? "border-[var(--color-surface)] hover:border-[var(--color-accent)]" : "border-dashed border-gray-100 opacity-80"
                                            )}
                                        >
                                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <item.icon size={100} />
                                            </div>
                                            
                                            <div>
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className={cn(
                                                        "w-12 h-12 flex items-center justify-center border transition-colors",
                                                        isAffordable 
                                                            ? "bg-gray-50 border-gray-100 group-hover:bg-[var(--color-accent)] group-hover:text-white" 
                                                            : "bg-gray-50 text-gray-300 border-gray-100"
                                                    )}>
                                                        {isAffordable ? <item.icon size={22} /> : <Lock size={20} />}
                                                    </div>
                                                     <span className="text-[9px] font-bold capitalize tracking-wider px-2 py-1 bg-gray-50 border border-gray-100 text-gray-400">
                                                        {item.category.toLowerCase()}
                                                    </span>
                                                </div>
                                                <h3 className={cn(
                                                    "text-2xl font-bold mb-3 tracking-tight",
                                                    isAffordable ? "text-[var(--color-text)]" : "text-gray-400"
                                                )}>
                                                    {item.name}
                                                </h3>
                                                <p className={cn(
                                                    "text-xs font-medium leading-relaxed mb-6",
                                                    isAffordable ? "text-gray-500" : "text-gray-300"
                                                )}>
                                                    {item.description}
                                                </p>
                                            </div>

                                            <div className="pt-6 border-t border-gray-50">
                                                <div className="flex items-center justify-between mb-2">
                                                     <div className={cn(
                                                        "text-lg font-bold font-mono",
                                                        isAffordable ? "text-[var(--color-text)]" : "text-gray-300"
                                                    )}>
                                                        {item.cost} <span className="text-[10px] capitalize font-sans tracking-tight opacity-40">VP</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => isAffordable && handleRedeem(item)}
                                                        disabled={!isAffordable}
                                                        className={cn(
                                                            "px-6 py-3 text-[10px] font-bold capitalize tracking-wider transition-all flex items-center gap-2",
                                                            isAffordable 
                                                                ? "bg-[var(--color-text)] text-white hover:bg-[var(--color-accent)] cursor-pointer" 
                                                                : "bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100"
                                                        )}
                                                    >
                                                        Exchange now
                                                    </button>
                                                </div>
                                                 {!isAffordable && (
                                                    <p className="text-[9px] font-bold text-[var(--color-accent)] capitalize tracking-wider text-right">
                                                        Insufficient VP (Needs {item.cost - vp} more)
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                ) : (
                    /* 🧠 Instructions View */
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* How to Earn */}
                            <div className="bg-white border border-[var(--color-surface)] p-10 shadow-sm">
                                <h3 className="text-xs font-bold capitalize tracking-wider text-[var(--color-text)] mb-10 flex items-center gap-4">
                                    <TrendingUp size={16} className="text-[var(--color-accent)]" /> 1. Acquire VP
                                </h3>
                                <ul className="space-y-8">
                                    {[
                                        { action: "High-signal architectural post", points: "+150 VP" },
                                        { action: "Technical Insight shared", points: "+50 VP" },
                                        { action: "Accepted solution in community", points: "+100 VP" },
                                        { action: "Resource library contribution", points: "+25 VP" }
                                    ].map((row, i) => (
                                        <li key={i} className="flex justify-between items-center border-b border-gray-50 pb-5">
                                            <span className="text-sm font-medium text-gray-600">{row.action}</span>
                                            <span className="text-[10px] font-mono font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/5 px-3 py-1.5">{row.points}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* How to Exchange */}
                            <div className="bg-white border border-[var(--color-surface)] p-10 shadow-sm">
                                <h3 className="text-xs font-bold capitalize tracking-wider text-[var(--color-text)] mb-10 flex items-center gap-4">
                                    <ShoppingBag size={16} className="text-[var(--color-accent)]" /> 2. Exchange VP
                                </h3>
                                <div className="space-y-8">
                                    {[
                                        "Select available item from the marketplace store.",
                                        "Click 'Exchange Now' to initiate the transaction.",
                                        "VP will be automatically deducted from your balance.",
                                        "Physical items will be shipped to your node address."
                                    ].map((step, i) => (
                                        <div key={i} className="flex gap-6">
                                            <span className="text-[11px] font-mono font-bold text-gray-200">0{i+1}</span>
                                            <p className="text-sm text-gray-500 leading-relaxed font-medium">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Vault Protocol */}
                            <div className="bg-gray-50 border border-[var(--color-surface)] p-10 shadow-none">
                                <h3 className="text-xs font-bold capitalize tracking-wider text-gray-400 mb-8 flex items-center gap-4">
                                    <Shield size={16} /> Vault protocol
                                </h3>
                                <ul className="space-y-6">
                                    <li className="flex gap-4 text-xs text-gray-500">
                                        <CheckCircle size={14} className="shrink-0 mt-0.5 text-gray-300" />
                                        <span className="leading-relaxed">All VP exchanges are recorded on the node ledger and are irreversible.</span>
                                    </li>
                                    <li className="flex gap-4 text-xs text-gray-500">
                                        <CheckCircle size={14} className="shrink-0 mt-0.5 text-gray-300" />
                                        <span className="leading-relaxed">Physical merchandise shipping is limited to verified alliance regions.</span>
                                    </li>
                                    <li className="flex gap-4 text-xs text-gray-500">
                                        <CheckCircle size={14} className="shrink-0 mt-0.5 text-gray-300" />
                                        <span className="leading-relaxed">Coupons and access keys must be activated within 30 days of exchange.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Earning Tip */}
                            <div className="bg-[var(--color-text)] text-white p-10 shadow-xl border-l-[6px] border-[var(--color-accent)]">
                                <h3 className="text-[10px] font-bold capitalize tracking-wider text-white/30 mb-10">Maximum output</h3>
                                <div className="space-y-8">
                                    <p className="text-base font-medium leading-relaxed italic text-gray-200">
                                        "Sustainability over volume. Consistent, valid weekly contributions yield a 1.5x VP multiplier."
                                    </p>
                                    <div className="h-px bg-white/10" />
                                    <p className="text-xs text-gray-400 font-medium opacity-60">
                                        Earn a 'Legacy Contributor' badge by maintaining a 1000+ VP balance for 3 months.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 🚀 Alliance Expansion (Preserved Section) */}
                <div className="bg-[var(--color-text)] text-white p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-[var(--color-accent)] text-black">
                                <Users size={24} />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tighter">Expand the Alliance</h2>
                        </div>
                        <p className="text-gray-400 text-sm mb-8 font-medium max-w-lg leading-relaxed">
                            Strengthen the network by inviting peers. Receive a <span className="text-white font-bold underline decoration-[var(--color-accent)] decoration-2 underline-offset-4">100 VP Bounty</span> for every verified join.
                        </p>
                        <div className="flex gap-3">
                            <div className="px-5 py-4 bg-white/5 border border-white/10 text-xs font-mono text-white/40 flex-1 flex items-center">
                                unitex.io/join/alexander_552
                            </div>
                            <button 
                                onClick={copyReferral}
                                className="px-10 py-4 bg-white text-black font-bold text-xs capitalize tracking-wider hover:bg-[var(--color-accent)] hover:text-white transition-all flex items-center gap-3"
                            >
                                <Copy size={18} /> Copy link
                            </button>
                        </div>
                    </div>
                    <div className="flex -space-x-5 px-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-16 h-16 bg-gray-900 border-2 border-black group cursor-pointer relative overflow-hidden transition-transform hover:scale-110 z-10 hover:z-20 shadow-2xl">
                                <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="user" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                <div className="absolute inset-0 bg-[var(--color-accent)] opacity-0 group-hover:opacity-20 transition-opacity" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-16 pb-8 border-t border-gray-100 text-center">
                    <div className="inline-flex items-center gap-3 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer group">
                        <HelpCircle size={14} className="group-hover:text-[var(--color-accent)]" />
                        <span className="text-[10px] font-bold capitalize tracking-wider">Vault protocol support</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default Vault;

