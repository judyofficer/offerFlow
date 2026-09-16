import React, { useState, useMemo } from 'react';
import { X, Search, RotateCcw, Trash2, ExternalLink, Calendar, FileText, CheckCircle2, Building2, Copy, Check, Filter } from 'lucide-react';
import type { ScheduleEvent, EventType } from '../types/schedule';
import { EVENT_TYPE_CONFIG } from '../types/schedule';
import { useApplicationStore } from '../../applications/store/useApplicationStore';
import { useScheduleStore } from '../store/useScheduleStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
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

const formatTimestamp = (ts?: number) => {
  if (!ts) return '';
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}-${day} ${h}:${min}`;
};

export const RecycleBinModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { events, unarchiveEvent, deleteEvent, clearArchivedEvents } = useScheduleStore();
  const { applications } = useApplicationStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 回收站中的所有已删除/已归档日程
  const deletedEvents = useMemo(() => {
    return events.filter(e => e.isArchived);
  }, [events]);

  // 根据搜索与类型二次过滤
  const filteredDeleted = useMemo(() => {
    return deletedEvents.filter(e => {
      // 1. 类型筛选
      if (selectedType !== 'all' && e.type !== selectedType) {
        return false;
      }
      // 2. 搜索关键词
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const app = applications.find(a => a.id === e.applicationId);
        const matchTitle = e.title.toLowerCase().includes(kw);
        const matchNotes = e.notes ? e.notes.toLowerCase().includes(kw) : false;
        const matchLocation = e.location ? e.location.toLowerCase().includes(kw) : false;
        const matchApp = app ? `${app.companyName} ${app.jobTitle}`.toLowerCase().includes(kw) : false;
        return matchTitle || matchNotes || matchLocation || matchApp;
      }
      return true;
    }).sort((a, b) => (b.archivedAt || b.updatedAt) - (a.archivedAt || a.updatedAt));
  }, [deletedEvents, selectedType, searchKeyword, applications]);

  // 类型统计
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: deletedEvents.length, oa: 0, interview: 0, deadline: 0, other: 0 };
    deletedEvents.forEach(e => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return counts;
  }, [deletedEvents]);

  if (!isOpen) return null;

  const handleCopyLink = (eventId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRestore = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    unarchiveEvent(id);
  };

  const handlePermanentDelete = (e: React.MouseEvent, event: ScheduleEvent) => {
    e.stopPropagation();
    if (window.confirm(`确定要彻底删除日程「${event.title}」吗？\n彻底删除后将无法恢复。`)) {
      deleteEvent(event.id);
    }
  };

  const handleClearAll = () => {
    if (deletedEvents.length === 0) return;
    if (window.confirm(`确定要清空回收站中全部 ${deletedEvents.length} 项日程吗？\n此操作将彻底删除，无法恢复。`)) {
      clearArchivedEvents();
    }
  };

  const getApplicationLabel = (appId?: string) => {
    if (!appId) return null;
    const app = applications.find(a => a.id === appId);
    if (!app) return null;
    return `${app.companyName} · ${app.jobTitle}`;
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.18s ease-out',
        boxSizing: 'border-box'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '740px',
          maxWidth: '100%',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalScaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
      >
        {/* 顶部 Header */}
        <header style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Trash2 size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  日程回收站
                </h2>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444'
                }}>
                  {deletedEvents.length} 项已删除
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                已删除的日程保存在回收站中，不再占用日历空间。随时可在此回顾备忘录并一键恢复至日历。
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ borderRadius: '8px', color: 'var(--text-secondary)' }}
            title="关闭"
          >
            <X size={18} />
          </button>
        </header>

        {/* 筛选与搜索工具栏 */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* 关键词搜索框 */}
            <div style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px' }} />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="在回收站中搜索公司、岗位、备忘录准备要点..."
                style={{
                  width: '100%',
                  height: '34px',
                  padding: '0 10px 0 32px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    padding: 0
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* 一键清空回收站按钮 */}
            {deletedEvents.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  borderRadius: '6px',
                  padding: '0 10px',
                  height: '34px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                title="清空回收站中的所有日程记录"
              >
                <Trash2 size={13} /> 清空回收站
              </button>
            )}
          </div>

          {/* 类型筛选芯片 */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Filter size={11} /> 分类：
            </span>
            {[
              { key: 'all' as const, label: `全部 (${typeCounts.all})` },
              { key: 'interview' as const, label: `面试 (${typeCounts.interview})` },
              { key: 'oa' as const, label: `笔试 (${typeCounts.oa})` },
              { key: 'deadline' as const, label: `Deadline (${typeCounts.deadline})` },
              { key: 'other' as const, label: `其他 (${typeCounts.other})` },
            ].map(tab => {
              const active = selectedType === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedType(tab.key)}
                  style={{
                    border: active ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: active ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-secondary)',
                    color: active ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '11.5px',
                    fontWeight: active ? 700 : 500,
                    borderRadius: '12px',
                    padding: '2px 10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 回收站列表内容区 */}
        <div style={{
          padding: '16px 24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--bg-primary)'
        }}>
          {filteredDeleted.length > 0 ? (
            filteredDeleted.map(event => {
              const typeConfig = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.other;
              const url = extractUrl(event.location);
              const appLabel = getApplicationLabel(event.applicationId);

              return (
                <div
                  key={event.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${typeConfig.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* 标题栏与操作按钮 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0, flex: 1 }}>
                      <CheckCircle2 size={17} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                        <span style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.3
                        }}>
                          {event.title}
                        </span>
                        {appLabel && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 size={12} color="var(--text-tertiary)" /> {appLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: typeConfig.bgColor,
                        color: typeConfig.color,
                        border: `1px solid ${typeConfig.borderColor}`,
                        fontWeight: 600
                      }}>
                        {typeConfig.label}
                      </span>

                      {/* 恢复至日历按钮 */}
                      <button
                        type="button"
                        onClick={(e) => handleRestore(e, event.id)}
                        style={{
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          backgroundColor: 'rgba(59, 130, 246, 0.08)',
                          color: 'var(--primary)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '3px 9px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = 'var(--primary)';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                          e.currentTarget.style.color = 'var(--primary)';
                        }}
                        title="恢复至日历，重新在日历和待办清单中显示"
                      >
                        <RotateCcw size={12} /> 恢复至日历
                      </button>

                      {/* 彻底删除按钮 */}
                      <button
                        type="button"
                        onClick={(e) => handlePermanentDelete(e, event)}
                        style={{
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          backgroundColor: 'transparent',
                          color: 'var(--danger)',
                          fontSize: '11.5px',
                          padding: '3px 7px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="彻底删除此记录，不再保留在回收站"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* 时间与删除记录时间 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} color="var(--primary)" /> 原定日期: {event.date} {event.time ? `(${event.time})` : ''}
                    </span>
                    {event.archivedAt && (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '11.5px' }}>
                        删除时间: {formatTimestamp(event.archivedAt)}
                      </span>
                    )}
                  </div>

                  {/* 备忘录准备记录回顾 */}
                  {event.notes && (
                    <div style={{
                      backgroundColor: 'var(--bg-primary)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px', fontSize: '11.5px' }}>
                        <FileText size={12} color="var(--text-tertiary)" /> 备忘录与准备记录：
                      </div>
                      {event.notes}
                    </div>
                  )}

                  {/* 笔试/面试链接直达 */}
                  {url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: 'var(--primary)',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={12} /> 笔试/面试直达链接 ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(event.id, url)}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: copiedId === event.id ? '#10b981' : 'var(--text-tertiary)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        {copiedId === event.id ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedId === event.id ? '已复制' : '复制'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-tertiary)'
              }}>
                <Trash2 size={24} />
              </div>
              <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {searchKeyword || selectedType !== 'all' ? '未找到符合条件的日程记录' : '回收站是空的'}
              </div>
              <p style={{ fontSize: '12.5px', maxWidth: '360px', margin: 0, lineHeight: 1.5 }}>
                在日程列表中点击「删除」或「一键删除已完成」，日程会移入回收站暂存，不再占用日历空间，方便日后随时查看与恢复。
              </p>
            </div>
          )}
        </div>

        {/* 底部 Footer */}
        <footer style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            共显示 {filteredDeleted.length} 条记录
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{
              padding: '6px 18px',
              fontSize: '12.5px',
              fontWeight: 600,
              borderRadius: '6px'
            }}
          >
            完成
          </button>
        </footer>
      </div>
    </div>
  );
};
