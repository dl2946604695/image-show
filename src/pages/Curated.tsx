import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Camera, Heart, MessageCircle, PenTool, Users } from 'lucide-react';
import { getPosts } from '@/lib/api';
import type { Post, PostType } from '@/types';

const TABS: { key: PostType | 'all'; label: string; icon: typeof BookOpen }[] = [
  { key: 'all', label: '全部', icon: BookOpen },
  { key: 'share', label: '作品分享', icon: Camera },
  { key: 'gear', label: '器材推荐', icon: PenTool },
  { key: 'talk', label: '交流讨论', icon: Users },
  { key: 'tutorial', label: '摄影教程', icon: BookOpen },
];

const TYPE_LABEL: Record<PostType, string> = {
  share: '作品分享',
  gear: '器材推荐',
  talk: '交流讨论',
  tutorial: '摄影教程',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function Curated() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<PostType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const type = activeTab === 'all' ? undefined : activeTab;
      const res = await getPosts(type);
      if (cancelled) return;
      if (res.success && Array.isArray(res.data)) {
        setPosts(res.data as Post[]);
      } else {
        setPosts([]);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-bg">
      <section className="curated-hero">
        <div className="container-60">
          <p className="curated-eyebrow">Curated Community</p>
          <h1 className="curated-title">精选社区</h1>
          <p className="curated-subtitle">
            摄影作品分享、器材推荐、交流讨论与教程，遇见志同道合的摄影人。
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-60">
          <div className="curated-tabs">
            {TABS.map((tab) => {
  const Icon = tab.icon;
  return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`curated-tab ${activeTab === tab.key ? 'curated-tab-active' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="curated-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="curated-card curated-card-skeleton" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="curated-empty">
              <BookOpen className="h-8 w-8" />
              <h3>暂无内容</h3>
              <p>这个分类下还没有帖子，换个分类看看吧。</p>
            </div>
          ) : (
            <div className="curated-grid">
              {posts.map((post) => (
                <article key={post.id} className="curated-card">
                  <div className="curated-card-cover-wrap">
                    <img src={post.cover} alt={post.title} className="curated-card-cover" loading="lazy" />
                    <span className="curated-card-type-tag">{TYPE_LABEL[post.type]}</span>
                  </div>
                  <div className="curated-card-body">
                    <h3 className="curated-card-title">{post.title}</h3>
                    <p className="curated-card-summary">{post.summary}</p>

                    <button
                      onClick={() => navigate(`/profile/${post.authorId}`)}
                      className="curated-card-author"
                    >
                      <span className="curated-card-author-avatar">
                        <Users className="h-3.5 w-3.5" />
                      </span>
                      <span className="curated-card-author-name">{post.authorName}</span>
                      <span className="curated-card-date">{formatDate(post.createdAt)}</span>
                    </button>

                    <div className="curated-card-stats">
                      <span className="curated-card-stat">
                        <Heart className="h-3.5 w-3.5" />
                        {post.likes}
                      </span>
                      <span className="curated-card-stat">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {post.replies}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
