import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, Loader } from 'lucide-react';
import { supabase } from '../../../../core/services/supabaseClient';
import { syncEngine } from '../../../../core/services/syncEngine';
import styles from './AuthPage.module.css';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const changed1 = await syncEngine.pullFromCloud(true);
        if (changed1) window.location.href = '/dashboard';
        else navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const changed2 = await syncEngine.pullFromCloud(true);
        if (changed2) window.location.href = '/dashboard';
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
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label>密码</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
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
