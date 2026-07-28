import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useApplicationStore } from '../../store/useApplicationStore';
import { STATUS_CONFIG } from '../../types/application';
import type { ApplicationStatus } from '../../types/application';
import { ApplicationCard } from '../../components/ApplicationCard';
import { ApplicationDetailPanel } from '../../components/ApplicationDetailPanel';
import styles from './Applications.module.css';

const COLUMNS: ApplicationStatus[] = ['applied', 'oa', 'interview', 'hr', 'offer', 'rejected'];

const Applications: React.FC = () => {
  const { applications, addApplication, updateApplicationStatus } = useApplicationStore();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const handleAddNew = () => {
    const company = prompt('请输入公司名称:');
    if (!company) return;
    const title = prompt('请输入投递岗位:');
    if (!title) return;
    
    addApplication({
      companyName: company,
      jobTitle: title,
      jobDescription: '',
      status: 'applied'
    });
  };

  const navigate = useNavigate();

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as ApplicationStatus;
    updateApplicationStatus(draggableId, newStatus);

    if (newStatus !== source.droppableId && ['oa', 'interview', 'hr', 'offer'].includes(newStatus)) {
      setTimeout(() => {
        if (confirm(`已将状态推进至 [${STATUS_CONFIG[newStatus].label}]，是否需要在日历中添加日程提醒？`)) {
          navigate(`/schedule?createFor=${draggableId}`);
        }
      }, 50);
    }
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
        <button className={styles.button} onClick={handleAddNew}>
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
    </div>
  );
};

export default Applications;
