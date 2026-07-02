import { useEffect, useLayoutEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useLocation, useNavigation } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Gallery } from '@/pages/Gallery';
import { PhotoDetail } from '@/pages/PhotoDetail';
import { Upload } from '@/pages/Upload';
import { Login } from '@/pages/Login';
import { useAuthStore } from '@/store/authStore';
import { usePhotoStore } from '@/store/photoStore';

function ScrollRestoreHandler() {
  const location = useLocation();
  const { scrollY, setScrollY } = usePhotoStore();

  useLayoutEffect(() => {
    if (location.pathname === '/' && scrollY > 0) {
      window.scrollTo(0, scrollY);
    }
  }, [location.pathname, scrollY]);

  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname === '/') {
        setScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, setScrollY]);

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
        { path: '/photo/:id', element: <PhotoDetail /> },
        { path: '/upload', element: <Upload /> },
        { path: '/login', element: <Login /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;