import React from 'react';
import { Heart, UserPlus, MessageSquare, HeartHandshake, Bell, ArrowRight } from 'lucide-react';

import { useNotifications } from '@/context/NotificationContext';

export function NotificationsList({ isSheet = false }: { isSheet?: boolean }) {
    const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
    const [activeFilter, setActiveFilter] = React.useState('All');
    const filters = ['All', 'Unread', 'Mentions', 'Likes', 'Follows', 'System'];

    const handleMarkAllRead = () => {
        markAllAsRead();
    };

    const filteredNotifications = notifications.filter(notif => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Unread') return !notif.read;
        if (activeFilter === 'Mentions') return notif.type === 'comment';
        if (activeFilter === 'Likes') return notif.type === 'like' || notif.type === 'support';
        if (activeFilter === 'Follows') return notif.type === 'follow';
        if (activeFilter === 'System') return notif.type === 'system';
        return true;
    });

    // Simple grouping for now: Unread vs Read, or Today (first 5) vs Older
    const today = filteredNotifications.filter(n => !n.read || filteredNotifications.indexOf(n) < 5);
    const yesterday = filteredNotifications.filter(n => n.read && filteredNotifications.indexOf(n) >= 5);

    return (
        <div className={isSheet ? "w-full pb-20" : "w-full max-w-4xl mx-auto pt-8 pb-20 px-6"}>
            {/* Sheet Header Actions */}
            {isSheet && (
                <div className="mb-6 flex justify-between items-center px-1">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text)]">Recent Activity</h2>
                    <button
                        onClick={handleMarkAllRead}
                        className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-accent)] hover:text-[var(--color-text)] transition-colors"
                    >
                        Mark all as read
                    </button>
                </div>
            )}

            {!isSheet && (
                <header className="flex justify-between items-end mb-8 border-b border-[var(--color-surface)] pb-8">
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter text-[var(--color-text)] uppercase leading-[0.8] mb-2">
                            Inbox
                        </h1>
                        <p className="text-sm font-mono text-[var(--color-text)] opacity-60 uppercase tracking-widest pl-1">
                            System Notifications
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleMarkAllRead}
                            className="px-4 py-2 border border-[var(--color-surface)] hover:border-[var(--color-text)] text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                            <Bell size={12} /> Mark all Read
                        </button>
                        <button className="px-4 py-2 bg-[var(--color-text)] text-white hover:bg-[var(--color-accent)] text-[10px] font-bold uppercase tracking-widest transition-colors">
                            Settings
                        </button>
                    </div>
                </header>
            )}

            {/* Filters */}
            <div className={`flex gap-4 mb-8 overflow-x-auto pb-2 border-b border-[var(--color-surface)] pl-1 no-scrollbar ${isSheet ? 'mx-0' : ''}`}>
                {filters.map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`text-xs font-bold uppercase tracking-widest pb-4 border-b-2 transition-colors whitespace-nowrap ${activeFilter === filter
                            ? 'border-[var(--color-accent)] text-[var(--color-text)]'
                            : 'border-transparent text-gray-400 hover:text-[var(--color-text)]'
                            }`}
                    >
                        {filter} {filter === 'Unread' && unreadCount > 0 && <span className="bg-[var(--color-accent)] text-white px-1.5 py-0.5 rounded-lg text-[8px] ml-1">{unreadCount}</span>}
                    </button>
                ))}
            </div>

            <div className="space-y-8">
                {filteredNotifications.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p className="uppercase tracking-widest text-xs">No notifications found</p>
                    </div>
                )}

                {/* Today Group */}
                {today.length > 0 && (
                    <section>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 pl-1">Today</h3>
                        <div className="space-y-0 border-t border-[var(--color-surface)]">
                            {today.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => markAsRead(notif.id)}
                                    className={`flex items-start gap-4 p-4 border-b border-[var(--color-surface)] transition-all group hover:bg-gray-50 cursor-pointer relative ${!notif.read ? 'bg-blue-50/30' : ''
                                        }`}
                                >
                                    {!notif.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-accent)]" />
                                    )}

                                    {/* Icon Badge */}
                                    <div className={`w-8 h-8 flex items-center justify-center shrink-0 border border-[var(--color-text)] transition-transform group-hover:scale-110 shadow-sm ${notif.type === 'like' ? 'bg-rose-50 text-[var(--color-text)]' :
                                        notif.type === 'follow' ? 'bg-blue-50 text-[var(--color-text)]' :
                                            notif.type === 'support' ? 'bg-green-50 text-[var(--color-text)]' :
                                                'bg-purple-50 text-[var(--color-text)]'
                                        }`}>
                                        {notif.type === 'like' && <Heart size={14} strokeWidth={2.5} />}
                                        {notif.type === 'follow' && <UserPlus size={14} strokeWidth={2.5} />}
                                        {notif.type === 'connection_accepted' && <UserPlus size={14} strokeWidth={2.5} />}
                                        {notif.type === 'comment' && <MessageSquare size={14} strokeWidth={2.5} />}
                                        {notif.type === 'support' && <HeartHandshake size={14} strokeWidth={2.5} />}
                                        {notif.type === 'system' && <Bell size={14} strokeWidth={2.5} />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pt-0.5">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-[10px] uppercase tracking-widest text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                                                {notif.type}
                                            </span>
                                            <span className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-wider">{notif.time}</span>
                                        </div>

                                        <p className="text-xs text-[var(--color-text)] font-medium leading-relaxed line-clamp-2">
                                            {notif.user && <span className="font-bold border-b border-transparent group-hover:border-[var(--color-text)] transition-colors mr-1">{notif.user}</span>}
                                            {notif.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Yesterday Group */}
                {yesterday.length > 0 && (
                    <section>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 pl-1">Yesterday</h3>
                        <div className="space-y-0 border-t border-[var(--color-surface)]">
                            {yesterday.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => markAsRead(notif.id)}
                                    className={`flex items-start gap-4 p-4 border-b border-[var(--color-surface)] transition-all group hover:bg-gray-50 cursor-pointer relative ${!notif.read ? 'bg-blue-50/30' : ''
                                        }`}
                                >
                                    {/* Icon Badge */}
                                    <div className={`w-8 h-8 flex items-center justify-center shrink-0 border border-[var(--color-text)] transition-transform group-hover:scale-110 shadow-sm bg-gray-50 text-gray-400 group-hover:text-[var(--color-text)]`}>
                                        {notif.type === 'comment' && <MessageSquare size={14} strokeWidth={2.5} />}
                                        {notif.type === 'support' && <HeartHandshake size={14} strokeWidth={2.5} />}
                                        {notif.type === 'like' && <Heart size={14} strokeWidth={2.5} />}
                                        {notif.type === 'follow' && <UserPlus size={14} strokeWidth={2.5} />}
                                        {notif.type === 'connection_accepted' && <UserPlus size={14} strokeWidth={2.5} />}
                                        {notif.type === 'system' && <Bell size={14} strokeWidth={2.5} />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pt-0.5">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-[10px] uppercase tracking-widest text-gray-500 group-hover:text-[var(--color-accent)] transition-colors">
                                                {notif.type}
                                            </span>
                                            <span className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-wider">{notif.time}</span>
                                        </div>

                                        <p className="text-xs text-gray-500 font-medium leading-relaxed group-hover:text-[var(--color-text)] transition-colors line-clamp-2">
                                            {notif.user && <span className="font-bold border-b border-transparent group-hover:border-[var(--color-text)] transition-colors mr-1">{notif.user}</span>}
                                            {notif.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Sheet Footer Action */}
            {isSheet && (
                <div className="mt-8 text-center">
                    <button className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] hover:text-[var(--color-text)] transition-colors flex items-center justify-center gap-2 mx-auto">
                        View All Notifications <ArrowRight size={12} />
                    </button>
                </div>
            )}

            {!isSheet && (
                <div className="mt-12 text-center pb-12">
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">End of Notifications</p>
                </div>
            )}
        </div>
    );
}

export default function Notifications() {
    return <NotificationsList />;
}
