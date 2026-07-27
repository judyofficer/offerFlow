import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarView } from '../../components/CalendarView';
import { EventList } from '../../components/EventList';
import { EventDetailPanel } from '../../components/EventDetailPanel';
import { useScheduleStore } from '../../store/useScheduleStore';
import styles from './Schedule.module.css';

const Schedule: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAppId = searchParams.get('createFor');
  
  const { events } = useScheduleStore();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Modal state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
        <div className={styles.listPane}>
          <EventList 
            events={events}
            selectedDate={selectedDate}
            onAddEvent={handleAddEvent}
            onEditEvent={handleEditEvent}
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
