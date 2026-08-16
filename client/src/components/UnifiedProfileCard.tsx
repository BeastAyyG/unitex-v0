import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Copy, Users, Zap, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/context/useAuth';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

export function UnifiedProfileCard() {
    const { currentUser } = useAuth();
    const [vp, setVp] = useState<number>(0);
    const [niche, setNiche] = useState<string>('Initialization Pending');
    const [username, setUsername] = useState<string>('');
    const [usercode, setUsercode] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>('Anonymous Node');
    const [photoURL, setPhotoURL] = useState<string>('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop');

    useEffect(() => {
        if (!currentUser?.uid || !rtdb) return;
        
        try {
            const userRef = ref(rtdb, `users/${currentUser.uid}`);
            const unsubscribe = onValue(userRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setVp(data.vp || 0);
                    setNiche(data.niche || (data.tags && data.tags.length > 0 ? data.tags[0] : 'General Node'));
                    setUsername(data.username || '');
                    setUsercode(data.usercode || '');
                    setDisplayName(data.displayName || currentUser?.displayName || 'Anonymous Node');
                    setPhotoURL(data.photoURL || currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop');
                }
            });
            
            return () => unsubscribe();
        } catch (err) {
            console.warn("RTDB subscription failed:", err);
        }
    }, [currentUser]);

    const publicId = usercode || currentUser?.uid || 'guest';
    const profileUrl = `${window.location.origin}/u/${encodeURIComponent(publicId)}`;

    const copyProfileUrl = () => {
        navigator.clipboard.writeText(profileUrl);
        toast.success("Profile URL copied!");
    };

    return (
        <div className="bg-white border border-[var(--color-surface)] overflow-hidden flex flex-col shadow-brutal-sm">
            {/* Banner/Header Portion */}
            <div className="h-16 bg-gradient-to-r from-[var(--color-surface)] to-[#F4511C]/10 w-full" />

            {/* Photo Underneath Left-Aligned */}
            <NavLink to="/profile" className="px-4 -mt-8 mb-4 block hover:opacity-80 transition-opacity">
                <Avatar className="w-16 h-16 rounded-lg border-2 border-white shadow-brutal-sm">
                    <AvatarImage src={photoURL} />
                    <AvatarFallback className="bg-[#09090b] text-white rounded-lg">{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
            </NavLink>

            {/* Info Section */}
            <div className="px-4 pb-4">
                <NavLink to="/profile">
                    <h2 className="text-lg font-bold text-[var(--color-text)] capitalize tracking-tight hover:text-[var(--color-accent)] transition-colors">{displayName}</h2>
                </NavLink>
                <p className="text-[10px] font-bold text-[var(--color-accent)] mb-1">@{username.replace(/^@/, '')}</p>
                <div className="flex items-center gap-1.5 mb-4 mt-1">
                    <p className="text-[9px] text-gray-400 font-mono capitalize tracking-widest">{niche}</p>
                </div>

                {/* Intelligence Stats */}
                <div className="border-y border-[var(--color-surface)] py-3 space-y-2 mb-4 bg-gray-50/50 -mx-4 px-4">
                    <div className="flex justify-between items-center text-[9px] font-bold capitalize tracking-tight text-gray-400">
                        <span className="flex items-center gap-1.5"><Award size={12} className="text-[#F4511C]" /> Value Points (VP)</span>
                        <span className="text-[var(--color-accent)] font-mono text-xs">{vp.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold capitalize tracking-tight text-gray-400">
                        <span>Profile Level</span>
                        <span className="text-[var(--color-text)]">{Math.floor(vp / 100) + 1}</span>
                    </div>
                </div>

                {/* Action Tray */}
                <div className="flex flex-col gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 text-[9px] font-bold capitalize tracking-tight h-8 border-[var(--color-surface)] hover:border-[var(--color-text)] rounded-lg"
                        onClick={copyProfileUrl}
                    >
                        <Copy size={12} />
                        Copy Node URL
                    </Button>
                    <NavLink to="/networking">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 text-[9px] font-bold capitalize tracking-tight h-8 text-gray-400 hover:text-[var(--color-text)] rounded-lg"
                        >
                            <Users size={12} />
                            My network
                        </Button>
                    </NavLink>
                </div>
            </div>

        </div>
    );
}
