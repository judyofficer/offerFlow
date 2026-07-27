import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  MessagesSquare,
  Settings,
  Workflow
} from 'lucide-react';
import styles from './Layout.module.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/resumes', label: 'Resumes', icon: FileText },
  { path: '/applications', label: 'Applications', icon: Briefcase },
  { path: '/interviews', label: 'Interviews', icon: MessagesSquare },
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
            Settings
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
