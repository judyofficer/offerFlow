import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import styles from '../../pages/Resumes/Resumes.module.css';

const PersonalInfoEditor: React.FC = () => {
  const { resumes, activeResumeId, updateActiveResume } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);

  if (!activeResume) return null;

  const { personalInfo } = activeResume.content;

  const handlePersonalInfoChange = (field: string, value: string) => {
    updateActiveResume({
      personalInfo: {
        ...personalInfo,
        [field]: value
      }
    });
  };

  return (
    <section style={{ marginBottom: '32px' }}>
      <h3 className="text-h3" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>基本信息 (Personal Info)</h3>
      
      <div className={styles.inputGroup}>
        <label className={styles.label}>姓名</label>
        <input 
          type="text" 
          className={styles.input} 
          value={personalInfo.name} 
          onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
          placeholder="例如: 张三"
        />
      </div>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <div className={styles.inputGroup} style={{ flex: 1 }}>
          <label className={styles.label}>邮箱</label>
          <input 
            type="email" 
            className={styles.input} 
            value={personalInfo.email} 
            onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
          />
        </div>
        <div className={styles.inputGroup} style={{ flex: 1 }}>
          <label className={styles.label}>电话</label>
          <input 
            type="tel" 
            className={styles.input} 
            value={personalInfo.phone} 
            onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
          />
        </div>
      </div>
      
      <div className={styles.inputGroup}>
        <label className={styles.label}>个人总结</label>
        <textarea 
          className={`${styles.input} ${styles.textarea}`} 
          value={personalInfo.summary} 
          onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
          placeholder="简短地介绍一下您的背景、优势和职业目标..."
        />
      </div>
    </section>
  );
};

export default PersonalInfoEditor;
