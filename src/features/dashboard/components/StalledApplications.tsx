import React, { useMemo, useEffect, useState } from 'react';
import { useApplicationStore } from '../../applications/store/useApplicationStore';
import { useScheduleStore } from '../../schedule/store/useScheduleStore';
import { STALLED_DAYS, getApplicationActivity, getStalledDays } from '../../applications/utils/applicationActivity';
import { STATUS_CONFIG } from '../../applications/types/application';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StalledApplications: React.FC = () => {
  const { applications, updateApplication } = useApplicationStore();
  const navigate = useNavigate();
  const { events } = useScheduleStore();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const stalledList = useMemo(() => {
    return applications
      .filter(app => getApplicationActivity(app, events, now) === 'pool')
      .map(app => ({ ...app, daysStalled: getStalledDays(app, now) }))
      .sort((a, b) => b.daysStalled - a.daysStalled)
      .slice(0, 10);
  }, [applications, events, now]);

  const handleMarkRejected = (id: string) => {
    if (confirm('确认将该投递标记为已淘汰？')) {
      updateApplication(id, { status: 'rejected' });
    }
  };

  if (stalledList.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
        <Clock size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <p style={{ fontSize: '14px' }}>当前没有待跟进池记录</p>
        <p style={{ fontSize: '12px', marginTop: '4px' }}>{STALLED_DAYS} 天无进展且没有待办日程的岗位会自动收进池中。</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '100%', paddingRight: '4px' }}>
      {stalledList.map((app) => {
        const isSevere = app.daysStalled >= 14;
        const alertColor = isSevere ? 'var(--danger)' : 'var(--warning)';
        
        return (
          <div 
            key={app.id}
            style={{ 
              flexShrink: 0,
              minWidth: 0,
              overflowWrap: 'anywhere',
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
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <span>{app.jobTitle}</span>
                  <span>•</span>
                  <span style={{ 
                    color: alertColor,
                    fontWeight: 500
                  }}>
                    {app.pooledAt ? '手动收池 · ' : ''}{STATUS_CONFIG[app.status].label} · {app.daysStalled} 天无进展
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button 
                onClick={() => navigate('/applications?scope=pool')}
                style={{ fontSize: '12px', whiteSpace: 'nowrap', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                待跟进池
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
