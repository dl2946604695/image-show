import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Bot, Images, LayoutDashboard, MessagesSquare, Trash2, Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  getAdminStats, getAdminUsers, deleteAdminUser,
  getAdminPhotos, deleteAdminPhoto,
  getAdminPosts, deleteAdminPost,
  getAdminChats, deleteAdminChat,
} from '@/lib/api';
import type { AdminStats, AdminUser, AdminChat, Photo, Post } from '@/types';

type Tab = 'dashboard' | 'users' | 'photos' | 'posts' | 'chats';

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { key: 'users', label: '用户管理', icon: Users },
  { key: 'photos', label: '照片管理', icon: Images },
  { key: 'posts', label: '帖子管理', icon: MessagesSquare },
  { key: 'chats', label: '对话管理', icon: Bot },
];

function formatDate(iso?: string) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

export function Admin() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuthStore();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const loadStats = useCallback(async () => {
    const r = await getAdminStats();
    if (r.success && r.data) setStats(r.data as AdminStats);
  }, []);

  const loadUsers = useCallback(async () => {
    const r = await getAdminUsers();
    if (r.success && r.data) setUsers(r.data as AdminUser[]);
  }, []);

  const loadPhotos = useCallback(async () => {
    const r = await getAdminPhotos();
    if (r.success && r.data) setPhotos(r.data as Photo[]);
  }, []);

  const loadPosts = useCallback(async () => {
    const r = await getAdminPosts();
    if (r.success && r.data) setPosts(r.data as Post[]);
  }, []);

  const loadChats = useCallback(async () => {
    const r = await getAdminChats();
    if (r.success && r.data) setChats(r.data as AdminChat[]);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    setLoadingData(true);
    const loaders: Record<Tab, () => Promise<void>> = {
      dashboard: async () => { await loadStats(); },
      users: async () => { await loadUsers(); },
      photos: async () => { await loadPhotos(); },
      posts: async () => { await loadPosts(); },
      chats: async () => { await loadChats(); },
    };
    loaders[tab]().finally(() => setLoadingData(false));
  }, [tab, isAuthenticated, loading, navigate, loadStats, loadUsers, loadPhotos, loadPosts, loadChats]);

  if (loading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="loading-spinner" /></div>;
  }
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text-tertiary">
        需要管理员权限
      </div>
    );
  }

  const handleDelete = async (type: Tab, id: string) => {
    if (!confirm('确认删除？此操作不可撤销。')) return;
    if (type === 'users') { await deleteAdminUser(id); await loadUsers(); }
    if (type === 'photos') { await deleteAdminPhoto(id); await loadPhotos(); }
    if (type === 'posts') { await deleteAdminPost(id); await loadPosts(); }
    if (type === 'chats') { await deleteAdminChat(id); await loadChats(); }
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <BarChart3 className="h-5 w-5" />
          <span>运营后台</span>
        </div>
        <nav className="admin-nav">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`admin-nav-item ${tab === t.key ? 'admin-nav-item-active' : ''}`}
              >
                <Icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="admin-main">
        {loadingData ? (
          <div className="admin-loading"><div className="loading-spinner" /></div>
        ) : tab === 'dashboard' ? (
          <DashboardView stats={stats} />
        ) : tab === 'users' ? (
          <UsersView users={users} onDelete={(id) => handleDelete('users', id)} />
        ) : tab === 'photos' ? (
          <PhotosView photos={photos} onDelete={(id) => handleDelete('photos', id)} />
        ) : tab === 'posts' ? (
          <PostsView posts={posts} onDelete={(id) => handleDelete('posts', id)} />
        ) : (
          <ChatsView chats={chats} onDelete={(id) => handleDelete('chats', id)} />
        )}
      </main>
    </div>
  );
}

