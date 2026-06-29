import { PhotoCard } from './PhotoCard';
import type { Photo } from '@/types';
import { ImageOff } from 'lucide-react';

interface PhotoGridProps {
  photos: Photo[];
  loading: boolean;
}

export function PhotoGrid({ photos, loading }: PhotoGridProps) {
  if (loading) {
    return (
      <div className="masonry-container">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="masonry-item skeleton"
            style={{ 
              height: Math.random() * 200 + 200,
              animationDelay: `${i * 100}ms`
            }}
          />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 bg-bg-secondary rounded-2xl flex items-center justify-center mb-5">
          <ImageOff className="w-8 h-8 text-text-tertiary" />
        </div>
        <h3 className="text-lg font-medium text-text-secondary mb-2">暂无照片</h3>
        <p className="text-sm text-text-tertiary">没有找到符合条件的照片</p>
      </div>
    );
  }

  return (
    <div className="masonry-container">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  );
}