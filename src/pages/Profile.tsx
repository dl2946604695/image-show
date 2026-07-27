import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Heart, ImagePlus, Images, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePhotoStore } from '@/store/photoStore';
import { getUserPhotos } from '@/lib/api';
import { PhotoCard } from '@/components/PhotoCard';
import { PhotoDetailModal } from '@/components/PhotoDetailModal';
import type { Photo } from '@/types';

export function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showDetail, openDetail } = usePhotoStore();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const result = await getUserPhotos();
      if (cancelled) return;
      if (result.success && Array.isArray(result.data)) {
        setPhotos(
          result.data.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description || '',
            url: p.url,
            thumbnailUrl: p.thumbnailUrl,
            category: p.category,
            photographerId: p.photographerId,
            photographerName: p.photographerName,
            createdAt: p.createdAt,
            likes: p.likes || 0,
          })),
        );
      } else {
        setPhotos([]);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const totalLikes = photos.reduce((sum, p) => sum + (p.likes || 0), 0);
    const categories = new Set(photos.map((p) => p.category).filter(Boolean));
    return { count: photos.length, totalLikes, categoryCount: categories.size };
  }, [photos]);

  const joinDate = user ? new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';

  return (
    <div className="min-h-screen bg-bg">
      <section className="profile-cover">
        <div className="profile-cover-inner" />
      </section>

      <div className="container-60 profile-content">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-fallback">
                <UserIcon className="h-10 w-10" />
              </div>
            )}
          </div>

          <div className="profile-header-info">
            <h1 className="profile-name">{user?.name || '摄影师'}</h1>
            <p className="profile-email">{user?.email}</p>
            {joinDate && (
              <p className="profile-joined">
                <Camera className="h-3.5 w-3.5" />
                <span>加入于 {joinDate}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => navigate('/upload')}
            className="profile-upload-btn"
          >
            <ImagePlus className="h-4 w-4" />
            <span>上传作品</span>
          </button>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <Images className="h-5 w-5 profile-stat-icon" />
            <div>
              <div className="profile-stat-number">{stats.count}</div>
              <div className="profile-stat-label">作品</div>
            </div>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <Heart className="h-5 w-5 profile-stat-icon" />
            <div>
              <div className="profile-stat-number">{stats.totalLikes}</div>
              <div className="profile-stat-label">总点赞</div>
            </div>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <Camera className="h-5 w-5 profile-stat-icon" />
            <div>
              <div className="profile-stat-number">{stats.categoryCount}</div>
              <div className="profile-stat-label">分类</div>
            </div>
          </div>
        </div>

        <div className="profile-section-title">
          <h2>我的作品</h2>
          <span className="profile-section-count">{stats.count} 张</span>
        </div>

        {loading ? (
          <div className="masonry-container">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="masonry-item skeleton"
                style={{ height: 240 + (i % 3) * 60, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="profile-empty">
            <div className="profile-empty-icon">
              <ImagePlus className="h-8 w-8" />
            </div>
            <h3>还没有发布作品</h3>
            <p>上传你的第一张摄影作品，与世界分享你眼中的光影。</p>
            <button onClick={() => navigate('/upload')} className="profile-empty-btn">
              <ImagePlus className="h-4 w-4" />
              <span>立即上传</span>
            </button>
          </div>
        ) : (
          <div className="masonry-container">
            {photos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        )}
      </div>

      {showDetail && <PhotoDetailModal />}
    </div>
  );
}
