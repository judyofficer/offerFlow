import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  MessagesSquare,
  Settings,
  Workflow,
  Calendar
} from 'lucide-react';
import styles from './Layout.module.css';

const navItems = [
  { path: '/dashboard', label: '数据看板', icon: LayoutDashboard },
  { path: '/resumes', label: '简历库', icon: FileText },
  { path: '/applications', label: '投递追踪', icon: Briefcase },
  { path: '/interviews', label: '面试记录', icon: MessagesSquare },
  { path: '/schedule', label: '日程管理', icon: Calendar },
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
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <nav className={styles.nav} style={{ flex: 0, marginTop: 'auto' }}>
          <NavLink
            to="/settings"
            className={({ isActive }) => 
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <Settings size={18} />
            系统设置
          </NavLink>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
