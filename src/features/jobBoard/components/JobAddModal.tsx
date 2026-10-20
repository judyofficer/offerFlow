import React, { useState } from 'react';
import { X, Wand2 } from 'lucide-react';
import { useJobAutofill } from '../../applications/hooks/useJobAutofill';
import { JobLinkInput } from '../../applications/components/JobLinkInput';
import { extractUrlFromText } from '../../applications/utils/urlJobParser';
import type { ApplicationPriority } from '../../applications/types/application';

interface Props {
  onClose: () => void;
  onSave: (data: {
    companyName: string;
    jobTitle: string;
    priority?: ApplicationPriority;
    url: string;
    salary: string;
    location: string;
    source: string;
    deadline: string;
    jobDescription?: string;
  }) => void;
  suggestedTitles?: string[];
}

export const JobAddModal: React.FC<Props> = ({ onClose, onSave, suggestedTitles = [] }) => {
  const [smartText, setSmartText] = useState('');

  const [priority, setPriority] = useState<ApplicationPriority>('target');
  const [fields, setFields] = useState({ companyName: '', jobTitle: '', url: '', salary: '', location: '', source: '', deadline: '', jobDescription: '' });
  const { companyName, jobTitle, url, salary, location, source, deadline, jobDescription } = fields;
  const applyParsed = useJobAutofill(setFields);

  const handleSave = () => {
    if (!companyName.trim() || !jobTitle.trim()) {
      alert('请至少填写公司名称和岗位名称');
      return;
    }
    onSave({ companyName: companyName.trim(), jobTitle: jobTitle.trim(), priority, url: url.trim(), salary: salary.trim(), location: location.trim(), source: source.trim(), deadline, jobDescription: jobDescription.trim() || undefined });
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

      <div className="job-add-modal" style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '12px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        overflow: 'hidden',
        animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>

        <div style={{ flexShrink: 0, padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wand2 size={20} color="var(--primary)" />
            添加收藏记录
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <JobLinkInput value={smartText} onChange={setSmartText} onParsed={applyParsed} />

          <div className="job-add-grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>公司名称 *</label>
              <input
                aria-label="公司名称" value={companyName} onChange={e => setFields(prev => ({ ...prev, companyName: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>岗位名称 *</label>
              <input
                list="suggested-job-titles"
                aria-label="岗位名称" value={jobTitle} onChange={e => setFields(prev => ({ ...prev, jobTitle: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
              <datalist id="suggested-job-titles">
                {suggestedTitles.map((title, idx) => (
                  <option key={idx} value={title} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="job-add-grid-3">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>薪资范围</label>
              <input
                aria-label="薪资范围" value={salary} onChange={e => setFields(prev => ({ ...prev, salary: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>地点</label>
              <input
                aria-label="地点" value={location} onChange={e => setFields(prev => ({ ...prev, location: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>来源 (如 Boss)</label>
              <input
                aria-label="来源" value={source} onChange={e => setFields(prev => ({ ...prev, source: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="job-add-grid-3">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>意向梯队 / 难度</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as ApplicationPriority)}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13.5px' }}
              >
                <option value="dream">冲刺 (重点 / 高难度)</option>
                <option value="target">主攻 (核心 / 主力投递)</option>
                <option value="safety">保底 (稳健 / 练习托底)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>招聘链接 URL</label>
              <input
                aria-label="招聘链接" value={url} onChange={e => setFields(prev => ({ ...prev, url: e.target.value }))}
                onPaste={event => {
                  const text = event.clipboardData.getData('text');
                  const parsed = extractUrlFromText(text);
                  if (parsed.url) {
                    event.preventDefault();
                    setFields(prev => ({ ...prev, url: parsed.url! }));
                    setSmartText(text);
                  }
                }}
                placeholder="https://..."
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                招聘截止日期
                <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', fontSize: '12px' }}>(选填)</span>
              </label>
              <input
                type="date"
                aria-label="招聘截止日期" value={deadline} onChange={e => setFields(prev => ({ ...prev, deadline: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px' }}
              />
            </div>
          </div>

          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)' }}>
            岗位描述 / JD（选填）
            <textarea value={jobDescription} onChange={event => setFields(prev => ({ ...prev, jobDescription: event.target.value }))} rows={3}
              style={{ display: 'block', marginTop: 6, width: '100%', padding: 10, border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-primary)', font: 'inherit', resize: 'vertical' }} />
          </label>

        </div>

        <div style={{ flexShrink: 0, padding: '16px 24px', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderRadius: '0 0 12px 12px' }}>
          <button onClick={onClose} className="btn btn-outline">
            取消
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            保存到收藏池
          </button>
        </div>

      </div>

      <style>
        {`
          .job-add-modal {
            width: 560px;
          }
          .job-add-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .job-add-grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 16px;
          }
          
          @media (max-width: 768px) {
            .job-add-modal {
              width: 90vw;
            }
            .job-add-grid-2, .job-add-grid-3 {
              grid-template-columns: 1fr;
            }
          }
          
          @keyframes scaleIn {
            from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}
      </style>
    </>
  );
};
