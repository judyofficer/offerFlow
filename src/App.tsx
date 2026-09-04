import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './core/components/Layout';
import AuthGuard from './core/components/AuthGuard';

// Route-level Code Splitting for performance
const Dashboard = React.lazy(() => import('./features/dashboard/pages/Dashboard'));
const Resumes = React.lazy(() => import('./features/resumes/pages/Resumes'));
const Applications = React.lazy(() => import('./features/applications/pages/Applications'));
const JobBoard = React.lazy(() => import('./features/jobBoard/pages/JobBoard'));
const Settings = React.lazy(() => import('./features/settings/pages/Settings'));
const Schedule = React.lazy(() => import('./features/schedule/pages/Schedule'));
const LandingPage = React.lazy(() => import('./features/landing/pages/LandingPage'));
const AuthPage = React.lazy(() => import('./features/landing/pages/AuthPage'));

const PageFallback: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', backgroundColor: 'var(--bg-primary)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div 
        style={{ 
          width: '28px', 
          height: '28px', 
          border: '3px solid var(--border-color)', 
          borderTopColor: 'var(--primary)', 
          borderRadius: '50%', 
          animation: 'spin 0.8s linear infinite' 
        }} 
      />
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>加载中...</span>
    </div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<AuthGuard />}>
          <Route element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="jobs" element={<JobBoard />} />
            <Route path="resumes" element={<Resumes />} />
            <Route path="applications" element={<Applications />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;

