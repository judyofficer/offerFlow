import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, Sparkles, ArrowRight, LayoutDashboard, Calendar } from 'lucide-react';
import { injectMockData } from '../../../../core/utils/mockDataInjector';
import styles from './LandingPage.module.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleDemo = () => {
    // 注入全部虚构数据
    injectMockData();
    // 跳转到 Dashboard
    navigate('/dashboard');
  };

  const handleStart = () => {
    // 不注入数据，直接跳转
    navigate('/dashboard');
  };

  return (
    <div className={styles.landingContainer}>
      {/* Animated Background */}
      <div className={`${styles.backgroundBlob} ${styles.blob1}`} />
      <div className={`${styles.backgroundBlob} ${styles.blob2}`} />

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
          <span>v1.0 全新架构上线，搭载纯前端极速引擎</span>
        </div>
        
        <h1 className={styles.heroTitle}>
          掌控你的求职之旅<br />
          从简历到 Offer
        </h1>
        
        <p className={styles.heroSubtitle}>
          offerFlow 是专为顶尖求职者设计的全生命周期求职工作台。拥有极客级的简历版本管理、拖拽式投递追踪，以及全景数据漏斗分析。完全离线化运行，保护您的隐私。
        </p>
        
        <div className={styles.heroActions}>
          <button className={styles.primaryButton} onClick={handleDemo}>
            <Sparkles size={20} />
            一键体验 Demo
          </button>
          <button className={styles.secondaryButton} onClick={handleStart}>
            从零开始使用 <ArrowRight size={20} />
          </button>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <FileText size={24} />
          </div>
          <h3 className={styles.featureTitle}>Git-like 简历控制</h3>
          <p className={styles.featureDesc}>
            抛弃混乱的 PDF 文件，使用类似 Git 的多版本管理系统。支持智能防抖保存、Ctrl+Z 撤销重做，一键导出高清 PDF。
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <LayoutDashboard size={24} />
          </div>
          <h3 className={styles.featureTitle}>全景 Kanban 追踪</h3>
          <p className={styles.featureDesc}>
            通过极致顺滑的拖拽 Kanban 追踪您的每一次投递状态。实时同步至数据大盘，自动生成漏斗转化图表。
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Calendar size={24} />
          </div>
          <h3 className={styles.featureTitle}>智能化日程管理</h3>
          <p className={styles.featureDesc}>
            集成的日历视图助您从容应对密集面试，不会错过任何一场笔试或 HR 对接，确保求职节奏井然有序。
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
