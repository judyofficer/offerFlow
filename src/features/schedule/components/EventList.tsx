import React, { useState, useMemo } from 'react';
import { Plus, MapPin, Clock, FileText, ExternalLink, Copy, Check, Briefcase, Calendar, ChevronRight } from 'lucide-react';
import type { ScheduleEvent, EventType } from '../types/schedule';
import { EVENT_TYPE_CONFIG } from '../types/schedule';
import { useApplicationStore } from '../../applications/store/useApplicationStore';

interface Props {
  events: ScheduleEvent[];
  selectedDate: string;
  onAddEvent: () => void;
  onEditEvent: (id: string) => void;
}

const extractUrl = (text?: string): string | null => {
  if (!text) return null;
  const trimmed = text.trim();
  const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) return urlMatch[0];
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+(\/[^\s]*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
};

const getDayOfWeekCn = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[d.getDay()];
};

const getRelativeDaysText = (targetDateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === 2) return '后天';
  if (diffDays > 2) return `${diffDays}天后`;
  if (diffDays === -1) return '昨天';
  if (diffDays < -1) return `${Math.abs(diffDays)}天前`;
  return '';
};

const getLinkActionText = (type: EventType) => {
  if (type === 'oa') return '直达笔试/测评';
  if (type === 'interview') return '进入面试会议';
  if (type === 'deadline') return '前往投递/确认';
  return '打开日程链接';
};


