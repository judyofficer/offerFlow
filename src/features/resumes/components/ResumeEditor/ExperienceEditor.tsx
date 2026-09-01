import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import type { Experience } from '../../types/resume';
import styles from '../../pages/Resumes/Resumes.module.css';

import { RichContentEditor } from './RichContentEditor';

const ExperienceEditor: React.FC = () => {
  const { resumes, activeResumeId, addSectionItem, updateSectionItem, deleteSectionItem, reorderSectionItems } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!activeResume) return null;

  const experience = activeResume.content.experience || [];

  const handleAdd = () => {
    addSectionItem('experience', {
      company: '',
      title: '',
      startDate: '',
      endDate: '',
      description: ''
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderSectionItems('experience', result.source.index, result.destination.index);
  };

  return (
    <section style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '16px' : '0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h3 
          className="text-h3" 
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronDown size={18} style={{ marginRight: '8px' }} /> : <ChevronRight size={18} style={{ marginRight: '8px' }} />}
          工作经历 (Work Experience)
        </h3>
        {isExpanded && (
          <button className="btn btn-outline btn-sm" onClick={handleAdd}>
            <Plus size={14} /> 添加工作经历
          </button>
        )}
      </div>

      {isExpanded && (
        <div style={{ marginTop: '16px' }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="experience-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {experience.map((item: Experience, index: number) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px',
                            marginBottom: '16px',
                            position: 'relative',
                            ...provided.draggableProps.style,
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
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>经历 {index + 1}</div>
                              <button onClick={() => deleteSectionItem('experience', item.id)} style={{ color: 'var(--danger)' }}>
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                              <div className={styles.inputGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>公司 / 机构名称</label>
                                <input type="text" className={styles.input} value={item.company} onChange={e => updateSectionItem('experience', item.id, { company: e.target.value })} />
                              </div>
                              <div className={styles.inputGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>担任职位</label>
                                <input type="text" className={styles.input} value={item.title} onChange={e => updateSectionItem('experience', item.id, { title: e.target.value })} />
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                              <div className={styles.inputGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>开始时间</label>
                                <input type="text" className={styles.input} placeholder="如: 2022.07" value={item.startDate} onChange={e => updateSectionItem('experience', item.id, { startDate: e.target.value })} />
                              </div>
                              <div className={styles.inputGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>结束时间</label>
                                <input type="text" className={styles.input} placeholder="如: 至今" value={item.endDate} onChange={e => updateSectionItem('experience', item.id, { endDate: e.target.value })} />
                              </div>
                            </div>
                            
                            <div className={styles.inputGroup}>
                              <label className={styles.label}>工作内容与业绩成果 (建议按条目突出重点)</label>
                              <RichContentEditor 
                                minHeight={100}
                                rows={5}
                                value={item.description} 
                                onChange={val => updateSectionItem('experience', item.id, { description: val })} 
                                placeholder="使用小圆点 (如：• 负责核心产品研发...) 列出您的工作内容与业务产出..."
                              />
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
        </div>
      )}
    </section>
  );
};

export default ExperienceEditor;
