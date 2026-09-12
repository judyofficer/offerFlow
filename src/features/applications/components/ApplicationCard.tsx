import React, { useState } from 'react';
import type { Application } from '../types/application';
import { PRIORITY_CONFIG } from '../types/application';
import { MapPin, DollarSign, Clock, Flame, Target, ShieldCheck, ExternalLink, Pencil } from 'lucide-react';
import { resolveApplicationUrl, openCareerUrl } from '../utils/careerUrlHelper';
import { useApplicationStore } from '../store/useApplicationStore';

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
  const { updateApplication } = useApplicationStore();
  const priority = application.priority || 'target';
  const pConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.target;
  const resolvedUrl = resolveApplicationUrl(application.companyName, application.url);
  const [isHovered, setIsHovered] = useState(false);

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resolvedUrl.url) {
      openCareerUrl(resolvedUrl.url);
    }
  };

  const handleQuickEditUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newUrl = prompt(`为【${application.companyName} - ${application.jobTitle}】设置进度查询链接：`, application.url || '');
    if (newUrl !== null) {
      updateApplication(application.id, { url: newUrl.trim() });
    }
  };

  return (
    <div 
      onClick={onClick}
      onMouseEnter={e => {
        setIsHovered(true);
        if (!isDragging) {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={e => {
        setIsHovered(false);
        if (!isDragging) {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
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
    >
      {/* 顶部行：公司名称 + 显眼的【进度 ↗】链接按钮 + 意向梯队标签 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1 }}>
          <span 
            style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={application.companyName || '未知公司'}
          >
            {application.companyName || '未知公司'}
          </span>
          
          {resolvedUrl.url ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleOpenUrl}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--primary, #3b82f6)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'var(--primary, #3b82f6)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.color = 'var(--primary, #3b82f6)';
                }}
                title="查看进度"
              >
                <span>进度</span>
                <ExternalLink size={10} />
              </button>

              {/* 快捷更换链接 */}
              {isHovered && (
                <button
                  type="button"
                  onClick={handleQuickEditUrl}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    borderRadius: '4px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                  title="修改进度查询链接"
                >
                  <Pencil size={11} />
                </button>
              )}
            </div>
          ) : (
            isHovered && (
              <button
                type="button"
                onClick={handleQuickEditUrl}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontSize: '10.5px',
                  color: 'var(--text-tertiary)',
                  background: 'none',
                  border: '1px dashed var(--border-color)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="设置进度查询链接"
              >
                <Pencil size={10} />
                <span>加进度</span>
              </button>
            )
          )}
        </div>

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
      
      {/* 底部元信息行：地点/薪资 + 更新时间 (严格等高对齐) */}
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
        
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0, marginLeft: 'auto' }} title={`最后更新: ${new Date(application.updatedAt).toLocaleString()}`}>
          <Clock size={11} />
          {new Date(application.updatedAt).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
