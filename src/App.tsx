import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useLocation, useNavigation } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Gallery } from '@/pages/Gallery';
import { Upload } from '@/pages/Upload';
import { Login } from '@/pages/Login';
import { AgentChat } from '@/pages/AgentChat';
import { Profile } from '@/pages/Profile';
import { Curated } from '@/pages/Curated';
import { Admin } from '@/pages/Admin';
import { useAuthStore } from '@/store/authStore';
import { usePhotoStore } from '@/store/photoStore';

function ScrollRestoreHandler() {
  const location = useLocation();
  const navigation = useNavigation();
  const { scrollY, setScrollY } = usePhotoStore();

  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname === '/' && navigation.state === 'idle') {
        setScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, setScrollY, navigation.state]);

  useEffect(() => {
    if (location.pathname === '/' && scrollY > 0 && navigation.state === 'idle') {
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    }
  }, [location.pathname, scrollY, navigation.state]);

  useEffect(() => {
    if (location.pathname !== '/') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return null;
}

function AppContent() {
  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      <ScrollRestoreHandler />
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <AppContent />,
    children: [
      { path: '/', element: <Gallery /> },
      { path: '/curated', element: <Curated /> },
      { path: '/upload', element: <Upload /> },
      { path: '/login', element: <Login /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/agent', element: <AgentChat /> },
          { path: '/profile', element: <Profile /> },
          { path: '/profile/:userId', element: <Profile /> },
          { path: '/admin', element: <Admin /> },
        ],
      },
    ],
  },
]);

function App() {
  const authLoading = useAuthStore((s) => s.loading);
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default App;
