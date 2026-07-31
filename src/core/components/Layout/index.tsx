import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Settings,
  Workflow,
  Calendar,
  Bookmark
} from 'lucide-react';
import styles from './Layout.module.css';

const navItems = [
  { path: '/dashboard', label: '数据看板', icon: LayoutDashboard },
  { path: '/jobs', label: '招聘信息池', icon: Bookmark },
  { path: '/applications', label: '投递追踪', icon: Workflow },
  { path: '/schedule', label: '日程管理', icon: Calendar },
  { path: '/resumes', label: '简历管理', icon: FileText },
  { path: '/settings', label: '设置', icon: Settings },
];

const Layout: React.FC = () => {
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
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
