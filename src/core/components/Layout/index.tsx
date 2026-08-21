import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Workflow,
  Calendar,
  Bookmark
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import styles from './Layout.module.css';

const navItems = [
  { path: '/dashboard', label: '数据看板', icon: LayoutDashboard },
  { path: '/jobs', label: '招聘信息', icon: Bookmark },
  { path: '/applications', label: '投递追踪', icon: Workflow },
  { path: '/schedule', label: '日程管理', icon: Calendar },
  { path: '/resumes', label: '简历管理', icon: FileText },
  { path: '/settings', label: '设置', icon: Settings },
];

const Layout: React.FC = () => {
  const isGuest = useAuthStore((state) => state.isGuest);
  const navigate = useNavigate();

  return (
    <div className={styles.layoutContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Workflow className={styles.logoIcon} size={24} strokeWidth={2.5} />
          <span className={styles.logoText}>offerFlow</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
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
