import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, X, Calendar, Search, LayoutGrid, TableProperties } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useApplicationStore } from '../../store/useApplicationStore';
import { useScheduleStore } from '../../../schedule/store/useScheduleStore';
import type { EventType } from '../../../schedule/types/schedule';
import { STATUS_CONFIG } from '../../types/application';
import type { ApplicationStatus, ApplicationPriority } from '../../types/application';
import { ApplicationCard } from '../../components/ApplicationCard';
import { ApplicationDetailPanel } from '../../components/ApplicationDetailPanel';
import { ApplicationTableView } from '../../components/ApplicationTableView';
import styles from './Applications.module.css';

const COLUMNS: ApplicationStatus[] = ['applied', 'oa', 'interview', 'hr', 'offer', 'rejected'];

export const Applications: React.FC = () => {
  const { applications, addApplication, updateApplicationStatus, updateApplication, deleteApplication } = useApplicationStore();
  const { addEvent } = useScheduleStore();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // 视图模式：'kanban' (看板) 或 'table' (表格)
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>(() => {
    return (localStorage.getItem('offerflow-app-view') as 'kanban' | 'table') || 'kanban';
  });

  const handleViewModeChange = (mode: 'kanban' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('offerflow-app-view', mode);
  };

  // 搜索与多维过滤
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Add Application Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState<{
    companyName: string;
    jobTitle: string;
    url: string;
    priority: ApplicationPriority;
  }>({
    companyName: '',
    jobTitle: '',
    url: '',
    priority: 'target'
  });

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
    setAddFormData({ companyName: '', jobTitle: '', url: '', priority: 'target' });
    setAddModalOpen(true);
  };

  const submitAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.companyName.trim() || !addFormData.jobTitle.trim()) return;
    
    addApplication({
      companyName: addFormData.companyName.trim(),
      jobTitle: addFormData.jobTitle.trim(),
      url: addFormData.url.trim(),
      priority: addFormData.priority,
      jobDescription: '',
      status: 'applied'
    });
    setAddModalOpen(false);
  };

  const triggerSchedulePrompt = (appId: string, status: ApplicationStatus) => {
    if (['oa', 'interview', 'hr', 'offer'].includes(status)) {
      setTimeout(() => {
        const app = applications.find(a => a.id === appId);
        setScheduleFormData({
          title: `${app?.companyName || ''} - ${STATUS_CONFIG[status].label}`,
          type: status === 'oa' ? 'oa' : (status === 'offer' ? 'deadline' : 'interview'),
          date: new Date().toISOString().split('T')[0],
          time: '14:00',
          notes: ''
        });
        setScheduleModalState({ isOpen: true, appId, status });
      }, 50);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as ApplicationStatus;
    updateApplicationStatus(draggableId, newStatus);

    if (newStatus !== source.droppableId) {
      triggerSchedulePrompt(draggableId, newStatus);
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

  // 过滤后的岗位数据
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // 1. 搜索过滤
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchCompany = (app.companyName || '').toLowerCase().includes(q);
        const matchTitle = (app.jobTitle || '').toLowerCase().includes(q);
        const matchLocation = (app.location || '').toLowerCase().includes(q);
        if (!matchCompany && !matchTitle && !matchLocation) return false;
      }
      // 2. 意向度过滤
      if (priorityFilter !== 'all') {
        const priority = app.priority || 'target';
        if (priority !== priorityFilter) return false;
      }
      // 3. 状态过滤 (在表格视图或全局过滤)
      if (statusFilter !== 'all') {
        if (app.status !== statusFilter) return false;
      }
      return true;
    });
  }, [applications, searchQuery, priorityFilter, statusFilter]);

  const kanbanRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      {/* 顶部标题栏 */}
      <header className={styles.header}>
        <div>
          <h1 className="text-h1">投递记录看板</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            追踪所有投递岗位进展，支持拖拽看板与高密度表格多维查阅。
          </p>
        </div>
        <button className="btn btn-accent" onClick={handleAddNew}>
          <Plus size={16} /> 添加岗位
        </button>
      </header>

      {/* 现代化多功能工具栏 */}
      <div className={styles.toolbar}>
        {/* 左侧：视图切换分段器 */}
        <div className={styles.segmentedControl}>
          <button
            type="button"
            className={`${styles.segmentBtn} ${viewMode === 'kanban' ? styles.activeSegment : ''}`}
            onClick={() => handleViewModeChange('kanban')}
          >
            <LayoutGrid size={15} /> 看板视图
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${viewMode === 'table' ? styles.activeSegment : ''}`}
            onClick={() => handleViewModeChange('table')}
          >
            <TableProperties size={15} /> 表格视图
          </button>
        </div>

        {/* 右侧：复合筛选与搜索 */}
        <div className={styles.filterGroup}>
          <div className={styles.searchInputWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="搜索公司 / 岗位 / 地点..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 意向梯队快筛 */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className={styles.filterSelect}
            title="按意向度 / 难度梯队筛选"
          >
            <option value="all">全部意向梯队</option>
            <option value="dream">冲刺 (重点)</option>
            <option value="target">主攻 (核心)</option>
            <option value="safety">保底 (稳健)</option>
          </select>

          {/* 状态快筛 */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
            title="按投递流转状态筛选"
          >
            <option value="all">全部投递状态</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* 匹配条数徽章 */}
          <span className={styles.countBadge}>
            共 {filteredApplications.length} 条记录
          </span>
        </div>
      </div>

      {/* 核心视图区域：根据 viewMode 切换看板或高密度表格 */}
      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className={styles.kanbanBoard} ref={kanbanRef}>
            {COLUMNS.map(status => {
              const columnApps = filteredApplications.filter(app => app.status === status);
              const config = STATUS_CONFIG[status];

              return (
                <div key={status} className={styles.column}>
                  <div className={styles.columnHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: config.color }} />
                      <span>{config.label}</span>
                    </div>
                    <span className={styles.columnBadge}>{columnApps.length}</span>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={styles.cardList}
                        style={{
                          backgroundColor: snapshot.isDraggingOver ? 'var(--bg-secondary)' : 'transparent',
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        {columnApps.map((app, index) => (
                          <Draggable key={app.id} draggableId={app.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
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
      ) : (
        <ApplicationTableView
          applications={filteredApplications}
          onSelectApp={(appId) => setSelectedAppId(appId)}
          onStatusChange={(appId, newStatus) => {
            updateApplicationStatus(appId, newStatus);
            triggerSchedulePrompt(appId, newStatus);
          }}
          onPriorityChange={(appId, newPriority) => {
            updateApplication(appId, { priority: newPriority });
          }}
          onAddSchedule={(app) => {
            setScheduleFormData({
              title: `${app.companyName} - ${STATUS_CONFIG[app.status]?.label || '面试'}`,
              type: app.status === 'oa' ? 'oa' : (app.status === 'offer' ? 'deadline' : 'interview'),
              date: new Date().toISOString().split('T')[0],
              time: '14:00',
              notes: ''
            });
            setScheduleModalState({ isOpen: true, appId: app.id, status: app.status });
          }}
          onDelete={(appId) => {
            const app = applications.find(a => a.id === appId);
            if (confirm(`确定要删除【${app?.companyName} - ${app?.jobTitle}】的投递记录吗？`)) {
              deleteApplication(appId);
            }
          }}
        />
      )}

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
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', width: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="text-h3">添加投递岗位</h3>
              <button onClick={() => setAddModalOpen(false)} className="btn btn-ghost btn-icon"><X size={20} /></button>
            </div>
            <form onSubmit={submitAddNew}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>公司名称</label>
                <input required autoFocus className={styles.input} placeholder="例如：字节跳动 / 招银网络" value={addFormData.companyName} onChange={e => setAddFormData({...addFormData, companyName: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>投递岗位</label>
                <input required className={styles.input} placeholder="例如：前端开发工程师" value={addFormData.jobTitle} onChange={e => setAddFormData({...addFormData, jobTitle: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>进度查询链接 (可选)</label>
                <input className={styles.input} placeholder="https://... (投递完成后生成的进度查询链接)" value={addFormData.url} onChange={e => setAddFormData({...addFormData, url: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>意向梯队 / 难度</label>
                <select
                  value={addFormData.priority}
                  onChange={e => setAddFormData({...addFormData, priority: e.target.value as ApplicationPriority})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="dream">冲刺 (重点意向 / 高难度)</option>
                  <option value="target">主攻 (核心匹配 / 主力投递)</option>
                  <option value="safety">保底 (稳健备选 / 练习托底)</option>
                </select>
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
                <input required className={styles.input} value={scheduleFormData.title} onChange={e => setScheduleFormData({...scheduleFormData, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
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
