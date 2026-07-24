import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Camera, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAuthStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      const from = location.state?.from?.pathname || '/agent';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="login-card">
        <div className="login-card-header">
          <div className="login-logo">
            <Camera className="w-6 h-6" />
          </div>
          <h1 className="login-title">光影集</h1>
          <p className="login-subtitle">
            {isLogin ? '欢迎回来' : '创建账号'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <input
              type="text"
              placeholder="用户名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="login-input"
              required
            />
          )}

          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />

          <div className="login-password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="login-password-toggle"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
          >
            {loading ? (
              <div className="loading-spinner" />
            ) : (
              isLogin ? '登录' : '注册'
            )}
          </button>
        </form>

        <div className="login-divider">
          <span>或</span>
        </div>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="login-switch-btn"
        >
          {isLogin ? (
            <>
              还没有账号？
              <span className="login-switch-highlight">创建新账号</span>
            </>
          ) : (
            <>
              已有账号？
              <span className="login-switch-highlight">立即登录</span>
            </>
          )}
        </button>

        <p className="login-footer-text">
          {isLogin ? (
            '登录即表示您同意我们的服务条款和隐私政策'
          ) : (
            '注册即表示您同意我们的服务条款和隐私政策'
          )}
        </p>

        <button
        onClick={() => navigate(-1)}
        className="login-back-btn"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回</span>
      </button>
      </div>
    </div>
  );
}