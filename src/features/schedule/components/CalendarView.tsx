import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Hourglass } from 'lucide-react';
import type { ScheduleEvent, EventType } from '../types/schedule';
import { EVENT_TYPE_CONFIG } from '../types/schedule';
import styles from './CalendarView.module.css';

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
  const [expandedOngoingDates, setExpandedOngoingDates] = useState<Record<string, boolean>>({});

  const toggleOngoingExpand = (dateStr: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedOngoingDates(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

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

  // 2. 将 events 数组按日期索引为：当天的直接日程 (directEvents) 与截止前的进行中时限 (ongoingDeadlines)
  const calendarDataByDate = useMemo(() => {
    const map = new Map<string, {
      directEvents: ScheduleEvent[];
      ongoingDeadlines: Array<{ event: ScheduleEvent; diffDays: number }>;
    }>();

    const getEntry = (dStr: string) => {
      let entry = map.get(dStr);
      if (!entry) {
        entry = { directEvents: [], ongoingDeadlines: [] };
        map.set(dStr, entry);
      }
      return entry;
    };

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      // 1. 当天的直接日程（截止日当天或具体时刻日程）
      getEntry(ev.date).directEvents.push(ev);

      // 2. 截止前进行中的时限日程（仅未完成时在截止日前各天生成轻量提示）
      const isDeadline = ev.timeType === 'deadline' || ev.type === 'deadline';
      if (isDeadline && !ev.isCompleted) {
        const startStr = ev.startDate || ev.date;
        if (startStr < ev.date) {
          const [y1, m1, d1] = startStr.split('-').map(Number);
          const [y2, m2, d2] = ev.date.split('-').map(Number);
          const curr = new Date(y1, m1 - 1, d1);
          const end = new Date(y2, m2 - 1, d2);

          while (curr < end) {
            const currStr = formatDateToLocalString(curr);
            if (currStr < ev.date) {
              const diffDays = Math.round((end.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
              getEntry(currStr).ongoingDeadlines.push({ event: ev, diffDays });
            }
            curr.setDate(curr.getDate() + 1);
          }
        }
      }
    }

    // 排序直接日程：未完成在前，已完成在后
    map.forEach(entry => {
      entry.directEvents.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        return (a.time || '00:00').localeCompare(b.time || '00:00');
      });
    });

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
    <div className={styles.container}>
      {/* 头部控制栏：年月切换 + 今天快捷定位 */}
      <header className={styles.header}>
        <div className={styles.headerTitleWrapper}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            backgroundColor: 'rgba(59, 130, 246, 0.12)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--primary)',
            flexShrink: 0
          }}>
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, flexWrap: 'wrap' }}>
              <span>{currentYear}年 {currentMonth + 1}月</span>
              {monthEventCount > 0 && (
                <span style={{ 
                  fontSize: '11.5px', 
                  fontWeight: 600, 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                  color: 'var(--primary)',
                  whiteSpace: 'nowrap'
                }}>
                  本月 {monthEventCount} 项
                </span>
              )}
            </h2>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button 
            type="button"
            onClick={prevMonth}
            style={{ 
              padding: '5px 9px', 
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
            <ChevronLeft size={16} />
          </button>
          <button 
            type="button"
            onClick={handleGoToday}
            style={{ 
              padding: '5px 12px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-color)', 
              backgroundColor: 'var(--bg-secondary)', 
              cursor: 'pointer', 
              fontSize: '12.5px', 
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
              padding: '5px 9px', 
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
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {/* 星期表头 */}
      <div className={styles.weekdaysHeader}>
        {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
          <div key={day} style={{ color: idx === 0 || idx === 6 ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div 
        className={styles.grid}
        style={{ 
          gridTemplateRows: `repeat(${weekCount}, minmax(78px, 94px))`,
          ['--week-count' as any]: weekCount
        }}
      >
        {days.map((dayObj) => {
          if (dayObj.isEmptyPlaceholder) {
            return (
              <div 
                key={dayObj.dateStr}
                className={styles.placeholder}
                style={{
                  minHeight: '78px',
                  maxHeight: '94px',
                  height: '100%',
                }}
              />
            );
          }

          const dateStr = dayObj.dateStr;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const cellData = calendarDataByDate.get(dateStr) || { directEvents: [], ongoingDeadlines: [] };
          const { directEvents, ongoingDeadlines } = cellData;
          const totalItemsCount = directEvents.length + ongoingDeadlines.length;
          const isOngoingExpanded = !!expandedOngoingDates[dateStr];

          // 按日程类型 (oa/interview/deadline/other) 进行分组，保证每种类型拥有独立且精准的颜色胶囊
          const groupedOngoing: Array<[EventType, Array<{ event: ScheduleEvent; diffDays: number }>]> = (() => {
            if (ongoingDeadlines.length === 0) return [];
            const map = new Map<EventType, Array<{ event: ScheduleEvent; diffDays: number }>>();
            for (let i = 0; i < ongoingDeadlines.length; i++) {
              const item = ongoingDeadlines[i];
              const t = item.event.type;
              const list = map.get(t) || [];
              list.push(item);
              map.set(t, list);
            }
            return Array.from(map.entries());
          })();

          return (
            <div 
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={styles.cell}
              style={{
                minHeight: '78px',
                maxHeight: '94px',
                height: '100%',
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
                padding: '4px 6px',
              }}
              title={
                totalItemsCount > 0 
                  ? `${dateStr}：\n${directEvents.map(e => `• ${e.time ? `${e.time} ` : ''}[${EVENT_TYPE_CONFIG[e.type].label}] ${e.title}`).join('\n')}${ongoingDeadlines.length > 0 ? `\n• [时限进行中] ${ongoingDeadlines.map(d => `[${EVENT_TYPE_CONFIG[d.event.type].label}] ${d.event.title} (剩${d.diffDays}天)`).join('、')}` : ''}`
                  : dateStr
              }
            >
              {/* 日期数字行 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', height: '20px', flexShrink: 0, width: '100%' }}>
                <span style={{ 
                  width: '20px', 
                  height: '20px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: '50%',
                  backgroundColor: isToday ? 'var(--primary, #3b82f6)' : (isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent'),
                  color: isToday ? '#ffffff' : (isSelected ? 'var(--primary)' : 'var(--text-primary)'),
                  fontWeight: isToday || isSelected ? 700 : 500,
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  {dayObj.dayNumber}
                </span>

                {totalItemsCount > 0 && (
                  <span className={styles.desktopCount} style={{ 
                    fontSize: '9.5px', 
                    fontWeight: 700, 
                    color: isToday ? 'var(--primary)' : 'var(--text-tertiary)',
                    paddingRight: '1px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {totalItemsCount} 项
                  </span>
                )}
              </div>
              
              {/* 1. 桌面端：当天直接日程渲染完整卡片，截止前按类型独立显示漏斗胶囊 */}
              <div className={styles.desktopContent}>
                {directEvents.length === 0 && ongoingDeadlines.length > 0 ? (
                  /* 仅有时限进行中：默认按类型独立展示倒计时胶囊（紫色笔试、黄色面试等），点击展开直接显示日程，再次点击日程即可收起 */
                  !isOngoingExpanded ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {groupedOngoing.map(([type, items]) => {
                        const typeConf = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.other;
                        return (
                          <button 
                            key={type}
                            type="button"
                            onClick={(e) => toggleOngoingExpand(dateStr, e)}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '10px',
                              backgroundColor: typeConf.bgColor,
                              color: typeConf.color,
                              border: `1px solid ${typeConf.borderColor}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              width: 'fit-content',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              transition: 'transform 0.1s ease, background-color 0.15s ease',
                            }}
                            title={`${items.length}条${typeConf.label}时限（点击展开查看）`}
                          >
                            <Hourglass size={10} color={typeConf.color} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '10px', lineHeight: 1 }}>{items.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* 展开状态：直接按事件自身类型颜色（面试黄色、笔试紫色、截止红色）显示日程卡片，点击直接收起 */
                    <div 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '2px', 
                        width: '100%', 
                        marginTop: '1px',
                        overflow: 'hidden'
                      }}
                    >
                      {ongoingDeadlines.slice(0, 2).map(({ event: ev, diffDays }) => {
                        const typeConf = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.other;
                        return (
                          <div 
                            key={ev.id}
                            onClick={(e) => toggleOngoingExpand(dateStr, e)}
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              backgroundColor: typeConf.bgColor,
                              borderRadius: '4px',
                              padding: '2px 5px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              border: `1px solid ${typeConf.borderColor}`,
                              borderLeft: `3px solid ${typeConf.color}`,
                              lineHeight: 1.2,
                              cursor: 'pointer',
                              transition: 'all 0.1s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '4px',
                              boxSizing: 'border-box'
                            }}
                            title={`[${typeConf.label}] ${ev.title} (剩${diffDays}天) · 点击收起`}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {ev.title}
                            </span>
                            <span style={{ color: typeConf.color, fontSize: '9.5px', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                              ({diffDays}天)
                            </span>
                          </div>
                        );
                      })}
                      {ongoingDeadlines.length > 2 && (
                        <div 
                          onClick={(e) => toggleOngoingExpand(dateStr, e)}
                          style={{ 
                            fontSize: '9px', 
                            color: 'var(--text-secondary)', 
                            fontWeight: 600, 
                            cursor: 'pointer', 
                            textAlign: 'center', 
                            padding: '1px 0',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          +{ongoingDeadlines.length - 2}项 · 点击收起
                        </div>
                      )}
                    </div>
                  )
                ) : directEvents.length === 1 ? (
                  /* 1个直接日程 + 可选的时限分立漏斗图标/展开 */
                  <>
                    {(() => {
                      const ev = directEvents[0];
                      const typeConf = EVENT_TYPE_CONFIG[ev.type];
                      const timeLabel = ev.isCompleted 
                        ? '✓已完成' 
                        : ev.timeType === 'deadline' 
                          ? `截止${ev.time ? ev.time.slice(0, 5) : '23:59'}` 
                          : ev.timeType === 'all_day' 
                            ? '全天' 
                            : ev.time ? ev.time.slice(0, 5) : '全天';

                      return (
                        <div 
                          style={{
                            padding: '2px 5px',
                            borderRadius: '4px',
                            backgroundColor: ev.isCompleted ? 'rgba(16, 185, 129, 0.1)' : typeConf.bgColor,
                            color: ev.isCompleted ? '#10b981' : typeConf.color,
                            border: `1px solid ${ev.isCompleted ? 'rgba(16, 185, 129, 0.3)' : typeConf.borderColor}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1px',
                            overflow: 'hidden',
                            lineHeight: 1.2,
                            boxSizing: 'border-box',
                            opacity: ev.isCompleted ? 0.78 : 1
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3px' }}>
                            <span style={{ 
                              fontSize: '9.5px', 
                              fontWeight: 700, 
                              color: ev.isCompleted ? '#10b981' : typeConf.color, 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '2px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}>
                              <span style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', backgroundColor: ev.isCompleted ? '#10b981' : typeConf.color, flexShrink: 0 }} />
                              {timeLabel}
                            </span>
                            <span style={{ 
                              fontSize: '9px', 
                              fontWeight: 600, 
                              color: ev.isCompleted ? '#10b981' : typeConf.color, 
                              opacity: 0.9,
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}>
                              {typeConf.label}
                            </span>
                          </div>
                          <div style={{ 
                            fontSize: '11px', 
                            fontWeight: 600, 
                            color: ev.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap', 
                            width: '100%',
                            textDecoration: ev.isCompleted ? 'line-through' : 'none'
                          }}>
                            {ev.title}
                          </div>
                        </div>
                      );
                    })()}
                    {ongoingDeadlines.length > 0 && (
                      !isOngoingExpanded ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap', marginTop: '1px' }}>
                          {groupedOngoing.map(([type, items]) => {
                            const typeConf = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.other;
                            return (
                              <button 
                                key={type}
                                type="button"
                                onClick={(e) => toggleOngoingExpand(dateStr, e)}
                                style={{
                                  fontSize: '9.5px',
                                  color: typeConf.color,
                                  backgroundColor: typeConf.bgColor,
                                  border: `1px solid ${typeConf.borderColor}`,
                                  borderRadius: '10px',
                                  padding: '1px 5px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  width: 'fit-content',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0
                                }}
                                title={`${items.length}条${typeConf.label}时限（点击展开）`}
                              >
                                <Hourglass size={9} color={typeConf.color} style={{ flexShrink: 0 }} />
                                <span>{items.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div 
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '2px', 
                            width: '100%', 
                            marginTop: '1px',
                            overflow: 'hidden'
                          }}
                        >
                          {ongoingDeadlines.slice(0, 1).map(({ event: ev, diffDays }) => {
                            const typeConf = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.other;
                            return (
                              <div 
                                key={ev.id}
                                onClick={(e) => toggleOngoingExpand(dateStr, e)}
                                style={{
                                  fontSize: '9.5px',
                                  color: typeConf.color,
                                  backgroundColor: typeConf.bgColor,
                                  border: `1px dashed ${typeConf.borderColor}`,
                                  borderRadius: '4px',
                                  padding: '1px 4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  fontWeight: 600,
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  cursor: 'pointer'
                                }}
                                title={`[${typeConf.label}] ${ev.title} (剩${diffDays}天) · 点击收起`}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <Hourglass size={8} color={typeConf.color} style={{ flexShrink: 0 }} />
                                  {ev.title} ({diffDays}天)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </>
                ) : directEvents.length === 2 ? (
                  /* 2个直接日程 */
                  <>
                    {directEvents.map(ev => {
                      const typeConf = EVENT_TYPE_CONFIG[ev.type];
                      const timeLabel = ev.isCompleted 
                        ? '✓' 
                        : ev.timeType === 'deadline' 
                          ? (ev.time ? `截止 ${ev.time.slice(0, 5)}` : '截止') 
                          : ev.timeType === 'all_day' 
                            ? '全天' 
                            : ev.time ? ev.time.slice(0, 5) : '全天';

                      return (
                        <div 
                          key={ev.id}
                          style={{
                            padding: '1px 4px',
                            borderRadius: '4px',
                            backgroundColor: ev.isCompleted ? 'rgba(16, 185, 129, 0.08)' : typeConf.bgColor,
                            color: ev.isCompleted ? '#10b981' : typeConf.color,
                            border: `1px solid ${ev.isCompleted ? 'rgba(16, 185, 129, 0.25)' : typeConf.borderColor}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1px',
                            overflow: 'hidden',
                            lineHeight: '1.15',
                            boxSizing: 'border-box',
                            height: '28px',
                            opacity: ev.isCompleted ? 0.78 : 1
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: ev.isCompleted ? '#10b981' : typeConf.color, display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: ev.isCompleted ? '#10b981' : typeConf.color, flexShrink: 0 }} />
                              {timeLabel}
                            </span>
                            <span style={{ fontSize: '8.5px', fontWeight: 600, color: ev.isCompleted ? '#10b981' : typeConf.color, opacity: 0.9, whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {typeConf.label}
                            </span>
                          </div>
                          <div style={{ 
                            fontSize: '10.5px', 
                            fontWeight: 600, 
                            color: ev.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap', 
                            textDecoration: ev.isCompleted ? 'line-through' : 'none'
                          }}>
                            {ev.title}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : directEvents.length >= 3 ? (
                  /* 3个及以上直接日程：渲染前 2 条 + 更多徽章 */
                  <>
                    {directEvents.slice(0, 2).map(ev => {
                      const typeConf = EVENT_TYPE_CONFIG[ev.type];
                      const timeLabel = ev.isCompleted 
                        ? '✓' 
                        : ev.timeType === 'deadline' 
                          ? (ev.time ? `截止 ${ev.time.slice(0, 5)}` : '截止') 
                          : ev.timeType === 'all_day' 
                            ? '全天' 
                            : ev.time ? ev.time.slice(0, 5) : '';

                      return (
                        <div 
                          key={ev.id}
                          style={{
                            padding: '1px 4px',
                            borderRadius: '4px',
                            backgroundColor: ev.isCompleted ? 'rgba(16, 185, 129, 0.08)' : typeConf.bgColor,
                            color: ev.isCompleted ? '#10b981' : typeConf.color,
                            border: `1px solid ${ev.isCompleted ? 'rgba(16, 185, 129, 0.25)' : typeConf.borderColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            overflow: 'hidden',
                            lineHeight: '1.15',
                            boxSizing: 'border-box',
                            height: '19px',
                            opacity: ev.isCompleted ? 0.78 : 1
                          }}
                        >
                          <span style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', backgroundColor: ev.isCompleted ? '#10b981' : typeConf.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '9px', fontWeight: 700, color: ev.isCompleted ? '#10b981' : typeConf.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
                            {timeLabel}
                          </span>
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: 600, 
                            color: ev.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap', 
                            flex: 1,
                            textDecoration: ev.isCompleted ? 'line-through' : 'none'
                          }}>
                            {ev.title}
                          </span>
                        </div>
                      );
                    })}
                    <div style={{ 
                      fontSize: '9.5px', 
                      color: 'var(--primary)', 
                      fontWeight: 600, 
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      borderRadius: '4px',
                      textAlign: 'center', 
                      padding: '1px 0',
                      height: '17px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      whiteSpace: 'nowrap'
                    }}>
                      +{directEvents.length - 2 + (ongoingDeadlines.length > 0 ? 1 : 0)} 项更多
                    </div>
                  </>
                ) : null}
              </div>

              {/* 2. 移动端：展示紧凑的彩色事件圆点指示器 */}
              <div className={styles.mobileContent}>
                {directEvents.slice(0, 3).map((ev) => {
                  const typeConf = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.other;
                  const dotColor = ev.isCompleted ? '#10b981' : typeConf.color;
                  return (
                    <span
                      key={ev.id}
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        flexShrink: 0,
                      }}
                      title={ev.title}
                    />
                  );
                })}
                {ongoingDeadlines.length > 0 && directEvents.length < 3 && (
                  <Hourglass 
                    size={8} 
                    color={EVENT_TYPE_CONFIG[ongoingDeadlines[0].event.type]?.color || 'var(--text-tertiary)'} 
                    style={{ flexShrink: 0 }} 
                  />
                )}
                {totalItemsCount > 3 && (
                  <span style={{ fontSize: '7.5px', lineHeight: 1, fontWeight: 700, color: 'var(--text-tertiary)' }}>
                    +
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部日程类型图例指示 */}
      <footer className={styles.footer}>
        {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: config.color }} />
            <span>{config.label}</span>
          </div>
        ))}
      </footer>
    </div>
  );
};



