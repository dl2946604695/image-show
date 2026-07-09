import { useEffect, useLayoutEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useLocation, useNavigation } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Gallery } from '@/pages/Gallery';
import { Upload } from '@/pages/Upload';
import { Login } from '@/pages/Login';
import { AgentChat } from '@/pages/AgentChat';
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

  return null;
}

function AppContent() {
  const location = useLocation();
  const isAgentPage = location.pathname === '/agent';
  
  return (
    <div className="min-h-screen bg-bg">
      {!isAgentPage && <Navigation />}
      <ScrollRestoreHandler />
      <Outlet />
    </div>
  );
}

function App() {
  const { initAuth, loading: authLoading } = useAuthStore();

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

  const router = createBrowserRouter([
    {
      element: <AppContent />,
      children: [
        { path: '/', element: <Gallery /> },
        { path: '/upload', element: <Upload /> },
        { path: '/login', element: <Login /> },
        { path: '/agent', element: <AgentChat /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;