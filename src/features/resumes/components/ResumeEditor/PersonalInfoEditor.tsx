import React, { useState } from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { ChevronDown, ChevronRight } from 'lucide-react';
import styles from '../../pages/Resumes/Resumes.module.css';

const PersonalInfoEditor: React.FC = () => {
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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handlePersonalInfoChange('avatar', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
        基本信息 (Personal Info)
      </h3>
      
      {isExpanded && (
        <div style={{ marginTop: '16px' }}>
          <div className={styles.inputGroup} style={{ marginBottom: '16px' }}>
            <label className={styles.label}>个人照片 (选填)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {personalInfo.avatar && (
                <img src={personalInfo.avatar} alt="Avatar" style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ fontSize: '13px' }}
              />
              {personalInfo.avatar && (
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => handlePersonalInfoChange('avatar', '')}
                  style={{ color: '#ef4444', padding: '4px 8px' }}
                >
                  移除照片
                </button>
              )}
            </div>
          </div>

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

          <div style={{ display: 'flex', gap: '16px' }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label}>GitHub主页</label>
              <input 
                type="text" 
                className={styles.input} 
                value={personalInfo.github || ''} 
                onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
                placeholder="例如: github.com/username"
              />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label}>个人网站/博客</label>
              <input 
                type="text" 
                className={styles.input} 
                value={personalInfo.website || ''} 
                onChange={(e) => handlePersonalInfoChange('website', e.target.value)}
                placeholder="例如: example.com"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label}>性别 (选填)</label>
              <input 
                type="text" 
                className={styles.input} 
                value={personalInfo.gender || ''} 
                onChange={(e) => handlePersonalInfoChange('gender', e.target.value)}
                placeholder="例如: 男"
              />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label}>生日 (选填)</label>
              <input 
                type="text" 
                className={styles.input} 
                value={personalInfo.birthDate || ''} 
                onChange={(e) => handlePersonalInfoChange('birthDate', e.target.value)}
                placeholder="例如: 2002.03"
              />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label}>民族 (选填)</label>
              <input 
                type="text" 
                className={styles.input} 
                value={personalInfo.ethnicity || ''} 
                onChange={(e) => handlePersonalInfoChange('ethnicity', e.target.value)}
                placeholder="例如: 汉族"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label}>现居城市 (选填)</label>
              <input 
                type="text" 
                className={styles.input} 
                value={personalInfo.city || ''} 
                onChange={(e) => handlePersonalInfoChange('city', e.target.value)}
                placeholder="例如: 北京"
              />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label}>意向城市 (选填)</label>
              <input 
                type="text" 
                className={styles.input} 
                value={personalInfo.intendedCity || ''} 
                onChange={(e) => handlePersonalInfoChange('intendedCity', e.target.value)}
                placeholder="例如: 北京 / 上海 / 深圳"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>求职意向 (选填)</label>
            <input 
              type="text" 
              className={styles.input} 
              value={personalInfo.intendedRole || ''} 
              onChange={(e) => handlePersonalInfoChange('intendedRole', e.target.value)}
              placeholder="例如: 前端开发"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default PersonalInfoEditor;
