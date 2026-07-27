import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';
import { useApplicationStore } from '../../applications/store/useApplicationStore';
import { EVENT_TYPE_CONFIG } from '../types/schedule';
import type { ScheduleEvent } from '../types/schedule';

interface Props {
  eventId: string | null; // if null, it's a new event
  initialDate?: string;
  initialAppId?: string;
  onClose: () => void;
}

export const EventDetailPanel: React.FC<Props> = ({ eventId, initialDate, initialAppId, onClose }) => {
  const { events, addEvent, updateEvent, deleteEvent } = useScheduleStore();
  const { applications } = useApplicationStore();
  
  const existingEvent = eventId ? events.find(e => e.id === eventId) : null;
  
  const [formData, setFormData] = useState<Partial<ScheduleEvent>>({
    title: '',
    type: 'interview',
    date: initialDate || new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    notes: '',
    applicationId: initialAppId || '',
  });

  useEffect(() => {
    if (existingEvent) {
      setFormData(existingEvent);
    } else if (initialAppId) {
      // Auto-fill title based on app
      const app = applications.find(a => a.id === initialAppId);
      if (app) {
        setFormData(prev => ({
          ...prev,
          title: `${app.companyName} ${app.jobTitle} 面试`,
          applicationId: initialAppId
        }));
      }
    }
  }, [existingEvent, initialAppId, applications]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.title || !formData.date) {
      alert('标题和日期不能为空');
      return;
    }
    if (eventId) {
      updateEvent(eventId, formData);
    } else {
      addEvent(formData as Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>);
    }
    onClose();
  };

  const handleDelete = () => {
    if (eventId && confirm('确定要删除这个日程吗？')) {
      deleteEvent(eventId);
      onClose();
    }
  };

  return (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          zIndex: 998,
        }}
      />
      
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          backgroundColor: 'var(--bg-primary)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          borderLeft: '1px solid var(--border-color)'
        }}
      >
        <header style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="text-h2">{eventId ? '编辑日程' : '新建日程'}</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            {eventId && (
              <button 
                onClick={handleDelete}
                style={{ padding: '6px', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                title="删除记录"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button 
              onClick={onClose}
              style={{ padding: '6px', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>日程标题 *</label>
            <input 
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="例如: 腾讯 WXG 视频一面"
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 500 }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>日程类型</label>
              <select 
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>关联投递岗位</label>
              <select 
                name="applicationId"
                value={formData.applicationId || ''}
                onChange={handleChange}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="">-- 无关联 --</option>
                {applications.map(app => (
                  <option key={app.id} value={app.id}>{app.companyName} - {app.jobTitle}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CalendarIcon size={14} /> 日期 *
              </label>
              <input 
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> 时间
              </label>
              <input 
                type="time"
                name="time"
                value={formData.time || ''}
                onChange={handleChange}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} /> 地点 / 会议链接
            </label>
            <input 
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              placeholder="腾讯会议ID 或 公司地址"
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>备忘录</label>
            <textarea 
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="面试准备要点，自我介绍草稿..."
              style={{ padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'none', flex: 1, minHeight: '150px', fontFamily: 'inherit', lineHeight: '1.5' }}
            />
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            style={{ padding: '8px 24px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
          >
            保存日程
          </button>
        </div>
      </div>
    </>
  );
};
