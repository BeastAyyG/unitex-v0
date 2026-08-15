import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { Toaster } from 'sonner';

const Home = lazy(() => import('./pages/Home'));
const Discover = lazy(() => import('./pages/Discover'));
const Communities = lazy(() => import('./pages/Communities'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const Events = lazy(() => import('./pages/Events'));
const Networking = lazy(() => import('./pages/Networking'));
const Resources = lazy(() => import('./pages/Resources'));
const Messages = lazy(() => import('./pages/Messages'));
const Vault = lazy(() => import('./pages/Vault'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const OtherProfile = lazy(() => import('@/pages/OtherProfile'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const EventDetail = lazy(() => import('@/pages/EventDetail'));
const DiscoverDetail = lazy(() => import('@/pages/DiscoverDetail'));
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('@/pages/Onboarding').then(({ Onboarding }) => ({ default: Onboarding })));

function RouteLoading() {
    return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
            <span className="font-syne text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-text)]">
                Loading sequence...
            </span>
        </div>
    );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    if (!currentUser) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function AppRoutes() {
    return (
        <Suspense fallback={<RouteLoading />}>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/u/:publicId" element={<PublicProfile />} />
            <Route path="/join/:publicId" element={<PublicProfile />} />
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
        </Suspense>
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