function DashboardView({ stats }: { stats: AdminStats | null }) {
  if (!stats) return <div className="admin-empty">暂无数据</div>;
  const cards = [
    { label: '用户', value: stats.users, icon: Users },
    { label: '照片', value: stats.photos, icon: Images },
    { label: '帖子', value: stats.posts, icon: MessagesSquare },
    { label: '对话', value: stats.chats, icon: Bot },
    { label: '总点赞', value: stats.totalLikes, icon: BarChart3 },
  ];
  return (
    <div className="admin-section">
      <h2 className="admin-section-title">数据概览</h2>
      <div className="admin-stat-grid">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="admin-stat-card">
              <div className="admin-stat-icon"><Icon className="h-5 w-5" /></div>
              <div>
                <div className="admin-stat-value">{c.value}</div>
                <div className="admin-stat-label">{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="admin-subtitle">Top 摄影师</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>摄影师</th><th>作品数</th><th>总点赞</th></tr></thead>
          <tbody>
            {stats.topPhotographers.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.count}</td>
                <td>{p.likes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="admin-subtitle">近 7 天上传</h3>
      <div className="admin-bar-chart">
        {stats.uploadsByDay.map((d) => {
          const max = Math.max(1, ...stats.uploadsByDay.map((x) => x.count));
          return (
            <div key={d.date} className="admin-bar-col">
              <div className="admin-bar" style={{ height: `${(d.count / max) * 100}%` }} />
              <span className="admin-bar-label">{d.count}</span>
              <span className="admin-bar-date">{d.date.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UsersView({ users, onDelete }: { users: AdminUser[]; onDelete: (id: string) => void }) {
  return (
    <div className="admin-section">
      <h2 className="admin-section-title">用户管理 ({users.length})</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>姓名</th><th>邮箱</th><th>角色</th><th>作品数</th><th>注册时间</th><th>操作</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td className="admin-mono">{u.email}</td>
                <td><span className={`admin-tag ${u.role === 'admin' ? 'admin-tag-red' : ''}`}>{u.role === 'admin' ? '管理员' : '用户'}</span></td>
                <td>{u.photoCount}</td>
                <td>{formatDate(u.createdAt)}</td>
                <td>
                  {u.role !== 'admin' && (
                    <button className="admin-del-btn" onClick={() => onDelete(u.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PhotosView({ photos, onDelete }: { photos: Photo[]; onDelete: (id: string) => void }) {
  return (
    <div className="admin-section">
      <h2 className="admin-section-title">照片管理 ({photos.length})</h2>
      <div className="admin-photo-grid">
        {photos.map((p) => (
          <div key={p.id} className="admin-photo-card">
            <img src={p.thumbnailUrl} alt={p.title} loading="lazy" />
            <div className="admin-photo-info">
              <span className="admin-photo-title">{p.title}</span>
              <span className="admin-photo-meta">{p.photographerName} · {p.likes} 赞</span>
            </div>
            <button className="admin-del-btn" onClick={() => onDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostsView({ posts, onDelete }: { posts: Post[]; onDelete: (id: string) => void }) {
  const typeLabel: Record<string, string> = { share: '分享', gear: '器材', talk: '交流', tutorial: '教程' };
  return (
    <div className="admin-section">
      <h2 className="admin-section-title">帖子管理 ({posts.length})</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>标题</th><th>类型</th><th>作者</th><th>点赞</th><th>回复</th><th>时间</th><th>操作</th></tr></thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="admin-cell-title">{p.title}</td>
                <td><span className="admin-tag">{typeLabel[p.type] || p.type}</span></td>
                <td>{p.authorName}</td>
                <td>{p.likes}</td>
                <td>{p.replies}</td>
                <td>{formatDate(p.createdAt)}</td>
                <td><button className="admin-del-btn" onClick={() => onDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChatsView({ chats, onDelete }: { chats: AdminChat[]; onDelete: (id: string) => void }) {
  return (
    <div className="admin-section">
      <h2 className="admin-section-title">对话管理 ({chats.length})</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>标题</th><th>用户ID</th><th>消息数</th><th>更新时间</th><th>操作</th></tr></thead>
          <tbody>
            {chats.map((c) => (
              <tr key={c.id}>
                <td className="admin-cell-title">{c.title}</td>
                <td className="admin-mono">{c.userId}</td>
                <td>{c.messageCount}</td>
                <td>{formatDate(c.updatedAt)}</td>
                <td><button className="admin-del-btn" onClick={() => onDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
