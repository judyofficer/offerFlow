import React, { useMemo } from 'react';
import { useApplicationStore } from '../../applications/store/useApplicationStore';
import { STATUS_CONFIG } from '../../applications/types/application';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StalledApplications: React.FC = () => {
  const { applications, updateApplication } = useApplicationStore();
  const navigate = useNavigate();

  const stalledList = useMemo(() => {
    const now = Date.now();
    const activeApps = applications.filter(a => !['wishlist', 'offer', 'rejected'].includes(a.status));
    
    const withDays = activeApps.map(app => {
      const daysStalled = Math.floor((now - app.updatedAt) / (1000 * 60 * 60 * 24));
      return { ...app, daysStalled };
    });

    // Only show applications stalled for 7 days or more
    return withDays
      .filter(app => app.daysStalled >= 7)
      .sort((a, b) => b.daysStalled - a.daysStalled) // Most stalled first
      .slice(0, 10); // Show top 10 max
  }, [applications]);

  const handleMarkRejected = (id: string) => {
    if (confirm('确认将该投递标记为已淘汰？')) {
      updateApplication(id, { status: 'rejected' });
    }
  };

  if (stalledList.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
        <Clock size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <p style={{ fontSize: '14px' }}>当前没有停滞超过 7 天的记录</p>
        <p style={{ fontSize: '12px', marginTop: '4px' }}>太棒了，流程都在顺利推进中！</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      {stalledList.map((app) => {
        const isSevere = app.daysStalled >= 14;
        const alertColor = isSevere ? 'var(--danger)' : 'var(--warning)';
        
        return (
          <div 
            key={app.id}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-secondary)',
              border: `1px solid ${isSevere ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              borderLeft: `4px solid ${alertColor}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: alertColor }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {app.companyName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span>{app.jobTitle}</span>
                  <span>•</span>
                  <span style={{ 
                    color: alertColor,
                    fontWeight: 500
                  }}>
                    卡在 "{STATUS_CONFIG[app.status].label}" 已 {app.daysStalled} 天
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => navigate('/applications')}
                style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                查看
              </button>
              <button 
                onClick={() => handleMarkRejected(app.id)}
                title="标记为被拒/养鱼结束"
                style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid transparent', backgroundColor: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center' }}
              >
                <XCircle size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
