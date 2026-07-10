import { useState } from 'react';
import { MessageSquare, Share2, Heart, HeartHandshake, ExternalLink, AlertTriangle, ArrowRight, MoreHorizontal, RefreshCw, Check, Copy } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/context/useAuth';
import { createNotification } from '@/lib/firestore';


export interface Post {
    id: string;
    author: {
        id: string;
        name: string;
        username?: string;
        usercode?: string;
        avatar?: string;
        role?: string;
    };
    content: string;
    timestamp: string;
    label?: string;
    media?: {
        type: 'image' | 'video';
        url: string;
    };
    source?: {
        platform: 'twitter' | 'reddit' | 'instagram' | 'youtube' | 'medium';
        url: string;
        author?: string;
        preview?: {
            title: string;
            description?: string;
            image?: string;
        };
    };
    stats: {
        likes: number;
        support: number;
        comments: number;
        shares: number;
    };
    ai?: {
        qualityScore: number;
        tags: string[];
        isSpam?: boolean;
    };
    createdAtMillis?: number;
    comments?: {
        id: number | string;
        author: string;
        authorId: string;
        avatar?: string;
        text: string;
        time: string;
    }[];
}

interface PostCardProps {
    post: Post;
}

const LABEL_CONFIG = {
    progress: { text: "Progress", bg: "bg-[var(--color-accent-green)] text-white" },
    failure: { text: "Failure", bg: "bg-[var(--color-accent-red)] text-white" },
    question: { text: "Question", bg: "bg-[var(--color-accent-yellow)] text-[var(--color-text)]" },
    resource: { text: "Resource", bg: "bg-[var(--color-accent-purple)] text-white" },
    discussion: { text: "Discussion", bg: "bg-[var(--color-accent-orange)] text-white" },
    reflection: { text: "Reflection", bg: "bg-[var(--color-surface)] text-[var(--color-text)]" },
    success: { text: "Success", bg: "bg-[var(--color-accent-green)] text-white" },
};

const PLATFORM_CONFIG = {
    twitter: { name: "X (Twitter)", color: "bg-black text-white" },
    reddit: { name: "Reddit", color: "bg-orange-500 text-white" },
    instagram: { name: "Instagram", color: "bg-pink-600 text-white" },
    youtube: { name: "YouTube", color: "bg-red-600 text-white" },
    medium: { name: "Medium", color: "bg-black text-white" },
};

