import React, { useMemo } from 'react';
import { useApplicationStore } from '../../../applications/store/useApplicationStore';
import { STATUS_CONFIG } from '../../../applications/types/application';
import { FunnelChart } from '../../components/FunnelChart';
import { UpcomingSchedule } from '../../components/UpcomingSchedule';
import { Briefcase, CheckCircle, Mail, Target } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { applications } = useApplicationStore();
  
  const stats = useMemo(() => {
    const totalApplied = applications.filter(a => a.status !== 'wishlist').length;
    const interviewing = applications.filter(a => ['oa', 'interview', 'hr'].includes(a.status)).length;
    const offers = applications.filter(a => a.status === 'offer').length;
    
    // Response rate: anything that is not just 'applied' or 'wishlist'
    const responses = applications.filter(a => ['oa', 'interview', 'hr', 'offer', 'rejected'].includes(a.status)).length;
    const responseRate = totalApplied > 0 ? Math.round((responses / totalApplied) * 100) : 0;

    return { totalApplied, interviewing, offers, responseRate };
  }, [applications]);

  const funnelData = useMemo(() => {
    const applied = applications.filter(a => a.status !== 'wishlist').length;
    const interview = applications.filter(a => ['oa', 'interview', 'hr', 'offer'].includes(a.status)).length;
    const offer = applications.filter(a => a.status === 'offer').length;

    return [
      { name: '投递 (Applied)', value: applied, fill: STATUS_CONFIG['applied'].color },
      { name: '笔/面试 (OA/Interview)', value: interview, fill: STATUS_CONFIG['interview'].color },
      { name: '录用 (Offer)', value: offer, fill: STATUS_CONFIG['offer'].color },
    ];
  }, [applications]);

  return (
    <div style={{ padding: '32px 48px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <h1 className="text-h1" style={{ marginBottom: '4px' }}>指挥中心</h1>
        <p style={{ color: 'var(--text-secondary)' }}>求职数据与关键日程总览。</p>
      </header>
      
      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        {[
          { label: '总投递', value: stats.totalApplied, icon: Mail, color: 'var(--primary)' },
          { label: '面试/流程中', value: stats.interviewing, icon: Target, color: '#f59e0b' },
          { label: '已拿 Offer', value: stats.offers, icon: CheckCircle, color: '#10b981' },
          { label: '整体回复率', value: `${stats.responseRate}%`, icon: Briefcase, color: '#8b5cf6' },
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>{stat.label}</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', color: stat.color }}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>
      
      {/* Middle Row: Charts & Sidebar */}
      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Left: Charts (Funnel) */}
        <div style={{ flex: 7, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ flex: 1, backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 className="text-h3" style={{ marginBottom: '24px' }}>投递转化漏斗</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <FunnelChart data={funnelData} />
            </div>
          </div>
        </div>

        {/* Right: Upcoming Schedule */}
        <div style={{ flex: 3 }}>
          <UpcomingSchedule />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
