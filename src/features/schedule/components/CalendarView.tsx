import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { ScheduleEvent } from '../types/schedule';
import { EVENT_TYPE_CONFIG } from '../types/schedule';

interface Props {
  events: ScheduleEvent[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}

const formatDateToLocalString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const CalendarView: React.FC<Props> = ({ events, selectedDate, onSelectDate }) => {
  const initialDate = useMemo(() => selectedDate ? new Date(selectedDate) : new Date(), []);
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  // 1. 仅计算当月实际跨越的周数与单元格，彻底剔除非当月的冗余日历块，释放最大垂直渲染空间
  const { days, weekCount } = useMemo(() => {
    const firstDayDate = new Date(currentYear, currentMonth, 1);
    const firstDayOfWeek = firstDayDate.getDay(); // 0(周日) - 6(周六)
    const currentMonthDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const result: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isEmptyPlaceholder?: boolean;
    }> = [];

    // 前置空白占位（仅用于星期对齐，不渲染非本月日期）
    for (let i = 0; i < firstDayOfWeek; i++) {
      result.push({
        dateStr: `empty-prev-${i}`,
        dayNumber: 0,
        isCurrentMonth: false,
        isEmptyPlaceholder: true
      });
    }

    // 当月有效日期
    for (let i = 1; i <= currentMonthDays; i++) {
      const d = new Date(currentYear, currentMonth, i);
      result.push({
        dateStr: formatDateToLocalString(d),
        dayNumber: i,
        isCurrentMonth: true,
        isEmptyPlaceholder: false
      });
    }

    // 后置补齐至当周周六（不追加多余整周）
    const totalFilled = result.length;
    const endPadding = totalFilled % 7 === 0 ? 0 : 7 - (totalFilled % 7);
    for (let i = 0; i < endPadding; i++) {
      result.push({
        dateStr: `empty-next-${i}`,
        dayNumber: 0,
        isCurrentMonth: false,
        isEmptyPlaceholder: true
      });
    }

    const calculatedWeeks = Math.ceil(result.length / 7);
    return { days: result, weekCount: calculatedWeeks };
  }, [currentYear, currentMonth]);