function PostCard({ post }: PostCardProps) {
    const { currentUser } = useAuth();
    const labelStyle = post.label && post.label in LABEL_CONFIG
        ? LABEL_CONFIG[post.label as keyof typeof LABEL_CONFIG]
        : post.label
            ? { text: post.label.charAt(0).toUpperCase() + post.label.slice(1), bg: "bg-gray-100 text-gray-700 border-gray-200" }
            : null;
    const sourceStyle = post.source ? PLATFORM_CONFIG[post.source.platform] : null;

    // Interactive state
    const [liked, setLiked] = useState(false);
    const [supported, setSupported] = useState(false);
    const [likeCount, setLikeCount] = useState(post.stats.likes);
    const [supportCount, setSupportCount] = useState(post.stats.support);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [localComments, setLocalComments] = useState(post.comments || []);
    const [commentCount, setCommentCount] = useState(post.stats.comments);
    const [shared, setShared] = useState(false);

    const handleLike = async () => {
        const newState = !liked;
        setLiked(newState);
        setLikeCount(c => newState ? c + 1 : c - 1);
        
        if (newState && currentUser && post.author.id !== currentUser.uid) {
            await createNotification({
                recipientUid: post.author.id,
                senderUid: currentUser.uid,
                senderName: currentUser.displayName || 'Someone',
                type: 'like',
                content: `liked your post: "${post.content.substring(0, 30)}..."`,
                actionUrl: `/profile/${post.author.id}` // Or a specific post link if available
            });
        }
    };

    const handleSupport = async () => {
        const newState = !supported;
        setSupported(newState);
        setSupportCount(c => newState ? c + 1 : c - 1);

        if (newState && currentUser && post.author.id !== currentUser.uid) {
            await createNotification({
                recipientUid: post.author.id,
                senderUid: currentUser.uid,
                senderName: currentUser.displayName || 'Someone',
                type: 'support',
                content: `supported your post: "${post.content.substring(0, 30)}..."`,
                actionUrl: `/profile/${post.author.id}`
            });
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Post by ${post.author.name}`,
            text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
            url: `${window.location.origin}/post/${post.id}`
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                setShared(true);
                toast.success("Shared successfully!");
                setTimeout(() => setShared(false), 2000);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    copyToClipboard();
                }
            }
        } else {
            copyToClipboard();
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
            setShared(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setShared(false), 2000);
        } catch {
            setShared(true);
            setTimeout(() => setShared(false), 2000);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !currentUser) return;
        const text = commentText;
        const newComment = {
            id: Date.now().toString(),
            author: currentUser.displayName || 'Me',
            authorId: currentUser.uid,
            avatar: currentUser.photoURL || undefined,
            text: text,
            time: 'Just now',
        };
        setLocalComments(prev => [...prev, newComment]);
        setCommentCount(prev => prev + 1);
        setCommentText('');

        if (post.author.id !== currentUser.uid) {
            await createNotification({
                recipientUid: post.author.id,
                senderUid: currentUser.uid,
                senderName: currentUser.displayName || 'Someone',
                type: 'comment',
                content: `commented: "${text.substring(0, 30)}..."`,
                actionUrl: `/profile/${post.author.id}`
            });
        }
    };

    return (
        <div className={`bg-[var(--color-bg)] p-5 border-2 border-[var(--color-text)] shadow-brutal transition-all group relative`}>

            {/* Header: Author + Meta */}
            <div className="flex justify-between items-start mb-6">
                <NavLink to={`/profile/${post.author.id}`} className="flex items-center gap-3 group/author">
                    <div className="w-12 h-12 bg-[var(--color-accent-yellow)] border-2 border-[var(--color-text)] relative shadow-[2px_2px_0px_0px_rgba(25,25,25,1)] hover-lift transition-all">
                        {post.author.avatar ? (
                            <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover grayscale mix-blend-multiply group-hover/author:grayscale-0 transition-all duration-300" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-syne font-bold text-lg">
                                {post.author.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-syne font-bold uppercase tracking-widest text-[var(--color-text)] leading-none text-base group-hover/author:text-[var(--color-accent-orange)] transition-colors">{post.author.name}</h3>
                            {post.author.role && <span className="px-1.5 py-0.5 border-2 border-[var(--color-text)] bg-[var(--color-accent-purple)] text-white text-[10px] font-syne font-bold uppercase tracking-wider">{post.author.role}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs font-mono font-medium text-[var(--color-text)] opacity-70">{post.author.username || `@${post.author.name.toLowerCase().replace(/\s+/g, '_')}`}</p>
                            <span className="w-1 h-px bg-[var(--color-text)]"></span>
                            <p className="text-xs font-mono font-medium text-[var(--color-text)] opacity-70 uppercase">{post.timestamp}</p>
                        </div>
                    </div>
                </NavLink>

                <div className="flex items-center gap-2">
                    {/* Top Label (if present) */}
                    {labelStyle && (
                        <span className={`px-2 py-1 text-xs font-syne font-bold uppercase tracking-widest border-2 border-[var(--color-text)] ${labelStyle.bg}`}>
                            {labelStyle.text}
                        </span>
                    )}
                    {/* More Menu */}
                    <button className="w-8 h-8 flex items-center justify-center border-2 border-transparent hover:border-[var(--color-text)] hover:bg-[var(--color-surface)] text-[var(--color-text)] transition-all">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="mb-6">
                <p className="text-lg md:text-xl font-outfit leading-relaxed text-[var(--color-text)] font-normal mb-6">
                    {post.content}
                </p>

                {/* Media Attachment */}
                {post.media && (
                    <div className="mb-6 aspect-video w-full bg-[var(--color-surface)] overflow-hidden border-2 border-[var(--color-text)] relative shadow-[4px_4px_0px_0px_rgba(25,25,25,1)]">
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-all z-10 pointer-events-none"></div>
                        {post.media.type === 'image' ? (
                            <img src={post.media.url} alt="Post attachment" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out grayscale hover:grayscale-0" />
                        ) : (
                            <video src={post.media.url} controls className="w-full h-full object-contain bg-black" />
                        )}
                    </div>
                )}

                {/* Rich Link Preview Card */}
                {post.source && sourceStyle && (
                    <a href={post.source.url} target="_blank" rel="noreferrer" className="block group/link border-2 border-[var(--color-text)] bg-white hover:-translate-y-1 hover:shadow-brutal transition-all">
                        <div className="flex flex-col md:flex-row h-auto md:h-32">
                            {/* Preview Image */}
                            {post.source.preview?.image && (
                                <div className="h-48 md:h-full w-full md:w-48 shrink-0 bg-[var(--color-surface)] border-b-2 md:border-b-0 md:border-r-2 border-[var(--color-text)] overflow-hidden relative">
                                    <img src={post.source.preview.image} alt="Link preview" className="w-full h-full object-cover group-hover/link:scale-110 transition-transform duration-500 grayscale group-hover/link:grayscale-0" />
                                </div>
                            )}

                            {/* Preview Metadata */}
                            <div className="p-4 bg-[var(--color-bg)] flex-1 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`px-2 py-1 flex items-center justify-center border-2 border-[var(--color-text)] text-[10px] ${sourceStyle.color}`}>
                                        <ExternalLink size={10} className="mr-1"/>
                                        <span className="font-syne font-bold uppercase tracking-widest">{sourceStyle.name}</span>
                                    </div>
                                </div>

                                <h4 className="text-base font-syne font-bold text-[var(--color-text)] group-hover/link:text-[var(--color-accent-orange)] transition-colors line-clamp-1 leading-tight mb-1">
                                    {post.source.preview?.title || post.source.url}
                                </h4>

                                {post.source.preview?.description && (
                                    <p className="text-sm font-outfit text-[var(--color-text)] opacity-80 line-clamp-1">
                                        {post.source.preview.description}
                                    </p>
                                )}
                            </div>
                            <div className="w-12 border-l-2 border-[var(--color-text)] bg-[var(--color-accent-yellow)] flex items-center justify-center group-hover/link:bg-[var(--color-accent-orange)] transition-colors">
                                <ArrowRight size={20} className="text-[var(--color-text)] group-hover/link:text-white -rotate-45 group-hover/link:rotate-0 transition-all duration-300" />
                            </div>
                        </div>
                    </a>
                )}
            </div>

            {/* Interactive Action Bar */}
            <div className="flex flex-wrap items-center justify-start border-t-2 border-[var(--color-text)] pt-4 gap-4">
                <button
                    onClick={() => setShowComments(!showComments)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 border-2 border-[var(--color-text)] hover-lift transition-all font-syne font-bold text-sm uppercase tracking-widest",
                        showComments ? "bg-[var(--color-accent-purple)] text-white" : "bg-white text-[var(--color-text)]"
                    )}
                >
                    <MessageSquare size={16} />
                    <span>{commentCount} Replies</span>
                </button>

                <button
                    onClick={handleLike}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 border-2 border-[var(--color-text)] hover-lift transition-all font-syne font-bold text-sm uppercase tracking-widest",
                        liked ? "bg-[var(--color-accent-red)] text-white" : "bg-white text-[var(--color-text)]"
                    )}
                >
                    <Heart size={16} className={liked ? "fill-white" : ""} />
                    <span>{likeCount} Likes</span>
                </button>

                <button
                    onClick={handleSupport}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 border-2 border-[var(--color-text)] hover-lift transition-all font-syne font-bold text-sm uppercase tracking-widest",
                        supported ? "bg-[var(--color-accent-green)] text-white" : "bg-white text-[var(--color-text)]"
                    )}
                >
                    <HeartHandshake size={16} />
                    <span>{supportCount} Support</span>
                </button>

                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-[var(--color-text)] hover-lift transition-all font-syne font-bold text-sm uppercase tracking-widest bg-[var(--color-accent-yellow)] text-[var(--color-text)]"
                >
                    {shared ? (
                        <>
                            <Check size={16} />
                            <span>Copied</span>
                        </>
                    ) : (
                        <>
                            <Share2 size={16} />
                            <span>Share</span>
                        </>
                    )}
                </button>
            </div>

            {/* Comments Section */}
            <div className={cn("mt-6 space-y-4", !showComments && localComments.length === 0 && "hidden")}>
                {showComments && localComments.length > 0 && (
                    <div className="space-y-4">
                        {localComments.map((c) => (
                            <div key={c.id} className="flex gap-4">
                                <div className="w-10 h-10 border-2 border-[var(--color-text)] bg-[var(--color-surface)] shrink-0 overflow-hidden shadow-brutal-sm">
                                    {c.avatar ? (
                                        <img src={c.avatar} className="w-full h-full object-cover grayscale mix-blend-multiply" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-syne font-bold">{c.author.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="flex-1 bg-white p-4 border-2 border-[var(--color-text)] shadow-brutal-sm">
                                    <div className="flex justify-between items-center mb-2 border-b-2 border-transparent hover:border-[var(--color-text)] transition-all">
                                        <NavLink to={`/profile/${c.authorId}`} className="text-sm font-syne font-bold uppercase tracking-widest text-[var(--color-text)]">{c.author}</NavLink>
                                        <span className="text-xs font-mono font-medium text-[var(--color-text)] opacity-70 uppercase">{c.time}</span>
                                    </div>
                                    <p className="text-sm font-outfit text-[var(--color-text)] leading-relaxed">
                                        {c.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quick Reply Box */}
                {showComments && (
                    <div className="flex gap-4 mt-4">
                        <div className="w-10 h-10 border-2 border-[var(--color-text)] bg-[var(--color-accent-yellow)] flex items-center justify-center shrink-0 shadow-brutal-sm">
                            <MessageSquare size={16} className="text-[var(--color-text)]" />
                        </div>
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                            placeholder="Add a reply... (press Enter)"
                            className="flex-1 bg-white border-2 border-[var(--color-text)] px-4 py-2 font-outfit text-sm text-[var(--color-text)] focus:outline-none focus:ring-0 focus:shadow-brutal-sm transition-all"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default PostCard;
