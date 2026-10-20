import React, { useState, useEffect } from 'react';
import { X, Sparkles, ExternalLink, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ApplicationPriority } from '../types/application';
import { extractUrlFromText } from '../utils/urlJobParser';
import { useJobAutofill } from '../hooks/useJobAutofill';
import { JobLinkInput } from './JobLinkInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    companyName: string;
    jobTitle: string;
    url: string;
    priority: ApplicationPriority;
    appliedDate: string;
    salary?: string;
    location?: string;
    source?: string;
    jobDescription?: string;
    deadline?: string;
  }) => void;
}

export const ApplicationAddModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [smartInput, setSmartInput] = useState('');
  const [showMoreFields, setShowMoreFields] = useState(false);

  // 表单核心状态
  const [formData, setFormData] = useState<{
    companyName: string;
    jobTitle: string;
    url: string;
    priority: ApplicationPriority;
    appliedDate: string;
    salary: string;
    location: string;
    source: string;
    jobDescription: string;
    deadline: string;
  }>({
    companyName: '',
    jobTitle: '',
    url: '',
    priority: 'target',
    appliedDate: new Date().toISOString().split('T')[0],
    salary: '',
    location: '',
    source: '',
    jobDescription: '',
    deadline: '',
  });

  const applyParsed = useJobAutofill(setFormData);

  useEffect(() => {
    if (isOpen) {
      setSmartInput('');
      setShowMoreFields(false);
      setFormData({
        companyName: '',
        jobTitle: '',
        url: '',
        priority: 'target',
        appliedDate: new Date().toISOString().split('T')[0],
        salary: '',
        location: '',
        source: '',
        jobDescription: '',
    deadline: '',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.jobTitle.trim()) {
      alert('请至少填写公司名称和投递岗位');
      return;
    }

    onSubmit({
      companyName: formData.companyName.trim(),
      jobTitle: formData.jobTitle.trim(),
      url: formData.url.trim(),
      priority: formData.priority,
      appliedDate: formData.appliedDate,
      salary: formData.salary.trim() || undefined,
      location: formData.location.trim() || undefined,
      source: formData.source.trim() || undefined,
      jobDescription: formData.jobDescription.trim() || undefined,
      deadline: formData.deadline || undefined,
    });
    onClose();
  };

  return (
    <>
      {/* 遮罩背景 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* 模态框主体 */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '14px',
          width: '90%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* 头部 */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div>
            <h3 className="text-h3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--primary)" />
              添加投递岗位
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              支持粘贴 Boss/牛客/拉勾/大厂官网链接或分享文案自动填写各字段
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 滚动表单区域 */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <JobLinkInput value={smartInput} onChange={setSmartInput} onParsed={(parsed, reset) => {
            applyParsed(parsed, reset);
            if (parsed.jobDescription) setShowMoreFields(true);
          }} />

          <form id="add-app-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 第一行：公司名称 + 投递岗位 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  公司名称 *
                </label>
                <input
                  required
                  placeholder="例如：字节跳动 / 美团"
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  投递岗位 *
                </label>
                <input
                  required
                  placeholder="例如：前端开发工程师"
                  value={formData.jobTitle}
                  onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* 第二行：岗位链接 / 进度查询链接 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  岗位链接 / 进度查询链接 (可选)
                </label>
                {formData.url && (
                  <a
                    href={formData.url.startsWith('http') ? formData.url : `https://${formData.url}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={11} /> 预览直达
                  </a>
                )}
              </div>
              <input
                placeholder="https://... 官网招聘详情或投递进度链接"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                onPaste={event => {
                  const text = event.clipboardData.getData('text');
                  const parsed = extractUrlFromText(text);
                  if (parsed.url) {
                    event.preventDefault();
                    setFormData(prev => ({ ...prev, url: parsed.url! }));
                    setSmartInput(text);
                  }
                }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  outline: 'none',
                }}
              />
            </div>

            {/* 第三行：薪资范围 + 工作城市 + 信息来源 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  薪资范围
                </label>
                <input
                  placeholder="如: 25k-35k*16"
                  value={formData.salary}
                  onChange={e => setFormData({ ...formData, salary: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  工作地点
                </label>
                <input
                  placeholder="如: 北京 / 上海"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  来源平台
                </label>
                <input
                  placeholder="如: Boss直聘 / 官网"
                  value={formData.source}
                  onChange={e => setFormData({ ...formData, source: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* 第四行：意向梯队 + 投递日期 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  意向梯队 / 难度
                </label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as ApplicationPriority })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="dream">冲刺 (重点意向 / 高难度)</option>
                  <option value="target">主攻 (核心匹配 / 主力投递)</option>
                  <option value="safety">保底 (稳健备选 / 练习托底)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  投递日期
                </label>
                <input
                  type="date"
                  value={formData.appliedDate}
                  onChange={e => setFormData({ ...formData, appliedDate: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              招聘截止日期（选填）
              <input type="date" value={formData.deadline} onChange={event => setFormData(prev => ({ ...prev, deadline: event.target.value }))}
                style={{ display: 'block', marginTop: 6, width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            </label>

            {/* 可折叠的岗位职责 / JD 区域 */}
            <div>
              <button
                type="button"
                onClick={() => setShowMoreFields(!showMoreFields)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                  fontWeight: 500,
                  marginTop: '4px',
                }}
              >
                {showMoreFields ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showMoreFields ? '收起岗位描述 (JD)' : '展开岗位描述 / JD 职责 (可选)'}
              </button>

              {showMoreFields && (
                <div style={{ marginTop: '8px' }}>
                  <textarea
                    placeholder="若粘贴的招聘文案中包含详细的 JD、职责或要求，会自动提取在此处，方便面试前复盘..."
                    value={formData.jobDescription}
                    onChange={e => setFormData({ ...formData, jobDescription: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                    }}
                  />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* 底部按钮栏 */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '8px 18px', fontSize: '13.5px' }}
          >
            取消
          </button>
          <button
            type="submit"
            form="add-app-form"
            className="btn btn-primary"
            style={{ padding: '8px 22px', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Check size={16} />
            确认添加
          </button>
        </div>
      </div>
    </>
  );
};
