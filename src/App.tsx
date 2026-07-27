import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './core/components/Layout';
import Dashboard from './features/dashboard/pages/Dashboard';
import Resumes from './features/resumes/pages/Resumes';
import Applications from './features/applications/pages/Applications';
import Interviews from './features/interviews/pages/Interviews';
import Settings from './features/settings/pages/Settings';
import Schedule from './features/schedule/pages/Schedule';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="resumes" element={<Resumes />} />
        <Route path="applications" element={<Applications />} />
        <Route path="interviews" element={<Interviews />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
