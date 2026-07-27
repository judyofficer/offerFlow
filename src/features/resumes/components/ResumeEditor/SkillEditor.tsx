import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import type { Skill } from '../../types/resume';
import styles from '../../pages/Resumes/Resumes.module.css';

const SkillEditor: React.FC = () => {
  const { resumes, activeResumeId, addSectionItem, updateSectionItem, deleteSectionItem, reorderSectionItems } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);

  if (!activeResume) return null;

  const skills = activeResume.content.skills || [];

  const handleAdd = () => {
    addSectionItem('skills', {
      category: '',
      items: []
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderSectionItems('skills', result.source.index, result.destination.index);
  };

  const handleItemsChange = (id: string, value: string) => {
    const itemsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    updateSectionItem('skills', id, { items: itemsArray });
  };

  return (
    <section style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h3 className="text-h3">Skills</h3>
        <button className={styles.buttonOutline} onClick={handleAdd} style={{ padding: '4px 8px', fontSize: '12px' }}>
          <Plus size={14} /> Add Skill Group
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="skills-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {skills.map((item: Skill, index: number) => (
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
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>Skill Group {index + 1}</div>
                          <button onClick={() => deleteSectionItem('skills', item.id)} style={{ color: 'var(--danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Category Name (e.g. Frontend, Languages)</label>
                          <input type="text" className={styles.input} value={item.category} onChange={e => updateSectionItem('skills', item.id, { category: e.target.value })} />
                        </div>
                        
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Skills (Comma separated)</label>
                          <input 
                            type="text" 
                            className={styles.input} 
                            placeholder="e.g. React, TypeScript, CSS" 
                            value={item.items.join(', ')} 
                            onChange={e => handleItemsChange(item.id, e.target.value)} 
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
    </section>
  );
};

export default SkillEditor;