export const EventList: React.FC<Props> = ({ events, selectedDate, onAddEvent, onEditEvent }) => {
  const { applications } = useApplicationStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const dayEvents = useMemo(() => {
    return events
      .filter(e => e.date === selectedDate)
      .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
  }, [events, selectedDate]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '00:00').localeCompare(b.time || '00:00'))
      .slice(0, 8);
  }, [events, todayStr]);

  const handleCopyLink = (eventId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2000);
  };


  const getApplicationLabel = (appId?: string) => {
    if (!appId) return null;
    const app = applications.find(a => a.id === appId);
    if (!app) return null;
    return `${app.companyName} · ${app.jobTitle}`;
  };

  return (
    <div style={{ 
      backgroundColor: 'var(--bg-primary)', 
      borderRadius: 'var(--radius-lg)', 
      padding: '24px', 
      border: '1px solid var(--border-color)', 
      boxShadow: 'var(--shadow-sm)',
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px',
      height: '100%',
      boxSizing: 'border-box'
    }}>
      {/* 顶部标题与新增按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>日程安排</h2>
            <span style={{ 
              fontSize: '12px', 
              padding: '3px 10px', 
              borderRadius: '12px', 
              backgroundColor: dayEvents.length > 0 ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)', 
              color: dayEvents.length > 0 ? 'var(--primary)' : 'var(--text-tertiary)',
              fontWeight: 600 
            }}>
              {dayEvents.length} 项日程
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Calendar size={14} color="var(--primary)" />
            <span>{selectedDate} ({getDayOfWeekCn(selectedDate)})</span>
            {selectedDate === todayStr && <strong style={{ color: 'var(--primary)', marginLeft: '4px' }}>今天</strong>}
          </p>
        </div>

        <button 
          type="button"
          onClick={onAddEvent}
          className="btn btn-primary"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '13.5px',
            padding: '7px 16px',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> 新增日程
        </button>
      </div>

      {/* 选中日期的日程列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {dayEvents.length > 0 ? (
          dayEvents.map(event => {
            const typeConfig = EVENT_TYPE_CONFIG[event.type];
            const url = extractUrl(event.location);
            const appLabel = getApplicationLabel(event.applicationId);

            return (
              <div 
                key={event.id}
                onClick={() => onEditEvent(event.id)}
                style={{
                  padding: '16px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `5px solid ${typeConfig.color}`,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* 标题与类型徽章 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '15.5px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {event.title}
                  </span>
                  <span style={{ 
                    fontSize: '11.5px', 
                    padding: '3px 10px', 
                    borderRadius: '12px', 
                    backgroundColor: typeConfig.bgColor, 
                    color: typeConfig.color,
                    border: `1px solid ${typeConfig.borderColor}`,
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    flexShrink: 0
                  }}>
                    {typeConfig.label}
                  </span>
                </div>

                {/* 关联岗位 */}
                {appLabel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Briefcase size={14} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{appLabel}</span>
                  </div>
                )}

                {/* 时间与地点 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {event.time && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Clock size={14} color="var(--primary)" /> {event.time}
                    </span>
                  )}
                  
                  {/* 非 URL 地点 (如物理地址/会议号) */}
                  {event.location && !url && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }} title={event.location}>
                      <MapPin size={14} color="var(--text-tertiary)" /> {event.location}
                    </span>
                  )}

                  {/* 备忘录标记 */}
                  {event.notes && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)' }} title={event.notes}>
                      <FileText size={14} /> 包含备注
                    </span>
                  )}
                </div>

                {/* 核心亮点：如果是笔试/面试链接，渲染醒目 1-Click 直达按钮与复制按钮 */}
                {url && (
                  <div 
                    onClick={e => e.stopPropagation()}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      marginTop: '4px',
                      paddingTop: '10px',
                      borderTop: '1px dashed var(--border-color)',
                      flexWrap: 'wrap'
                    }}
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(59, 130, 246, 0.12)',
                        color: 'var(--primary, #3b82f6)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'all 0.18s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = 'var(--primary, #3b82f6)';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
                        e.currentTarget.style.color = 'var(--primary, #3b82f6)';
                        e.currentTarget.style.transform = 'none';
                      }}
                      title={`在新标签页打开: ${url}`}
                    >
                      <ExternalLink size={14} />
                      <span>{getLinkActionText(event.type)} ↗</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(event.id, url)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-color)',
                        color: copiedId === event.id ? 'var(--success, #10b981)' : 'var(--text-secondary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title="复制链接"
                    >
                      {copiedId === event.id ? <Check size={13} color="var(--success, #10b981)" /> : <Copy size={13} />}
                      <span>{copiedId === event.id ? '已复制' : '复制链接'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ 
            padding: '24px 18px', 
            textAlign: 'center', 
            color: 'var(--text-tertiary)', 
            fontSize: '13.5px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '10px',
            border: '1px dashed var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>选中日期暂无日程安排</span>
            <button
              type="button"
              onClick={onAddEvent}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={14} /> 立即添加该日日程
            </button>
          </div>
        )}

        {/* 即将到来 (Upcoming Events) - 清晰醒目的卡片列表 */}
        {upcomingEvents.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 700, 
              color: 'var(--text-primary)', 
              marginBottom: '12px', 
              paddingBottom: '8px', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>近期日程 (Upcoming)</span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>共 {upcomingEvents.length} 项</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingEvents.map(event => {
                const typeConfig = EVENT_TYPE_CONFIG[event.type];
                const url = extractUrl(event.location);
                const relText = getRelativeDaysText(event.date);

                return (
                  <div 
                    key={event.id}
                    onClick={() => onEditEvent(event.id)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 14px', 
                      borderRadius: '8px', 
                      backgroundColor: 'var(--bg-secondary)', 
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)',
                      borderLeft: `4px solid ${typeConfig.color}`,
                      transition: 'all 0.15s ease',
                      gap: '12px'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.title}
                        </span>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '1px 7px', 
                          borderRadius: '10px', 
                          backgroundColor: typeConfig.bgColor, 
                          color: typeConfig.color,
                          border: `1px solid ${typeConfig.borderColor}`,
                          fontWeight: 600,
                          flexShrink: 0
                        }}>
                          {typeConfig.label}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span>{event.date} {event.time || ''}</span>
                        {relText && (
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 600, 
                            color: relText === '今天' ? 'var(--primary)' : 'var(--text-tertiary)',
                            backgroundColor: relText === '今天' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            {relText}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '5px',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: 'var(--primary)',
                            fontSize: '11.5px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'var(--primary)';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
                            e.currentTarget.style.color = 'var(--primary)';
                          }}
                          title={`在新标签页打开: ${url}`}
                        >
                          <ExternalLink size={12} />
                          <span>直达</span>
                        </a>
                      )}
                      <ChevronRight size={16} color="var(--text-tertiary)" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


