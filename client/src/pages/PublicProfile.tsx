import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, Copy, MapPin, Share2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLockup } from '@/components/Brand';
import { Button } from '@/components/ui/button';
import { getPublicProfile } from '@/lib/firestore';
import { isDemoMode } from '@/lib/firebase';

const DEMO_PROFILE = {
    publicId: 'DEMO01',
    uid: 'demo-guest-001',
    userId: 'DEMO01',
    usercode: 'DEMO01',
    displayName: 'Demo User',
    username: '@demo_user',
    photoURL: '',
    bio: 'Exploring UnitX in demo mode',
    role: 'Member',
    location: '',
};

function PublicProfile() {
    const { publicId = '' } = useParams();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadProfile = async () => {
            setLoading(true);
            let normalizedId = '';
            try {
                normalizedId = decodeURIComponent(publicId).trim();
            } catch {
                normalizedId = '';
            }
            const result = isDemoMode
                ? (normalizedId.toLowerCase() === 'demo01' || normalizedId === DEMO_PROFILE.uid ? DEMO_PROFILE : null)
                : await getPublicProfile(normalizedId);

            if (!cancelled) {
                setProfile(result);
                setLoading(false);
            }
        };

        void loadProfile();
        return () => { cancelled = true; };
    }, [publicId]);

    const shareUrl = useMemo(() => window.location.href, []);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Public profile link copied');
        } catch {
            toast.error('Copy is unavailable in this browser');
        }
    };

    const shareProfile = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${profile?.displayName || 'UnitX profile'} on UnitX`,
                    text: 'View this public UnitX profile',
                    url: shareUrl,
                });
                return;
            }
            await copyLink();
        } catch {
            // Sharing can be cancelled by the user; do not show an error for that.
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text)]">
                <p className="font-syne text-xs font-bold uppercase tracking-[0.25em]">Loading public node...</p>
            </main>
        );
    }

    if (!profile) {
        return (
            <main className="min-h-screen bg-[var(--color-bg)] px-6 py-10 text-[var(--color-text)]">
                <div className="max-w-xl mx-auto">
                    <BrandLockup size={38} />
                    <section className="mt-16 bg-white border-2 border-[var(--color-text)] p-8 md:p-12 shadow-brutal">
                        <p className="text-[10px] font-syne font-bold uppercase tracking-[0.25em] text-[var(--color-accent-orange)]">Public ID not found</p>
                        <h1 className="mt-4 text-4xl font-syne font-bold uppercase tracking-tight">Node unavailable</h1>
                        <p className="mt-4 text-sm opacity-70 leading-relaxed">This public ID does not exist, or its owner has not enabled a public profile yet.</p>
                        <Link to="/login" className="inline-flex items-center gap-2 mt-8 bg-[var(--color-accent-orange)] text-white border-2 border-[var(--color-text)] px-5 py-3 text-xs font-syne font-bold uppercase tracking-widest shadow-brutal-sm hover-lift">
                            Open UnitX <ArrowRight size={15} />
                        </Link>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[var(--color-bg)] px-5 py-8 md:px-8 md:py-12 text-[var(--color-text)]">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between gap-4">
                    <BrandLockup size={38} />
                    <Link to="/login" className="text-[10px] font-syne font-bold uppercase tracking-widest opacity-70 hover:opacity-100">Join UnitX</Link>
                </div>

                <section className="mt-12 bg-white border-2 border-[var(--color-text)] shadow-brutal overflow-hidden">
                    <div className="h-28 md:h-40 bg-[var(--color-surface)] border-b-2 border-[var(--color-text)] relative">
                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(135deg, transparent 0 48%, var(--color-accent-yellow) 48% 52%, transparent 52%), linear-gradient(45deg, transparent 0 48%, var(--color-accent-purple) 48% 52%, transparent 52%)', backgroundSize: '48px 48px' }} />
                    </div>

                    <div className="px-6 pb-7 md:px-10 md:pb-10">
                        <div className="-mt-12 md:-mt-16 flex flex-col md:flex-row md:items-end gap-5">
                            <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-[var(--color-accent-yellow)] border-2 border-[var(--color-text)] shadow-brutal-sm overflow-hidden flex items-center justify-center">
                                {profile.photoURL ? (
                                    <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl md:text-5xl font-syne font-bold">{String(profile.displayName || 'U').charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="pb-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-3xl md:text-4xl font-syne font-bold uppercase tracking-tight truncate">{profile.displayName || 'UnitX User'}</h1>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 border-2 border-[var(--color-text)] bg-[var(--color-accent-green)] text-[9px] font-syne font-bold uppercase tracking-widest"><Check size={11} /> Public</span>
                                </div>
                                <p className="mt-1 text-sm font-mono opacity-60">{profile.username || profile.role || 'UnitX member'}</p>
                            </div>
                        </div>

                        <div className="mt-7 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                            <div>
                                <p className="text-lg font-outfit leading-relaxed">{profile.bio || 'A UnitX member building and sharing in the network.'}</p>
                                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-syne font-bold uppercase tracking-widest opacity-60">
                                    <span className="inline-flex items-center gap-2"><ShieldCheck size={14} /> Public identity</span>
                                    {profile.location && <span className="inline-flex items-center gap-2"><MapPin size={14} /> {profile.location}</span>}
                                    <span className="font-mono">ID: {profile.publicId || profile.userId || publicId}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button onClick={copyLink} variant="outline" className="bg-white border-2 border-[var(--color-text)] text-[var(--color-text)] font-syne font-bold text-xs uppercase tracking-widest shadow-brutal-sm hover-lift">
                                    <Copy size={14} className="mr-2" /> Copy link
                                </Button>
                                <Button onClick={() => void shareProfile()} className="bg-[var(--color-accent-purple)] text-white border-2 border-[var(--color-text)] font-syne font-bold text-xs uppercase tracking-widest shadow-brutal-sm hover-lift">
                                    <Share2 size={14} className="mr-2" /> Share
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                <p className="mt-6 text-center text-[10px] font-syne font-bold uppercase tracking-[0.22em] opacity-50">Anyone with this public link can view this profile</p>
            </div>
        </main>
    );
}

export default PublicProfile;
