import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Communities from './pages/Communities';
import CommunityPage from '@/pages/CommunityPage';
import Events from './pages/Events';
import Networking from './pages/Networking';
import Resources from './pages/Resources';
import Messages from './pages/Messages';
import Vault from './pages/Vault';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Dashboard from './pages/Dashboard';
import OtherProfile from '@/pages/OtherProfile';
import EventDetail from '@/pages/EventDetail';
import DiscoverDetail from '@/pages/DiscoverDetail';
import Login from './pages/Login';
import { Onboarding } from '@/pages/Onboarding';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    if (!currentUser) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Home />} />
                <Route path="discover" element={<Discover />} />
                <Route path="discover/:slug" element={<DiscoverDetail />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="communities" element={<Communities />} />
                <Route path="communities/:communityId" element={<CommunityPage />} />
                <Route path="events" element={<Events />} />
                <Route path="events/:eventId" element={<EventDetail />} />
                <Route path="networking" element={<Networking />} />
                <Route path="roadmaps" element={<Resources />} />
                <Route path="resources" element={<Resources />} />
                <Route path="messages" element={<Messages />} />
                <Route path="vault" element={<Vault />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/:userId" element={<OtherProfile />} />
                <Route path="settings" element={<Settings />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <Toaster position="top-center" expand={true} richColors />
                <AppRoutes />
            </NotificationProvider>
        </AuthProvider>
    );
}

export default App;
