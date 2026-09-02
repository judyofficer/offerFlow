import React, { useState, useRef } from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { ChevronDown, ChevronRight, Camera, Upload, Trash2, Plus } from 'lucide-react';
import type { CustomField } from '../../types/resume';
import styles from '../../pages/Resumes/Resumes.module.css';

const PersonalInfoEditor: React.FC = () => {
  const { resumes, activeResumeId, updateActiveResume } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);
  const [isExpanded, setIsExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeResume) return null;

  const { personalInfo } = activeResume.content;
  const customFields = personalInfo.customFields || [];

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

  const handleAddCustomField = () => {
    const newField: CustomField = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: '',
      value: '',
    };
    updateActiveResume({
      personalInfo: {
        ...personalInfo,
        customFields: [...customFields, newField],
      },
    });
  };

  const handleAddPresetField = (label: string) => {
    const existing = customFields.find(f => f.label === label);
    if (existing) return;
    const newField: CustomField = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label,
      value: '',
    };
    updateActiveResume({
      personalInfo: {
        ...personalInfo,
        customFields: [...customFields, newField],
      },
    });
  };

  const handleUpdateCustomField = (id: string, key: 'label' | 'value', val: string) => {
    updateActiveResume({
      personalInfo: {
        ...personalInfo,
        customFields: customFields.map(f => f.id === id ? { ...f, [key]: val } : f),
      },
    });
  };

  const handleDeleteCustomField = (id: string) => {
    updateActiveResume({
      personalInfo: {
        ...personalInfo,
        customFields: customFields.filter(f => f.id !== id),
      },
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
        基本信息 (Personal Info)
      </h3>
      
      {isExpanded && (
        <div style={{ marginTop: '16px' }}>
          <div className={styles.inputGroup} style={{ marginBottom: '16px' }}>
            <label className={styles.label}>个人照片 (选填)</label>
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
            {personalInfo.avatar ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img 
                  src={personalInfo.avatar} 
                  alt="Avatar" 
                  style={{ width: '52px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} 
                />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    type="button"
                    className="btn btn-outline btn-sm" 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 10px' }}
                  >
                    <Upload size={14} /> 更换照片
                  </button>
                  <button 
                    type="button"
                    className="btn btn-ghost btn-sm" 
                    onClick={() => {
                      handlePersonalInfoChange('avatar', '');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{ color: 'var(--danger, #ef4444)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 10px' }}
                  >
                    <Trash2 size={14} /> 移除照片
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  type="button"
                  className="btn btn-outline btn-sm" 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 14px' }}
                >
                  <Camera size={15} /> 上传个人照片
                </button>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>支持 1 寸/2 寸寸照，JPG、PNG 格式</span>
              </div>
            )}
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

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div className={styles.inputGroup} style={{ flex: '1 1 calc(25% - 12px)', minWidth: '130px' }}>
              <label className={styles.label}>性别 (选填)</label>
              <input 
                type="text" 
                className={styles.input} 
                value={personalInfo.gender || ''} 
                onChange={(e) => handlePersonalInfoChange('gender', e.target.value)}
                placeholder="例如: 男"
              />
            </div>
            <div className={styles.inputGroup} style={{ flex: '1 1 calc(25% - 12px)', minWidth: '130px' }}>
              <label className={styles.label}>生日 (选填)</label>
              <input 
                type="text" 
                className={styles.input} 
                value={personalInfo.birthDate || ''} 
                onChange={(e) => handlePersonalInfoChange('birthDate', e.target.value)}
                placeholder="例如: 2002.03"
              />
            </div>
            <div className={styles.inputGroup} style={{ flex: '1 1 calc(25% - 12px)', minWidth: '130px' }}>
              <label className={styles.label}>民族 (选填)</label>
              <input 
                type="text" 
                className={styles.input} 
                value={personalInfo.ethnicity || ''} 
                onChange={(e) => handlePersonalInfoChange('ethnicity', e.target.value)}
                placeholder="例如: 汉族"
              />
            </div>
            <div className={styles.inputGroup} style={{ flex: '1 1 calc(25% - 12px)', minWidth: '130px' }}>
              <label className={styles.label}>政治面貌 (选填)</label>
              <input 
                type="text" 
                className={styles.input} 
                value={personalInfo.politicalStatus || ''} 
                onChange={(e) => handlePersonalInfoChange('politicalStatus', e.target.value)}
                placeholder="例如: 中共党员 / 群众"
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

          {/* 自定义基本信息列表 (Custom Info Items) */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  自定义基本信息 (选填)
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                  自由添加微信号、期望薪资、英语水平等
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '3px 10px' }}
              >
                <Plus size={13} /> 添加信息项
              </button>
            </div>

            {/* 快捷推荐预设标签 */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>常用添加：</span>
              {['微信号', '期望薪资', '英语水平', '工作年限', 'Gitee', '领英', '驾照'].map(preset => {
                const isAdded = customFields.some(f => f.label === preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddPresetField(preset)}
                    disabled={isAdded}
                    style={{
                      fontSize: '11.5px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: isAdded ? 'transparent' : 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: isAdded ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                      cursor: isAdded ? 'default' : 'pointer',
                      opacity: isAdded ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                    }}
                    title={isAdded ? `已添加【${preset}】` : `点击快速添加【${preset}】字段`}
                  >
                    + {preset}
                  </button>
                );
              })}
            </div>

            {/* 字段输入列表 */}
            {customFields.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customFields.map((field) => (
                  <div 
                    key={field.id}
                    style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      alignItems: 'center',
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ width: '130px', flexShrink: 0 }}>
                      <input
                        type="text"
                        className={styles.input}
                        value={field.label}
                        onChange={(e) => handleUpdateCustomField(field.id, 'label', e.target.value)}
                        placeholder="名称 (如: 微信号)"
                        style={{ height: '34px', fontSize: '13px', margin: 0 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        className={styles.input}
                        value={field.value}
                        onChange={(e) => handleUpdateCustomField(field.id, 'value', e.target.value)}
                        placeholder="内容值 (如: wx_123456 / 15k-20k / CET-6)"
                        style={{ height: '34px', fontSize: '13px', margin: 0 }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomField(field.id)}
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--danger, #ef4444)', padding: '6px', flexShrink: 0 }}
                      title="删除该信息项"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
};

export default PersonalInfoEditor;
