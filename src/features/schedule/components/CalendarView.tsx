import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Hourglass } from 'lucide-react';
import type { ScheduleEvent, EventType } from '../types/schedule';
import { EVENT_TYPE_CONFIG } from '../types/schedule';
import styles from './CalendarView.module.css';

export type TimeFilterMode = 'all' | 'specific' | 'deadline';

interface Props {
  events: ScheduleEvent[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  selectedCompany?: string;
  timeFilter?: TimeFilterMode;
  onTimeFilterChange?: (mode: TimeFilterMode) => void;
}

const formatDateToLocalString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const CalendarView: React.FC<Props> = ({ 
  events, 
  selectedDate, 
  onSelectDate, 
  selectedCompany,
  timeFilter: controlledTimeFilter,
  onTimeFilterChange
}) => {
  const initialDate = useMemo(() => selectedDate ? new Date(selectedDate) : new Date(), []);
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [internalTimeFilter, setInternalTimeFilter] = useState<TimeFilterMode>('all');

  const activeTimeFilter = controlledTimeFilter !== undefined ? controlledTimeFilter : internalTimeFilter;

  const handleTimeFilterChange = (mode: TimeFilterMode) => {
    if (onTimeFilterChange) {
      onTimeFilterChange(mode);
    } else {
      setInternalTimeFilter(mode);
    }
  };

  const todayStr = useMemo(() => formatDateToLocalString(new Date()), []);

  // 0. 时限任务 vs 固定时间任务 筛选过滤
  const filteredEventsByTime = useMemo(() => {
    if (activeTimeFilter === 'all') return events;
    if (activeTimeFilter === 'deadline') {
      return events.filter(e => e.timeType === 'deadline' || e.type === 'deadline');
    }
    return events.filter(e => e.timeType !== 'deadline' && e.type !== 'deadline');
  }, [events, activeTimeFilter]);

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

  // 2. 将 filteredEventsByTime 数组按日期索引为：当天的直接日程 (directEvents) 与截止前的进行中时限 (ongoingDeadlines)
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

    for (let i = 0; i < filteredEventsByTime.length; i++) {
      const ev = filteredEventsByTime[i];
      // 1. 当天的直接日程（截止日当天或具体时刻日程）
      getEntry(ev.date).directEvents.push(ev);

      // 2. 截止前进行中的时限日程：
      // 规则：
      // - 仅在「全部」全览模式 (activeTimeFilter === 'all') 下展示小圆点（单选时限任务或固定时间时不显示圆点）
      // - 仅在未完成 (isCompleted === false) 时展示
      // - 以当日 (todayStr) 为准，当日之前的历史日期 (currStr < todayStr) 不显示小圆点
      const isDeadline = ev.timeType === 'deadline' || ev.type === 'deadline';
      if (activeTimeFilter === 'all' && isDeadline && !ev.isCompleted) {
        const startStr = ev.startDate || ev.date;
        if (startStr < ev.date) {
          const [y1, m1, d1] = startStr.split('-').map(Number);
          const [y2, m2, d2] = ev.date.split('-').map(Number);
          const curr = new Date(y1, m1 - 1, d1);
          const end = new Date(y2, m2 - 1, d2);

          while (curr < end) {
            const currStr = formatDateToLocalString(curr);
            // 必须是当天及之后，且在截止日之前
            if (currStr >= todayStr && currStr < ev.date) {
              const diffDays = Math.round((end.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
              getEntry(currStr).ongoingDeadlines.push({ event: ev, diffDays });
            }
            curr.setDate(curr.getDate() + 1);
          }
        }
      }
    }

    // 单元格内分开呈现排序：未完成固定时间 -> 未完成时限任务 -> 已完成固定时间 -> 已完成时限任务
    map.forEach(entry => {
      entry.directEvents.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        const aDeadline = a.timeType === 'deadline' || a.type === 'deadline';
        const bDeadline = b.timeType === 'deadline' || b.type === 'deadline';
        if (aDeadline !== bDeadline) {
          return aDeadline ? 1 : -1; // 固定时间优先置顶展示
        }
        return (a.time || '00:00').localeCompare(b.time || '00:00');
      });
    });

    return map;
  }, [filteredEventsByTime, activeTimeFilter, todayStr]);

  // 3. 统计当月日程总数
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthEventCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < filteredEventsByTime.length; i++) {
      if (filteredEventsByTime[i].date.startsWith(currentMonthPrefix)) {
        count++;
      }
    }
    return count;
  }, [filteredEventsByTime, currentMonthPrefix]);

  const filterBadgeLabel = useMemo(() => {
    const parts: string[] = [];
    if (activeTimeFilter === 'specific') parts.push('固定时间');
    if (activeTimeFilter === 'deadline') parts.push('时限任务');
    if (selectedCompany && selectedCompany !== 'all') parts.push(selectedCompany);
    return parts.length > 0 ? ` · ${parts.join(' · ')}` : '';
  }, [activeTimeFilter, selectedCompany]);

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
      {/* 头部控制栏：年月切换 + 时限/固定时间筛选 + 今天快捷定位 */}
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
                  本月 {monthEventCount} 项{filterBadgeLabel}
                </span>
              )}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* 时限任务 vs 固定时间任务 分开显示切换器 */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-secondary)',
            padding: '2px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            gap: '2px'
          }}>
            {[
              { key: 'all' as TimeFilterMode, label: '全部' },
              { key: 'specific' as TimeFilterMode, label: '固定时间' },
              { key: 'deadline' as TimeFilterMode, label: '时限任务' },
            ].map(tab => {
              const active = activeTimeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTimeFilterChange(tab.key)}
                  style={{
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11.5px',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    backgroundColor: active ? 'var(--primary)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                  title={tab.key === 'specific' ? '仅显示固定时刻日程（如面试/笔试会议）' : (tab.key === 'deadline' ? '仅显示截止时限任务（如笔试测评/Offer决策截止）' : '显示全部日程')}
                >
                  {tab.key === 'deadline' && <Hourglass size={10.5} style={{ opacity: active ? 1 : 0.7 }} />}
                  {tab.label}
                </button>
              );
            })}
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
          gridTemplateRows: `repeat(${weekCount}, 1fr)`,
          ['--week-count' as any]: weekCount
        }}
      >
        {days.map((dayObj) => {
          if (dayObj.isEmptyPlaceholder) {
            return (
              <div 
                key={dayObj.dateStr}
                className={styles.placeholder}
              />
            );
          }

          const dateStr = dayObj.dateStr;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const cellData = calendarDataByDate.get(dateStr) || { directEvents: [], ongoingDeadlines: [] };
          const { directEvents, ongoingDeadlines } = cellData;
          const totalItemsCount = directEvents.length + ongoingDeadlines.length;

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
                padding: '5px 6px',
              }}
              title={
                totalItemsCount > 0 
                  ? `${dateStr}：\n${directEvents.map(e => `• ${e.time ? `${e.time} ` : ''}[${EVENT_TYPE_CONFIG[e.type].label}] ${e.title}${(e.timeType === 'deadline' || e.type === 'deadline') ? ' (时限任务)' : ''}`).join('\n')}${ongoingDeadlines.length > 0 ? `\n• [时限进行中] ${ongoingDeadlines.map(d => `[${EVENT_TYPE_CONFIG[d.event.type].label}] ${d.event.title} (剩${d.diffDays}天)`).join('、')}` : ''}`
                  : dateStr
              }
            >
              {/* 日期数字行 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', height: '20px', flexShrink: 0, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
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

                  {/* 时限进行中指示圆点：在日期数字旁以轻量精致彩点展示，不占下方卡片空间 */}
                  {ongoingDeadlines.length > 0 && (
                    <div 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0 }} 
                      title={`时限进行中：\n${ongoingDeadlines.map(d => `• [${EVENT_TYPE_CONFIG[d.event.type]?.label}] ${d.event.title} (剩${d.diffDays}天)`).join('\n')}`}
                    >
                      {groupedOngoing.slice(0, 3).map(([type, items]) => {
                        const typeConf = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.other;
                        return (
                          <span
                            key={type}
                            style={{
                              width: '5.5px',
                              height: '5.5px',
                              borderRadius: '50%',
                              backgroundColor: typeConf.color,
                              boxShadow: `0 0 0 1px ${typeConf.borderColor}`,
                              flexShrink: 0,
                              display: 'inline-block'
                            }}
                            title={`${items.length}条${typeConf.label}时限进行中 (点击查看详情)`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {directEvents.length > 0 && (
                  <span className={styles.desktopCount} style={{ 
                    fontSize: '10px', 
                    fontWeight: 700, 
                    color: isToday ? 'var(--primary)' : 'var(--text-tertiary)',
                    paddingRight: '1px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {directEvents.length} 项
                  </span>
                )}
              </div>
              
              {/* 1. 桌面端：只渲染当天的直接日程卡片，获得最大垂直与横向显示空间 */}
              <div className={styles.desktopContent}>
                {directEvents.length === 1 ? (
                  /* 单项直接日程：渲染高可读性的精致双行卡片 */
                  (() => {
                    const ev = directEvents[0];
                    const typeConf = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.other;
                    const isDeadline = ev.timeType === 'deadline' || ev.type === 'deadline';
                    const timeLabel = ev.isCompleted 
                      ? '✓已完成' 
                      : ev.timeType === 'deadline' 
                        ? `截止 ${ev.time ? ev.time.slice(0, 5) : '23:59'}` 
                        : ev.timeType === 'all_day' 
                          ? '全天' 
                          : ev.time ? ev.time.slice(0, 5) : '全天';

                    return (
                      <div 
                        style={{
                          padding: '3px 6px',
                          borderRadius: '5px',
                          backgroundColor: ev.isCompleted ? 'rgba(16, 185, 129, 0.08)' : typeConf.bgColor,
                          color: ev.isCompleted ? '#10b981' : typeConf.color,
                          border: `1px solid ${ev.isCompleted ? 'rgba(16, 185, 129, 0.25)' : typeConf.borderColor}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1.5px',
                          overflow: 'hidden',
                          lineHeight: 1.25,
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
                            fontSize: '8.5px', 
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
                          fontSize: '11.5px', 
                          fontWeight: 600, 
                          color: ev.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '4px',
                          width: '100%',
                          textDecoration: ev.isCompleted ? 'line-through' : 'none'
                        }}>
                          <span style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap', 
                            flex: 1,
                            minWidth: 0 
                          }}>
                            {ev.title}
                          </span>
                          {isDeadline && (
                            <span 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                flexShrink: 0,
                                opacity: 0.85,
                                color: ev.isCompleted ? '#10b981' : typeConf.color 
                              }} 
                              title={`时限任务 (最晚截止 ${ev.time || '23:59'})`}
                            >
                              <Hourglass size={11} />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : directEvents.length >= 2 ? (
                  /* 2项及以上直接日程：渲染单行高密度胶囊，优先展示日程名称 */
                  (() => {
                    const visibleDirect = directEvents.slice(0, 2);
                    const remainingDirectCount = directEvents.length - 2;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5px', overflow: 'hidden', width: '100%' }}>
                        {visibleDirect.map(ev => {
                          const typeConf = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.other;
                          const isDeadline = ev.timeType === 'deadline' || ev.type === 'deadline';

                          return (
                            <div 
                              key={ev.id}
                              style={{
                                padding: '2px 5px',
                                borderRadius: '4px',
                                backgroundColor: ev.isCompleted ? 'rgba(16, 185, 129, 0.08)' : typeConf.bgColor,
                                color: ev.isCompleted ? '#10b981' : typeConf.color,
                                border: `1px solid ${ev.isCompleted ? 'rgba(16, 185, 129, 0.25)' : typeConf.borderColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3.5px',
                                overflow: 'hidden',
                                lineHeight: 1.15,
                                boxSizing: 'border-box',
                                height: '21px',
                                opacity: ev.isCompleted ? 0.78 : 1,
                                flexShrink: 0
                              }}
                              title={`${ev.time ? `${ev.time} ` : ''}[${typeConf.label}] ${ev.title}${isDeadline ? ' (时限任务)' : ''}`}
                            >
                              <span style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', backgroundColor: ev.isCompleted ? '#10b981' : typeConf.color, flexShrink: 0 }} />
                              {ev.isCompleted && (
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#10b981', flexShrink: 0 }}>✓</span>
                              )}
                              <span style={{ 
                                fontSize: '11px', 
                                fontWeight: 600, 
                                color: ev.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap', 
                                flex: 1,
                                minWidth: 0,
                                textDecoration: ev.isCompleted ? 'line-through' : 'none'
                              }}>
                                {ev.title}
                              </span>
                              {isDeadline && (
                                <span 
                                  style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    flexShrink: 0,
                                    opacity: 0.85,
                                    color: ev.isCompleted ? '#10b981' : typeConf.color 
                                  }} 
                                  title={`时限任务 (最晚截止 ${ev.time || '23:59'})`}
                                >
                                  <Hourglass size={10} />
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {remainingDirectCount > 0 && (
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
                            +{remainingDirectCount} 项更多
                          </div>
                        )}
                      </div>
                    );
                  })()
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
                {ongoingDeadlines.length > 0 && (
                  groupedOngoing.slice(0, 2).map(([type]) => (
                    <span
                      key={type}
                      style={{
                        width: '3.5px',
                        height: '3.5px',
                        borderRadius: '50%',
                        backgroundColor: EVENT_TYPE_CONFIG[type]?.color || 'var(--text-tertiary)',
                        opacity: 0.85,
                        flexShrink: 0,
                      }}
                      title="时限进行中"
                    />
                  ))
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          <Hourglass size={12} color="var(--primary)" />
          <span>时限任务</span>
        </div>
      </footer>
    </div>
  );
};


