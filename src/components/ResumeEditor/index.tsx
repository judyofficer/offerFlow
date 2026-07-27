import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import styles from '../../pages/Resumes/Resumes.module.css';

const ResumeEditor: React.FC = () => {
  const { resumes, activeResumeId, updateActiveResume } = useResumeStore();
  
  const activeResume = resumes.find(r => r.id === activeResumeId);

  if (!activeResume) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
        Please select or create a resume version.
      </div>
    );
  }

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
    <div>
      <h2 className="text-h2" style={{ marginBottom: '24px' }}>Edit Resume: {activeResume.name}</h2>
      
      <section style={{ marginBottom: '32px' }}>
        <h3 className="text-h3" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Personal Information</h3>
        
        <div className={styles.inputGroup}>
          <label className={styles.label}>Full Name</label>
          <input 
            type="text" 
            className={styles.input} 
            value={personalInfo.name} 
            onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
            placeholder="e.g. John Doe"
          />
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className={styles.inputGroup} style={{ flex: 1 }}>
            <label className={styles.label}>Email</label>
            <input 
              type="email" 
              className={styles.input} 
              value={personalInfo.email} 
              onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
            />
          </div>
          <div className={styles.inputGroup} style={{ flex: 1 }}>
            <label className={styles.label}>Phone</label>
            <input 
              type="tel" 
              className={styles.input} 
              value={personalInfo.phone} 
              onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
            />
          </div>
        </div>
        
        <div className={styles.inputGroup}>
          <label className={styles.label}>Professional Summary</label>
          <textarea 
            className={`${styles.input} ${styles.textarea}`} 
            value={personalInfo.summary} 
            onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
            placeholder="A brief summary of your background and goals..."
          />
        </div>
      </section>
      
      <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
        <em>Note: Education, Experience, Projects and Skills sections will be implemented in subsequent iterations of the MVP.</em>
      </div>
    </div>
  );
};

export default ResumeEditor;
