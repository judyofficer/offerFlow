import React from 'react';
import { useApplicationStore } from '../../store/useApplicationStore';
import { STATUS_CONFIG } from '../../types/application';
import type { ApplicationStatus } from '../../types/application';

const Dashboard: React.FC = () => {
  const { applications } = useApplicationStore();
  
  const total = applications.length;
  
  const getCount = (status: ApplicationStatus) => applications.filter(a => a.status === status).length;

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="text-h1" style={{ marginBottom: '8px' }}>Overview</h1>
      <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Your job search at a glance.</p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '24px',
        marginBottom: '48px'
      }}>
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Total Applications</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{total}</div>
        </div>

        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          if (status === 'wishlist') return null;
          return (
            <div key={status} style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: config.color }}></span>
                {config.label}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{getCount(status as ApplicationStatus)}</div>
            </div>
          );
        })}
      </div>
      
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="text-h3" style={{ marginBottom: '16px' }}>Funnel (Coming soon)</h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
          Data visualization charts will be implemented here.
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
