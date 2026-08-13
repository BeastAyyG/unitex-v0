import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Bell, MessageSquare, Settings, Home as HomeIcon, Compass, Users, CalendarDays, Network, Archive, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/useAuth';
import { useNotifications } from '@/context/NotificationContext';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import CreatePost from '@/components/CreatePost';
import { BrandLockup } from '@/components/Brand';
import { toast } from 'sonner';

export function Header() {
    const { userData } = useAuth();
    const { unreadCount } = useNotifications();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

    const navItems = [
        { path: '/', label: 'Home', icon: HomeIcon },
        { path: '/discover', label: 'Discover', icon: Compass },
        { path: '/communities', label: 'Communities', icon: Users },
        { path: '/events', label: 'Events', icon: CalendarDays },
        { path: '/networking', label: 'Network', icon: Network },
        { path: '/vault', label: 'Vault', icon: Archive },
    ];

    const iconNavs = [
        { path: '/messages', icon: MessageSquare, label: 'Messages' },
        { path: '/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
        { path: '/settings', icon: Settings, label: 'Settings' }
    ];

    return (
        <header className="sticky top-0 z-50 w-full bg-[var(--color-bg)] border-b-2 border-[var(--color-text)]">
            <div className="flex items-center justify-between h-16 sm:h-20 px-3 sm:px-4 md:px-8">
                {/* Logo */}
                <div className="flex-shrink-0 flex items-center">
                    <NavLink to="/" className="flex items-center gap-2 group">
                        <BrandLockup compact />
                    </NavLink>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-2" aria-label="Primary navigation">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "relative w-11 h-11 border-2 border-[var(--color-text)] flex items-center justify-center bg-white hover-lift transition-colors group/nav",
                                isActive ? "bg-[var(--color-accent-yellow)]" : "hover:bg-[var(--color-surface)]"
                            )}
                            title={item.label}
                            aria-label={item.label}
                        >
                            <item.icon size={18} strokeWidth={2.2} />
                            <span className="sr-only">{item.label}</span>
                            <span className="absolute top-full mt-2 hidden group-hover/nav:block whitespace-nowrap bg-[var(--color-text)] text-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider z-50">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Right side: Button, Icons & Profile */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                        <DialogTrigger asChild>
                            <button aria-label="Create post" className="hidden md:flex w-11 h-11 items-center justify-center relative overflow-hidden group border-2 border-[var(--color-text)] bg-[var(--color-bg)] hover-lift shrink-0">
                                <span className="relative z-10 font-syne font-bold uppercase tracking-widest text-sm text-[var(--color-text)] group-hover:text-white transition-colors duration-300">
                                    <Plus size={20} />
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
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t-2 border-[var(--color-text)] border-dashed">
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
                                        <span className="absolute top-1 right-1 min-w-5 h-5 px-1 border-2 border-[var(--color-text)] bg-[var(--color-accent-red)] text-white text-[8px] font-bold flex items-center justify-center">
                                            {item.badge > 9 ? '9+' : item.badge}
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
