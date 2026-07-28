import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScheduleEvent } from '../types/schedule';
import { EVENT_TYPE_CONFIG } from '../types/schedule';

interface Props {
  events: ScheduleEvent[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}

const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const days = [];
  
  // 0 = Sunday, 1 = Monday, etc.
  const firstDayOfWeek = date.getDay();
  // Adjust so Monday is 0, Sunday is 6 (optional, but let's stick to Sunday = 0 for standard)
  
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false
    });
  }

  const currentMonthDays = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= currentMonthDays; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  const remaining = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }
  
  return days;
};

const formatDateToLocalString = (date: Date) => {
  // To avoid timezone shift issues, construct YYYY-MM-DD locally
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const CalendarView: React.FC<Props> = ({ events, selectedDate, onSelectDate }) => {
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  const days = getDaysInMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const todayStr = formatDateToLocalString(new Date());

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {currentYear}年 {currentMonth + 1}月
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={prevMonth}
            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={18} color="var(--text-secondary)" />
          </button>
          <button 
            onClick={() => {
              const now = new Date();
              setCurrentYear(now.getFullYear());
              setCurrentMonth(now.getMonth());
              onSelectDate(formatDateToLocalString(now));
            }}
            style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}
          >
            今天
          </button>
          <button 
            onClick={nextMonth}
            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={18} color="var(--text-secondary)" />
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: 'var(--text-tertiary)' }}>
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {days.map((dayObj, i) => {
          const dateStr = formatDateToLocalString(dayObj.date);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          
          const dayEvents = events.filter(e => e.date === dateStr);

          return (
            <div 
              key={i}
              onClick={() => onSelectDate(dateStr)}
              style={{
                aspectRatio: '1',
                borderRadius: '8px',
                border: isSelected ? '2px solid var(--primary)' : '1px solid transparent',
                backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: dayObj.isCurrentMonth ? 1 : 0.3,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ 
                width: '28px', 
                height: '28px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                borderRadius: '50%',
                backgroundColor: isToday ? 'var(--primary)' : 'transparent',
                color: isToday ? 'var(--primary-foreground)' : 'var(--text-primary)',
                fontWeight: isToday ? 600 : 400,
                fontSize: '14px',
                marginBottom: '4px'
              }}>
                {dayObj.date.getDate()}
              </span>
              
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {dayEvents.slice(0, 3).map((e, idx) => (
                  <span 
                    key={idx}
                    style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      backgroundColor: EVENT_TYPE_CONFIG[e.type].color 
                    }}
                    title={e.title}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', lineHeight: '6px' }}>+</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
