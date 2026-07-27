import React from 'react';
import { useApplicationStore } from '../../../applications/store/useApplicationStore';
import { STATUS_CONFIG } from '../../../applications/types/application';
import type { ApplicationStatus } from '../../../applications/types/application';

const Dashboard: React.FC = () => {
  const { applications } = useApplicationStore();
  
  const getCount = (status: ApplicationStatus) => applications.filter(a => a.status === status).length;

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <h1 className="text-h1" style={{ marginBottom: '8px' }}>数据总览</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>全局求职数据追踪。</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>总投递数</div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{applications.length}</div>
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
        <h3 className="text-h3" style={{ marginBottom: '16px' }}>漏斗分析 (开发中)</h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
          图表可视化将在这里渲染...
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
