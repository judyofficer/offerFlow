import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import type { Skill } from '../../types/resume';
import styles from '../../pages/Resumes/Resumes.module.css';

import { AutoResizeTextarea } from './AutoResizeTextarea';

const SkillEditor: React.FC = () => {
  const { resumes, activeResumeId, addSectionItem, updateSectionItem, deleteSectionItem, reorderSectionItems } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);
  const [isExpanded, setIsExpanded] = useState(true);

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

  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');

  const handleItemsChange = (id: string, value: string) => {
    updateSectionItem('skills', id, { items: [value] });
  };

  const handleSmartImport = () => {
    if (!importText.trim()) return;
    
    const lines = importText.split('\n').filter(line => line.trim());
    let pendingCategory = '';
    
    lines.forEach(line => {
      // Clean bullet points, extra spaces, and markdown bold/italic symbols
      let cleanLine = line.replace(/^[-*•\s]+/, '').replace(/\*\*/g, '').trim();
      if (!cleanLine) return;
      
      // Look for a colon indicating category: items
      const colonMatch = cleanLine.match(/^([^:：]+)[:：](.+)$/);
      if (colonMatch) {
        addSectionItem('skills', {
          category: colonMatch[1].trim(),
          items: [colonMatch[2].trim()]
        });
        pendingCategory = '';
      } else {
        // No colon, keep the whole line as one item or treat as category if short
        if (cleanLine.length < 20 && !cleanLine.includes('，') && !cleanLine.includes(',')) {
          // Looks like a category header
          pendingCategory = cleanLine;
        } else {
          // It's a list of items / long sentence
          addSectionItem('skills', {
            category: pendingCategory || '综合技能',
            items: [cleanLine]
          });
          pendingCategory = ''; // Reset after use
        }
      }
    });
    
    setImportText('');
    setIsImporting(false);
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
          专业技能 (Skills)
        </h3>
        {isExpanded && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setIsImporting(!isImporting)}>
              智能导入
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleAdd}>
              <Plus size={14} /> 添加技能分类
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div style={{ marginTop: '16px' }}>
          {isImporting && (
            <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                支持直接粘贴多行文本。智能识别格式：<br/>
                <code>前端: React, Vue</code> 或 <br/>
                <code>前端<br/>React, Vue</code>
              </p>
              <AutoResizeTextarea
                className={`${styles.input} ${styles.textarea}`}
                style={{ minHeight: '80px', marginBottom: '8px' }}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="在此粘贴您的技能描述文本..."
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsImporting(false)}>取消</button>
                <button className="btn btn-primary btn-sm" onClick={handleSmartImport}>识别并添加</button>
              </div>
            </div>
          )}

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
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>技能分类 {index + 1}</div>
                              <button onClick={() => deleteSectionItem('skills', item.id)} style={{ color: 'var(--danger)' }}>
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className={styles.inputGroup}>
                              <label className={styles.label}>分类名称 (如: 前端框架、语言、工具等)</label>
                              <input type="text" className={styles.input} value={item.category} onChange={e => updateSectionItem('skills', item.id, { category: e.target.value })} />
                            </div>
                            
                            <div className={styles.inputGroup}>
                              <label className={styles.label}>技能描述 (支持长句，直接保留原格式)</label>
                              <AutoResizeTextarea 
                                className={`${styles.input} ${styles.textarea}`} 
                                style={{ minHeight: '60px' }} 
                                value={item.items.join(', ')} 
                                onChange={e => handleItemsChange(item.id, e.target.value)} 
                                placeholder="如: 熟悉 HTML5, CSS3, JavaScript..." 
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

export default SkillEditor;
