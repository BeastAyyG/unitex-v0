import React, { useState, useRef, useEffect } from 'react';
import { Image, Link, X, Send, FileText, Globe, Plus, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCEPTED_MEDIA_TYPES, getMediaType, validateMediaFile, type MediaType } from '@/lib/media';
import { toast } from 'sonner';

const POST_LABELS = [
    { id: 'progress', label: 'Progress', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { id: 'failure', label: 'Failure', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    { id: 'question', label: 'Question', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { id: 'resource', label: 'Resource', color: 'bg-sky-100 text-sky-800 border-sky-200' },
    { id: 'discussion', label: 'Discussion', color: 'bg-violet-100 text-violet-800 border-violet-200' },
    { id: 'reflection', label: 'Reflection', color: 'bg-slate-100 text-slate-800 border-slate-200' },
];

export interface CreatePostMedia {
    type: MediaType;
    url: string;
}

function CreatePost({ initialExpanded = false, onPost }: { initialExpanded?: boolean, onPost?: (content: string, label: string | null, media?: CreatePostMedia) => void }) {
    const [isExpanded, setIsExpanded] = useState(initialExpanded);
    const [content, setContent] = useState('');
    const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [customLabel, setCustomLabel] = useState('');
    const [customLabels, setCustomLabels] = useState<{ id: string; label: string; color: string }[]>([]);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const submittedPreviewRef = useRef<string | null>(null);

    // Clean up object URL on unmount or when preview changes
    useEffect(() => {
        return () => {
            if (mediaPreview && mediaPreview !== submittedPreviewRef.current) {
                URL.revokeObjectURL(mediaPreview);
            }
        };
    }, [mediaPreview]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validationError = validateMediaFile(file);
        if (validationError) {
            toast.error(validationError);
            return;
        }

        // Revoke previous preview URL
        if (mediaPreview) {
            URL.revokeObjectURL(mediaPreview);
        }

        const previewUrl = URL.createObjectURL(file);
        setMediaFile(file);
        setMediaPreview(previewUrl);

        // Reset file input so the same file can be re-selected
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeMedia = () => {
        if (mediaPreview) {
            URL.revokeObjectURL(mediaPreview);
        }
        setMediaFile(null);
        setMediaPreview(null);
    };

    const handleAddCustomLabel = () => {
        const trimmed = customLabel.trim();
        if (!trimmed) return;
        const id = trimmed.toLowerCase().replace(/\s+/g, '-');
        if ([...POST_LABELS, ...customLabels].some(l => l.id === id)) {
            setSelectedLabel(id);
            setCustomLabel('');
            setShowCustomInput(false);
            return;
        }
        const newLabel = { id, label: trimmed, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
        setCustomLabels(prev => [...prev, newLabel]);
        setSelectedLabel(id);
        setCustomLabel('');
        setShowCustomInput(false);
    };

    const allLabels = [...POST_LABELS, ...customLabels];

    const handlePost = () => {
        if ((content.trim() || mediaFile) && onPost) {
            const mediaType = mediaFile ? getMediaType(mediaFile) : null;
            const media: CreatePostMedia | undefined = mediaPreview && mediaFile
                ? { type: mediaType || 'image', url: mediaPreview }
                : undefined;
            // Keep a submitted blob URL alive for the locally-rendered post.
            submittedPreviewRef.current = mediaPreview;
            onPost(content, selectedLabel, media);
            setContent('');
            setSelectedLabel(null);
            setMediaFile(null);
            setMediaPreview(null);
            setIsExpanded(false);
        }
    };

    return (
        <div className={cn(
            "bg-[var(--color-bg)] transition-all duration-300 relative group border-2 border-[var(--color-text)]",
            isExpanded ? "shadow-brutal" : "hover:shadow-brutal-sm"
        )}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_MEDIA_TYPES}
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Header / collapsed state */}
            <div
                onClick={() => setIsExpanded(true)}
                className="p-4 flex items-center justify-between cursor-pointer border-b-2 border-transparent group-hover:border-[var(--color-text)] transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 flex items-center justify-center border-2 transition-all",
                        isExpanded ? "bg-[var(--color-accent-purple)] text-white border-[var(--color-text)] shadow-brutal-sm" : "bg-white text-[var(--color-text)] border-[var(--color-text)] shadow-[2px_2px_0px_0px_rgba(25,25,25,1)]"
                    )}>
                        <FileText size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-syne font-bold uppercase tracking-widest text-[var(--color-text)]">
                            {isExpanded ? "Initialize Sequence" : "Transmit Data"}
                        </h3>
                        {!isExpanded && (
                            <p className="text-xs font-outfit text-[var(--color-text)] opacity-70 mt-1">
                                Share an update with the network.
                            </p>
                        )}
                    </div>
                </div>

                {!isExpanded && (
                    <div className="w-10 h-10 flex items-center justify-center border-2 border-[var(--color-text)] bg-[var(--color-accent-yellow)] shadow-[2px_2px_0px_0px_rgba(25,25,25,1)] hover-lift">
                        <Plus size={24} className="text-[var(--color-text)]" />
                    </div>
                )}
            </div>

            {/* Expanded Form */}
            {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t-2 border-[var(--color-text)]">
                    {/* Content Area */}
                    <div className="mb-6 relative">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter data sequence..."
                            className="w-full min-h-[160px] resize-none outline-none text-xl font-outfit text-[var(--color-text)] placeholder:text-gray-400 font-medium bg-transparent py-4 focus:ring-0"
                            autoFocus
                        />
                        <div className="absolute bottom-0 right-0 text-[10px] font-syne font-bold uppercase tracking-widest text-[var(--color-accent-orange)]">
                            MARKDOWN SUPPORTED
                        </div>
                    </div>

                    {/* Media Preview */}
                    {mediaPreview && mediaFile && (
                        <div className="mb-6 relative border-2 border-[var(--color-text)] bg-[var(--color-surface)] overflow-hidden shadow-brutal-sm">
                            <button
                                onClick={removeMedia}
                                className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center border-2 border-[var(--color-text)] bg-[var(--color-accent-red)] text-white hover:scale-110 transition-transform"
                                title="Remove media"
                            >
                                <X size={16} />
                            </button>
                            {getMediaType(mediaFile) === 'video' ? (
                                <video src={mediaPreview} controls className="w-full max-h-[280px] object-contain bg-black" />
                            ) : getMediaType(mediaFile) === 'audio' ? (
                                <div className="p-6 bg-[var(--color-accent-yellow)]">
                                    <audio src={mediaPreview} controls className="w-full" />
                                </div>
                            ) : (
                                <img src={mediaPreview} alt="Upload preview" className="w-full max-h-[280px] object-contain bg-black" />
                            )}
                            <div className="px-3 py-2 text-[10px] font-syne font-bold text-[var(--color-text)] uppercase tracking-widest border-t-2 border-[var(--color-text)] bg-white flex items-center justify-between">
                                <span className="truncate max-w-[70%]">{mediaFile.name}</span>
                                <span>{(mediaFile.size / 1024).toFixed(0)} KB</span>
                            </div>
                        </div>
                    )}

                    {/* Meta Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pt-6 border-t-2 border-[var(--color-text)]">

                        {/* Label Selector */}
                        <div>
                            <span className="text-[10px] font-syne font-bold uppercase tracking-widest text-[var(--color-text)] opacity-70 mb-3 block">Category <span className="opacity-50">(optional)</span></span>
                            <div className="flex flex-wrap gap-2">
                                {allLabels.map((label) => (
                                    <button
                                        key={label.id}
                                        onClick={() => setSelectedLabel(selectedLabel === label.id ? null : label.id)}
                                        className={cn(
                                            "px-3 py-1.5 text-[10px] font-syne font-bold uppercase tracking-widest border-2 transition-all hover-lift",
                                            selectedLabel === label.id
                                                ? "bg-[var(--color-text)] text-white border-[var(--color-text)] shadow-brutal-sm"
                                                : "bg-white border-[var(--color-text)] text-[var(--color-text)]"
                                        )}
                                    >
                                        {label.label}
                                    </button>
                                ))}
                                {/* Add Custom Category */}
                                {showCustomInput ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={customLabel}
                                            onChange={(e) => setCustomLabel(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomLabel()}
                                            placeholder="TYPE..."
                                            className="h-8 px-2 text-[10px] font-syne font-bold uppercase tracking-widest border-2 border-[var(--color-text)] outline-none bg-white w-28 focus:shadow-brutal-sm transition-all"
                                            autoFocus
                                        />
                                        <button onClick={handleAddCustomLabel} className="h-8 px-3 text-[10px] font-syne font-bold uppercase tracking-widest border-2 border-[var(--color-text)] bg-[var(--color-accent-purple)] text-white hover-lift">Add</button>
                                        <button onClick={() => { setShowCustomInput(false); setCustomLabel(''); }} className="h-8 px-2 border-2 border-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-accent-red)] hover:text-white transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowCustomInput(true)}
                                        className="px-3 py-1.5 text-[10px] font-syne font-bold uppercase tracking-widest border-2 border-[var(--color-text)] border-dashed bg-white text-[var(--color-text)] hover:border-solid hover:bg-[var(--color-accent-yellow)] hover-lift transition-all"
                                    >
                                        + Custom
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Attachments */}
                        <div>
                            <span className="text-[10px] font-syne font-bold uppercase tracking-widest text-[var(--color-text)] opacity-70 mb-3 block">Attachments</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "h-10 px-4 flex items-center gap-2 border-2 transition-all hover-lift text-xs font-syne font-bold uppercase tracking-widest",
                                        mediaFile
                                            ? "border-[var(--color-text)] text-[var(--color-text)] bg-[var(--color-accent-yellow)] shadow-brutal-sm"
                                            : "border-[var(--color-text)] bg-white hover:bg-[var(--color-accent-yellow)] text-[var(--color-text)]"
                                    )}
                                >
                                    {mediaFile && getMediaType(mediaFile) === 'audio' ? <Music2 size={16} /> : <Image size={16} />} {mediaFile ? 'Change' : 'Media'}
                                </button>
                                <button className="h-10 px-4 flex items-center gap-2 border-2 border-[var(--color-text)] bg-white hover:bg-[var(--color-accent-yellow)] hover-lift transition-all text-xs font-syne font-bold uppercase tracking-widest text-[var(--color-text)]">
                                    <Link size={16} /> Link
                                </button>
                                <button className="h-10 px-4 flex items-center gap-2 border-2 border-[var(--color-text)] bg-white hover:bg-[var(--color-accent-yellow)] hover-lift transition-all text-[var(--color-text)]">
                                    <Globe size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => { setIsExpanded(false); removeMedia(); }}
                            className="px-6 py-3 border-2 border-[var(--color-text)] bg-white text-sm font-syne font-bold uppercase tracking-widest text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors hover-lift"
                        >
                            Abort
                        </button>

                        <button
                            disabled={!content.trim() && !mediaFile}
                            onClick={handlePost}
                            className="flex items-center gap-2 px-8 py-3 bg-[var(--color-accent-purple)] text-white border-2 border-[var(--color-text)] hover:bg-[var(--color-accent-orange)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group/btn hover-lift"
                        >
                            <span className="text-sm font-syne font-bold uppercase tracking-widest">Transmit</span>
                            <Send size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreatePost;
