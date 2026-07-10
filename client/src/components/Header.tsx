import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Bell, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/useAuth';
import { useNotifications } from '@/context/NotificationContext';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import CreatePost from '@/components/CreatePost';
import { toast } from 'sonner';

export function Header() {
    const { userData } = useAuth();
    const { unreadCount } = useNotifications();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

    const navItems = [
        { path: '/discover', label: 'Nodes' },
        { path: '/communities', label: 'Alliances' },
        { path: '/events', label: 'Events' },
        { path: '/networking', label: 'Connect' },
        { path: '/vault', label: 'Vault' },
    ];

    const iconNavs = [
        { path: '/messages', icon: MessageSquare, label: 'Messages' },
        { path: '/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
        { path: '/settings', icon: Settings, label: 'Settings' }
    ];

    return (
        <header className="sticky top-0 z-50 w-full bg-[var(--color-bg)] border-b-2 border-[var(--color-text)]">
            <div className="flex items-center justify-between h-20 px-4 md:px-8">
                {/* Logo */}
                <div className="flex-shrink-0 flex items-center">
                    <NavLink to="/" className="flex items-center gap-2 group">
                        {/* Architectural Logo SVG for UniteX */}
                        <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--color-text)]">
                            <path d="M10 30V10H16V22C16 26.4183 19.5817 30 24 30C28.4183 30 32 26.4183 32 22V10H38V30H32V25.5C30.2 28.2 27.3 30 24 30H10Z" fill="currentColor"/>
                            <path d="M46 10H52V30H46V10Z" fill="currentColor"/>
                            <path d="M58 10H64V14H58V10ZM58 16H64V30H58V16Z" fill="currentColor"/>
                            <path d="M70 16H66V10H80V16H76V30H70V16Z" fill="currentColor"/>
                            <path d="M86 10H102V16H92V18H100V24H92V26H102V32H86V10Z" fill="currentColor"/>
                            <path d="M106 10H112L116 16L120 10H126L120 19L126 30H120L116 23L112 30H106L112 19L106 10Z" fill="currentColor"/>
                        </svg>
                    </NavLink>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-8">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "text-sm font-syne font-bold uppercase tracking-widest transition-colors",
                                isActive ? "text-[var(--color-accent-orange)]" : "text-[var(--color-text)] hover:text-[var(--color-accent-orange)]"
                            )}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Right side: Button, Icons & Profile */}
                <div className="flex items-center gap-4">
                    <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                        <DialogTrigger asChild>
                            <button className="hidden md:block relative overflow-hidden group border-2 border-[var(--color-text)] bg-[var(--color-bg)] px-6 py-2 rounded-none hover-lift shrink-0">
                                <span className="relative z-10 font-syne font-bold uppercase tracking-widest text-sm text-[var(--color-text)] group-hover:text-white transition-colors duration-300">
                                    Create Post
                                </span>
                                <div className="absolute inset-0 bg-[var(--color-accent-purple)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-2xl">
                            <DialogTitle className="sr-only">Access Console</DialogTitle>
                            <DialogDescription className="sr-only">Share with the network.</DialogDescription>
                            <CreatePost
                                initialExpanded={true}
                                onPost={(content, label) => {
                                    toast.success(`Post synchronized: ${label || 'POST'}`);
                                    setIsPostDialogOpen(false);
                                }}
                            />
                        </DialogContent>
                    </Dialog>

                    {/* Quick Link Icons for Inbox, Notifications, Settings */}
                    <div className="hidden sm:flex items-center gap-2">
                        {iconNavs.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => cn(
                                    "relative w-10 h-10 border-2 border-[var(--color-text)] flex items-center justify-center hover-lift bg-white text-[var(--color-text)]",
                                    isActive ? "bg-[var(--color-accent-yellow)]" : "hover:bg-[var(--color-surface)]"
                                )}
                                title={item.label}
                            >
                                <item.icon size={18} />
                                {item.badge && item.badge > 0 ? (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 border-2 border-[var(--color-text)] bg-[var(--color-accent-red)] text-white text-[9px] font-syne font-bold flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(25,25,25,1)]">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                ) : null}
                            </NavLink>
                        ))}


                    </div>

                    <NavLink to="/profile" className="w-10 h-10 border-2 border-[var(--color-text)] bg-[var(--color-accent-yellow)] flex items-center justify-center hover-lift shrink-0">
                        {userData?.photoURL ? (
                            <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover grayscale mix-blend-multiply" />
                        ) : (
                            <span className="font-syne font-bold text-lg">{userData?.displayName?.charAt(0) || 'U'}</span>
                        )}
                    </NavLink>

                    {/* Mobile Menu Button */}
                    <button 
                        className="lg:hidden p-2 text-[var(--color-text)]"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="lg:hidden border-t-2 border-[var(--color-text)] bg-[var(--color-bg)] absolute w-full left-0 z-50">
                    <div className="flex flex-col p-4 gap-4">
                        {/* Standard Links */}
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) => cn(
                                    "text-lg font-syne font-bold uppercase tracking-widest p-2 border-b-2 border-transparent",
                                    isActive ? "border-[var(--color-text)] text-[var(--color-accent-orange)]" : "text-[var(--color-text)]"
                                )}
                            >
                                {item.label}
                            </NavLink>
                        ))}

                        {/* Extra Sub-nav items for Mobile */}
                        <div className="grid grid-cols-4 gap-2 mt-2 pt-4 border-t-2 border-[var(--color-text)] border-dashed">
                            {iconNavs.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={({ isActive }) => cn(
                                        "flex flex-col items-center justify-center p-3 border-2 border-[var(--color-text)] bg-white font-syne font-bold uppercase text-[10px] tracking-wider relative",
                                        isActive ? "bg-[var(--color-accent-yellow)]" : ""
                                    )}
                                >
                                    <item.icon size={18} className="mb-1" />
                                    <span>{item.label}</span>
                                    {item.badge && item.badge > 0 ? (
                                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 border-2 border-[var(--color-text)] bg-[var(--color-accent-red)] text-white text-[8px] font-bold flex items-center justify-center">
                                            {item.badge}
                                        </span>
                                    ) : null}
                                </NavLink>
                            ))}


                        </div>

                        <button 
                            onClick={() => { setIsMenuOpen(false); setIsPostDialogOpen(true); }}
                            className="w-full text-center border-2 border-[var(--color-text)] bg-[var(--color-accent-purple)] text-white font-syne font-bold uppercase tracking-widest py-3 mt-4"
                        >
                            Create Post
                        </button>
                    </div>
                </div>
            )}

        </header>
    );
}

