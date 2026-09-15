import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarView, type TimeFilterMode } from '../../components/CalendarView';
import { EventList } from '../../components/EventList';
import { EventDetailPanel } from '../../components/EventDetailPanel';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useApplicationStore } from '../../../applications/store/useApplicationStore';
import { isEventMatchingCompany, getEventCompanyName } from '../../utils/companyMatcher';
import styles from './Schedule.module.css';

const Schedule: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAppId = searchParams.get('createFor');
  
  const { events } = useScheduleStore();
  const { applications } = useApplicationStore();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilterMode>('all');
  
  // Modal state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // 1. 获取所有有日程或有投递记录的公司列表
  const availableCompanies = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events) {
      const comp = getEventCompanyName(event, applications);
      map.set(comp, (map.get(comp) || 0) + 1);
    }
    // 也补充投递列表中的公司（如果日程中尚未创建）
    for (const app of applications) {
      if (app.companyName && !map.has(app.companyName)) {
        map.set(app.companyName, 0);
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
  }, [events, applications]);

  // 2. 根据选中的公司过滤日程
  const filteredEvents = useMemo(() => {
    if (selectedCompany === 'all') return events;
    return events.filter(e => isEventMatchingCompany(e, selectedCompany, applications));
  }, [events, selectedCompany, applications]);

  useEffect(() => {
    if (initialAppId) {
      setIsPanelOpen(true);
      setEditingEventId(null);
      // clear the param so it doesn't re-open on refresh
      setSearchParams({});
    }
  }, [initialAppId, setSearchParams]);

  const handleAddEvent = () => {
    setEditingEventId(null);
    setIsPanelOpen(true);
  };

  const handleEditEvent = (id: string) => {
    setEditingEventId(id);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setEditingEventId(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="text-h1">日程管理</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>统筹所有的笔试、面试安排与 Offer 截止时间。</p>
      </header>

      <div className={styles.content}>
        <div className={styles.calendarPane}>
          <CalendarView 
            events={filteredEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedCompany={selectedCompany}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
          />
        </div>
        <div className={styles.listPane}>
          <EventList 
            events={filteredEvents}
            allEvents={events}
            selectedDate={selectedDate}
            onAddEvent={handleAddEvent}
            onEditEvent={handleEditEvent}
            selectedCompany={selectedCompany}
            onSelectCompany={setSelectedCompany}
            availableCompanies={availableCompanies}
            timeFilter={timeFilter}
          />
        </div>
      </div>

      {isPanelOpen && (
        <EventDetailPanel 
          eventId={editingEventId}
          initialDate={selectedDate}
          initialAppId={initialAppId || undefined}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
};

export default Schedule;
