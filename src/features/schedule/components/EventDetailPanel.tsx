import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar as CalendarIcon, Clock, MapPin, ExternalLink, Briefcase, FileText, Hourglass, CheckCircle2, Circle } from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';
import { useApplicationStore } from '../../applications/store/useApplicationStore';
import { EVENT_TYPE_CONFIG } from '../types/schedule';
import type { ScheduleEvent, EventType, TimeType } from '../types/schedule';

interface Props {
  eventId: string | null; // if null, it's a new event
  initialDate?: string;
  initialAppId?: string;
  onClose: () => void;
}

const formatDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isUrlLike = (text?: string): boolean => {
  if (!text) return false;
  const trimmed = text.trim();
  return /^https?:\/\//i.test(trimmed) || /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+(\/[^\s]*)?$/i.test(trimmed);
};

export const EventDetailPanel: React.FC<Props> = ({ eventId, initialDate, initialAppId, onClose }) => {
  const { events, addEvent, updateEvent, deleteEvent } = useScheduleStore();
  const { applications } = useApplicationStore();
  
  const existingEvent = eventId ? events.find(e => e.id === eventId) : null;
  
  const [formData, setFormData] = useState<Partial<ScheduleEvent>>({
    title: '',
    type: 'interview',
    date: initialDate || formatDateStr(new Date()),
    time: '19:00',
    timeType: 'specific',
    isCompleted: false,
    location: '',
    notes: '',
    applicationId: initialAppId || '',
  });

  useEffect(() => {
    if (existingEvent) {
      setFormData({
        ...existingEvent,
        timeType: existingEvent.timeType || (existingEvent.type === 'deadline' ? 'deadline' : 'specific'),
        isCompleted: existingEvent.isCompleted || false
      });
    } else if (initialAppId) {
      // Auto-fill title based on app
      const app = applications.find(a => a.id === initialAppId);
      if (app) {
        setFormData(prev => ({
          ...prev,
          title: `${app.companyName} - ${app.jobTitle} 面试`,
          applicationId: initialAppId
        }));
      }
    }
  }, [existingEvent, initialAppId, applications]);

  // Keyboard shortcut Cmd/Ctrl + Enter to save, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSelect = (type: EventType) => {
    setFormData(prev => ({ 
      ...prev, 
      type,
      // 如果切换为 deadline，自动建议 deadline 模式
      timeType: type === 'deadline' ? 'deadline' : prev.timeType,
      time: type === 'deadline' ? (prev.time || '23:59') : prev.time
    }));
  };

  const handleQuickDate = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    setFormData(prev => ({ ...prev, date: formatDateStr(target) }));
  };

  const handleQuickDeadline = (offsetDays: number) => {
    const today = new Date();
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    setFormData(prev => ({
      ...prev,
      timeType: 'deadline',
      startDate: prev.startDate || formatDateStr(today),
      date: formatDateStr(target),
      time: '23:59'
    }));
  };

  const handleOpenLink = () => {
    if (!formData.location) return;
    const trimmed = formData.location.trim();
    const url = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSave = () => {
    if (!formData.title?.trim() || !formData.date) {
      alert('请填写日程标题与日期');
      return;
    }
    const isDeadline = formData.timeType === 'deadline' || formData.type === 'deadline';
    const finalData = {
      title: formData.title.trim(),
      type: formData.type || 'interview',
      date: formData.date,
      startDate: formData.startDate || (isDeadline ? formatDateStr(new Date()) : undefined),
      time: formData.timeType === 'all_day' ? undefined : (formData.time || (formData.timeType === 'deadline' ? '23:59' : '19:00')),
      timeType: formData.timeType || 'specific',
      isCompleted: formData.isCompleted ?? false,
      location: formData.location?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      applicationId: formData.applicationId || undefined,
    };
    if (eventId) {
      updateEvent(eventId, finalData);
    } else {
      addEvent(finalData as Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>);
    }
    onClose();
  };

  const handleDelete = () => {
    if (eventId && confirm('确定要删除这个日程吗？此操作不可撤销。')) {
      deleteEvent(eventId);
      onClose();
    }
  };

  const isLink = isUrlLike(formData.location);

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.18s ease-out',
        boxSizing: 'border-box'
      }}
    >
      {/* 居中浮窗主体卡片 */}
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '580px',
          maxWidth: '100%',
          maxHeight: '88vh',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalScaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
      >
        {/* 顶部 Header */}
        <header style={{ 
          padding: '18px 22px', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              backgroundColor: 'rgba(59, 130, 246, 0.12)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <CalendarIcon size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                {eventId ? '编辑日程' : '新建日程'}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* 显眼的完成状态切换按钮 */}
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isCompleted: !prev.isCompleted }))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '6px',
                border: `1.5px solid ${formData.isCompleted ? 'var(--success, #10b981)' : 'var(--border-color)'}`,
                backgroundColor: formData.isCompleted ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-primary)',
                color: formData.isCompleted ? 'var(--success, #10b981)' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="切换完成状态"
            >
              {formData.isCompleted ? <CheckCircle2 size={15} color="#10b981" /> : <Circle size={15} color="var(--text-tertiary)" />}
              <span>{formData.isCompleted ? '已完成' : '未完成'}</span>
            </button>

            {eventId && (
              <button 
                type="button"
                onClick={handleDelete}
                className="btn btn-ghost btn-icon btn-sm"
                style={{ color: 'var(--danger)', borderRadius: '8px' }}
                title="删除日程"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-icon btn-sm"
              style={{ color: 'var(--text-secondary)', borderRadius: '8px' }}
              title="关闭 (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* 表单内容区 (支持自适应滚动) */}
        <div style={{ 
          padding: '22px 24px', 
          overflowY: 'auto', 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '18px' 
        }}>
          {/* 1. 日程标题 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              日程标题 *
            </label>
            <input 
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              placeholder="例如: 招银网络 - 笔试 或 腾讯 WXG 视频一面"
              autoFocus
              style={{ 
                padding: '10px 14px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                outline: 'none', 
                backgroundColor: 'var(--bg-secondary)', 
                color: 'var(--text-primary)', 
                fontSize: '15px', 
                fontWeight: 600 
              }}
            />
          </div>

          {/* 2. 日程类型：4 态可视化 Segmented 切换器 (固定 38px 高度与 1.5px 边框，消除抖动) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              日程类型
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map(typeKey => {
                const config = EVENT_TYPE_CONFIG[typeKey];
                const isSelected = formData.type === typeKey;

                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => handleTypeSelect(typeKey)}
                    style={{
                      height: '38px',
                      borderRadius: '8px',
                      border: `1.5px solid ${isSelected ? config.color : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? config.bgColor : 'var(--bg-secondary)',
                      color: isSelected ? config.color : 'var(--text-secondary)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      padding: 0,
                    }}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 关联投递岗位 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Briefcase size={14} color="var(--text-tertiary)" /> 关联投递岗位 (可选)
            </label>
            <select 
              name="applicationId"
              value={formData.applicationId || ''}
              onChange={handleChange}
              style={{ 
                height: '38px',
                padding: '0 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                outline: 'none', 
                backgroundColor: 'var(--bg-secondary)', 
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">-- 无关联（独立日程） --</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.companyName} · {app.jobTitle}</option>
              ))}
            </select>
          </div>

          {/* 4. 时间与时限模式设置 (支持固定时刻 vs 时限截止前完成 vs 全天) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} color="var(--primary)" /> 时间模式
              </label>

              {/* 时间模式切换 Segmented */}
              <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                {[
                  { type: 'specific' as TimeType, label: '固定时刻', icon: Clock },
                  { type: 'deadline' as TimeType, label: '时限/截止前', icon: Hourglass },
                  { type: 'all_day' as TimeType, label: '全天有效', icon: CalendarIcon },
                ].map(item => {
                  const active = (formData.timeType || 'specific') === item.type;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          timeType: item.type,
                          time: item.type === 'deadline' && (!prev.time || prev.time === '19:00') ? '23:59' : prev.time
                        }));
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: active ? 'var(--primary)' : 'transparent',
                        color: active ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon size={12} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 模式 1: 固定时间点 */}
            {(formData.timeType === 'specific' || !formData.timeType) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>日程日期 *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date || ''}
                    onChange={handleChange}
                    style={{ height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>具体时刻 (HH:mm)</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time || '19:00'}
                    onChange={handleChange}
                    style={{ height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {/* 模式 2: 时限/截止前完成 (专为牛客/赛码自选题库或限期作答设计) */}
            {formData.timeType === 'deadline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>最晚截止日期 *</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date || ''}
                      onChange={handleChange}
                      style={{ height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13.5px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>截止时刻 (默认23:59)</label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time || '23:59'}
                      onChange={handleChange}
                      style={{ height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13.5px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* 快捷时限计算芯片 */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', minHeight: '26px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>时限快捷计算:</span>
                  {[
                    { label: '3天内截止', offset: 3 },
                    { label: '5天内截止', offset: 5 },
                    { label: '7天内截止', offset: 7 },
                    { label: '10天内截止', offset: 10 },
                  ].map(chip => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleQuickDeadline(chip.offset)}
                      style={{
                        height: '24px',
                        padding: '0 8px',
                        borderRadius: '5px',
                        fontSize: '11.5px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        boxSizing: 'border-box'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 模式 3: 全天有效 */}
            {formData.timeType === 'all_day' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>有效日期 *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date || ''}
                  onChange={handleChange}
                  style={{ height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* 快速日期芯片 */}
            {formData.timeType === 'specific' && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', minHeight: '26px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>快捷选择:</span>
                {[
                  { label: '今天', offset: 0 },
                  { label: '明天', offset: 1 },
                  { label: '后天', offset: 2 },
                  { label: '+3天', offset: 3 },
                  { label: '+7天', offset: 7 },
                ].map(chip => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleQuickDate(chip.offset)}
                    style={{
                      height: '24px',
                      padding: '0 8px',
                      borderRadius: '5px',
                      fontSize: '11.5px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease, color 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 5. 地点 / 笔试/面试链接 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} color="var(--primary)" /> 笔试/面试链接
              </label>

              {isLink && (
                <button
                  type="button"
                  onClick={handleOpenLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11.5px',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    height: '22px',
                    boxSizing: 'border-box'
                  }}
                  title="在新标签页测试打开链接"
                >
                  <ExternalLink size={11} /> 测试打开
                </button>
              )}
            </div>

            <input 
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              placeholder="例如: https://... 或 腾讯会议"
              style={{ 
                height: '38px',
                padding: '0 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                outline: 'none', 
                backgroundColor: 'var(--bg-secondary)', 
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 6. 备忘录 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={14} color="var(--text-tertiary)" /> 备忘录 (可选)
            </label>
            <textarea 
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="记录准备要点、重点问题、注意事项等..."
              style={{ 
                padding: '10px 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                outline: 'none', 
                backgroundColor: 'var(--bg-secondary)', 
                color: 'var(--text-primary)', 
                resize: 'vertical', 
                minHeight: '88px', 
                fontFamily: 'inherit', 
                fontSize: '13.5px',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* 底部操作栏 */}
        <footer style={{ 
          padding: '14px 22px', 
          borderTop: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div>
            {eventId ? (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 0'
                }}
              >
                <Trash2 size={14} /> 删除此日程
              </button>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                快捷键: <strong>Esc</strong> 关闭 · <strong>⌘Enter</strong> 保存
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              style={{ padding: '7px 16px', fontSize: '13px', borderRadius: '8px' }}
            >
              取消
            </button>
            <button 
              type="button"
              onClick={handleSave}
              className="btn btn-primary"
              style={{ padding: '7px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '8px' }}
            >
              保存日程 (⌘↵)
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};


