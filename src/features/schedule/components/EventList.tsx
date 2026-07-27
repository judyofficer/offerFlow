import React from 'react';
import { Plus, MapPin, Clock, FileText } from 'lucide-react';
import type { ScheduleEvent } from '../types/schedule';
import { EVENT_TYPE_CONFIG } from '../types/schedule';

interface Props {
  events: ScheduleEvent[];
  selectedDate: string;
  onAddEvent: () => void;
  onEditEvent: (id: string) => void;
}

export const EventList: React.FC<Props> = ({ events, selectedDate, onAddEvent, onEditEvent }) => {
  const dayEvents = events.filter(e => e.date === selectedDate).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

  // If no events today, show upcoming events
  const todayStr = new Date().toISOString().split('T')[0]; // simple comparison
  const upcomingEvents = events
    .filter(e => e.date >= todayStr && e.date !== selectedDate)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '00:00').localeCompare(b.time || '00:00'))
    .slice(0, 5); // next 5 events

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>日程安排</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {selectedDate}
          </p>
        </div>
        <button 
          onClick={onAddEvent}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '8px 16px', 
            borderRadius: 'var(--radius-md)', 
            backgroundColor: 'var(--primary)', 
            color: '#fff', 
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          <Plus size={16} /> 新增
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {dayEvents.length > 0 ? (
          dayEvents.map(event => (
            <div 
              key={event.id}
              onClick={() => onEditEvent(event.id)}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderLeft: `4px solid ${EVENT_TYPE_CONFIG[event.type].color}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>{event.title}</span>
                <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'var(--bg-tertiary)', color: EVENT_TYPE_CONFIG[event.type].color }}>
                  {EVENT_TYPE_CONFIG[event.type].label}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {event.time && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {event.time}</span>
                )}
                {event.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {event.location}</span>
                )}
                {event.notes && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> 备注</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            本日无日程安排
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              即将到来 (Upcoming)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingEvents.map(event => (
                <div 
                  key={event.id}
                  onClick={() => onEditEvent(event.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{event.title}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{event.date} {event.time}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: EVENT_TYPE_CONFIG[event.type].color }}>
                    {EVENT_TYPE_CONFIG[event.type].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
