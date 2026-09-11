import React from 'react';
import type { Application } from '../types/application';
import { PRIORITY_CONFIG } from '../types/application';
import { MapPin, DollarSign, Clock, Flame, Target, ShieldCheck } from 'lucide-react';

interface Props {
  application: Application;
  onClick: () => void;
  isDragging?: boolean;
}

const renderPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'dream':
      return <Flame size={11} style={{ flexShrink: 0 }} />;
    case 'target':
      return <Target size={11} style={{ flexShrink: 0 }} />;
    case 'safety':
      return <ShieldCheck size={11} style={{ flexShrink: 0 }} />;
    default:
      return <Target size={11} style={{ flexShrink: 0 }} />;
  }
};

export const ApplicationCard: React.FC<Props> = ({ application, onClick, isDragging }) => {
  const priority = application.priority || 'target';
  const pConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.target;

  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-primary)',
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        cursor: isDragging ? 'grabbing' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '94px',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
        transform: isDragging ? 'rotate(2deg)' : 'none',
        gap: '6px',
      }}
      onMouseEnter={e => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={e => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
    >
      {/* 顶部行：公司名称 + 意向梯队标签 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span 
          style={{ 
            fontSize: '12.5px', 
            fontWeight: 500, 
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '170px',
          }}
          title={application.companyName || '未知公司'}
        >
          {application.companyName || '未知公司'}
        </span>
        <span
          style={{
            fontSize: '11px',
            padding: '2px 7px',
            borderRadius: '4px',
            backgroundColor: pConfig.bgColor,
            color: pConfig.color,
            border: `1px solid ${pConfig.borderColor}`,
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            letterSpacing: '0.2px',
          }}
          title={`意向梯队：${pConfig.label}`}
        >
          {renderPriorityIcon(priority)}
          <span>{pConfig.shortLabel}</span>
        </span>
      </div>

      {/* 中间行：加粗岗位名称 */}
      <div 
        style={{ 
          fontWeight: 600, 
          fontSize: '14px', 
          color: 'var(--text-primary)',
          lineHeight: '1.3',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
        title={application.jobTitle || '未命名岗位'}
      >
        {application.jobTitle || '未命名岗位'}
      </div>
      
      {/* 底部元信息行：地点/薪资 + 格式化时间 (严格单行对齐) */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontSize: '11px', 
          color: 'var(--text-tertiary)',
          marginTop: '2px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {application.location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }} title={`工作地点: ${application.location}`}>
              <MapPin size={11} style={{ flexShrink: 0 }} />
              <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{application.location}</span>
            </span>
          )}
          {application.salary && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }} title={`薪资范围: ${application.salary}`}>
              <DollarSign size={11} style={{ flexShrink: 0 }} />
              <span style={{ maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{application.salary}</span>
            </span>
          )}
        </div>
        
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0, marginLeft: 'auto' }}>
          <Clock size={11} />
          {new Date(application.updatedAt).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

