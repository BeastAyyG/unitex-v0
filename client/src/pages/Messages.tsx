import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { MessageSquare, Search, Send, Phone, Video, MoreVertical } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { subscribeToConversations, subscribeToMessages, sendMessage } from '@/lib/firestore';

function Messages() {
    const { currentUser } = useAuth();
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [conversations, setConversations] = useState<any[]>([]);
    const [currentMessages, setCurrentMessages] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        const unsub = subscribeToConversations(currentUser.uid, (convs) => {
            setConversations(convs);
            if (!activeChatId && convs.length > 0) {
                setActiveChatId(convs[0].id);
            }
        });
        return () => unsub();
    }, [currentUser, activeChatId]);

    useEffect(() => {
        if (!activeChatId) return;
        const unsub = subscribeToMessages(activeChatId, (msgs) => {
            setCurrentMessages(msgs);
        });
        return () => unsub();
    }, [activeChatId]);

    const activeChat = conversations.find(c => c.id === activeChatId) || null;

    const parseChatMetadata = (chat: any) => {
        if (!currentUser || !chat) return null;
        const otherUserId = chat.participants.find((id: string) => id !== currentUser.uid) || chat.participants[0];
        const otherUserMeta = chat.details ? chat.details[otherUserId] : null;

        const timeString = chat.lastMessageAt ? new Date(chat.lastMessageAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New';
        
        return {
            id: chat.id,
            user: otherUserMeta?.name || 'Unknown User',
            userId: otherUserId,
            initials: otherUserMeta?.initials || 'U',
            lastMessage: chat.lastMessage || 'Start a conversation...',
            time: timeString,
            unread: false,
            isGroup: chat.participants.length > 2,
            online: false // RTDB status could be wired here
        };
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeChatId || !currentUser) return;
        const text = newMessage.trim();
        setNewMessage('');
        try {
            await sendMessage(activeChatId, currentUser.uid, currentUser.displayName || 'Me', text);
        } catch (err) {
            console.error('Message failed to send', err);
        }
    };

    const displayConvs = conversations
        .map(parseChatMetadata)
        .filter(c => c !== null)
        .filter(c => !searchQuery || c.user.toLowerCase().includes(searchQuery.toLowerCase()));

    const activeChatMeta = parseChatMetadata(activeChat);

    return (
        <div className="pt-8 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex gap-6 px-6">
            {/* Thread List */}
            <div className="w-[340px] flex flex-col h-full border border-[var(--color-surface)] bg-white shadow-sm overflow-hidden rounded-lg">
                <div className="p-5 border-b border-[var(--color-surface)] bg-gray-50/50 rounded-lg">
                    <h1 className="text-xl font-bold tracking-tight mb-4 text-[var(--color-text)]">Messages</h1>
                    <div className="relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-accent)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-[var(--color-surface)] py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-[var(--color-accent)] transition-all"
                        />
                    </div>
                </div>

                <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--color-surface)]/50">
                    {displayConvs.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-400 font-bold uppercase tracking-widest mt-10">
                            No active chats
                        </div>
                    ) : (
                        displayConvs.map((chat: any) => (
                            <div
                                key={chat.id}
                                onClick={() => setActiveChatId(chat.id)}
                                className={cn(
                                    "group relative p-5 cursor-pointer transition-all duration-200",
                                    activeChatId === chat.id
                                        ? "bg-[var(--color-surface)]/30 border-r-2 border-[var(--color-accent)]"
                                        : "hover:bg-gray-50"
                                )}
                            >
                                <div className="flex gap-4 items-start">
                                    <NavLink 
                                        to={chat.isGroup ? "/communities" : `/profile/${chat.userId}`}
                                        className="shrink-0 group/avatar"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="w-12 h-12 bg-[var(--color-surface)] flex items-center justify-center font-bold text-xs text-[var(--color-text)] rounded-lg border border-[var(--color-surface)] group-hover/avatar:border-[var(--color-accent)] transition-all">
                                            {chat.initials}
                                        </div>
                                    </NavLink>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <NavLink 
                                                to={chat.isGroup ? "/communities" : `/profile/${chat.userId}`}
                                                className={cn(
                                                    "text-sm tracking-tight flex items-center gap-2 hover:text-[var(--color-accent)] transition-colors",
                                                    chat.unread ? "font-bold text-[var(--color-text)]" : "font-semibold text-gray-600"
                                                )}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {chat.user}
                                                {chat.online && <span className="w-1.5 h-1.5 bg-green-500 rounded-lg shrink-0" />}
                                            </NavLink>
                                            <span className="text-[10px] text-gray-400 font-mono">{chat.time}</span>
                                        </div>
                                        <p className={cn(
                                            "text-xs truncate leading-relaxed",
                                            chat.unread ? "text-[var(--color-text)] font-medium" : "text-gray-400"
                                        )}>
                                            {chat.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white border border-[var(--color-surface)] flex flex-col h-full relative shadow-sm overflow-hidden text-[var(--color-text)]">
                {activeChatMeta ? (
                    <>
                        <div className="h-16 border-b border-[var(--color-surface)] flex items-center justify-between px-6 bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <NavLink to={activeChatMeta.isGroup ? "/communities" : `/profile/${activeChatMeta.userId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                    <div className="w-10 h-10 bg-[var(--color-surface)] flex items-center justify-center font-bold text-xs text-[var(--color-text)] rounded-lg">
                                        {activeChatMeta.initials}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-base tracking-tight text-[var(--color-text)]">{activeChatMeta.user}</h2>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-lg",
                                                activeChatMeta.online ? "bg-green-500" : "bg-gray-300"
                                            )}></span>
                                            <span className="text-[10px] font-medium text-gray-400">
                                                {activeChatMeta.online ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                </NavLink>
                            </div>
                            <div className="flex items-center gap-4 text-gray-400">
                                <Phone size={18} className="hover:text-[var(--color-text)] cursor-pointer transition-colors" />
                                <Video size={18} className="hover:text-[var(--color-text)] cursor-pointer transition-colors" />
                                <div className="w-px h-4 bg-[var(--color-surface)]" />
                                <MoreVertical size={18} className="hover:text-[var(--color-text)] cursor-pointer transition-colors" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gray-50/30">
                            {currentMessages.length === 0 && (
                                <div className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest mt-10">
                                    Send a message to start chatting!
                                </div>
                            )}
                            {currentMessages.map(msg => {
                                const isMe = msg.uid === currentUser?.uid;
                                return (
                                <div key={msg.id} className={cn(
                                    "flex flex-col max-w-[70%]",
                                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                                )}>
                                    <div className={cn(
                                        "p-4 text-sm leading-relaxed transition-all rounded-lg",
                                        isMe
                                            ? "bg-[var(--color-text)] text-white shadow-sm"
                                            : "bg-white border border-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                                    )}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-2 font-mono uppercase tracking-wider">
                                        {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                    </span>
                                </div>
                            )})}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-[var(--color-surface)] shrink-0 rounded-lg">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-50 border border-[var(--color-surface)] p-3 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:bg-white transition-all text-[var(--color-text)] rounded-lg"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                    className="px-6 bg-[var(--color-text)] text-white hover:bg-[var(--color-accent)] disabled:opacity-50 transition-all flex items-center justify-center font-bold text-xs uppercase tracking-widest h-12 rounded-lg"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 h-full">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">Select a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Messages;
