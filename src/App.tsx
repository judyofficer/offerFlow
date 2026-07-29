import { Routes, Route } from 'react-router-dom';
import Layout from './core/components/Layout';
import Dashboard from './features/dashboard/pages/Dashboard';
import Resumes from './features/resumes/pages/Resumes';
import Applications from './features/applications/pages/Applications';
import JobBoard from './features/jobBoard/pages/JobBoard';
import Settings from './features/settings/pages/Settings';
import Schedule from './features/schedule/pages/Schedule';

import LandingPage from './features/landing/pages/LandingPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<Layout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="jobs" element={<JobBoard />} />
        <Route path="resumes" element={<Resumes />} />
        <Route path="applications" element={<Applications />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
