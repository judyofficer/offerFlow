import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Workflow,
  Calendar,
  Bookmark,
  PanelLeftClose,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import styles from './Layout.module.css';

const navItems = [
  { path: '/dashboard', label: '数据看板', icon: LayoutDashboard },
  { path: '/jobs', label: '岗位收藏', icon: Bookmark },
  { path: '/applications', label: '投递追踪', icon: Workflow },
  { path: '/schedule', label: '日程管理', icon: Calendar },
  { path: '/resumes', label: '简历管理', icon: FileText },
  { path: '/settings', label: '设置', icon: Settings },
];

const Layout: React.FC = () => {
  const isGuest = useAuthStore((state) => state.isGuest);
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('offerflow_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('offerflow_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={styles.layoutContainer}>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          {isCollapsed ? (
            <button
              type="button"
              onClick={toggleCollapse}
              className={`${styles.collapseBtn} ${styles.collapsedLogoBtn}`}
              title="展开侧边栏 (⌘B)"
              aria-label="展开侧边栏"
            >
              <img src="/favicon.png" alt="offerFlow" className={styles.logoIcon} />
            </button>
          ) : (
            <>
              <div className={styles.logoGroup}>
                <img src="/favicon.png" alt="offerFlow" className={styles.logoIcon} />
                <span className={styles.logoText}>offerFlow</span>
              </div>
              <button
                type="button"
                onClick={toggleCollapse}
                className={styles.collapseBtn}
                title="收起侧边栏 (⌘B)"
                aria-label="收起侧边栏"
              >
                <PanelLeftClose size={18} />
              </button>
            </>
          )}
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''} ${item.path === '/settings' ? styles.settingsItem : ''}`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className={styles.mainContent}>
        {isGuest && (
          <div style={{ backgroundColor: 'var(--accent-color)', color: 'white', padding: '12px 24px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>您当前处于 <strong>Demo 体验模式</strong>。数据仅保存在本地，不会自动同步。清除浏览器缓存会导致数据丢失。</span>
            <button 
              onClick={() => {
                const setGuestMode = useAuthStore.getState().setGuestMode;
                setGuestMode(false);
                navigate('/auth');
              }}
              style={{ padding: '6px 12px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '16px' }}
            >
              登录并开启云同步
            </button>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
