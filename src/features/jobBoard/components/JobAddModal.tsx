import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2 } from 'lucide-react';
import { parseJobText } from '../utils/parser';

interface Props {
  onClose: () => void;
  onSave: (data: {
    companyName: string;
    jobTitle: string;
    url: string;
    salary: string;
    location: string;
    source: string;
  }) => void;
  suggestedTitles?: string[];
}

export const JobAddModal: React.FC<Props> = ({ onClose, onSave, suggestedTitles = [] }) => {
  const [smartText, setSmartText] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [url, setUrl] = useState('');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the smart input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSmartParse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSmartText(val);
    if (val.trim()) {
      const parsed = parseJobText(val);
      if (parsed.companyName) setCompanyName(parsed.companyName);
      if (parsed.jobTitle) setJobTitle(parsed.jobTitle);
      if (parsed.salary) setSalary(parsed.salary);
      if (parsed.location) setLocation(parsed.location);
    }
  };

  const handleSave = () => {
    if (!companyName || !jobTitle) {
      alert('请至少填写公司名称和岗位名称');
      return;
    }
    onSave({ companyName, jobTitle, url, salary, location, source });
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9998, backdropFilter: 'blur(4px)'
        }}
      />

      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '560px',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '12px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>

        <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wand2 size={20} color="var(--primary)" />
            添加收藏记录
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 智能解析区 */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              粘贴一行文本，自动拆分提取薪资、地点、岗位
            </label>
            <input
              ref={inputRef}
              value={smartText}
              onChange={handleSmartParse}
              placeholder="例如粘贴：字节跳动 - 前端开发工程师 北京 30-50K"
              style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--primary)', outline: 'none', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>公司名称 *</label>
              <input
                value={companyName} onChange={e => setCompanyName(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>岗位名称 *</label>
              <input
                list="suggested-job-titles"
                value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
              <datalist id="suggested-job-titles">
                {suggestedTitles.map((title, idx) => (
                  <option key={idx} value={title} />
                ))}
              </datalist>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>薪资范围</label>
              <input
                value={salary} onChange={e => setSalary(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>地点</label>
              <input
                value={location} onChange={e => setLocation(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>来源 (如 Boss)</label>
              <input
                value={source} onChange={e => setSource(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>原始招聘链接 URL (可选)</label>
            <input
              value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

        </div>

        <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderRadius: '0 0 12px 12px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>
            取消
          </button>
          <button onClick={handleSave} style={{ padding: '8px 24px', borderRadius: '4px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer', fontWeight: 600 }}>
            保存到收藏池
          </button>
        </div>

      </div>

      <style>
        {`
          @keyframes scaleIn {
            from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}
      </style>
    </>
  );
};
