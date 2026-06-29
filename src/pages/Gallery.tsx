import { useEffect, useState } from 'react';
import { PhotoGrid } from '@/components/PhotoGrid';
import { CategoryFilter } from '@/components/CategoryFilter';
import { usePhotoStore } from '@/store/photoStore';
import { getPhotos, getCategories } from '@/lib/api';
import { mockPhotos, mockCategories } from '@/lib/mockData';
import type { Photo, Category } from '@/types';

export function Gallery() {
  const { 
    photos, 
    categories,
    loading,
    setPhotos, 
    setCategories, 
    setLoading,
    getFilteredPhotos 
  } = usePhotoStore();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (hasLoaded && photos.length > 0) return;
      
      setLoading(true);

      try {
        const photosResult = await getPhotos();
        
        if (photosResult.success && photosResult.data.length > 0) {
          const formattedPhotos: Photo[] = photosResult.data.map((photo: any) => ({
            id: photo.id,
            title: photo.title,
            description: photo.description || '',
            url: photo.url,
            thumbnailUrl: photo.thumbnailUrl,
            category: photo.category,
            photographerId: photo.photographerId,
            photographerName: photo.photographerName,
            createdAt: photo.createdAt,
            likes: photo.likes || 0,
          }));
          setPhotos(formattedPhotos);
        } else {
          setPhotos(mockPhotos);
        }

        const categoriesResult = await getCategories();

        if (categoriesResult.success && categoriesResult.data.length > 0) {
          const formattedCategories: Category[] = categoriesResult.data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
          }));
          setCategories(formattedCategories);
        } else {
          setCategories(mockCategories);
        }
      } catch {
        setPhotos(mockPhotos);
        setCategories(mockCategories);
      }

      setLoading(false);
      setHasLoaded(true);
    };

    fetchPhotos();
  }, [setPhotos, setCategories, setLoading, hasLoaded, photos.length]);

  const filteredPhotos = getFilteredPhotos();

  return (
    <div className="min-h-screen bg-bg">
      <section className="hero-section">
        <div className="container-60">
          <p className="text-text-tertiary text-xs uppercase tracking-[0.3em] mb-6 fade-in">
            Photography Gallery
          </p>
          <h1 className="hero-title mb-6 fade-in stagger-1">
            光影之间，
            <br />
            定格美好
          </h1>
          <p className="hero-subtitle fade-in stagger-2">
            探索来自世界各地摄影师的精彩作品，<br />
            用镜头记录下那些令人难忘的瞬间。
          </p>
          
          <div className="hero-stats fade-in stagger-3">
            <div className="text-center">
              <span className="hero-stat-number">{filteredPhotos.length}</span>
              <div className="hero-stat-label">张照片</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <span className="hero-stat-number">{categories.length}</span>
              <div className="hero-stat-label">个分类</div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-60">
          <div className="mb-8">
            <CategoryFilter />
          </div>
          <PhotoGrid photos={filteredPhotos} loading={loading} />
        </div>
      </section>
    </div>
  );
}