import { useState, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
    Bell, 
    Shield, 
    User as UserIcon, 
    CreditCard, 
    Eye, 
    Settings as SettingsIcon, 
    Download, 
    Smartphone, 
    Laptop, 
    Monitor,
    LogOut,
    Plus,
    Trash2,
    Check,
    MessageSquare,
    Users,
    AppWindow,
    MapPin,
    Camera,
    Lock,
    Fingerprint,
    AtSign,
    Gift,
    Share2,
    Database,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Field, FieldLabel } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '@/context/useAuth';
import { useNavigate } from 'react-router-dom';
import { updateUser, uploadAvatar, getUser, isUsernameAvailable, getUserRewards, getReferralStats, saveReferralCode } from '@/lib/firestore';
import { syncUserToRTDB } from '@/lib/rtdb';
import { toast } from 'sonner';

function Settings() {
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('Profile Info');
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [username, setUsername] = useState('');
    const [usercode, setUsercode] = useState('');
    const [originalUsername, setOriginalUsername] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [updating, setUpdating] = useState(false);
    const [rewards, setRewards] = useState({ exp: 0, vp: 0, level: 1, title: 'Newcomer' });
    const [referralCode, setReferralCode] = useState('');
    const [referrals, setReferrals] = useState<any[]>([]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return;
            const userData = await getUser(currentUser.uid) as any;
            if (userData) {
                setUsername(userData.username?.replace('@', '') || '');
                setOriginalUsername(userData.username?.replace('@', '') || '');
                setUsercode(userData.userId || userData.usercode || '');
                setBio(userData.bio || '');
                setLocation(userData.location || '');
            }
            // Load Rewards and Referral data in parallel
            const [rewardData, referralData] = await Promise.all([
                getUserRewards(currentUser.uid),
                getReferralStats(currentUser.uid)
            ]);
            setRewards(rewardData);
            setReferralCode(referralData.code || '');
            setReferrals(referralData.referrals || []);
            // Auto-save referral code if not yet set
            if (!referralData.code) saveReferralCode(currentUser.uid);
        };
        fetchUserData();
    }, [currentUser]);

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            toast.error("Failed to sign out");
        }
    };

    const handleSaveProfile = async () => {
        if (!currentUser || !auth.currentUser) return;
        setUpdating(true);
        try {
            const cleanUsername = `@${username.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
            
            // Uniqueness check for username if changed
            if (username !== originalUsername) {
                const available = await isUsernameAvailable(cleanUsername);
                if (!available) {
                    toast.error("Username is already taken");
                    setUpdating(false);
                    return;
                }
            }

            // 1. Update Auth Profile
            await updateProfile(auth.currentUser, { displayName });
            
            // 2. Update Firestore User Document
            const updateData = { 
                displayName,
                username: cleanUsername,
                bio,
                location
            };
            await updateUser(currentUser.uid, updateData);
            
            // 3. Sync to RTDB for components like Sidebar
            await syncUserToRTDB(currentUser, { ...updateData, photoURL: currentUser.photoURL, userId: usercode });
            
            setOriginalUsername(username);
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;
        
        setUpdating(true);
        try {
            const photoURL = await uploadAvatar(currentUser.uid, file);
            // 1. Update Auth Profile for immediate UI reflection
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL });
            }
            // 2. Sync to RTDB as well
            await syncUserToRTDB(currentUser, { photoURL, userId: usercode });
            toast.success("Avatar updated!");
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setUpdating(false);
        }
    };

    const sections = [
        { id: 'Account', icon: UserIcon, label: 'Account' },
        { id: 'Profile Info', icon: AtSign, label: 'Profile' },
        { id: 'Privacy & Security', icon: Shield, label: 'Privacy' },
        { id: 'Notifications', icon: Bell, label: 'Notifications' },
        { id: 'Content Preferences', icon: Eye, label: 'Content' },
        { id: 'Rewards & Activity', icon: Zap, label: 'Rewards' },
        { id: 'Referrals', icon: Share2, label: 'Growth' },
        { id: 'System', icon: Database, label: 'System' },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'Account':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-[var(--color-text)]">
                        <section>
                            <h2 className="text-3xl font-bold mb-4 tracking-tight">Account Protocol</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8 max-w-sm leading-loose">Manage your core credentials and authentication methods.</p>
                            
                            <div className="space-y-6">
                                <Field>
                                    <FieldLabel className="uppercase tracking-widest opacity-40 text-[10px] font-bold mb-3">Email Address</FieldLabel>
                                    <div className="relative group">
                                        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-[var(--color-text)] group-focus-within:text-[var(--color-accent)] transition-all" size={16} />
                                        <Input value={currentUser?.email || ''} readOnly disabled className="pl-12 h-14 bg-gray-50 border border-[var(--color-surface)] rounded-lg font-medium text-sm opacity-60 cursor-not-allowed" />
                                    </div>
                                    <p className="mt-2 text-[9px] font-bold uppercase opacity-30 tracking-widest italic">Primary communication channel for system alerts.</p>
                                </Field>

                                <Separator className="bg-[var(--color-surface)] my-8" />

                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest">Initial Security Overhaul</h3>
                                    <Field>
                                        <FieldLabel className="uppercase tracking-widest opacity-40 text-[10px] font-bold mb-3">Current password</FieldLabel>
                                        <div className="relative group">
                                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-[var(--color-text)] group-focus-within:text-[#6366f1] transition-all" size={18} />
                                            <Input type="password" placeholder="••••••••" className="pl-12 h-14 bg-white border border-[var(--color-surface)] rounded-lg font-medium text-sm tracking-widest transition-all focus:ring-0 focus:border-[#6366f1] shadow-sm" />
                                        </div>
                                    </Field>

                                    <Field>
                                        <FieldLabel className="uppercase tracking-widest opacity-40 text-[10px] font-bold mb-3">New password</FieldLabel>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-[var(--color-text)] group-focus-within:text-[var(--color-accent)] transition-all" size={18} />
                                            <Input type="password" placeholder="Enter new secret" className="pl-12 h-14 bg-white border border-[var(--color-surface)] rounded-lg font-medium text-sm tracking-widest transition-all focus:ring-0 focus:border-[var(--color-accent)] shadow-sm" />
                                        </div>
                                    </Field>

                                    <Button className="w-full h-16 bg-[var(--color-text)] text-white hover:bg-[var(--color-accent)] font-bold uppercase tracking-widest rounded-lg shadow-md transition-all active:scale-[0.98] text-xs">
                                        Update Security Protocol
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>
                );
            case 'Profile Info':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-[var(--color-text)]">
                        <section>
                            <h2 className="text-3xl font-bold mb-4 tracking-tight">Public Identity</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8 max-w-sm leading-loose">Synchronize your persona across the Alliance network.</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold mb-4 uppercase tracking-widest opacity-40">Identity Visualizer</label>
                                    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6">
                                        <div className="w-24 h-24 rounded-lg bg-cover bg-center border border-[var(--color-surface)] shadow-sm relative group" 
                                             style={{ backgroundImage: `url(${currentUser?.photoURL || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&h=256&auto=format&fit=crop'})` }}>
                                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                 <Camera size={20} className="text-white" />
                                                 <input type="file" onChange={handleAvatarUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                             </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Button disabled={updating} onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()} className="bg-[var(--color-text)] text-white hover:bg-[var(--color-accent)] py-2.5 px-6 h-auto text-[10px] font-bold uppercase tracking-widest rounded-none transition-all shadow-sm">
                                                Update Frame
                                            </Button>
                                            <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest">JPG or PNG • Max 2MB</p>
                                        </div>
                                    </div>
                                </div>

                                <Field>
                                    <FieldLabel className="uppercase tracking-widest opacity-40 text-[10px] font-bold mb-3">Display Name</FieldLabel>
                                    <div className="relative group">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-[var(--color-text)] group-focus-within:text-[var(--color-accent)] group-focus-within:opacity-100 transition-all" size={16} />
                                        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Full Name" className="pl-12 h-14 bg-white border border-[var(--color-surface)] rounded-lg font-medium text-sm transition-all focus:ring-0 focus:border-[var(--color-accent)] shadow-sm" />
                                    </div>
                                </Field>

                                <Field>
                                    <FieldLabel className="uppercase tracking-widest opacity-40 text-[10px] font-bold mb-3">Protocol Handle (@)</FieldLabel>
                                    <div className="relative group">
                                        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-[var(--color-text)] group-focus-within:text-[var(--color-accent)] group-focus-within:opacity-100 transition-all" size={16} />
                                        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="pl-12 h-14 bg-white border border-[var(--color-surface)] rounded-lg font-medium text-sm transition-all focus:ring-0 focus:border-[var(--color-accent)] shadow-sm" />
                                    </div>
                                </Field>

                                <Field>
                                    <FieldLabel className="uppercase tracking-widest opacity-40 text-[10px] font-bold mb-3">Node Core ID</FieldLabel>
                                    <div className="relative group">
                                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-[var(--color-text)] group-focus-within:text-[var(--color-accent)] group-focus-within:opacity-100 transition-all" size={16} />
                                        <Input value={usercode} readOnly disabled className="pl-12 h-14 bg-gray-50 border border-[var(--color-surface)] rounded-lg font-mono text-sm tracking-widest opacity-60 cursor-not-allowed" />
                                    </div>
                                    <p className="mt-2 text-[9px] font-bold uppercase opacity-30 tracking-widest italic">Immutable network identifier.</p>
                                </Field>

                                <Field>
                                    <FieldLabel className="uppercase tracking-widest opacity-40 text-[10px] font-bold mb-3">Base Location</FieldLabel>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-[var(--color-text)] group-focus-within:text-[var(--color-accent)] group-focus-within:opacity-100 transition-all" size={16} />
                                        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Physical Node Location" className="pl-12 h-14 bg-white border border-[var(--color-surface)] rounded-lg font-medium text-sm transition-all focus:ring-0 focus:border-[var(--color-accent)] shadow-sm" />
                                    </div>
                                </Field>

                                <Field>
                                    <div className="flex justify-between mb-3">
                                        <FieldLabel className="uppercase tracking-widest opacity-40 text-[10px] font-bold mb-0">Professional Transmission (Bio)</FieldLabel>
                                        <span className="text-[10px] font-mono opacity-30">{bio.length}/280</span>
                                    </div>
                                    <div className="relative group">
                                        <MessageSquare className="absolute left-4 top-5 opacity-20 text-[var(--color-text)] group-focus-within:text-[var(--color-accent)] group-focus-within:opacity-100 transition-all" size={16} />
                                        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} placeholder="Share your focus area..." className="pl-12 pt-4 min-h-[140px] bg-white border border-[var(--color-surface)] rounded-lg font-medium text-sm resize-none transition-all focus:ring-0 focus:border-[var(--color-accent)] shadow-sm" />
                                    </div>
                                </Field>

                                <Button onClick={handleSaveProfile} disabled={updating} className="w-full h-16 bg-[var(--color-accent)] text-white hover:opacity-90 font-bold uppercase tracking-widest rounded-lg shadow-sm transition-all active:scale-[0.98] text-xs">
                                    {updating ? 'Processing Synchronization...' : 'Commit Persona Changes'}
                                </Button>
                            </div>
                        </section>
                    </div>
                );
            case 'Privacy & Security':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-[var(--color-text)]">
                        <section>
                            <h2 className="text-3xl font-bold mb-4 tracking-tight">Privacy Center</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8 max-w-sm leading-loose">Control your visibility and secure your node against unauthorized access.</p>
                            
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Visibility Matrix</h3>
                                    {[
                                        { label: 'Public Profile Visibility', desc: 'Allow anyone to see your node status and activity.' },
                                        { label: 'Network Searchability', desc: 'Enable your handle to appear in global search scans.' }
                                    ].map((item, i) => (
                                        <div key={item.label} className="flex justify-between items-center p-6 border border-[var(--color-surface)] bg-white group hover:border-[var(--color-accent)]/30 transition-all">
                                            <div className="space-y-1">
                                                <h4 className="text-xs font-bold uppercase tracking-widest">{item.label}</h4>
                                                <p className="text-[10px] opacity-40 font-medium">{item.desc}</p>
                                            </div>
                                            <div className={cn("w-10 h-5 rounded-full p-1 transition-colors cursor-pointer", i === 0 ? "bg-[var(--color-accent)]" : "bg-gray-200")}>
                                                <div className={cn("w-3 h-3 bg-white rounded-full transition-transform", i === 0 ? "translate-x-5" : "translate-x-0")}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="bg-[var(--color-surface)]" />

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">2FA / Advanced Security</h3>
                                    <div className="p-6 border border-[var(--color-surface)] bg-gray-50/50 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white flex items-center justify-center border border-[var(--color-surface)]">
                                                <Lock size={18} className="opacity-40 group-hover:text-[var(--color-accent)] transition-colors" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-widest">Two-Factor Auth</h4>
                                                <p className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">Deactivated • High Risk</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" className="h-10 px-6 text-[10px] font-bold uppercase tracking-widest rounded-lg border-gray-200 hover:bg-white transition-all">Enable</Button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                );
            case 'Notifications':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-[var(--color-text)]">
                        <section>
                            <h2 className="text-3xl font-bold mb-4 tracking-tight">Relay Preferences</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8 max-w-sm leading-loose">Configure how the system communicates tactical updates to your node.</p>
                            
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Primary Relays</h3>
                                    {[
                                        { label: 'Push Notifications', desc: 'Real-time OS level alerts for critical events.', active: true },
                                        { label: 'Email Transmissions', desc: 'Daily digests and important security logs.', active: false },
                                        { label: 'In-App Beacons', desc: 'Visual indicators within the terminal interface.', active: true }
                                    ].map((item) => (
                                        <div key={item.label} className="flex justify-between items-center p-6 border border-[var(--color-surface)] bg-white hover:border-[var(--color-accent)]/30 transition-all">
                                            <div className="space-y-1">
                                                <h4 className="text-xs font-bold uppercase tracking-widest">{item.label}</h4>
                                                <p className="text-[10px] opacity-40 font-medium">{item.desc}</p>
                                            </div>
                                            <div className={cn("w-10 h-5 rounded-full p-1 transition-colors cursor-pointer", item.active ? "bg-[var(--color-accent)]" : "bg-gray-200")}>
                                                <div className={cn("w-3 h-3 bg-white rounded-full transition-transform", item.active ? "translate-x-5" : "translate-x-0")}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                );
            case 'Content Preferences':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-[var(--color-text)]">
                        <section>
                            <h2 className="text-3xl font-bold mb-4 tracking-tight">Feed Tuning</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8 max-w-sm leading-loose">Recalibrate the Discovery algorithm based on your sectors of interest.</p>
                            
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {['AI/ML', 'Blockchain', 'UX Design', 'Hardware', 'Marketing', 'Fintech', 'Gaming', 'Security', 'Big Data'].map(topic => (
                                        <button key={topic} className="h-12 border border-[var(--color-surface)] bg-white text-[10px] font-bold uppercase tracking-widest hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-all">
                                            {topic}
                                        </button>
                                    ))}
                                </div>
                                <Separator className="bg-[var(--color-surface)]" />
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Safety Filters</h3>
                                    <div className="p-6 border border-gray-100 bg-gray-50/30 flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">Sensitive Content Filter</span>
                                        <div className="w-10 h-5 bg-[var(--color-accent)] rounded-full p-1 flex justify-end">
                                            <div className="w-3 h-3 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                );
            case 'Rewards & Activity':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-[var(--color-text)]">
                        <section>
                            <h2 className="text-3xl font-bold mb-4 tracking-tight">Growth Metrics</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8 max-w-sm leading-loose">Historical data of your contributions and accumulated influence.</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-6 border border-[var(--color-surface)] bg-white shadow-sm">
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Total EXP</span>
                                    <div className="text-3xl font-black mt-2 text-[var(--color-accent)]">{rewards.exp.toLocaleString()}</div>
                                    <div className="w-full h-1 bg-gray-100 mt-4 overflow-hidden">
                                        <div className="h-full bg-[var(--color-accent)] animate-pulse" style={{ width: `${Math.min(100, (rewards.exp / 50000) * 100)}%` }}></div>
                                    </div>
                                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-30 mt-2">Level {rewards.level} · {rewards.title}</p>
                                </div>
                                <div className="p-6 border border-[var(--color-surface)] bg-white shadow-sm">
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Total VP</span>
                                    <div className="text-3xl font-black mt-2 text-indigo-500">{rewards.vp.toLocaleString()}</div>
                                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-30 mt-6 italic">Convertible to network perks.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Recalibration Logs</h3>
                                <div className="border border-[var(--color-surface)] divide-y divide-[var(--color-surface)]">
                                    {[
                                        { event: 'Content Publication', pts: '+50 XP', date: '2h ago' },
                                        { event: 'Alliance Engagement', pts: '+15 VP', date: '6h ago' },
                                        { event: 'Daily Uptime Bonus', pts: '+100 XP', date: '1d ago' }
                                    ].map((log, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors">
                                            <div className="space-y-0.5">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest">{log.event}</h4>
                                                <span className="text-[9px] opacity-40 font-mono uppercase">{log.date}</span>
                                            </div>
                                            <span className="font-black text-xs text-emerald-500">{log.pts}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                );
            case 'Referrals':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-[var(--color-text)]">
                        <section>
                            <h2 className="text-3xl font-bold mb-4 tracking-tight">Growth Engine</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8 max-w-sm leading-loose">Invite new nodes to the Alliance and earn unique rewards.</p>
                            
                            <div className="p-8 bg-[var(--color-text)] text-white shadow-xl relative overflow-hidden mb-8">
                                <div className="flex flex-col gap-6 relative z-10">
                                    <div>
                                        <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Your Unique Invite Code</h3>
                                        <div className="flex gap-2">
                                            <div className="flex-1 h-14 bg-white/10 flex items-center px-4 font-mono font-bold tracking-[0.3em] border border-white/20 uppercase text-lg">
                                                {referralCode || 'Generating...'}
                                            </div>
                                            <Button
                                                className="w-14 h-14 bg-white text-black hover:bg-[var(--color-accent)] hover:text-white transition-all rounded-lg p-0 flex items-center justify-center"
                                                onClick={() => { navigator.clipboard.writeText(referralCode); toast.success('Code copied!'); }}
                                            >
                                                <Share2 size={18} />
                                            </Button>
                                        </div>
                                        <p className="text-[9px] font-mono opacity-40 mt-2 tracking-wider">Share this code. Earn 100 VP + 500 EXP per successful sign-up.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-4 border border-white/10">
                                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Total Referrals</span>
                                            <div className="text-2xl font-black mt-1">{referrals.length}</div>
                                        </div>
                                        <div className="bg-white/5 p-4 border border-white/10">
                                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">VP Earned</span>
                                            <div className="text-2xl font-black mt-1 text-emerald-400">{(referrals.length * 100).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    {referrals.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-[9px] font-bold uppercase tracking-widest opacity-40">Recent Referrals</h4>
                                            {referrals.slice(0, 3).map((r: any, i: number) => (
                                                <div key={i} className="flex justify-between bg-white/5 border border-white/10 p-3">
                                                    <span className="text-[10px] font-mono opacity-60">{r.referredUid?.substring(0, 12)}...</span>
                                                    <span className="text-[10px] font-bold text-emerald-400">+100 VP</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)] opacity-10 -mr-32 -mt-32 blur-[60px]"></div>
                            </div>
                        </section>
                    </div>
                );
            case 'System':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-[var(--color-text)]">
                        <section>
                            <h2 className="text-3xl font-bold mb-4 tracking-tight">System Core</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8 max-w-sm leading-loose">Low-level terminal controls and cache management.</p>
                            
                            <div className="space-y-6">
                                <div className="p-6 border border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="space-y-1 text-center sm:text-left">
                                        <h4 className="text-xs font-bold uppercase tracking-widest">Network Cache</h4>
                                        <p className="text-[10px] opacity-40 font-medium tracking-tight">Clear 1.2GB of temporary discover data.</p>
                                    </div>
                                    <Button variant="outline" className="h-10 px-8 text-[10px] font-bold uppercase tracking-widest border-gray-200 hover:bg-gray-50 rounded-lg transition-all">Flush Logs</Button>
                                </div>

                                <div className="p-6 border border-red-50 bg-red-50/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="space-y-1 text-center sm:text-left">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-red-600">Nuclear Protocol</h4>
                                        <p className="text-[10px] text-red-600/60 font-medium tracking-tight">Permanently wipe all node data and credentials.</p>
                                    </div>
                                    <Button className="h-10 px-8 text-[10px] font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 rounded-none transition-all shadow-sm">Initialize</Button>
                                </div>
                            </div>
                        </section>
                    </div>
                );
            case 'Team':
            case 'Appearance':
                return (
                    <div className="flex flex-col items-center justify-center h-[400px] text-[var(--color-text)]">
                        <div className="border border-[var(--color-surface)] p-12 text-center shadow-sm max-w-md">
                            <h2 className="text-2xl font-bold tracking-tight mb-4">{activeSection} Module</h2>
                            <p className="text-[10px] uppercase tracking-widest bg-gray-50 inline-block px-4 py-1 font-bold text-[var(--color-accent)]">Initialization in Progress</p>
                            <p className="mt-8 opacity-40 text-[10px] font-bold uppercase tracking-widest italic">Check back later for system updates.</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pt-4 pb-10 text-[var(--color-text)]">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <nav className="space-y-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 group border border-transparent rounded-lg",
                                        activeSection === section.id
                                            ? "bg-white text-[var(--color-text)] border-[var(--color-surface)] shadow-sm"
                                            : "text-gray-400 hover:text-[var(--color-text)] hover:bg-white/50"
                                    )}
                                >
                                    <section.icon 
                                        size={18} 
                                        className={cn(
                                            "transition-colors",
                                            activeSection === section.id ? "text-[var(--color-accent)]" : "group-hover:text-[var(--color-accent)]"
                                        )} 
                                    />
                                    <span className="text-xs font-bold uppercase tracking-widest">{section.label}</span>
                                    {activeSection === section.id && (
                                        <div className="ml-auto w-1.5 h-1.5 bg-[var(--color-accent)]" />
                                    )}
                                </button>
                            ))}
                        </nav>
                        
                        <div className="mt-12 pt-12 border-t border-[var(--color-surface)]">
                            <button onClick={handleSignOut} className="flex items-center gap-4 px-6 py-4 text-red-500 hover:text-red-600 transition-all group w-full text-left rounded-lg hover:bg-red-50/50">
                                <LogOut size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest">Sign Out Terminal</span>
                            </button>
                            <button className="flex items-center gap-4 px-6 py-4 text-gray-400 hover:text-red-600 transition-all group w-full text-left rounded-lg hover:bg-red-50/50 mt-2">
                                <Trash2 size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest">Delete account</span>
                            </button>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <main className="flex-1 max-w-2xl bg-white border border-[var(--color-surface)] p-6 lg:p-8 shadow-sm rounded-lg min-h-[600px]">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default Settings;
