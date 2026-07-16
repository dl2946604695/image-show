import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  Camera,
  ChevronLeft,
  Image,
  LogOut,
  Menu,
  Plus,
  Search,
  Star,
  User,
  Users,
} from 'lucide-react';
import { usePhotoStore } from '@/store/photoStore';
import { useAuthStore } from '@/store/authStore';

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSearchQuery, searchQuery } = usePhotoStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navItems = [
    { icon: Image, label: '探索', path: '/' },
    { icon: Star, label: '精选', path: '/', pending: true },
    { icon: Users, label: '摄影师', path: '/', pending: true },
    { icon: Bot, label: '摄影老师', path: '/agent' },
  ];
  const isAgentPage = location.pathname === '/agent';

  const go = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="nav-bar">
        <div className={`nav-bar-inner ${isAgentPage ? 'nav-bar-inner-agent' : ''}`}>
          <div className="nav-logo" onClick={() => go('/')}>
            <div className="nav-logo-icon">
              <div className="nav-logo-icon-inner">
                <Camera className="h-5 w-5" />
              </div>
            </div>
            <span className="nav-logo-text">光影集</span>
          </div>

          <div className="hidden lg:flex nav-links">
            {navItems.map((item) => {
              const active =
                item.path === '/agent'
                  ? location.pathname === '/agent'
                  : location.pathname === '/' && item.label === '探索';

              return (
                <button
                  key={item.label}
                  onClick={() => go(item.path)}
                  className={`nav-link ${active ? 'nav-link-active' : ''}`}
                  title={item.pending ? '即将上线' : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <button className="nav-menu-btn" onClick={() => setMobileMenuOpen(true)} aria-label="打开菜单">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <>
          <div className="nav-drawer-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="nav-drawer">
            <div className="nav-drawer-content">
              <div className="nav-drawer-header">
                <button className="nav-drawer-back-btn" onClick={() => setMobileMenuOpen(false)} aria-label="关闭菜单">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="nav-drawer-title">菜单</span>
              </div>

              <div className="nav-drawer-search">
                <div className={`nav-search-wrapper ${searchFocused ? 'nav-search-wrapper-focused' : ''}`}>
                  <Search className="nav-search-icon" />
                  <input
                    type="text"
                    placeholder="搜索图片"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="nav-search-input"
                  />
                </div>
              </div>

              <div className="nav-drawer-links">
                {navItems.map((item) => {
                  const active =
                    item.path === '/agent'
                      ? location.pathname === '/agent'
                      : location.pathname === '/' && item.label === '探索';

                  return (
                    <button
                      key={item.label}
                      onClick={() => go(item.path)}
                      className={`nav-drawer-link ${active ? 'nav-drawer-link-active' : ''}`}
                      title={item.pending ? '即将上线' : undefined}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {isAuthenticated ? (
                <div className="nav-drawer-user-section">
                  <div className="nav-drawer-user-info">
                    <div className="nav-drawer-user-avatar">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="头像" className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl bg-bg-tertiary">
                          <User className="h-5 w-5 text-text-secondary" />
                        </div>
                      )}
                    </div>
                    <div className="nav-drawer-user-details">
                      <div className="nav-drawer-user-name">{user?.name || '用户'}</div>
                      <div className="nav-drawer-user-email">{user?.email}</div>
                    </div>
                  </div>

                  <div className="nav-drawer-user-actions">
                    <button onClick={() => go('/upload')} className="nav-drawer-action-btn">
                      <Plus className="h-5 w-5" />
                      <span>上传作品</span>
                    </button>
                    <button onClick={handleLogout} className="nav-drawer-action-btn nav-drawer-action-btn-danger">
                      <LogOut className="h-5 w-5" />
                      <span>退出登录</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="nav-drawer-auth">
                  <button onClick={() => go('/login')} className="nav-action-btn nav-action-btn-primary w-full justify-center">
                    <User className="h-4 w-4" />
                    <span>登录 / 注册</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
