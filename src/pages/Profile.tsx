import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Heart, ImagePlus, Images, Trophy, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePhotoStore } from '@/store/photoStore';
import { getUserPhotos, getPhotographer, getTopPhotographers } from '@/lib/api';
import { PhotoCard } from '@/components/PhotoCard';
import { PhotoDetailModal } from '@/components/PhotoDetailModal';
import type { Photo, Photographer } from '@/types';

const PHOTO_FIELDS = (p: any): Photo => ({
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
});

export function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuthStore();
  const { showDetail } = usePhotoStore();

  const isSelf = !userId || (user?.id && userId === user.id);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [profileUser, setProfileUser] = useState<{ name: string; email: string; createdAt: string } | null>(null);
  const [topPhotographers, setTopPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setPhotos([]);
      setProfileUser(null);

      if (isSelf) {
        const [photosRes, topRes] = await Promise.all([getUserPhotos(), getTopPhotographers()]);
        if (cancelled) return;
        if (photosRes.success && Array.isArray(photosRes.data)) {
          setPhotos(photosRes.data.map(PHOTO_FIELDS));
        }
        if (topRes.success && Array.isArray(topRes.data)) {
          setTopPhotographers(topRes.data);
        }
        if (user) {
          setProfileUser({ name: user.name, email: user.email, createdAt: new Date().toISOString() });
        }
      } else if (userId) {
        const res = await getPhotographer(userId);
        if (cancelled) return;
        if (res.success && res.data) {
          setPhotos((res.data.photos || []).map(PHOTO_FIELDS));
          if (res.data.user) {
            setProfileUser(res.data.user);
          } else {
            // 摄影师信息缺失时用照片里的名字兜底
            const fallbackName = res.data.photos?.[0]?.photographerName || '摄影师';
            setProfileUser({ name: fallbackName, email: '', createdAt: res.data.photos?.[0]?.createdAt || new Date().toISOString() });
          }
        }
        setTopPhotographers([]);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, isSelf, user]);

  const stats = useMemo(() => {
    const totalLikes = photos.reduce((sum, p) => sum + (p.likes || 0), 0);
    const categories = new Set(photos.map((p) => p.category).filter(Boolean));
    return { count: photos.length, totalLikes, categoryCount: categories.size };
  }, [photos]);

  const joinDate = profileUser?.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const displayName = isSelf ? user?.name || '摄影师' : profileUser?.name || '摄影师';

  return (
    <div className="min-h-screen bg-bg">
      <section className="profile-cover">
        <div className="profile-cover-inner" />
      </section>

      <div className="container-60 profile-content">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.avatarUrl && isSelf ? (
              <img src={user.avatarUrl} alt={displayName} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-fallback">
                <UserIcon className="h-10 w-10" />
              </div>
            )}
          </div>

          <div className="profile-header-info">
            <h1 className="profile-name">{displayName}</h1>
            {isSelf && profileUser?.email && (
              <p className="profile-email">{profileUser.email}</p>
            )}
            {joinDate && (
              <p className="profile-joined">
                <Camera className="h-3.5 w-3.5" />
                <span>加入于 {joinDate}</span>
              </p>
            )}
          </div>

          {isSelf && (
            <button onClick={() => navigate('/upload')} className="profile-upload-btn">
              <ImagePlus className="h-4 w-4" />
              <span>上传作品</span>
            </button>
          )}
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

        {isSelf && topPhotographers.length > 0 && (
          <div className="profile-hall">
            <div className="profile-section-title">
              <Trophy className="h-4 w-4 profile-stat-icon" />
              <h2>名人堂</h2>
              <span className="profile-section-count">优秀摄影师</span>
            </div>
            <div className="profile-hall-grid">
              {topPhotographers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/profile/${p.id}`)}
                  className="profile-hall-card"
                >
                  {p.coverPhoto?.thumbnailUrl ? (
                    <img src={p.coverPhoto.thumbnailUrl} alt={p.name} className="profile-hall-cover" />
                  ) : (
                    <div className="profile-hall-cover profile-hall-cover-empty">
                      <UserIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="profile-hall-info">
                    <div className="profile-hall-name">{p.name}</div>
                    <div className="profile-hall-meta">
                      <span>{p.photoCount} 作品</span>
                      <span className="profile-hall-dot" />
                      <span>{p.totalLikes} 赞</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="profile-section-title">
          <h2>{isSelf ? '我的作品' : 'TA的作品'}</h2>
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
            <h3>{isSelf ? '还没有发布作品' : '该摄影师暂无作品'}</h3>
            <p>
              {isSelf
                ? '上传你的第一张摄影作品，与世界分享你眼中的光影。'
                : '这位摄影师还没有上传任何作品。'}
            </p>
            {isSelf && (
              <button onClick={() => navigate('/upload')} className="profile-empty-btn">
                <ImagePlus className="h-4 w-4" />
                <span>立即上传</span>
              </button>
            )}
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
