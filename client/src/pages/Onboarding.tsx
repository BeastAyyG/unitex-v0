import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { getUser, updateUser, isUsernameAvailable } from '@/lib/firestore';
import { syncUserToRTDB } from '@/lib/rtdb';
import { Shield, Zap, User, Briefcase, GraduationCap, MapPin, Check, ChevronRight, Hash, Hash as HashIcon, Map, Users, Target, Camera, X, Crop, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandLockup } from '@/components/Brand';

const STEPS = [
    { id: 1, name: 'Identity', icon: Shield },
    { id: 2, name: 'Basic Info', icon: User },
    { id: 3, name: 'Profile', icon: Check },
    { id: 4, name: 'Network', icon: Users },
    { id: 5, name: 'Background', icon: Briefcase },
    { id: 6, name: 'Interests', icon: Target },
];

const PRESET_TOPICS = [
    'Core Architecture', 'Design Systems', 'AI & ML', 
    'Cybersecurity', 'Decentralized Tech', 'Web3', 
    'React', 'Rust', 'DevOps', 'VFX', 'Startups', 'Finance'
];

export const Onboarding = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form State
    const [userData, setUserData] = useState<any>(null);
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState('');
    const [bio, setBio] = useState('');
    const [education, setEducation] = useState('');
    const [workplace, setWorkplace] = useState('');
    const [location, setLocation] = useState('');
    const [topics, setTopics] = useState<string[]>([]);
    const [photoURL, setPhotoURL] = useState('');
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
    
    // Validation State
    const [usernameError, setUsernameError] = useState('');
    const [checkingUsername, setCheckingUsername] = useState(false);

    useEffect(() => {
        if (currentUser) {
            getUser(currentUser.uid).then((data: any) => {
                if (data) {
                    if (data.onboardingCompleted && data.hasSeenCredentials) {
                        navigate('/');
                        return;
                    }
                    setUserData(data);
                    setUsername((data.username || '').replace(/^@/, ''));
                    setBio(data.bio || '');
                    setPhotoURL(data.photoURL || '');
                    if (data.lastCompletedStep) {
                        setStep(Math.min(6, data.lastCompletedStep + 1));
                    }
                }
                setLoading(false);
            });
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        const checkUsername = async () => {
            if (!username || username === userData?.username) {
                setUsernameError('');
                return;
            }
            if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
                setUsernameError('3-15 chars, alphanumeric & underscores only.');
                return;
            }
            setCheckingUsername(true);
            const isAvail = await isUsernameAvailable(username);
            if (!isAvail) {
                setUsernameError('Username is already taken.');
            } else {
                setUsernameError('');
            }
            setCheckingUsername(false);
        };
        const timer = setTimeout(checkUsername, 500);
        return () => clearTimeout(timer);
    }, [username, userData]);

    const saveProgress = async (nextStep?: number) => {
        if (!currentUser) return;
        try {
            const cleanUsername = username.replace(/^@/, '');
            const updateData: any = {
                username: cleanUsername,
                gender,
                dob,
                bio,
                education,
                workplace,
                location,
                photoURL,
                feedPreferences: topics,
                lastCompletedStep: nextStep ? Math.max(userData?.lastCompletedStep || 0, nextStep - 1) : (userData?.lastCompletedStep || 0)
            };
            
            await updateUser(currentUser.uid, updateData);
            // Sync to RTDB for components that use it (like Sidebar/UnifiedProfileCard)
            await syncUserToRTDB(currentUser, { ...updateData, userId: userData?.userId });
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    };

    const handleNext = async () => {
        if (step === 1 && usernameError) return;
        if (step === 2 && !dob) {
            toast.error('Date of Birth is mandatory');
            return;
        }
        
        const nextStep = step + 1;
        await saveProgress(nextStep);
        setStep(nextStep);
    };

    const handleComplete = async () => {
        if (!currentUser) return;
        setSaving(true);
        try {
            const cleanUsername = username.replace(/^@/, '');
            const updateData = {
                username: cleanUsername,
                gender,
                dob,
                bio,
                education,
                workplace,
                location,
                photoURL,
                feedPreferences: topics,
                onboardingCompleted: true,
                hasSeenCredentials: true,
                lastCompletedStep: 6
            };
            
            await updateUser(currentUser.uid, updateData);
            await syncUserToRTDB(currentUser, { ...updateData, userId: userData?.userId });
            toast.success('Onboarding complete!');
            navigate('/');
        } catch (error) {
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const toggleTopic = (t: string) => {
        setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setZoom(1);
                setCropPosition({ x: 0, y: 0 });
                setIsCropModalOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const applyCrop = () => {
        if (!tempImage) return;
        
        const canvas = document.createElement('canvas');
        const img = new Image();
        img.onload = () => {
            const size = 400; 
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Clear with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, size, size);
            
            // Calculate how to draw the image based on the UI state
            // The UI viewport is 256x256 (w-64 h-64).
            const scaleFactor = size / 256;
            
            // Center point of the image in the viewport (relative to image center)
            const drawWidth = size * zoom;
            const drawHeight = (drawWidth * img.height) / img.width;
            
            // The cropPosition from drag is the offset from the initial center
            const x = (size / 2) - (drawWidth / 2) + (cropPosition.x * scaleFactor);
            const y = (size / 2) - (drawHeight / 2) + (cropPosition.y * scaleFactor);
            
            ctx.drawImage(img, x, y, drawWidth, drawHeight);
            setPhotoURL(canvas.toDataURL('image/jpeg', 0.9));
            setIsCropModalOpen(false);
        };
        img.src = tempImage;
    };

    if (loading || !userData) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Zap size={32} className="text-[var(--color-accent)] animate-pulse" />
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Initializing Node...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg)] flex flex-col font-sans text-[var(--color-text)] relative overflow-hidden">
            {/* Background Details */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--color-accent)]/5 blur-[120px] rounded-full -mr-64 -mt-64 animate-pulse duration-[10000ms] pointer-events-none" />
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0 mix-blend-overlay" />

            <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full z-10 p-6 md:p-12 gap-12">
                {/* Left Progress Tracker */}
                <div className="md:w-64 shrink-0 flex flex-col">
                    <BrandLockup className="mb-16" size={40} />

                    <div className="space-y-6">
                        {STEPS.map((s) => {
                            const isActive = s.id === step;
                            const isPast = s.id < step;
                            const Icon = s.icon;
                            return (
                                <div key={s.id} className="flex items-center gap-4 group">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300",
                                        isActive ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-lg" : 
                                        isPast ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white border-gray-200 text-gray-400"
                                    )}>
                                        {isPast ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold uppercase tracking-wider transition-colors",
                                        isActive ? "text-[var(--color-text)]" : isPast ? "text-gray-600" : "text-gray-400"
                                    )}>
                                        {s.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 flex flex-col max-w-2xl bg-white border border-[var(--color-surface)] shadow-sm relative overflow-hidden">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-accent)]" />
                    
                    <div className="p-8 md:p-12 flex-1 flex flex-col">
                        <div className="mb-8">
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-[var(--color-text)] mb-2">
                                {STEPS.find(s => s.id === step)?.name}
                            </h1>
                            <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">
                                Step {step} of {STEPS.length}
                            </p>
                        </div>

                        <div className="flex-1 flex flex-col justify-center min-h-[300px] animate-in fade-in slide-in-from-right-8 duration-500">
                            {/* STEP 1: IDENTITY */}
                            {step === 1 && (
                                <div className="space-y-8">
                                    <div className="bg-gray-50 p-6 border border-[var(--color-surface)] flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">User ID</p>
                                            <p className="text-3xl font-black font-mono tracking-widest text-[var(--color-accent)]">{userData?.userId || userData?.usercode || currentUser?.uid || "DEMO01"}</p>
                                        </div>
                                        <Shield size={40} className="text-gray-200" />
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium text-gray-600 leading-relaxed">
                                            This immutable ID anchors your identity on the blockchain. Now, choose your public network handle.
                                        </p>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Unique Username</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none select-none">@</span>
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                                                    className="w-full bg-white border border-[var(--color-surface)] pl-8 pr-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] font-bold tracking-tight"
                                                    placeholder="username"
                                                />
                                            </div>
                                            <div className="h-4 flex items-center">
                                                {checkingUsername && <span className="text-[10px] text-gray-400 font-mono">Verifying availability...</span>}
                                                {usernameError && <span className="text-[10px] text-rose-500 font-bold">{usernameError}</span>}
                                                {!checkingUsername && !usernameError && username && <span className="text-[10px] text-emerald-500 font-bold">Available</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: BASIC INFO */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date of Birth <span className="text-rose-500">*</span></label>
                                        <input
                                            type="date"
                                            value={dob}
                                            onChange={e => setDob(e.target.value)}
                                            className="w-full bg-white border border-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] uppercase tracking-wider font-mono text-gray-600"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Gender (Optional)</label>
                                        <select
                                            value={gender}
                                            onChange={e => setGender(e.target.value)}
                                            className="w-full bg-white border border-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] text-gray-600 font-bold"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Non-binary">Non-binary</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: PROFILE */}
                            {step === 3 && (
                                <div className="space-y-8 flex flex-col items-center">
                                    <div className="relative group">
                                        <input 
                                            type="file" 
                                            id="avatar-upload" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                        <label 
                                            htmlFor="avatar-upload"
                                            className="w-32 h-32 rounded-lg border border-[var(--color-surface)] overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer block relative"
                                        >
                                            {photoURL ? (
                                                <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${username || userData?.uid || currentUser?.uid || "demo"}`} alt="Avatar" className="w-full h-full object-cover grayscale" />
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Upload Photo</span>
                                            </div>
                                        </label>
                                    </div>
                                    <div className="w-full space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bio (Optional)</label>
                                        <textarea
                                            value={bio}
                                            onChange={e => setBio(e.target.value)}
                                            className="w-full bg-white border border-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] min-h-[120px] resize-none"
                                            placeholder="Write a brief transmission about yourself..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: NETWORK SYNC */}
                            {step === 4 && (
                                <div className="space-y-6 text-center">
                                    <div className="w-20 h-20 bg-gray-50 border border-[var(--color-surface)] mx-auto flex items-center justify-center">
                                        <Users size={32} className="text-[var(--color-accent)]" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold">Synchronize Alliance</h3>
                                        <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
                                            Connect your contacts to discover peers currently active in the UnitX mesh network.
                                        </p>
                                    </div>
                                    <button onClick={handleNext} className="mx-auto w-max px-8 py-3 bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-surface)] text-xs font-bold uppercase tracking-widest hover:border-[var(--color-accent)] transition-colors">
                                        Sync Contacts
                                    </button>
                                    <button onClick={handleNext} className="block mx-auto text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[var(--color-text)] mt-4">
                                        Skip for now
                                    </button>
                                </div>
                            )}

                            {/* STEP 5: BACKGROUND */}
                            {step === 5 && (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><GraduationCap size={12}/> Education</label>
                                        <input
                                            type="text"
                                            value={education}
                                            onChange={e => setEducation(e.target.value)}
                                            className="w-full bg-white border border-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                                            placeholder="e.g. B.S. in Computer Science"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Briefcase size={12}/> Workplace</label>
                                        <input
                                            type="text"
                                            value={workplace}
                                            onChange={e => setWorkplace(e.target.value)}
                                            className="w-full bg-white border border-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                                            placeholder="e.g. Software Engineer at ACME Corp"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><MapPin size={12}/> Location</label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={e => setLocation(e.target.value)}
                                            className="w-full bg-white border border-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                                            placeholder="e.g. San Francisco, CA"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 6: INTERESTS */}
                            {step === 6 && (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-500 leading-relaxed font-medium mb-6">
                                        Select at least 3 topics to calibrate your intelligence feed.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {PRESET_TOPICS.map(topic => {
                                            const isSelected = topics.includes(topic);
                                            return (
                                                <button
                                                    key={topic}
                                                    onClick={() => toggleTopic(topic)}
                                                    className={cn(
                                                        "px-4 py-2 border text-xs font-bold uppercase tracking-wider transition-all",
                                                        isSelected ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-sm" : "bg-white border-[var(--color-surface)] text-gray-500 hover:border-gray-300"
                                                    )}
                                                >
                                                    {topic}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="pt-8 border-t border-[var(--color-surface)] text-center">
                                        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest animate-pulse">
                                            Vector Alignment: {Math.min(100, topics.length * 33.3)}% Complete
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Navigation Footer */}
                        <div className="mt-8 pt-8 border-t border-[var(--color-surface)] flex items-center justify-between">
                            {step > 1 ? (
                                <button 
                                    onClick={() => setStep(prev => prev - 1)}
                                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[var(--color-text)] transition-colors"
                                >
                                    Back
                                </button>
                            ) : (
                                <div /> // Spacer
                            )}
                            <div className="flex items-center gap-4">
                                {step > 2 && step < STEPS.length && (
                                    <button
                                        onClick={() => {
                                            const nextStep = step + 1;
                                            saveProgress(nextStep);
                                            setStep(nextStep);
                                        }}
                                        className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[var(--color-text)] transition-colors"
                                    >
                                        Skip
                                    </button>
                                )}
                                {step === STEPS.length && (
                                    <button
                                        onClick={handleComplete}
                                        disabled={saving}
                                        className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[var(--color-text)] transition-colors"
                                    >
                                        Skip
                                    </button>
                                )}
                                {step < STEPS.length ? (
                                    <button 
                                        onClick={handleNext}
                                        disabled={step === 1 && !!usernameError}
                                        className="px-8 py-3 bg-[var(--color-text)] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[var(--color-accent)] transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        Continue <ChevronRight size={14} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleComplete}
                                        disabled={saving || topics.length < 1}
                                        className="px-8 py-3 bg-[var(--color-accent)] text-white text-xs font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? 'Initializing...' : 'Enter Mesh'} <Zap size={14} className="fill-white" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CROP MODAL */}
            <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
                <DialogContent className="max-w-md bg-white border border-[var(--color-surface)] rounded-lg p-0 overflow-hidden">
                    <div className="p-6 border-b border-[var(--color-surface)]">
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter">Adjust Profile Picture</DialogTitle>
                    </div>
                    <div className="p-8 space-y-8 flex flex-col items-center">
                        <div className="w-64 h-64 border-2 border-[var(--color-accent)] overflow-hidden relative bg-gray-100 cursor-move">
                            {tempImage && (
                                <motion.img 
                                    src={tempImage} 
                                    drag
                                    dragMomentum={false}
                                    onDrag={(_, info: any) => {
                                        setCropPosition(prev => ({
                                            x: prev.x + info.delta.x,
                                            y: prev.y + info.delta.y
                                        }));
                                    }}
                                    style={{ 
                                        scale: zoom,
                                        width: '100%',
                                        height: 'auto',
                                        x: cropPosition.x,
                                        y: cropPosition.y,
                                        position: 'absolute',
                                        cursor: 'move'
                                    }}
                                    draggable={false}
                                />
                            )}
                            <div className="absolute inset-0 border-2 border-white pointer-events-none opacity-50" />
                        </div>
                        
                        <div className="w-full space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>Zoom</span>
                                <span>{Math.round(zoom * 100)}%</span>
                            </div>
                            <input 
                                type="range"
                                min="1" 
                                max="3" 
                                step="0.1"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full h-1 bg-gray-200 appearance-none cursor-pointer accent-[var(--color-accent)]"
                            />
                        </div>

                        <div className="flex gap-4 w-full">
                            <Button 
                                variant="outline" 
                                className="flex-1 rounded-lg border-[var(--color-surface)] font-bold text-xs uppercase"
                                onClick={() => setIsCropModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="flex-1 rounded-lg bg-[var(--color-text)] text-white hover:bg-[var(--color-accent)] font-bold text-xs uppercase"
                                onClick={applyCrop}
                            >
                                Apply Crop
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
