import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { useScheduleStore } from '../../schedule/store/useScheduleStore';
import { EVENT_TYPE_CONFIG } from '../../schedule/types/schedule';

export const UpcomingSchedule: React.FC = () => {
  const { events } = useScheduleStore();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Get events for today and future, sorted by date and time
  const upcomingEvents = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '00:00').localeCompare(b.time || '00:00'))
    .slice(0, 5); // Show next 5 events

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} /> 近期日程
        </h3>
        <button 
          onClick={() => navigate('/schedule')}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
        >
          查看全部
        </button>
      </div>

      <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map(event => {
            const isToday = event.date === todayStr;
            const eventColor = EVENT_TYPE_CONFIG[event.type].color;
            
            return (
              <div 
                key={event.id}
                onClick={() => navigate('/schedule')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${eventColor}`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{event.title}</span>
                  {isToday && (
                    <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>今天</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <Clock size={12} />
                    {!isToday && <span>{event.date}</span>}
                    {event.time && <span>{event.time}</span>}
                  </div>
                  <span style={{ fontSize: '12px', color: eventColor, padding: '2px 6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                    {EVENT_TYPE_CONFIG[event.type].label}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            最近没有安排，可以安心休息或继续投递~
          </div>
        )}
      </div>
    </div>
  );
};
