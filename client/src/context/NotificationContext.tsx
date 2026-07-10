import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/firestore';

interface Notification {
    id: string;
    type: 'like' | 'follow' | 'comment' | 'support' | 'system' | 'connection_accepted';
    user?: string;
    content: string;
    time: string;
    read: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAllAsRead: () => void;
    markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Separated as a named function declaration so Vite Fast Refresh works correctly
// (a file cannot export both a component and a hook as arrow functions)
export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!currentUser) {
            setNotifications([]);
            return;
        }

        const unsubscribe = subscribeToNotifications(currentUser.uid, (notifs) => {
            const formatted = notifs.map(n => ({
                id: n.id,
                type: n.type || 'system',
                user: n.senderName || 'System',
                content: n.text || n.content,
                time: n.createdAt
                    ? new Date(n.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now',
                read: n.read || false
            })) as Notification[];
            setNotifications(formatted);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllAsRead = async () => {
        if (!currentUser) return;
        await markAllNotificationsAsRead(currentUser.uid);
    };

    const markAsRead = async (id: string) => {
        await markNotificationAsRead(id);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, markAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
}
