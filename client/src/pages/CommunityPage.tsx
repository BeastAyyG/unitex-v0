import { useState } from 'react';
import { useParams, Link, NavLink } from 'react-router-dom';
import { ArrowLeft, Users, Zap, MessageSquare, Lightbulb, Megaphone, CheckCircle, Star, TrendingUp, Filter, Share2, Bookmark, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { Field } from '../components/ui/field';
import { MOCK_COMMUNITIES, MOCK_POSTS } from '@/utils/mockData';

// Default fallback if community Id isn't specific above
const defaultCommunity = {
    id: "default", name: "General Hub", tagline: "A collaborative space for builders.",
    members: "1.2k", active: "Moderate", category: "General", rank: 100,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
    logo: "https://images.unsplash.com/photo-1531297122539-d31b0a1d68ce?q=80&w=200&auto=format&fit=crop",
    intents: [
        { id: "ask", label: "Ask", icon: MessageSquare, description: "Get help with a problem" },
        { id: "insight", label: "Insight", icon: Lightbulb, description: "Share a discovery or learning" },
    ]
}

// MOCK_POSTS moved to mockData.ts

// --- COMPONENTS --- //

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border", className)}>
        {children}
    </span>
);

export default function CommunityPage() {
    const { communityId } = useParams();
    const community = MOCK_COMMUNITIES[communityId || ""] || defaultCommunity;
    
    const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
    const [composerOpen, setComposerOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState("Relevance");
    const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
    const [likedPosts, setLikedPosts] = useState<number[]>([]);
    const [upvotedPosts, setUpvotedPosts] = useState<number[]>([]);
    const [savedPosts, setSavedPosts] = useState<number[]>([]);
    const [sharedPostId, setSharedPostId] = useState<number | null>(null);

    const handleLike = (id: number) => {
        setLikedPosts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const handleUpvote = (id: number) => {
        setUpvotedPosts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const handleSave = (id: number) => {
        setSavedPosts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const handleShare = (id: number) => {
        setSharedPostId(id);
        setTimeout(() => setSharedPostId(null), 2000);
    };

    const posts = MOCK_POSTS.filter(p => community.id === "default" ? true : p.communityId === community.id);
    const filters = ["Relevance", "High Signal", "New", "Deep Dives"];

    return (
        <div className="pb-20 w-full max-w-[1600px] mx-auto px-4 md:px-8">
            
            {/* Nav Header */}
            <div className="py-6 flex items-center gap-4 mb-4">
                <Link to="/communities" className="p-3 hover:bg-gray-50 transition-all rounded-lg border border-[var(--color-surface)] shadow-sm">
                    <ArrowLeft size={18} />
                </Link>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Community Center // {community.name}
                </div>
            </div>

            {/* Community Identity Header */}
            <header className="relative mb-10 border border-[var(--color-surface)] bg-white overflow-hidden shadow-sm rounded-lg">
                <div className="h-64 relative bg-[var(--color-surface)]">
                     <img src={community.image} alt={community.name} className="w-full h-full object-cover opacity-80 grayscale hover:grayscale-0 transition-all duration-700" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     
                     <div className="absolute bottom-8 left-8 md:left-12 flex items-end gap-8">
                         <Avatar className="h-32 w-32 md:h-40 md:w-40 border border-white shadow-md rounded-lg bg-white">
                             <AvatarImage src={community.logo} className="object-cover transition-all" />
                             <AvatarFallback className="rounded-lg bg-[var(--color-text)] text-white font-bold text-4xl">{community.name.substring(0, 2)}</AvatarFallback>
                         </Avatar>
                         <div className="mb-4">
                             <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tight leading-none">
                                 {community.name}
                             </h1>
                             <p className="text-white/80 text-sm md:text-base font-bold uppercase tracking-widest mt-4 max-w-2xl">
                                 {community.tagline}
                             </p>
                         </div>
                     </div>

                     <div className="absolute top-8 right-8 flex flex-col gap-4">
                         <div className="bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20 text-white flex items-center gap-3">
                             <Users size={16} className="text-white" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">{community.members} CITIZENS</span>
                         </div>
                         <div className="bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20 text-white flex items-center gap-3">
                             <Zap size={16} className="text-white" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">INTENSITY: {community.active}</span>
                         </div>
                     </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Main Feed Column */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* Adaptive Composer */}
                    <section className={cn("border border-[var(--color-surface)] bg-white p-8 transition-all duration-300 shadow-sm rounded-lg")}>
                        {!composerOpen ? (
                             <div className="flex items-center gap-6 cursor-text group" onClick={() => setComposerOpen(true)}>
                                 <Avatar className="h-10 w-10 rounded-lg border border-gray-100 shrink-0">
                                     <AvatarImage src="https://github.com/shadcn.png" />
                                 </Avatar>
                                 <div className="flex-1 border bg-gray-50 border-gray-100 h-12 flex items-center px-6 text-[11px] text-gray-400 font-bold uppercase tracking-widest group-hover:bg-white group-hover:border-gray-200 transition-all rounded-lg">
                                     Share knowledge with the {community.name}...
                                 </div>
                             </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center border-b border-[var(--color-surface)] pb-6">
                                     <h2 className="text-lg font-bold uppercase tracking-tight">Select Interaction Intent</h2>
                                     <button onClick={() => { setComposerOpen(false); setSelectedIntent(null); }} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[var(--color-text)] transition-colors">Abort Execution</button>
                                </div>
                                
                                 {/* Intent Selector */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {community.intents.map((intent: any) => {
                                        const Icon = intent.icon;
                                        const isActive = selectedIntent === intent.id;
                                        return (
                                            <button
                                                key={intent.id}
                                                onClick={() => setSelectedIntent(intent.id)}
                                                className={cn(
                                                    "text-left p-4 border transition-all duration-200 group flex flex-col gap-3 relative overflow-hidden rounded-lg",
                                                    isActive 
                                                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-accent)]" 
                                                        : "border-[var(--color-surface)] bg-white hover:bg-gray-50 text-gray-400 hover:text-[var(--color-text)]"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon size={18} className={isActive ? "text-[var(--color-accent)]" : "opacity-40 group-hover:opacity-100"} />
                                                    <span className="font-bold text-xs uppercase tracking-widest">{intent.label}</span>
                                                </div>
                                                <span className={cn("text-[9px] font-bold uppercase tracking-widest leading-tight opacity-60")}>
                                                    {intent.description}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                 {/* Dynamic Form based on selected intent */}
                                {selectedIntent && (
                                    <div className="pt-8 border-t border-[var(--color-surface)] animate-in fade-in slide-in-from-top-4 duration-300">
                                        
                                        {/* Shared Title Field */}
                                        <div className="space-y-6 mb-6">
                                            <Field>
                                                 <input 
                                                    type="text" 
                                                    placeholder={selectedIntent === 'ask' ? "What are you stuck on?" : "Define the subject"}
                                                    className="w-full text-2xl font-bold bg-transparent border-none placeholder:text-gray-200 focus:outline-none focus:ring-0 px-0 tracking-tight"
                                                />
                                            </Field>
                                        </div>

                                        {/* Dynamic Fields */}
                                        <div className="space-y-6 bg-white p-6 border border-[var(--color-surface)] shadow-sm rounded-lg">
                                            {selectedIntent === 'ask' && (
                                                <>
                                                    <Field><textarea placeholder="1. Problem Description (be specific)" className="w-full min-h-[100px] text-xs font-bold uppercase tracking-widest bg-gray-50 border border-gray-100 p-4 focus:bg-white focus:outline-none resize-none rounded-lg" /></Field>
                                                    <Field><textarea placeholder="2. Attempts & Failures" className="w-full min-h-[80px] text-xs font-bold uppercase tracking-widest bg-gray-50 border border-gray-100 p-4 focus:bg-white focus:outline-none resize-none rounded-lg" /></Field>
                                                    <Field><textarea placeholder="3. Context" className="w-full min-h-[80px] text-xs font-bold uppercase tracking-widest bg-gray-50 border border-gray-100 p-4 focus:bg-white focus:outline-none resize-none rounded-lg" /></Field>
                                                </>
                                            )}
                                        </div>

                                        <div className="mt-6 flex justify-end gap-4">
                                            <Button variant="outline" className="rounded-lg border border-[var(--color-surface)] text-gray-400 font-bold uppercase tracking-widest text-[10px] px-6 h-12 shadow-sm hover:bg-gray-50" onClick={() => {setComposerOpen(false); setSelectedIntent(null)}}>Discard Buffer</Button>
                                            <Button className="rounded-lg bg-[var(--color-text)] hover:bg-[var(--color-accent)] text-white font-bold uppercase tracking-widest text-[10px] px-10 h-12 shadow-sm">Broadcast Knowledge</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Feed Intelligence / Filters */}
                    <div className="flex items-center justify-between border-b border-[var(--color-surface)] pb-4 mt-6">
                         <div className="flex items-center gap-2">
                             <Filter size={14} className="text-gray-400" />
                             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sort By Engine:</span>
                         </div>
                         <div className="flex gap-2">
                             {filters.map(f => (
                                 <button key={f} onClick={() => setActiveFilter(f)} className={cn("px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors border", activeFilter === f ? "bg-[var(--color-text)] text-white border-[var(--color-text)]" : "bg-transparent text-gray-500 border-transparent hover:border-gray-200")}>
                                     {f}
                                 </button>
                             ))}
                         </div>
                    </div>

                    {/* Evolved Post Feed */}
                    <div className="space-y-6">
                         {posts.map(post => {
                             const intentConfig = community.intents.find((i: any) => i.label === post.intent) || community.intents[0];
                             const IntentIcon = intentConfig?.icon || Star;
                             
                             const isLiked = likedPosts.includes(post.id);
                             const isUpvoted = upvotedPosts.includes(post.id);
                             const score = isUpvoted ? post.score + 1 : post.score;
                             const isSaved = savedPosts.includes(post.id);
                             const isShared = sharedPostId === post.id;
                             
                             return (
                                 <article key={post.id} className="border border-[var(--color-surface)] bg-white hover:border-[var(--color-accent)] transition-all duration-300 relative overflow-hidden group flex flex-col shadow-sm rounded-lg">
                                     
                                     {/* Signal Layer Striping */}
                                     {post.score > 100 && <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--color-accent)]" />}
                                     
                                     <div className="p-5 md:p-6">
                                         <div className="flex justify-between items-start mb-4">
                                              <NavLink to={`/profile/${post.authorId}`} className="flex items-center gap-3">
                                                  <Avatar className="h-8 w-8 rounded-lg border border-[var(--color-surface)]">
                                                      <AvatarImage src={post.authorAvatar} />
                                                  </Avatar>
                                                  <div>
                                                      <div className="text-xs font-bold text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors">{post.author}</div>
                                                      <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{post.time}</div>
                                                  </div>
                                              </NavLink>
                                              
                                              {/* Intent Tag */}
                                              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600 group-hover:bg-[var(--color-text)] group-hover:text-white group-hover:border-[var(--color-text)] transition-colors">
                                                  <IntentIcon size={12} />
                                                  <span className="text-[9px] font-bold uppercase tracking-wider">{post.intent}</span>
                                              </div>
                                         </div>

                                         {/* Context-Rich Title */}
                                         <h3 className="text-lg md:text-xl font-bold leading-tight mb-4 group-hover:text-[var(--color-accent)] transition-colors text-[var(--color-text)]">
                                             {post.title}
                                         </h3>

                                         {/* Content */}
                                         <div className="bg-gray-50 border-l-2 border-[var(--color-surface)] group-hover:border-[var(--color-accent)] transition-colors pl-4 pr-4 py-4 mb-5 text-sm text-gray-700 leading-relaxed">
                                              {post.content}
                                         </div>

                                         {/* Photo Media */}
                                         {post.image && (
                                              <div className="mb-5 border border-[var(--color-surface)] overflow-hidden">
                                                  <img src={post.image} alt={post.title} className="w-full h-auto max-h-[400px] object-cover hover:scale-105 transition-transform duration-700" />
                                              </div>
                                         )}

                                         {/* Highlighted Takeaway */}
                                         {post.takeaway && (
                                             <div className="mb-4 inline-block">
                                                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] mb-1">Key Takeaway</div>
                                                  <p className="text-sm font-medium text-[var(--color-text)] leading-relaxed italic border-b border-dashed border-gray-200 pb-1">"{post.takeaway}"</p>
                                             </div>
                                         )}
                                     </div>

                                     {/* Signal Metrics Bar */}
                                     <div className="mt-auto border-t border-[var(--color-surface)] bg-gray-50/50 flex divide-x divide-[var(--color-surface)]">
                                         <button onClick={() => handleLike(post.id)} className={cn("flex-none px-4 md:px-6 flex items-center justify-center gap-2 py-3 hover:bg-white transition-colors group/btn", isLiked ? "bg-red-50" : "")} title="Like">
                                             <Heart size={14} className={cn("transition-all group-hover/btn:scale-110", isLiked ? "text-red-500 fill-red-500" : "text-gray-400 group-hover/btn:text-red-500")} />
                                         </button>
                                         <button onClick={() => handleUpvote(post.id)} className={cn("flex-1 flex items-center justify-center gap-2 py-3 hover:bg-white transition-colors group/btn", isUpvoted ? "bg-emerald-50" : "")}>
                                             <TrendingUp size={14} className={cn("transition-transform group-hover/btn:scale-110", isUpvoted ? "text-emerald-600" : "text-emerald-500")} />
                                             <span className={cn("text-xs font-bold flex flex-wrap justify-center items-center gap-1", isUpvoted ? "text-emerald-700" : "")}>
                                                 {isUpvoted ? "Supported" : "Support"} 
                                                 <span className={cn("text-[10px] px-1 py-0.5 rounded", isUpvoted ? "bg-emerald-200 text-emerald-900" : "bg-emerald-100 text-emerald-800")}>{score}</span>
                                             </span>
                                         </button>
                                         <button onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} className={cn("flex-1 flex items-center justify-center gap-2 py-3 hover:bg-white transition-colors group/btn", expandedPostId === post.id ? "bg-white border-b-2 border-b-blue-500" : "")}>
                                             <MessageSquare size={14} className="text-blue-500 group-hover/btn:scale-110 transition-transform" />
                                             <span className="text-xs font-bold flex flex-wrap justify-center items-center gap-1">Discussion <span className="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.5 rounded">{post.depth} nodes</span></span>
                                         </button>
                                         <button onClick={() => handleSave(post.id)} className={cn("flex-none px-4 md:px-6 flex items-center justify-center gap-2 py-3 hover:bg-white transition-colors group/btn", isSaved ? "bg-blue-50" : "")} title="Save to Vault">
                                             <Bookmark size={14} className={cn("transition-all group-hover/btn:scale-110", isSaved ? "text-blue-600 fill-blue-600" : "text-gray-400 group-hover/btn:text-[var(--color-text)]")} />
                                             <span className={cn("text-xs font-bold hidden sm:inline", isSaved ? "text-blue-700" : "text-gray-400 group-hover/btn:text-[var(--color-text)]")}>{isSaved ? "Saved" : "Save"}</span>
                                         </button>
                                         <button onClick={() => handleShare(post.id)} className="flex-none px-4 md:px-6 flex items-center justify-center gap-2 py-3 hover:bg-white transition-colors group/btn" title="Share Protocol">
                                             <Share2 size={14} className={cn("transition-all group-hover/btn:scale-110", isShared ? "text-green-500" : "text-gray-400 group-hover/btn:text-[var(--color-text)]")} />
                                             <span className={cn("text-xs font-bold hidden sm:inline", isShared ? "text-green-600" : "text-gray-400 group-hover/btn:text-[var(--color-text)]")}>{isShared ? "Copied" : "Share"}</span>
                                         </button>
                                     </div>

                                     {/* Expanded Discussion Thread */}
                                     {expandedPostId === post.id && (
                                         <div className="border-t border-[var(--color-surface)] bg-white p-6 animate-in slide-in-from-top-2 duration-200">
                                             <div className="mb-4">
                                                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b pb-2">Active Protocol Thread</h4>
                                             </div>
                                             
                                             <div className="space-y-4">
                                                 {post.comments && post.comments.length > 0 ? (
                                                     post.comments.map((comment: any) => (
                                                         <div key={comment.id} className="flex gap-3 text-sm">
                                                             <NavLink to={`/profile/${comment.authorId}`} className="shrink-0 mt-1">
                                                                 <Avatar className="h-6 w-6 rounded-lg border border-[var(--color-surface)]">
                                                                     <AvatarImage src={comment.avatar} />
                                                                 </Avatar>
                                                             </NavLink>
                                                             <div className="flex-1 bg-gray-50 border border-[var(--color-surface)] p-3 hover:border-gray-300 transition-colors">
                                                                 <div className="flex justify-between items-center mb-1">
                                                                     <NavLink to={`/profile/${comment.authorId}`} className="font-bold text-xs hover:text-[var(--color-accent)] transition-colors">{comment.author}</NavLink>
                                                                     <span className="text-[9px] font-mono text-gray-400 uppercase">{comment.time}</span>
                                                                 </div>
                                                                 <p className="text-gray-700">{comment.text}</p>
                                                             </div>
                                                         </div>
                                                     ))
                                                 ) : (
                                                     <div className="text-center py-6 text-sm text-gray-500 font-mono">No nodes in this thread yet.</div>
                                                 )}
                                             </div>

                                             {/* Reply Input */}
                                             <div className="mt-6 flex gap-3">
                                                  <Avatar className="h-8 w-8 rounded-lg border border-[var(--color-surface)] shrink-0">
                                                      <AvatarImage src="https://github.com/shadcn.png" />
                                                  </Avatar>
                                                  <div className="flex-1 relative">
                                                      <input type="text" placeholder="Add to the signal..." className="w-full bg-gray-50 border border-[var(--color-surface)] px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-text)] transition-colors pr-20" />
                                                      <button className="absolute right-1 top-1 bottom-1 px-3 bg-[var(--color-text)] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--color-text)]/90 transition-colors">Submit</button>
                                                  </div>
                                             </div>
                                         </div>
                                     )}
                                 </article>
                             )
                         })}
                    </div>
                </div>

                {/* Sidebar - About Community */}
                <div className="hidden lg:block space-y-6">
                    <div className="border border-[var(--color-surface)] bg-white p-8 sticky top-24 shadow-sm rounded-lg">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 border-b border-[var(--color-surface)] pb-4">Protocol // Rules</h4>
                        
                        <div className="space-y-4 mb-6 text-sm text-gray-600 leading-relaxed font-medium">
                            <p>This space operates on structured knowledge exchange.</p>
                            <p>Posts without clear takeaways, unstructured rants, or low-effort questions will be down-voted heavily by the signal engine.</p>
                        </div>
                        
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Allowed Intents</h4>
                        <ul className="space-y-2 mb-6">
                            {community.intents.map((i: any) => {
                                const Icon = i.icon;
                                return (
                                <li key={i.id} className="flex items-center gap-2 text-xs text-[var(--color-text)]">
                                    <Icon size={12} className="text-[var(--color-accent)]" /> <strong>{i.label}</strong>
                                </li>
                                )
                            })}
                        </ul>

                        <div className="bg-gray-50 p-3 border border-gray-100 rounded-lg">
                             <div className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-1">Your Standing</div>
                             <div className="font-mono text-sm font-bold text-[var(--color-text)]">Neutral Participant</div>
                             <div className="mt-2 w-full bg-gray-200 h-1">
                                 <div className="bg-[var(--color-accent)] w-1/4 h-full" />
                             </div>
                             <div className="text-[8px] text-right mt-1 text-gray-400 uppercase">24 signal needed for 'Contributor'</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
