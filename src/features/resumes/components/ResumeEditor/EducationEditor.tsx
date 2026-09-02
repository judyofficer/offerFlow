import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import type { Education, CustomField } from '../../types/resume';
import styles from '../../pages/Resumes/Resumes.module.css';

const pillButtonStyle: React.CSSProperties = {
  fontSize: '11.5px',
  padding: '2px 8px',
  borderRadius: '12px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  transition: 'all 0.15s ease',
};

const EducationEditor: React.FC = () => {
  const { resumes, activeResumeId, addSectionItem, updateSectionItem, deleteSectionItem, reorderSectionItems } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!activeResume) return null;

  const education = activeResume.content.education || [];

  const handleAdd = () => {
    addSectionItem('education', {
      school: '',
      degree: '',
      major: '',
      startDate: '',
      endDate: '',
      description: ''
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderSectionItems('education', result.source.index, result.destination.index);
  };

  const handleAddCustomField = (eduId: string, label = '') => {
    const item = education.find(e => e.id === eduId);
    if (!item) return;
    const current = item.customFields || [];
    const newField: CustomField = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `edu-f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label,
      value: '',
    };
    updateSectionItem('education', eduId, {
      customFields: [...current, newField],
    });
  };

  const handleUpdateCustomField = (eduId: string, fieldId: string, key: 'label' | 'value', val: string) => {
    const item = education.find(e => e.id === eduId);
    if (!item) return;
    const current = item.customFields || [];
    updateSectionItem('education', eduId, {
      customFields: current.map(f => f.id === fieldId ? { ...f, [key]: val } : f),
    });
  };

  const handleDeleteCustomField = (eduId: string, fieldId: string) => {
    const item = education.find(e => e.id === eduId);
    if (!item) return;
    const current = item.customFields || [];
    updateSectionItem('education', eduId, {
      customFields: current.filter(f => f.id !== fieldId),
    });
  };

  return (
    <section style={{ marginBottom: '32px' }}>
      <h3 
        className="text-h3" 
        style={{ 
          marginBottom: isExpanded ? '16px' : '0', 
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown size={18} style={{ marginRight: '8px' }} /> : <ChevronRight size={18} style={{ marginRight: '8px' }} />}
        教育经历 (Education)
      </h3>

      {isExpanded && (
        <div style={{ marginTop: '16px' }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="education-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {education.map((item: Education, index: number) => (
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
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                {item.school ? `${item.school} (${item.degree || '教育经历'})` : `学校 ${index + 1}`}
                              </div>
                              <button onClick={() => deleteSectionItem('education', item.id)} style={{ color: 'var(--danger)' }}>
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className={styles.inputGroup}>
                              <label className={styles.label}>学校名称</label>
                              <input type="text" className={styles.input} placeholder="例如: 浙江大学" value={item.school} onChange={e => updateSectionItem('education', item.id, { school: e.target.value })} />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '16px' }}>
                              <div className={styles.inputGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>学历 / 学位</label>
                                <input type="text" className={styles.input} placeholder="如: 本科 / 硕士" value={item.degree} onChange={e => updateSectionItem('education', item.id, { degree: e.target.value })} />
                              </div>
                              <div className={styles.inputGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>专业</label>
                                <input type="text" className={styles.input} placeholder="如: 计算机科学与技术" value={item.major} onChange={e => updateSectionItem('education', item.id, { major: e.target.value })} />
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                              <div className={styles.inputGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>开始时间</label>
                                <input type="text" className={styles.input} placeholder="如: 2020.09" value={item.startDate} onChange={e => updateSectionItem('education', item.id, { startDate: e.target.value })} />
                              </div>
                              <div className={styles.inputGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>结束时间</label>
                                <input type="text" className={styles.input} placeholder="如: 2024.06" value={item.endDate} onChange={e => updateSectionItem('education', item.id, { endDate: e.target.value })} />
                              </div>
                            </div>

                            {/* 绩点 / 成绩排名 (选填项) */}
                            {item.gpa !== undefined && (
                              <div className={styles.inputGroup} style={{ marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <label className={styles.label} style={{ margin: 0 }}>绩点 / 成绩排名 (选填)</label>
                                  <button
                                    type="button"
                                    onClick={() => updateSectionItem('education', item.id, { gpa: undefined })}
                                    className="btn btn-ghost btn-icon btn-sm"
                                    style={{ color: 'var(--text-tertiary)', padding: '2px 4px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                    title="移除绩点"
                                  >
                                    <Trash2 size={12} /> 移除
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  className={styles.input}
                                  placeholder="例如: 3.85 / 4.0 (专业前 5%)"
                                  value={item.gpa}
                                  onChange={e => updateSectionItem('education', item.id, { gpa: e.target.value })}
                                />
                              </div>
                            )}

                            {/* 主修课程 (选填项) */}
                            {item.courses !== undefined && (
                              <div className={styles.inputGroup} style={{ marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <label className={styles.label} style={{ margin: 0 }}>主修课程 (选填)</label>
                                  <button
                                    type="button"
                                    onClick={() => updateSectionItem('education', item.id, { courses: undefined })}
                                    className="btn btn-ghost btn-icon btn-sm"
                                    style={{ color: 'var(--text-tertiary)', padding: '2px 4px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                    title="移除主修课程"
                                  >
                                    <Trash2 size={12} /> 移除
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  className={styles.input}
                                  placeholder="例如: 数据结构、算法设计、计算机网络、操作系统、分布式系统"
                                  value={item.courses}
                                  onChange={e => updateSectionItem('education', item.id, { courses: e.target.value })}
                                />
                              </div>
                            )}

                            {/* 自定义字段列表 */}
                            {(item.customFields || []).length > 0 && (
                              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(item.customFields || []).map(field => (
                                  <div
                                    key={field.id}
                                    style={{
                                      display: 'flex',
                                      gap: '8px',
                                      alignItems: 'center',
                                      backgroundColor: 'var(--bg-secondary)',
                                      padding: '6px 10px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--border-color)',
                                    }}
                                  >
                                    <div style={{ width: '120px', flexShrink: 0 }}>
                                      <input
                                        type="text"
                                        className={styles.input}
                                        value={field.label}
                                        onChange={e => handleUpdateCustomField(item.id, field.id, 'label', e.target.value)}
                                        placeholder="名称 (如: 学院)"
                                        style={{ height: '32px', fontSize: '13px', margin: 0 }}
                                      />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <input
                                        type="text"
                                        className={styles.input}
                                        value={field.value}
                                        onChange={e => handleUpdateCustomField(item.id, field.id, 'value', e.target.value)}
                                        placeholder="内容值 (如: 计算机学院 / 计算机视觉)"
                                        style={{ height: '32px', fontSize: '13px', margin: 0 }}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCustomField(item.id, field.id)}
                                      className="btn btn-ghost btn-icon btn-sm"
                                      style={{ color: 'var(--danger, #ef4444)', padding: '4px', flexShrink: 0 }}
                                      title="删除该信息项"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 快速选择添加可选信息的胶囊栏 */}
                            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>选择添加补充信息：</span>
                              {item.courses === undefined && (
                                <button
                                  type="button"
                                  onClick={() => updateSectionItem('education', item.id, { courses: '' })}
                                  style={pillButtonStyle}
                                  title="添加主修课程展示"
                                >
                                  + 主修课程
                                </button>
                              )}
                              {item.gpa === undefined && (
                                <button
                                  type="button"
                                  onClick={() => updateSectionItem('education', item.id, { gpa: '' })}
                                  style={pillButtonStyle}
                                  title="添加成绩绩点或专业排名"
                                >
                                  + 绩点 / GPA
                                </button>
                              )}
                              {!((item.customFields || []).some(f => f.label === '学院' || f.label === '院系')) && (
                                <button
                                  type="button"
                                  onClick={() => handleAddCustomField(item.id, '学院')}
                                  style={pillButtonStyle}
                                  title="添加所属二级学院或院系"
                                >
                                  + 学院 / 院系
                                </button>
                              )}
                              {!((item.customFields || []).some(f => f.label === '研究方向')) && (
                                <button
                                  type="button"
                                  onClick={() => handleAddCustomField(item.id, '研究方向')}
                                  style={pillButtonStyle}
                                  title="添加硕士/本科研究方向"
                                >
                                  + 研究方向
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleAddCustomField(item.id, '')}
                                style={pillButtonStyle}
                                title="自由添加更多自定义字段"
                              >
                                <Plus size={11} style={{ marginRight: '2px' }} /> 自定义项
                              </button>
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

          <button className="btn btn-outline" style={{ width: '100%', marginTop: '8px' }} onClick={handleAdd}>
            <Plus size={16} style={{ marginRight: '8px' }} />
            添加教育经历
          </button>
        </div>
      )}
    </section>
  );
};

export default EducationEditor;
