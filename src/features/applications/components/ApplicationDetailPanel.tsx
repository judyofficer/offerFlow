import React, { useState } from 'react';
import { X, Trash2, ExternalLink, RotateCcw, Copy, Check, Sparkles, ClipboardPaste } from 'lucide-react';
import { useApplicationStore } from '../store/useApplicationStore';
import { useResumeStore } from '../../resumes/store/useResumeStore';
import { useJobStore } from '../../jobBoard/store/useJobStore';
import { STATUS_CONFIG } from '../types/application';
import { resolveApplicationUrl, openCareerUrl } from '../utils/careerUrlHelper';
import styles from './ApplicationDetailPanel.module.css';

interface Props {
  appId: string;
  onClose: () => void;
}

export const ApplicationDetailPanel: React.FC<Props> = ({ appId, onClose }) => {
  const { applications, updateApplication, deleteApplication } = useApplicationStore();
  const { resumes } = useResumeStore();
  const { addBookmark } = useJobStore();
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState(false);

  const application = applications.find(a => a.id === appId);

  if (!application) return null;

  const resolvedUrl = resolveApplicationUrl(application.companyName, application.url);

  const handleCopyLink = () => {
    if (resolvedUrl.url) {
      navigator.clipboard.writeText(resolvedUrl.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePasteProgressUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        updateApplication(appId, { url: text.trim() });
        setPasted(true);
        setTimeout(() => setPasted(false), 2000);
      }
    } catch {
      const fallback = prompt('请输入进度查询链接：', application.url || '');
      if (fallback !== null) {
        updateApplication(appId, { url: fallback.trim() });
        setPasted(true);
        setTimeout(() => setPasted(false), 2000);
      }
    }
  };

  const handleApplyOfficialUrl = () => {
    if (resolvedUrl.url) {
      updateApplication(appId, { url: resolvedUrl.url });
    }
  };

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

  const handleMoveBackToJobBoard = () => {
    if (confirm(`确定要将【${application.companyName} - ${application.jobTitle}】撤回至岗位收藏吗？`)) {
      addBookmark({
        companyName: application.companyName,
        jobTitle: application.jobTitle,
        url: application.url || '',
        salary: application.salary || '',
        location: application.location || '',
        source: application.source || '',
        deadline: application.deadline || '',
      });
      deleteApplication(appId);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={styles.backdrop}
      />

      {/* Panel */}
      <div className={styles.panel}>
        <header style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span>{application.companyName}</span>
              {resolvedUrl.url && (
                <button
                  type="button"
                  onClick={() => openCareerUrl(resolvedUrl.url)}
                  className="btn btn-primary btn-sm"
                  style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 500,
                    borderRadius: '6px',
                  }}
                  title="查看进度"
                >
                  <ExternalLink size={13} /> 查看进度
                </button>
              )}
            </h2>
            <p className="text-body" style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{application.jobTitle}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleMoveBackToJobBoard}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}
              title="撤回至岗位收藏"
            >
              <RotateCcw size={14} /> 移回岗位收藏
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-ghost btn-icon"
              style={{ color: 'var(--danger)' }}
              title="删除记录"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 进度查询链接 (URL) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                进度查询链接 (URL)
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handlePasteProgressUrl}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    color: 'var(--primary)',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                  title="粘贴进度查询链接"
                >
                  <ClipboardPaste size={12} />
                  <span>{pasted ? '已粘贴' : '粘贴进度链接'}</span>
                </button>

                {resolvedUrl.url && (
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: copied ? 'var(--success, #10b981)' : 'var(--text-tertiary)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                    title="复制链接"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? '已复制' : '复制'}</span>
                  </button>
                )}

                {resolvedUrl.type === 'matched_official' && !application.url && (
                  <button
                    type="button"
                    onClick={handleApplyOfficialUrl}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      color: 'var(--primary)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                    title="填入推荐进度入口"
                  >
                    <Sparkles size={11} /> 填入推荐进度
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                name="url"
                value={application.url || ''}
                onChange={handleChange}
                placeholder="https://..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13.5px' }}
              />
              {resolvedUrl.url && (
                <button
                  type="button"
                  onClick={() => openCareerUrl(resolvedUrl.url)}
                  className="btn btn-outline btn-sm"
                  style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px', height: '36px' }}
                  title="打开"
                >
                  <ExternalLink size={14} /> 打开
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>公司名称</label>
              <input
                name="companyName"
                value={application.companyName}
                onChange={handleChange}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>岗位名称</label>
              <input
                name="jobTitle"
                value={application.jobTitle}
                onChange={handleChange}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>意向梯队 / 难度</label>
              <select
                name="priority"
                value={application.priority || 'target'}
                onChange={handleChange}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="dream">冲刺</option>
                <option value="target">主攻</option>
                <option value="safety">保底</option>
              </select>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>当前状态</label>
              <select
                name="status"
                value={application.status}
                onChange={handleChange}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>薪资范围</label>
              <input
                name="salary"
                value={application.salary || ''}
                onChange={handleChange}
                placeholder="例如: 20k-30k * 15"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>信息来源</label>
              <input
                name="source"
                value={application.source || ''}
                onChange={handleChange}
                placeholder="Boss, 牛客, 官网等"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>截止日期</label>
              <input
                type="date"
                name="deadline"
                value={application.deadline || ''}
                onChange={handleChange}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'none', flex: 1, minHeight: '200px', fontFamily: 'inherit', lineHeight: '1.5' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>备注</label>
            <textarea
              name="notes"
              value={application.notes || ''}
              onChange={handleChange}
              placeholder="面试准备要点，或面经记录..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
            />
          </div>

          {/* 解决由于 Flex 布局在不同浏览器下底部 Padding 丢失导致被遮挡的问题 */}
          <div style={{ minHeight: '24px', flexShrink: 0 }} />
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
