import React, { useState } from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { ChevronDown, ChevronRight } from 'lucide-react';
import styles from '../../pages/Resumes/Resumes.module.css';
import { AutoResizeTextarea } from './AutoResizeTextarea';

const SummaryEditor: React.FC = () => {
  const { resumes, activeResumeId, updateActiveResume } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);
  const [isExpanded, setIsExpanded] = useState(true);

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
        自我评价 (Self Evaluation)
      </h3>
      
      {isExpanded && (
        <div style={{ marginTop: '16px' }}>
          <div className={styles.inputGroup}>
            <AutoResizeTextarea 
              className={`${styles.input} ${styles.textarea}`} 
              value={personalInfo.summary} 
              onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
              placeholder="总结您的核心竞争力和职业亮点..."
              style={{ minHeight: '120px' }}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default SummaryEditor;
