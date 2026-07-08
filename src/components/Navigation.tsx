import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, Camera, User, Plus, Image, Star, Users, LogOut, ChevronLeft, Bot } from 'lucide-react';
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
    { icon: Star, label: '精选', path: '/' },
    { icon: Users, label: '摄影师', path: '/' },
    { icon: Bot, label: '摄影老师', path: '/agent' },
  ];

  return (
    <>
      <nav className="nav-bar">
        <div className="nav-bar-inner">
          <div className="nav-logo" onClick={() => navigate('/')}>
            <div className="nav-logo-icon">
              <div className="nav-logo-icon-inner">
                <Camera className="w-5 h-5" />
              </div>
            </div>
            <span className="nav-logo-text">光影集</span>
          </div>

          <div className="hidden lg:flex nav-links">
            {navItems.map((item) => (
              <button 
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`nav-link ${location.pathname === item.path ? 'nav-link-active' : ''}`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <div className={`nav-search-wrapper ${searchFocused ? 'nav-search-wrapper-focused' : ''}`}>
              <Search className="nav-search-icon" />
              <input
                type="text"
                placeholder="搜索图片"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="nav-search-input"
              />
            </div>
            
            <div className="nav-actions">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => navigate('/upload')}
                    className="nav-action-btn nav-action-btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    <span>上传</span>
                  </button>
                  <button className="nav-avatar-btn" onClick={() => navigate('/')}>
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="头像" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center rounded-lg bg-bg-tertiary">
                        <User className="w-4 h-4 text-text-secondary" />
                      </div>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="nav-action-btn nav-action-btn-secondary"
                >
                  <User className="w-4 h-4" />
                  <span>登录</span>
                </button>
              )}
            </div>
          </div>

          <button
            className="lg:hidden nav-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="打开菜单"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <>
          <div 
            className="nav-drawer-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="nav-drawer">
            <div className="nav-drawer-content">
              <div className="nav-drawer-header">
                <button 
                  className="nav-drawer-back-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ChevronLeft className="w-5 h-5" />
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="nav-search-input"
                  />
                </div>
              </div>
              
              <div className="nav-drawer-links">
                {navItems.map((item) => (
                  <button 
                    key={item.label}
                    onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                    className={`nav-drawer-link ${location.pathname === item.path ? 'nav-drawer-link-active' : ''}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              
              {isAuthenticated ? (
                <div className="nav-drawer-user-section">
                  <div className="nav-drawer-user-info">
                    <div className="nav-drawer-user-avatar">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="头像" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center rounded-xl bg-bg-tertiary">
                          <User className="w-5 h-5 text-text-secondary" />
                        </div>
                      )}
                    </div>
                    <div className="nav-drawer-user-details">
                      <div className="nav-drawer-user-name">{user?.name || '用户'}</div>
                      <div className="nav-drawer-user-email">{user?.email}</div>
                    </div>
                  </div>
                  
                  <div className="nav-drawer-user-actions">
                    <button
                      onClick={() => { navigate('/upload'); setMobileMenuOpen(false); }}
                      className="nav-drawer-action-btn"
                    >
                      <Plus className="w-5 h-5" />
                      <span>上传作品</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="nav-drawer-action-btn nav-drawer-action-btn-danger"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>退出登录</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="nav-drawer-auth">
                  <button
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                    className="nav-action-btn nav-action-btn-primary w-full justify-center"
                  >
                    <User className="w-4 h-4" />
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