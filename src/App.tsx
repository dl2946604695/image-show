import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, ScrollRestoration } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Gallery } from '@/pages/Gallery';
import { PhotoDetail } from '@/pages/PhotoDetail';
import { Upload } from '@/pages/Upload';
import { Login } from '@/pages/Login';
import { useAuthStore } from '@/store/authStore';

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

  return (
    <Router>
      <div className="min-h-screen bg-bg">
        <Navigation />
        <ScrollRestoration />
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/photo/:id" element={<PhotoDetail />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;