  // 2. 将 events 数组索引为 Map<dateStr, events[]>，实现 O(1) 秒级查找，彻底消灭 42 次线性 filter
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const list = map.get(ev.date);
      if (list) {
        list.push(ev);
      } else {
        map.set(ev.date, [ev]);
      }
    }
    return map;
  }, [events]);

  const todayStr = useMemo(() => formatDateToLocalString(new Date()), []);

  // 3. 统计当月日程总数
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthEventCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < events.length; i++) {
      if (events[i].date.startsWith(currentMonthPrefix)) {
        count++;
      }
    }
    return count;
  }, [events, currentMonthPrefix]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    onSelectDate(formatDateToLocalString(now));
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
      gap: '18px',
      height: '100%',
      boxSizing: 'border-box'
    }}>
      {/* 头部控制栏：年月切换 + 今天快捷定位 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            backgroundColor: 'rgba(59, 130, 246, 0.12)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <span>{currentYear}年 {currentMonth + 1}月</span>
              {monthEventCount > 0 && (
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  padding: '3px 10px', 
                  borderRadius: '12px', 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                  color: 'var(--primary)' 
                }}>
                  本月 {monthEventCount} 项日程
                </span>
              )}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            type="button"
            onClick={prevMonth}
            style={{ 
              padding: '6px 10px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-color)', 
              backgroundColor: 'var(--bg-secondary)', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'background-color 0.15s ease'
            }}
            title="上个月"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            type="button"
            onClick={handleGoToday}
            style={{ 
              padding: '6px 14px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-color)', 
              backgroundColor: 'var(--bg-secondary)', 
              cursor: 'pointer', 
              fontSize: '13px', 
              fontWeight: 600,
              color: 'var(--text-primary)',
              transition: 'background-color 0.15s ease'
            }}
          >
            今天
          </button>
          <button 
            type="button"
            onClick={nextMonth}
            style={{ 
              padding: '6px 10px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-color)', 
              backgroundColor: 'var(--bg-secondary)', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'background-color 0.15s ease'
            }}
            title="下个月"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      {/* 星期表头 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '6px', 
        textAlign: 'center', 
        fontWeight: 600, 
        fontSize: '13px', 
        color: 'var(--text-tertiary)',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
          <div key={day} style={{ color: idx === 0 || idx === 6 ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 (按当月实际周数动态生成，单格高度提升至 112px，彻底剔除非本月冗余块) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gridTemplateRows: `repeat(${weekCount}, 112px)`, 
        gap: '6px', 
        flex: 1 
      }}>
        {days.map((dayObj) => {
          // 如果是非本月占位符，渲染透明占位格子，保持星期列对齐同时彻底隐藏干扰
          if (dayObj.isEmptyPlaceholder) {
            return (
              <div 
                key={dayObj.dateStr}
                style={{
                  height: '112px',
                  maxHeight: '112px',
                  boxSizing: 'border-box',
                  pointerEvents: 'none',
                  backgroundColor: 'transparent'
                }}
              />
            );
          }

          const dateStr = dayObj.dateStr;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const dayEvents = eventsByDate.get(dateStr) || [];

          return (
            <div 
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              style={{
                height: '112px',
                maxHeight: '112px',
                borderRadius: '8px',
                border: isSelected 
                  ? '1.5px solid var(--primary, #3b82f6)' 
                  : isToday 
                    ? '1.5px dashed var(--primary, #3b82f6)' 
                    : '1.5px solid var(--border-color)',
                backgroundColor: isSelected 
                  ? 'rgba(59, 130, 246, 0.08)' 
                  : isToday 
                    ? 'rgba(59, 130, 246, 0.03)' 
                    : 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                padding: '5px 6px',
                cursor: 'pointer',
                transition: 'background-color 0.1s ease, border-color 0.1s ease',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden'
              }}
              title={dayEvents.length > 0 ? `${dateStr}：\n${dayEvents.map(e => `• ${e.time ? `${e.time} ` : ''}[${EVENT_TYPE_CONFIG[e.type].label}] ${e.title}`).join('\n')}` : dateStr}
            >
              {/* 日期数字行 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', height: '22px', flexShrink: 0 }}>
                <span style={{ 
                  width: '22px', 
                  height: '22px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: '50%',
                  backgroundColor: isToday ? 'var(--primary, #3b82f6)' : (isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent'),
                  color: isToday ? '#ffffff' : (isSelected ? 'var(--primary)' : 'var(--text-primary)'),
                  fontWeight: isToday || isSelected ? 700 : 500,
                  fontSize: '12.5px',
                }}>
                  {dayObj.dayNumber}
                </span>

                {dayEvents.length > 0 && (
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 700, 
                    color: isToday ? 'var(--primary)' : 'var(--text-tertiary)',
                    paddingRight: '2px'
                  }}>
                    {dayEvents.length} 项
                  </span>
                )}
              </div>
              
              {/* 日程内容区：在 112px 高度下释放最大信息容量 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden', flex: 1, justifyContent: 'flex-start' }}>
                {dayEvents.length === 1 ? (
                  /* 单个日程：双行舒适豪华卡片 */
                  <div 
                    style={{
                      padding: '3px 6px',
                      borderRadius: '5px',
                      backgroundColor: EVENT_TYPE_CONFIG[dayEvents[0].type].bgColor,
                      color: EVENT_TYPE_CONFIG[dayEvents[0].type].color,
                      border: `1px solid ${EVENT_TYPE_CONFIG[dayEvents[0].type].borderColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      overflow: 'hidden',
                      lineHeight: 1.25,
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: EVENT_TYPE_CONFIG[dayEvents[0].type].color, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: EVENT_TYPE_CONFIG[dayEvents[0].type].color }} />
                        {dayEvents[0].time ? dayEvents[0].time.slice(0, 5) : '全天'}
                      </span>
                      <span style={{ fontSize: '9.5px', fontWeight: 600, color: EVENT_TYPE_CONFIG[dayEvents[0].type].color, opacity: 0.9 }}>
                        {EVENT_TYPE_CONFIG[dayEvents[0].type].label}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                      {dayEvents[0].title}
                    </div>
                  </div>
                ) : dayEvents.length === 2 ? (
                  /* 2个日程：完整展示 2 条双行卡片 (各含时间、类型标签与标题，信息量翻倍且不拥挤) */
                  dayEvents.map(ev => {
                    const typeConf = EVENT_TYPE_CONFIG[ev.type];
                    return (
                      <div 
                        key={ev.id}
                        style={{
                          padding: '2px 5px',
                          borderRadius: '4px',
                          backgroundColor: typeConf.bgColor,
                          color: typeConf.color,
                          border: `1px solid ${typeConf.borderColor}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px',
                          overflow: 'hidden',
                          lineHeight: '1.2',
                          boxSizing: 'border-box',
                          height: '35px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3px' }}>
                          <span style={{ fontSize: '9.5px', fontWeight: 700, color: typeConf.color, display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <span style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', backgroundColor: typeConf.color }} />
                            {ev.time ? ev.time.slice(0, 5) : '全天'}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: typeConf.color, opacity: 0.9 }}>
                            {typeConf.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.title}
                        </div>
                      </div>
                    );
                  })
                ) : dayEvents.length === 3 ? (
                  /* 3个日程：渲染 3 条紧凑胶囊，一览无余 */
                  dayEvents.map(ev => {
                    const typeConf = EVENT_TYPE_CONFIG[ev.type];
                    return (
                      <div 
                        key={ev.id}
                        style={{
                          padding: '2px 5px',
                          borderRadius: '4px',
                          backgroundColor: typeConf.bgColor,
                          color: typeConf.color,
                          border: `1px solid ${typeConf.borderColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          overflow: 'hidden',
                          lineHeight: '1.2',
                          boxSizing: 'border-box',
                          height: '21px'
                        }}
                      >
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: typeConf.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '9.5px', fontWeight: 700, color: typeConf.color, flexShrink: 0 }}>
                          {ev.time ? ev.time.slice(0, 5) : ''}
                        </span>
                        <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {ev.title}
                        </span>
                      </div>
                    );
                  })
                ) : dayEvents.length >= 4 ? (
                  /* 4个及以上日程：渲染前 2 条紧凑胶囊 + 更多徽章 */
                  <>
                    {dayEvents.slice(0, 2).map(ev => {
                      const typeConf = EVENT_TYPE_CONFIG[ev.type];
                      return (
                        <div 
                          key={ev.id}
                          style={{
                            padding: '2px 5px',
                            borderRadius: '4px',
                            backgroundColor: typeConf.bgColor,
                            color: typeConf.color,
                            border: `1px solid ${typeConf.borderColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            overflow: 'hidden',
                            lineHeight: '1.2',
                            boxSizing: 'border-box',
                            height: '21px'
                          }}
                        >
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: typeConf.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '9.5px', fontWeight: 700, color: typeConf.color, flexShrink: 0 }}>
                            {ev.time ? ev.time.slice(0, 5) : ''}
                          </span>
                          <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {ev.title}
                          </span>
                        </div>
                      );
                    })}
                    <div style={{ 
                      fontSize: '10.5px', 
                      color: 'var(--primary)', 
                      fontWeight: 600, 
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      borderRadius: '4px',
                      textAlign: 'center', 
                      padding: '2px 0',
                      height: '19px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box'
                    }}>
                      +{dayEvents.length - 2} 项更多日程
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部日程类型图例指示 */}
      <footer style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '20px', 
        paddingTop: '12px', 
        borderTop: '1px solid var(--border-color)',
        flexWrap: 'wrap'
      }}>
        {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: config.color }} />
            <span>{config.label}</span>
          </div>
        ))}
      </footer>
    </div>
  );
};



