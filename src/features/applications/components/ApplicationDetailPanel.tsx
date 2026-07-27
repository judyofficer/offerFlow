import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { useApplicationStore } from '../store/useApplicationStore';
import { useResumeStore } from '../../resumes/store/useResumeStore';
import { STATUS_CONFIG } from '../types/application';

interface Props {
  appId: string;
  onClose: () => void;
}

export const ApplicationDetailPanel: React.FC<Props> = ({ appId, onClose }) => {
  const { applications, updateApplication, deleteApplication } = useApplicationStore();
  const { resumes } = useResumeStore();
  
  const application = applications.find(a => a.id === appId);
  
  if (!application) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateApplication(appId, { [name]: value });
  };

  const handleDelete = () => {
    if (confirm('确定要删除这条投递记录吗？')) {
      deleteApplication(appId);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          zIndex: 998,
        }}
      />
      
      {/* Panel */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '500px',
          backgroundColor: 'var(--bg-primary)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          borderLeft: '1px solid var(--border-color)'
        }}
      >
        <header style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="text-h2">投递详情</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={handleDelete}
              style={{ padding: '6px', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
              title="删除记录"
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={onClose}
              style={{ padding: '6px', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>公司名称</label>
              <input 
                name="companyName"
                value={application.companyName}
                onChange={handleChange}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>岗位名称</label>
              <input 
                name="jobTitle"
                value={application.jobTitle}
                onChange={handleChange}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>当前状态</label>
              <select 
                name="status"
                value={application.status}
                onChange={handleChange}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>关联简历 (投递用)</label>
              <select 
                name="resumeId"
                value={application.resumeId || ''}
                onChange={handleChange}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="">-- 未关联简历 --</option>
                {resumes.map(resume => (
                  <option key={resume.id} value={resume.id}>{resume.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>工作地点</label>
              <input 
                name="location"
                value={application.location || ''}
                onChange={handleChange}
                placeholder="例如: 北京, 上海, 远程"
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>薪资范围</label>
              <input 
                name="salary"
                value={application.salary || ''}
                onChange={handleChange}
                placeholder="例如: 20k-30k * 15"
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>岗位描述 (Job Description)</label>
            <textarea 
              name="jobDescription"
              value={application.jobDescription || ''}
              onChange={handleChange}
              placeholder="请粘贴详细的 JD 文本..."
              style={{ padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'none', flex: 1, minHeight: '200px', fontFamily: 'inherit', lineHeight: '1.5' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>备注与面经链接</label>
            <textarea 
              name="notes"
              value={application.notes || ''}
              onChange={handleChange}
              placeholder="面试准备要点，或面经记录..."
              style={{ padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}
      </style>
    </>
  );
};
