import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, Sparkles, ArrowRight, LayoutDashboard, Calendar } from 'lucide-react';
import { injectMockData } from '../../../../core/utils/mockDataInjector';
import styles from './LandingPage.module.css';

import { useAuthStore } from '../../../../core/store/useAuthStore';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const setGuestMode = useAuthStore((state) => state.setGuestMode);
  const user = useAuthStore((state) => state.user);

  const handleDemo = () => {
    // 注入全部虚构数据
    injectMockData();
    setGuestMode(true);
    // 跳转到 Dashboard
    navigate('/dashboard');
  };

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setGuestMode(false);
      navigate('/auth');
    }
  };

  return (
    <div className={styles.landingContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <Briefcase size={28} color="#8b5cf6" />
          offerFlow
        </div>
        <nav className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>产品功能</a>
          <a href="https://github.com/offerFlow/offerFlow" target="_blank" rel="noreferrer" className={styles.navLink}>GitHub</a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.heroBadge}>
          <Sparkles size={16} />
          <span>v1.0 现已上线，支持多端同步</span>
        </div>

        <h1 className={styles.heroTitle}>
          一站式求职管理工具<br />
          从简历到 Offer
        </h1>

        <p className={styles.heroSubtitle}>
          offerFlow 是一款开源的求职管理工具。提供多版本简历管理、看板式的投递状态追踪，以及清晰的数据漏斗分析。支持跨端自动同步，保护数据隐私。
        </p>

        <div className={styles.heroActions}>
          <button className={styles.primaryButton} onClick={handleDemo}>
            <Sparkles size={20} />
            一键体验 Demo
          </button>
          <button className={styles.secondaryButton} onClick={handleStart}>
            {user ? '进入工作台' : '从零开始使用'} <ArrowRight size={20} />
          </button>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <FileText size={24} />
          </div>
          <h3 className={styles.featureTitle}>多版本简历管理</h3>
          <p className={styles.featureDesc}>
            不再被混乱的文件命名困扰。使用系统化的版本管理，支持自动保存、撤销重做，可一键导出为标准 PDF。
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <LayoutDashboard size={24} />
          </div>
          <h3 className={styles.featureTitle}>求职进度追踪</h3>
          <p className={styles.featureDesc}>
            使用投递追踪看板直观地管理您的每一次投递状态。支持拖拽操作，自动生成清晰的可视化投递转化数据。
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Calendar size={24} />
          </div>
          <h3 className={styles.featureTitle}>面试日程记录</h3>
          <p className={styles.featureDesc}>
            提供集成的日历视图功能，方便统一记录笔试和面试时间，帮助您安排求职节奏，不遗漏任何重要行程。
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
