import { useState, useEffect, useCallback } from 'react';
import { Heart, X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPhoto, likePhoto } from '@/lib/api';
import { usePhotoStore } from '@/store/photoStore';
import type { Photo } from '@/types';

export function PhotoDetailModal() {
  const { selectedPhoto, photos, setPhotos, closeDetail, openDetail } = usePhotoStore();
  const [photo, setPhoto] = useState<Photo | null>(selectedPhoto || null);
  const [loading, setLoading] = useState(!selectedPhoto);
  const [liked, setLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setPhoto(selectedPhoto);
    setLoading(!selectedPhoto);
    setImageLoaded(false);
    setLiked(false);
  }, [selectedPhoto]);

  const photoIndex = photos.findIndex((p) => p.id === (photo?.id || ''));
  const prevPhoto = photoIndex > 0 ? photos[photoIndex - 1] : null;
  const nextPhoto = photoIndex < photos.length - 1 ? photos[photoIndex + 1] : null;

  const fetchPhoto = useCallback(async () => {
    if (!selectedPhoto) return;

    setLoading(true);
    setImageLoaded(false);

    const result = await getPhoto(selectedPhoto.id);

    if (result.success) {
      const formattedPhoto: Photo = {
        id: result.data.id,
        title: result.data.title,
        description: result.data.description || '',
        url: result.data.url,
        thumbnailUrl: result.data.thumbnailUrl,
        category: result.data.category,
        photographerId: result.data.photographerId,
        photographerName: result.data.photographerName,
        createdAt: result.data.createdAt,
        likes: result.data.likes || 0,
      };
      setPhoto(formattedPhoto);
    }

    setLoading(false);
  }, [selectedPhoto]);

  useEffect(() => {
    if (selectedPhoto && !loading) {
      const existingPhoto = photos.find((p) => p.id === selectedPhoto.id);
      if (existingPhoto) {
        setPhoto(existingPhoto);
        setLoading(false);
      } else {
        fetchPhoto();
      }
    }
  }, [selectedPhoto, photos, fetchPhoto, loading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDetail();
      } else if (e.key === 'ArrowLeft' && prevPhoto) {
        openDetail(prevPhoto);
      } else if (e.key === 'ArrowRight' && nextPhoto) {
        openDetail(nextPhoto);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDetail, openDetail, prevPhoto, nextPhoto]);

  const handleLike = async () => {
    if (!photo) return;

    const newLikes = liked ? photo.likes - 1 : photo.likes + 1;
    setLiked(!liked);

    if (!liked) {
      await likePhoto(photo.id);
    }

    setPhoto({ ...photo, likes: newLikes });
    setPhotos(photos.map((p) => (p.id === photo.id ? { ...p, likes: newLikes } : p)));
  };

  const handleDownload = () => {
    if (!photo) return;
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `${photo.title}.jpg`;
    link.click();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeDetail();
    }
  };

  if (!photo) {
    return null;
  }

  if (loading) {
    return (
      <div className="detail-modal-overlay" onClick={handleOverlayClick}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="detail-modal-overlay" onClick={handleOverlayClick}>
      <button
        onClick={closeDetail}
        className="detail-close-btn"
      >
        <X className="w-5 h-5" />
      </button>

      {prevPhoto && (
        <button
          onClick={() => openDetail(prevPhoto)}
          className="detail-nav-btn detail-nav-btn-prev"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {nextPhoto && (
        <button
          onClick={() => openDetail(nextPhoto)}
          className="detail-nav-btn detail-nav-btn-next"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <div className="detail-wrapper">
        <div className="detail-image-area">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
              <div className="loading-spinner" />
            </div>
          )}
          <img
            src={photo.url}
            alt={photo.title}
            className={`detail-image transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = photo.thumbnailUrl;
              setImageLoaded(true);
            }}
          />
          <div className="detail-image-footer">
            <span className="detail-image-info">{photo.category} · {photo.photographerName}</span>
          </div>
        </div>

        <div className="detail-info-panel">
          <div className="detail-panel-header">
            <span className="detail-panel-tag">{photo.category}</span>
          </div>

          <h2 className="detail-panel-title">{photo.title}</h2>

          <div className="detail-panel-photographer">
            <div className="detail-photographer-avatar">
              <span className="text-white text-sm font-medium">{photo.photographerName.charAt(0)}</span>
            </div>
            <div>
              <p className="detail-photographer-name">{photo.photographerName}</p>
              <p className="detail-photographer-location">{photo.category} · 摄影师</p>
            </div>
          </div>

          <p className="detail-panel-description">{photo.description}</p>

          <div className="detail-panel-tags">
            {photo.category.split('、').map((tag, idx) => (
              <span key={idx} className="detail-panel-tag-item">{tag}</span>
            ))}
          </div>

          <div className="detail-panel-actions">
            <button
              onClick={handleDownload}
              className="detail-panel-btn detail-panel-btn-primary"
            >
              <Download className="w-4 h-4" />
              <span>下载原图</span>
            </button>
            <button
              onClick={handleLike}
              className={`detail-panel-btn detail-panel-btn-secondary ${liked ? 'detail-panel-btn-liked' : ''}`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="detail-panel-footer">
            <span className="detail-panel-date">{new Date(photo.createdAt).toLocaleDateString('zh-CN')}</span>
            <span className="detail-panel-views">浏览量</span>
          </div>
        </div>
      </div>
    </div>
  );
}