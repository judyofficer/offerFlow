import React, { useState } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useApplicationStore } from '../../store/useApplicationStore';
import { useScheduleStore } from '../../../schedule/store/useScheduleStore';
import type { EventType } from '../../../schedule/types/schedule';
import { STATUS_CONFIG } from '../../types/application';
import type { ApplicationStatus } from '../../types/application';
import { ApplicationCard } from '../../components/ApplicationCard';
import { ApplicationDetailPanel } from '../../components/ApplicationDetailPanel';
import styles from './Applications.module.css';

const COLUMNS: ApplicationStatus[] = ['applied', 'oa', 'interview', 'hr', 'offer', 'rejected'];

const Applications: React.FC = () => {
  const { applications, addApplication, updateApplicationStatus } = useApplicationStore();
  const { addEvent } = useScheduleStore();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Add Application Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ companyName: '', jobTitle: '' });

  // Schedule Prompt Modal State
  const [scheduleModalState, setScheduleModalState] = useState<{
    isOpen: boolean;
    appId: string;
    status: ApplicationStatus;
  } | null>(null);
  const [scheduleFormData, setScheduleFormData] = useState<{
    title: string;
    type: EventType;
    date: string;
    time: string;
    notes: string;
  }>({
    title: '',
    type: 'interview',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    notes: ''
  });

  const handleAddNew = () => {
    setAddFormData({ companyName: '', jobTitle: '' });
    setAddModalOpen(true);
  };

  const submitAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.companyName.trim() || !addFormData.jobTitle.trim()) return;
    
    addApplication({
      companyName: addFormData.companyName.trim(),
      jobTitle: addFormData.jobTitle.trim(),
      jobDescription: '',
      status: 'applied'
    });
    setAddModalOpen(false);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as ApplicationStatus;
    updateApplicationStatus(draggableId, newStatus);

    if (newStatus !== source.droppableId && ['oa', 'interview', 'hr', 'offer'].includes(newStatus)) {
      setTimeout(() => {
        const app = applications.find(a => a.id === draggableId);
        setScheduleFormData({
          title: `${app?.companyName || ''} - ${STATUS_CONFIG[newStatus].label}`,
          type: newStatus === 'oa' ? 'oa' : (newStatus === 'offer' ? 'deadline' : 'interview'),
          date: new Date().toISOString().split('T')[0],
          time: '14:00',
          notes: ''
        });
        setScheduleModalState({ isOpen: true, appId: draggableId, status: newStatus });
      }, 50);
    }
  };

  const submitScheduleEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalState) return;
    addEvent({
      ...scheduleFormData,
      applicationId: scheduleModalState.appId,
    });
    setScheduleModalState(null);
  };

  const kanbanRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = kanbanRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className="text-h1">投递记录看板</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>追踪所有的岗位投递状态与进展，支持拖拽改变状态。</p>
        </div>
        <button className="btn btn-accent" onClick={handleAddNew}>
          <Plus size={16} /> 添加岗位
        </button>
      </header>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={styles.kanbanBoard} ref={kanbanRef}>
          {COLUMNS.map(status => {
            const config = STATUS_CONFIG[status];
            const columnApps = applications.filter(app => app.status === status);
            
            return (
              <div key={status} className={styles.column}>
                <div className={styles.columnHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: config.color }}></span>
                    {config.label}
                  </div>
                  <span className={styles.columnBadge}>{columnApps.length}</span>
                </div>
                
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div 
                      className={styles.cardList}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{ 
                        backgroundColor: snapshot.isDraggingOver ? 'var(--bg-secondary)' : 'transparent',
                        minHeight: '200px',
                        transition: 'background-color 0.2s ease',
                        flex: 1,
                      }}
                    >
                      {columnApps.map((app, index) => (
                        <Draggable key={app.id} draggableId={app.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                marginBottom: '12px',
                              }}
                            >
                              <ApplicationCard 
                                application={app} 
                                onClick={() => setSelectedAppId(app.id)}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Slide-over Detail Panel */}
      {selectedAppId && (
        <ApplicationDetailPanel 
          appId={selectedAppId} 
          onClose={() => setSelectedAppId(null)} 
        />
      )}

      {/* Add Application Modal */}
      {addModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', width: '400px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="text-h3">添加岗位</h3>
              <button onClick={() => setAddModalOpen(false)} className="btn btn-ghost btn-icon"><X size={20} /></button>
            </div>
            <form onSubmit={submitAddNew}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>公司名称</label>
                <input required autoFocus className={styles.input} placeholder="例如：字节跳动" value={addFormData.companyName} onChange={e => setAddFormData({...addFormData, companyName: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>投递岗位</label>
                <input required className={styles.input} placeholder="例如：前端开发工程师" value={addFormData.jobTitle} onChange={e => setAddFormData({...addFormData, jobTitle: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-outline">取消</button>
                <button type="submit" className="btn btn-primary">确认添加</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Prompt Modal */}
      {scheduleModalState && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', width: '450px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={20} color="var(--primary)" /> 添加日程提醒</h3>
              <button onClick={() => setScheduleModalState(null)} className="btn btn-ghost btn-icon"><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
              岗位状态已推进至 <strong>{STATUS_CONFIG[scheduleModalState.status].label}</strong>，建议您为其添加一条日程安排以免遗忘。
            </p>
            <form onSubmit={submitScheduleEvent}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>日程标题</label>
                <input required className={styles.input} value={scheduleFormData.title} onChange={e => setScheduleFormData({...scheduleFormData, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>日期</label>
                  <input type="date" required className={styles.input} value={scheduleFormData.date} onChange={e => setScheduleFormData({...scheduleFormData, date: e.target.value})} onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', colorScheme: 'dark', cursor: 'pointer' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>时间</label>
                  <input type="time" required className={styles.input} value={scheduleFormData.time} onChange={e => setScheduleFormData({...scheduleFormData, time: e.target.value})} onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', colorScheme: 'dark', cursor: 'pointer' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setScheduleModalState(null)} className="btn btn-outline">暂不添加</button>
                <button type="submit" className="btn btn-primary">保存日程</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
