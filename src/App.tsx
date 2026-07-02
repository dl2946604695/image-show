import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, ScrollRestoration, Outlet } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Gallery } from '@/pages/Gallery';
import { PhotoDetail } from '@/pages/PhotoDetail';
import { Upload } from '@/pages/Upload';
import { Login } from '@/pages/Login';
import { useAuthStore } from '@/store/authStore';

function AppContent() {
  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      <ScrollRestoration />
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