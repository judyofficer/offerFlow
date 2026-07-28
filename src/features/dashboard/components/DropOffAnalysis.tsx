import React, { useMemo } from 'react';
import { useApplicationStore } from '../../applications/store/useApplicationStore';

export const DropOffAnalysis: React.FC = () => {
  const { applications } = useApplicationStore();

  const metrics = useMemo(() => {
    // 基础定义
    const all = applications.filter(a => a.status !== 'wishlist');
    const total = all.length;
    
    // 我们用一个粗略的快照来反推漏斗 (由于没有完整的状态流转历史表)
    // 初筛通过：只要进入了 oa, interview, hr, offer 就算通过简历初筛
    const passedResume = all.filter(a => ['oa', 'interview', 'hr', 'offer'].includes(a.status)).length;
    
    // 进入面试：只要进入了 interview, hr, offer 就算拿到面试
    const passedOa = all.filter(a => ['interview', 'hr', 'offer'].includes(a.status)).length;
    
    // 拿到 Offer
    const gotOffer = all.filter(a => a.status === 'offer').length;

    return [
      { 
        label: '简历投递 (投递总数)', 
        count: total, 
        base: total, 
        rateLabel: '基准',
        color: 'var(--primary)'
      },
      { 
        label: '初筛/机试 (简历通过)', 
        count: passedResume, 
        base: total,
        rateLabel: total > 0 ? `${Math.round((passedResume / total) * 100)}% 简历通过率` : '0%',
        color: '#8b5cf6'
      },
      { 
        label: '业务/HR 面试 (邀约面试)', 
        count: passedOa, 
        base: passedResume,
        rateLabel: passedResume > 0 ? `${Math.round((passedOa / passedResume) * 100)}% 面试邀约率` : '0%',
        color: '#f59e0b'
      },
      { 
        label: '斩获 Offer (发放 Offer)', 
        count: gotOffer, 
        base: passedOa,
        rateLabel: passedOa > 0 ? `${Math.round((gotOffer / passedOa) * 100)}% Offer 转化率` : '0%',
        color: '#10b981'
      }
    ];
  }, [applications]);

  if (metrics[0].count === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
        暂无投递数据，无法进行存活率诊断
      </div>
    );
  }

  const maxCount = metrics[0].count;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', justifyContent: 'center' }}>
      {metrics.map((m, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.label}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {m.count} <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>({m.rateLabel})</span>
            </span>
          </div>
          <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '5px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${maxCount > 0 ? (m.count / maxCount) * 100 : 0}%`, 
                backgroundColor: m.color,
                borderRadius: '5px',
                transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
              }} 
            />
          </div>
          {/* Connector to next step (simulating a funnel drop-off) */}
          {idx < metrics.length - 1 && (
            <div style={{ paddingLeft: '12px', marginTop: '-4px', marginBottom: '-8px' }}>
              <div style={{ width: '2px', height: '16px', backgroundColor: 'var(--border-color)', opacity: 0.5 }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
