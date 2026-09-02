import React, { useState } from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { ChevronDown, ChevronRight } from 'lucide-react';
import styles from '../../pages/Resumes/Resumes.module.css';
import { RichContentEditor } from './RichContentEditor';

/**
 * 兼容历史数组结构 Award[] 与新版纯文本 string
 */
const getAwardsText = (awards: any): string => {
  if (typeof awards === 'string') return awards;
  if (Array.isArray(awards)) {
    return awards
      .map(a => {
        if (!a) return '';
        const parts = [
          a.date,
          a.name,
          a.awarder ? `(${a.awarder})` : '',
          a.description ? `- ${a.description}` : '',
        ].filter(Boolean);
        return parts.join(' ');
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
};

const AwardEditor: React.FC = () => {
  const { resumes, activeResumeId, updateActiveResume } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!activeResume) return null;

  const rawAwards = activeResume.content.awards;
  const awardsValue = getAwardsText(rawAwards);

  const handleChange = (val: string) => {
    updateActiveResume({ awards: val });
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
          <div className={styles.inputGroup}>
            <RichContentEditor
              value={awardsValue}
              onChange={handleChange}
              placeholder="例如:&#10;2024.05 校级一等奖学金 (全系排名前 5%)&#10;2023.11 全国大学生数学建模竞赛 省级二等奖&#10;2023.06 校级优秀学生干部&#10;&#10;💡 提示：每一行在简历预览与导出时会自动添加列表项圆点(•)，支持 **加粗** 关键词"
              minHeight={120}
              rows={5}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default AwardEditor;
