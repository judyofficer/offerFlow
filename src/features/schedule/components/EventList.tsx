import React, { useState, useMemo } from 'react';
import { Plus, MapPin, Clock, FileText, ExternalLink, Copy, Check, Briefcase, Calendar, ChevronRight, CheckCircle2, Circle, Hourglass } from 'lucide-react';
import type { ScheduleEvent, EventType } from '../types/schedule';
import { EVENT_TYPE_CONFIG } from '../types/schedule';
import { useApplicationStore } from '../../applications/store/useApplicationStore';
import { useScheduleStore } from '../store/useScheduleStore';

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
  const { toggleCompleteEvent } = useScheduleStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const dayEvents = useMemo(() => {
    // 1. 当天截止或当天的直接日程
    const direct = events.filter(e => e.date === selectedDate);

    // 2. 截止前且未完成的时限日程（截止前都放在当天的日程安排里面，完成后才移出当天日程安排）
    const ongoing = events.filter(e => {
      const isDeadline = e.timeType === 'deadline' || e.type === 'deadline';
      if (!isDeadline) return false;
      if (e.isCompleted) return false; // 完成后立即移出非截止日的当天日程安排
      if (e.date <= selectedDate) return false; // 当天即截止日属于 direct，不重复添加
      const start = e.startDate || e.date;
      return start <= selectedDate;
    });

    const directUncompleted = direct.filter(e => !e.isCompleted);
    const directCompleted = direct.filter(e => e.isCompleted);

    return [
      ...directUncompleted,
      ...ongoing,
      ...directCompleted
    ];
  }, [events, selectedDate]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => e.date >= todayStr)
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        return a.date.localeCompare(b.date) || (a.time || '00:00').localeCompare(b.time || '00:00');
      })
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

  const renderTimeBadge = (event: ScheduleEvent) => {
    const isOngoingSpan = event.date > selectedDate && (event.timeType === 'deadline' || event.type === 'deadline');

    if (isOngoingSpan) {
      const [y1, m1, d1] = selectedDate.split('-').map(Number);
      const [y2, m2, d2] = event.date.split('-').map(Number);
      const diffDays = Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / (1000 * 60 * 60 * 24));
      const typeConf = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.other;

      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600,
          color: typeConf.color,
          backgroundColor: typeConf.bgColor,
          border: `1px dashed ${typeConf.borderColor}`,
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <Hourglass size={12} color={typeConf.color} /> 时限进行中 · 剩 {diffDays} 天 (最晚 {event.date} {event.time || '23:59'})
        </span>
      );
    }

    if (event.timeType === 'deadline') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600,
          color: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          padding: '2px 7px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <Hourglass size={12} /> 截止 {event.time || '23:59'} 前完成
        </span>
      );
    }
    if (event.timeType === 'all_day') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '2px 7px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <Calendar size={12} /> 全天有效
        </span>
      );
    }
    if (event.time) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '12.5px' }}>
          <Clock size={13} color="var(--primary)" /> {event.time}
        </span>
      );
    }
    return null;
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
                  backgroundColor: event.isCompleted ? 'rgba(255, 255, 255, 0.02)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `5px solid ${event.isCompleted ? 'var(--success, #10b981)' : typeConfig.color}`,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  opacity: event.isCompleted ? 0.78 : 1
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderTopColor = 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.borderRightColor = 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.borderBottomColor = 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.borderLeftColor = event.isCompleted ? 'var(--success, #10b981)' : typeConfig.color;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderTopColor = 'var(--border-color)';
                  e.currentTarget.style.borderRightColor = 'var(--border-color)';
                  e.currentTarget.style.borderBottomColor = 'var(--border-color)';
                  e.currentTarget.style.borderLeftColor = event.isCompleted ? 'var(--success, #10b981)' : typeConfig.color;
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* 标题与类型徽章 + 完成勾选 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0, flex: 1 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompleteEvent(event.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '1px 0 0 0',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: event.isCompleted ? 'var(--success, #10b981)' : 'var(--text-tertiary)',
                        borderRadius: '4px',
                        flexShrink: 0
                      }}
                      title={event.isCompleted ? '点击标为未完成' : '点击标为已完成'}
                    >
                      {event.isCompleted ? (
                        <CheckCircle2 size={19} color="#10b981" />
                      ) : (
                        <Circle size={19} />
                      )}
                    </button>
                    <span style={{
                      fontWeight: 600,
                      fontSize: '15.5px',
                      color: event.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                      lineHeight: '1.4',
                      textDecoration: event.isCompleted ? 'line-through' : 'none'
                    }}>
                      {event.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {event.isCompleted && (
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        fontWeight: 600
                      }}>
                        已完成
                      </span>
                    )}
                    <span style={{
                      fontSize: '11.5px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      backgroundColor: typeConfig.bgColor,
                      color: typeConfig.color,
                      border: `1px solid ${typeConfig.borderColor}`,
                      whiteSpace: 'nowrap',
                      fontWeight: 600
                    }}>
                      {typeConfig.label}
                    </span>
                  </div>
                </div>

                {/* 关联岗位 */}
                {appLabel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '27px' }}>
                    <Briefcase size={14} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{appLabel}</span>
                  </div>
                )}

                {/* 时间与地点 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '27px' }}>
                  {renderTimeBadge(event)}

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
                      flexWrap: 'wrap',
                      paddingLeft: '27px'
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
              <span>近期日程</span>
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
                      backgroundColor: event.isCompleted ? 'rgba(255, 255, 255, 0.02)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)',
                      borderLeft: `4px solid ${event.isCompleted ? 'var(--success, #10b981)' : typeConfig.color}`,
                      transition: 'all 0.15s ease',
                      gap: '12px',
                      opacity: event.isCompleted ? 0.75 : 1
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderTopColor = 'rgba(59, 130, 246, 0.5)';
                      e.currentTarget.style.borderRightColor = 'rgba(59, 130, 246, 0.5)';
                      e.currentTarget.style.borderBottomColor = 'rgba(59, 130, 246, 0.5)';
                      e.currentTarget.style.borderLeftColor = event.isCompleted ? 'var(--success, #10b981)' : typeConfig.color;
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderTopColor = 'var(--border-color)';
                      e.currentTarget.style.borderRightColor = 'var(--border-color)';
                      e.currentTarget.style.borderBottomColor = 'var(--border-color)';
                      e.currentTarget.style.borderLeftColor = event.isCompleted ? 'var(--success, #10b981)' : typeConfig.color;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompleteEvent(event.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: event.isCompleted ? 'var(--success, #10b981)' : 'var(--text-tertiary)',
                          borderRadius: '4px',
                          flexShrink: 0
                        }}
                        title={event.isCompleted ? '点击标为未完成' : '点击标为已完成'}
                      >
                        {event.isCompleted ? (
                          <CheckCircle2 size={16} color="#10b981" />
                        ) : (
                          <Circle size={16} />
                        )}
                      </button>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: event.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textDecoration: event.isCompleted ? 'line-through' : 'none'
                          }}>
                            {event.title}
                          </span>
                          {event.isCompleted ? (
                            <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 600 }}>
                              已完成
                            </span>
                          ) : (
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
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span>
                            {event.date} {event.timeType === 'deadline' ? `(截止 ${event.time || '23:59'})` : (event.timeType === 'all_day' ? '(全天)' : event.time || '')}
                          </span>
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



