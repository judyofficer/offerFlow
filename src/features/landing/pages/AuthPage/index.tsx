import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, Loader, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../../../core/services/supabaseClient';
import { syncEngine } from '../../../../core/services/syncEngine';
import { useAuthStore } from '../../../../core/store/useAuthStore';
import styles from './AuthPage.module.css';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const changed1 = await syncEngine.pullFromCloud(true);
        if (changed1) window.location.href = '/';
        else navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const changed2 = await syncEngine.pullFromCloud(true);
        if (changed2) window.location.href = '/';
        else navigate('/dashboard');
      }
    } catch (err: any) {
      let errorMsg = err.message || '认证失败，请稍后再试';
      if (errorMsg.includes('Email not confirmed')) {
        errorMsg = '邮箱未验证。请前往邮箱查收验证邮件，或在 Supabase 后台 (Authentication -> Providers -> Email) 关闭 "Confirm email" 选项。';
      } else if (errorMsg.includes('Invalid login credentials')) {
        errorMsg = '邮箱或密码错误，请重试';
      } else if (errorMsg.includes('User already registered')) {
        errorMsg = '该邮箱已被注册，请直接登录';
      } else if (errorMsg.includes('Password should be at least')) {
        errorMsg = '密码长度不能少于 6 个字符';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !validateEmail(email)) {
      setError('请输入有效的邮箱地址，系统将发送重置密码邮件给您');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth',
      });
      if (error) throw error;
      setError('密码重置邮件已发送，请查收您的邮箱');
    } catch (err: any) {
      setError(err.message || '发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <Briefcase size={32} color="#8b5cf6" />
          <span>offerFlow</span>
        </div>
        
        <h2 className={styles.title}>{isLogin ? '欢迎回来' : '创建账号'}</h2>
        <p className={styles.subtitle}>
          {isLogin ? '登录以同步您的求职数据' : '开启云端求职之旅'}
        </p>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleAuth} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>邮箱</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="geek@example.com"
              disabled={loading}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>密码</label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={handleResetPassword}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                >
                  忘记密码？
                </button>
              )}
            </div>
            <div className={styles.passwordWrapper}>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                disabled={loading}
              />
              <button 
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader className={styles.spinner} size={20} /> : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div className={styles.switchMode}>
          <span className={styles.switchText}>
            {isLogin ? '还没有账号？' : '已有账号？'}
          </span>
          <button 
            type="button" 
            className={styles.switchBtn} 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? '立即注册' : '去登录'} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
