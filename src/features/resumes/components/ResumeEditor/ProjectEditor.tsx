import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import type { Project } from '../../types/resume';
import styles from '../../pages/Resumes/Resumes.module.css';

const ProjectEditor: React.FC = () => {
  const { resumes, activeResumeId, addSectionItem, updateSectionItem, deleteSectionItem, reorderSectionItems } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);

  if (!activeResume) return null;

  const projects = activeResume.content.projects || [];

  const handleAdd = () => {
    addSectionItem('projects', {
      name: '',
      role: '',
      startDate: '',
      endDate: '',
      description: '',
      link: ''
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderSectionItems('projects', result.source.index, result.destination.index);
  };

  return (
    <section style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h3 className="text-h3">项目经历 (Projects)</h3>
        <button className={styles.buttonOutline} onClick={handleAdd} style={{ padding: '4px 8px', fontSize: '12px' }}>
          <Plus size={14} /> 添加项目经历
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="projects-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {projects.map((item: Project, index: number) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        marginBottom: '16px',
                        position: 'relative'
                      }}
                    >
                      <div
                        {...provided.dragHandleProps}
                        style={{ position: 'absolute', left: '8px', top: '16px', color: 'var(--text-tertiary)', cursor: 'grab' }}
                      >
                        <GripVertical size={16} />
                      </div>
                      
                      <div style={{ marginLeft: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>项目 {index + 1}</div>
                          <button onClick={() => deleteSectionItem('projects', item.id)} style={{ color: 'var(--danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>项目名称</label>
                            <input type="text" className={styles.input} value={item.name} onChange={e => updateSectionItem('projects', item.id, { name: e.target.value })} />
                          </div>
                          <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>担任角色</label>
                            <input type="text" className={styles.input} value={item.role} onChange={e => updateSectionItem('projects', item.id, { role: e.target.value })} />
                          </div>
                        </div>
                        
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>项目链接 (可选)</label>
                          <input type="url" className={styles.input} placeholder="如: https://github.com/..." value={item.link || ''} onChange={e => updateSectionItem('projects', item.id, { link: e.target.value })} />
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>开始时间</label>
                            <input type="text" className={styles.input} placeholder="如: 2022.07" value={item.startDate} onChange={e => updateSectionItem('projects', item.id, { startDate: e.target.value })} />
                          </div>
                          <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>结束时间</label>
                            <input type="text" className={styles.input} placeholder="如: 至今" value={item.endDate} onChange={e => updateSectionItem('projects', item.id, { endDate: e.target.value })} />
                          </div>
                        </div>
                        
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>项目描述与贡献</label>
                          <textarea className={`${styles.input} ${styles.textarea}`} style={{ minHeight: '80px' }} value={item.description} onChange={e => updateSectionItem('projects', item.id, { description: e.target.value })} placeholder="描述项目背景以及您主要负责了哪些工作..." />
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </section>
  );
};

export default ProjectEditor;
