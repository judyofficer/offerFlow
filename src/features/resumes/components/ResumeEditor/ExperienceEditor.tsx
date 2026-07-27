import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import type { Experience } from '../../types/resume';
import styles from '../../pages/Resumes/Resumes.module.css';

const ExperienceEditor: React.FC = () => {
  const { resumes, activeResumeId, addSectionItem, updateSectionItem, deleteSectionItem, reorderSectionItems } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h3 className="text-h3">Work Experience</h3>
        <button className={styles.buttonOutline} onClick={handleAdd} style={{ padding: '4px 8px', fontSize: '12px' }}>
          <Plus size={14} /> Add Experience
        </button>
      </div>

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
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>Item {index + 1}</div>
                          <button onClick={() => deleteSectionItem('experience', item.id)} style={{ color: 'var(--danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>Company</label>
                            <input type="text" className={styles.input} value={item.company} onChange={e => updateSectionItem('experience', item.id, { company: e.target.value })} />
                          </div>
                          <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>Job Title</label>
                            <input type="text" className={styles.input} value={item.title} onChange={e => updateSectionItem('experience', item.id, { title: e.target.value })} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>Start Date</label>
                            <input type="text" className={styles.input} placeholder="e.g. Jul 2022" value={item.startDate} onChange={e => updateSectionItem('experience', item.id, { startDate: e.target.value })} />
                          </div>
                          <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>End Date</label>
                            <input type="text" className={styles.input} placeholder="e.g. Present" value={item.endDate} onChange={e => updateSectionItem('experience', item.id, { endDate: e.target.value })} />
                          </div>
                        </div>
                        
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Description / Responsibilities</label>
                          <textarea className={`${styles.input} ${styles.textarea}`} style={{ minHeight: '80px' }} value={item.description} onChange={e => updateSectionItem('experience', item.id, { description: e.target.value })} placeholder="Use bullet points (e.g. • Developed new features) to describe your impact..." />
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

export default ExperienceEditor;
