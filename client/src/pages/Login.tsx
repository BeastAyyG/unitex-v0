import { useState, useEffect } from 'react';
import { useAuth } from '@/context/useAuth';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Phone, Lock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Login() {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInWithPhone, verifyOtp, signInAsGuest } = useAuth();
    const navigate = useNavigate();
    
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [method, setMethod] = useState<'email' | 'phone'>('email');
    const [step, setStep] = useState<'input' | 'verify'>('input');
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // We'll need a container for the invisible recaptcha
        if (method === 'phone' && !document.getElementById('recaptcha-container')) {
            const container = document.createElement('div');
            container.id = 'recaptcha-container';
            document.body.appendChild(container);
        }
    }, [method]);

    const handleGoogle = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            toast.success('Authenticated with Google');
            navigate('/');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthFallback = async (provider: string) => {
        setLoading(true);
        try {
            await signInWithGoogle(); 
            toast.success(`Authenticated with ${provider}`);
            navigate('/');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = async () => {
        setLoading(true);
        try {
            await signInAsGuest();
            toast.success('Signed in as Guest');
            navigate('/');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'login') {
                await signInWithEmail(email, password);
                toast.success('Welcome back!');
            } else {
                await signUpWithEmail(email, password, displayName);
                toast.success('Account created successfully');
            }
            navigate('/');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithPhone(phoneNumber, 'recaptcha-container');
            setStep('verify');
            toast.info('Verification code sent to your phone');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyOtp(otp);
            toast.success('Phone verified!');
            navigate('/');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] flex flex-col lg:flex-row overflow-hidden font-outfit selection:bg-[var(--color-accent-orange)]/30 text-[var(--color-text)]">
            {/* Left Column: Form Section */}
            <div className="flex-1 flex flex-col justify-center px-8 lg:px-24 py-12 relative z-10 border-b-2 lg:border-b-0 lg:border-r-2 border-[var(--color-text)]">
                <div className="max-w-md w-full mx-auto space-y-8">
                    
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        {/* Architectural Logo SVG for UniteX */}
                        <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--color-text)]">
                            <path d="M10 30V10H16V22C16 26.4183 19.5817 30 24 30C28.4183 30 32 26.4183 32 22V10H38V30H32V25.5C30.2 28.2 27.3 30 24 30H10Z" fill="currentColor"/>
                            <path d="M46 10H52V30H46V10Z" fill="currentColor"/>
                            <path d="M58 10H64V14H58V10ZM58 16H64V30H58V16Z" fill="currentColor"/>
                            <path d="M70 16H66V10H80V16H76V30H70V16Z" fill="currentColor"/>
                            <path d="M86 10H102V16H92V18H100V24H92V26H102V32H86V10Z" fill="currentColor"/>
                            <path d="M106 10H112L116 16L120 10H126L120 19L126 30H120L116 23L112 30H106L112 19L106 10Z" fill="currentColor"/>
                        </svg>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-syne font-bold tracking-tighter text-[var(--color-text)] uppercase leading-[0.9]">
                            {mode === 'login' ? 'System Access' : 'Initialize Node'}
                        </h1>
                        <p className="text-[var(--color-text)] opacity-85 text-base font-outfit">
                            We empower developers and technical teams to connect, build, and deploy AI-driven nodes visually.
                        </p>
                    </div>

                    {/* Method Toggle */}
                    <div className="flex p-1 bg-white border-2 border-[var(--color-text)] w-fit shadow-brutal-sm">
                        <button 
                            onClick={() => { setMethod('email'); setStep('input'); }}
                            className={cn(
                                "px-6 py-2 text-xs font-syne font-bold uppercase tracking-widest transition-all",
                                method === 'email' ? "bg-[var(--color-accent-purple)] text-white shadow-brutal-sm" : "text-[var(--color-text)] hover:text-[var(--color-accent-purple)]"
                            )}
                        >
                            Email
                        </button>
                        <button 
                            onClick={() => { setMethod('phone'); setStep('input'); }}
                            className={cn(
                                "px-6 py-2 text-xs font-syne font-bold uppercase tracking-widest transition-all",
                                method === 'phone' ? "bg-[var(--color-accent-purple)] text-white shadow-brutal-sm" : "text-[var(--color-text)] hover:text-[var(--color-accent-purple)]"
                            )}
                        >
                            Phone
                        </button>
                    </div>

                    {/* Auth Forms */}
                    <div className="space-y-4">
                        {method === 'email' ? (
                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                {mode === 'signup' && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-syne font-bold uppercase tracking-widest text-[var(--color-text)] opacity-70 ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter identity label..."
                                            value={displayName}
                                            onChange={e => setDisplayName(e.target.value)}
                                            required
                                            className="w-full bg-white border-2 border-[var(--color-text)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:shadow-brutal-sm transition-all placeholder:text-gray-400 font-medium font-outfit"
                                        />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-syne font-bold uppercase tracking-widest text-[var(--color-text)] opacity-70 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="address@domain.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-white border-2 border-[var(--color-text)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:shadow-brutal-sm transition-all placeholder:text-gray-400 font-medium font-outfit"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-syne font-bold uppercase tracking-widest text-[var(--color-text)] opacity-70 ml-1">Password</label>
                                    <input
                                        type="password"
                                        placeholder="Min 8 characters"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-white border-2 border-[var(--color-text)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:shadow-brutal-sm transition-all placeholder:text-gray-400 font-medium font-outfit"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-[var(--color-accent-orange)] text-white text-xs font-syne font-bold uppercase tracking-widest border-2 border-[var(--color-text)] shadow-brutal hover-lift disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Processing...' : mode === 'login' ? 'Synchronize Session' : 'Establish Node Link'}
                                    <ChevronRight size={14} strokeWidth={3} />
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={step === 'input' ? handlePhoneSubmit : handleVerifyOtp} className="space-y-4">
                                {step === 'input' ? (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-syne font-bold uppercase tracking-widest text-[var(--color-text)] opacity-70 ml-1">Mobile Number</label>
                                        <input
                                            type="tel"
                                            placeholder="+1 234 567 8900"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value)}
                                            required
                                            className="w-full bg-white border-2 border-[var(--color-text)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:shadow-brutal-sm transition-all placeholder:text-gray-400 font-medium font-outfit"
                                        />
                                        <p className="text-[10px] text-gray-500 font-mono mt-1">Includes country code (e.g., +1 for USA)</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-syne font-bold uppercase tracking-widest text-[var(--color-text)] opacity-70 ml-1">Verification Code</label>
                                        <input
                                            type="text"
                                            placeholder="6-digit code"
                                            value={otp}
                                            onChange={e => setOtp(e.target.value)}
                                            required
                                            maxLength={6}
                                            className="w-full bg-white border-2 border-[var(--color-text)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:shadow-brutal-sm transition-all placeholder:text-gray-400 font-mono tracking-[1em] text-center"
                                        />
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-[var(--color-accent-orange)] text-white text-xs font-syne font-bold uppercase tracking-widest border-2 border-[var(--color-text)] shadow-brutal hover-lift disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Validating...' : step === 'input' ? 'Request Authentication Code' : 'Verify & Establish Session'}
                                    <ChevronRight size={14} strokeWidth={3} />
                                </button>
                                {step === 'verify' && (
                                    <button 
                                        type="button" 
                                        onClick={() => setStep('input')}
                                        className="text-[10px] font-syne font-bold uppercase tracking-widest text-[var(--color-accent-orange)] hover:underline block mx-auto py-2"
                                    >
                                        Edit Number
                                    </button>
                                )}
                            </form>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-[var(--color-text)] border-dashed" /></div>
                        <div className="relative flex justify-center">
                            <span className="px-4 bg-[var(--color-bg)] text-[10px] text-[var(--color-text)] font-syne font-bold uppercase tracking-widest">or route via</span>
                        </div>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={handleGoogle}
                            className="bg-white border-2 border-[var(--color-text)] py-4 flex items-center justify-center hover:bg-[var(--color-accent-yellow)] transition-all hover-lift cursor-pointer shadow-brutal-sm group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path fill="#ea4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.092 1.092-2.82 2.256-6.024 2.256-4.812 0-8.68-3.92-8.68-8.736a8.6 8.6 0 0 1 8.68-8.736c2.592 0 4.548 1.02 5.94 2.304l2.304-2.304C18.42 1.092 15.6 0 12.12 0 5.484 0 0 5.484 0 12.12c0 6.636 5.484 12.12 12.12 12.12 3.588 0 6.3-1.188 8.424-3.42 2.184-2.184 2.868-5.268 2.868-7.74 0-.744-.06-1.464-.18-2.16H12.48z"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => handleOAuthFallback('GitHub')}
                            className="bg-white border-2 border-[var(--color-text)] py-4 flex items-center justify-center hover:bg-[var(--color-accent-yellow)] transition-all hover-lift cursor-pointer shadow-brutal-sm group"
                            title="Sign in with GitHub"
                        >
                             <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => handleOAuthFallback('Apple')}
                            className="bg-white border-2 border-[var(--color-text)] py-4 flex items-center justify-center hover:bg-[var(--color-accent-yellow)] transition-all hover-lift cursor-pointer shadow-brutal-sm group"
                            title="Sign in with Apple"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
                            </svg>
                        </button>
                    </div>

                    {/* Guest Button */}
                    <button
                        onClick={handleGuest}
                        disabled={loading}
                        className="w-full bg-white border-2 border-[var(--color-text)] py-4 mt-4 flex items-center justify-center hover:bg-[var(--color-accent-green)] hover:text-white transition-all font-syne font-bold uppercase tracking-widest text-sm hover-lift shadow-brutal-sm"
                    >
                        Bypass Verification (Guest)
                    </button>

                    <p className="text-sm text-center text-[var(--color-text)] opacity-85 font-medium mt-8">
                        {mode === 'login' ? "Access denied? " : 'Already registered? '}
                        <button
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                            className="text-[var(--color-accent-orange)] font-syne font-bold uppercase tracking-widest hover:underline ml-1"
                        >
                            {mode === 'login' ? 'Register Node' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>

            {/* Right Column: Visual Section */}
            <div className="hidden lg:flex flex-1 bg-[var(--color-surface)] relative items-center justify-center p-12 overflow-hidden">
                <div className="relative z-20 w-full max-w-lg bg-[var(--color-bg)] border-2 border-[var(--color-text)] p-12 flex flex-col justify-between shadow-brutal group">
                    <div className="space-y-6">
                        <div className="flex gap-2">
                             <span className="px-3 py-1 bg-white border-2 border-[var(--color-text)] text-[10px] font-syne font-bold uppercase tracking-widest text-[var(--color-text)]">Network Core</span>
                             <span className="px-3 py-1 bg-[var(--color-accent-yellow)] border-2 border-[var(--color-text)] text-[10px] font-syne font-bold uppercase tracking-widest text-[var(--color-text)]">Ver 3.0</span>
                        </div>
                        <blockquote className="text-3xl font-syne font-bold leading-[1.1] text-[var(--color-text)] uppercase tracking-tight">
                            "UniteX Node integration has completely centralized our systems. What used to take days of routing setup is now instant."
                        </blockquote>
                    </div>

                    <div className="space-y-6 mt-12">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[var(--color-accent-yellow)] border-2 border-[var(--color-text)] overflow-hidden shadow-brutal-sm shrink-0">
                                <img 
                                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" 
                                    className="w-full h-full object-cover grayscale mix-blend-multiply hover:grayscale-0 transition-all duration-300"
                                    alt="Testimonial Author"
                                />
                            </div>
                            <div>
                                <h4 className="text-base font-syne font-bold uppercase tracking-widest text-[var(--color-text)]">Gina Clinton</h4>
                                <p className="text-xs text-[var(--color-text)] opacity-75 font-mono uppercase tracking-wider">Head of Routing, Acme Inc.</p>
                            </div>
                        </div>
                        <div className="h-0.5 bg-[var(--color-text)] w-full" />
                        <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-[var(--color-text)] opacity-80 uppercase">
                            <span>SYNCED 2026</span>
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-[var(--color-text)]" />
                                <span className="w-2 h-2 bg-[var(--color-text)]" />
                                <span className="w-2 h-2 bg-[var(--color-accent-orange)]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Global background noise texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-50 mix-blend-overlay" />
        </div>
    );
}
