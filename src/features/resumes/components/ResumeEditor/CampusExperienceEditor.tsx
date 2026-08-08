import React, { useState } from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical } from 'lucide-react';
import type { CampusExperience } from '../../types/resume';
import styles from '../../pages/Resumes/Resumes.module.css';

import { AutoResizeTextarea } from './AutoResizeTextarea';

const CampusExperienceEditor: React.FC = () => {
  const { resumes, activeResumeId, updateActiveResume } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!activeResume) return null;

  const campusExperience = activeResume.content.campusExperience || [];

  const handleAdd = () => {
    const newItem: CampusExperience = {
      id: crypto.randomUUID(),
      organization: '',
      role: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    updateActiveResume({ campusExperience: [...campusExperience, newItem] });
  };

  const handleUpdate = (id: string, field: keyof CampusExperience, value: string) => {
    const updated = campusExperience.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    updateActiveResume({ campusExperience: updated });
  };

  const handleDelete = (id: string) => {
    updateActiveResume({ campusExperience: campusExperience.filter(item => item.id !== id) });
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
        校园经历 (Campus Experience)
      </h3>
      
      {isExpanded && (
        <div style={{ marginTop: '16px' }}>
          {campusExperience.map((item, index) => (
            <div key={item.id} className={styles.editorCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                  <GripVertical size={16} style={{ cursor: 'grab', marginRight: '8px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>经历 {index + 1}</span>
                </div>
                <button onClick={() => handleDelete(item.id)} className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }}>
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>组织名称</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={item.organization} 
                    onChange={(e) => handleUpdate(item.id, 'organization', e.target.value)}
                    placeholder="例如: 学生职业发展协会"
                  />
                </div>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>角色/职务</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={item.role} 
                    onChange={(e) => handleUpdate(item.id, 'role', e.target.value)}
                    placeholder="例如: 活动部 负责人"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>开始时间</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={item.startDate} 
                    onChange={(e) => handleUpdate(item.id, 'startDate', e.target.value)}
                    placeholder="2023.09"
                  />
                </div>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>结束时间</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={item.endDate} 
                    onChange={(e) => handleUpdate(item.id, 'endDate', e.target.value)}
                    placeholder="2024.06"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>经历描述 (建议使用列表项)</label>
                <AutoResizeTextarea 
                  className={`${styles.input} ${styles.textarea}`} 
                  style={{ minHeight: '80px' }}
                  value={item.description} 
                  onChange={(e) => handleUpdate(item.id, 'description', e.target.value)}
                  placeholder="描述您的主要工作内容和成果..."
                />
              </div>
            </div>
          ))}

          <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleAdd}>
            <Plus size={16} style={{ marginRight: '8px' }} />
            添加校园经历
          </button>
        </div>
      )}
    </section>
  );
};

export default CampusExperienceEditor;
