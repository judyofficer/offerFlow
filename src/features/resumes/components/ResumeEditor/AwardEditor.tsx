import React, { useState } from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical } from 'lucide-react';
import type { Award } from '../../types/resume';
import styles from '../../pages/Resumes/Resumes.module.css';

import { AutoResizeTextarea } from './AutoResizeTextarea';

const AwardEditor: React.FC = () => {
  const { resumes, activeResumeId, updateActiveResume } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!activeResume) return null;

  const awards = activeResume.content.awards || [];

  const handleAdd = () => {
    const newItem: Award = {
      id: crypto.randomUUID(),
      name: '',
      awarder: '',
      date: '',
      description: ''
    };
    updateActiveResume({ awards: [...awards, newItem] });
  };

  const handleUpdate = (id: string, field: keyof Award, value: string) => {
    const updated = awards.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    updateActiveResume({ awards: updated });
  };

  const handleDelete = (id: string) => {
    updateActiveResume({ awards: awards.filter(item => item.id !== id) });
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
        荣誉奖项 (Awards)
      </h3>
      
      {isExpanded && (
        <div style={{ marginTop: '16px' }}>
          {awards.map((item, index) => (
            <div key={item.id} className={styles.editorCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                  <GripVertical size={16} style={{ cursor: 'grab', marginRight: '8px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>奖项 {index + 1}</span>
                </div>
                <button onClick={() => handleDelete(item.id)} className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }}>
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>奖项名称</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={item.name} 
                    onChange={(e) => handleUpdate(item.id, 'name', e.target.value)}
                    placeholder="例如: 校级优秀学生干部"
                  />
                </div>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>颁发机构</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={item.awarder} 
                    onChange={(e) => handleUpdate(item.id, 'awarder', e.target.value)}
                    placeholder="例如: 东北林业大学"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>获奖时间</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={item.date} 
                  onChange={(e) => handleUpdate(item.id, 'date', e.target.value)}
                  placeholder="2023.11"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>奖项说明 (选填，建议使用列表项)</label>
                <AutoResizeTextarea 
                  className={`${styles.input} ${styles.textarea}`} 
                  style={{ minHeight: '80px' }}
                  value={item.description || ''} 
                  onChange={(e) => handleUpdate(item.id, 'description', e.target.value)}
                  placeholder="如: 全国一等奖、排名前5%..."
                />
              </div>
            </div>
          ))}

          <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleAdd}>
            <Plus size={16} style={{ marginRight: '8px' }} />
            添加荣誉奖项
          </button>
        </div>
      )}
    </section>
  );
};

export default AwardEditor;
