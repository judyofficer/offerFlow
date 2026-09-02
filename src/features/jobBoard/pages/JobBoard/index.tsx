import React, { useState, useEffect, useCallback } from 'react';
import { useJobStore } from '../../store/useJobStore';
import { useApplicationStore } from '../../../applications/store/useApplicationStore';
import { ExternalLink, Plus, Trash2, CheckCircle2, CalendarClock, Link2, ArrowRight, X, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JobAddModal } from '../../components/JobAddModal';
import styles from './JobBoard.module.css';

interface AppliedUndoItem {
  bookmark: any;
  applicationId: string;
}

const JobBoard: React.FC = () => {
  const { bookmarks, addBookmark, updateBookmark, deleteBookmark, restoreBookmark } = useJobStore();
  const { applications, addApplication, deleteApplication } = useApplicationStore();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ isOpen: boolean; message: string; canUndo?: boolean }>({ isOpen: false, message: '' });
  const [undoStack, setUndoStack] = useState<AppliedUndoItem[]>([]);

  // 撤回标为已投操作
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const [latest, ...remaining] = undoStack;
    // 从投递看板移除创建的应用
    deleteApplication(latest.applicationId);
    // 恢复原岗位收藏至信息池
    restoreBookmark(latest.bookmark);
    // 更新撤销栈
    setUndoStack(remaining);
    // 提示用户
    setNotification({
      isOpen: true,
      message: `已撤回！【${latest.bookmark.companyName} - ${latest.bookmark.jobTitle}】已恢复至信息池。`,
      canUndo: false,
    });
  }, [undoStack, deleteApplication, restoreBookmark]);

  // Auto-dismiss notification after 5s
  useEffect(() => {
    if (!notification.isOpen) return;
    const timer = setTimeout(() => {
      setNotification({ isOpen: false, message: '' });
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.isOpen]);

  // Keyboard shortcut Ctrl+Z / Cmd+Z to undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (undoStack.length > 0) {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, handleUndo]);

  // Extract unique job titles for autocomplete suggestion
  const suggestedTitles = Array.from(new Set([
    ...bookmarks.map(b => b.jobTitle),
    ...applications.map(a => a.jobTitle)
  ])).filter(Boolean);

  // 1. 去投递：在新标签页打开招聘主页链接
  const handleOpenJobUrl = (bookmark: any) => {
    if (bookmark.url && bookmark.url.trim()) {
      const fullUrl = bookmark.url.startsWith('http') ? bookmark.url.trim() : `https://${bookmark.url.trim()}`;
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } else {
      const inputUrl = prompt(`【${bookmark.companyName} - ${bookmark.jobTitle}】尚未设置招聘链接，请输入网址：`);
      if (inputUrl && inputUrl.trim()) {
        const trimmed = inputUrl.trim();
        updateBookmark(bookmark.id, { url: trimmed });
        const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // 2. 改变投递状态：标为已投并移入投递追踪看板
  const handleMarkAsApplied = (bookmark: any) => {
    // 从 Store 获取最新鲜的岗位数据，避免闭包捕获遗漏刚刚修改的截止日期等字段
    const freshBookmark = useJobStore.getState().bookmarks.find(b => b.id === bookmark.id) || bookmark;

    const newAppId = addApplication({
      companyName: freshBookmark.companyName,
      jobTitle: freshBookmark.jobTitle,
      jobDescription: '',
      url: freshBookmark.url || '',
      salary: freshBookmark.salary || '',
      location: freshBookmark.location || '',
      source: freshBookmark.source || '',
      deadline: freshBookmark.deadline || '',
      status: 'applied'
    });
    deleteBookmark(freshBookmark.id);

    // 深拷贝快照，完整保留原始 bookmark 的所有字段（含 id、deadline、createdAt 等）
    const bookmarkSnapshot = JSON.parse(JSON.stringify(freshBookmark));
    setUndoStack(prev => [{ bookmark: bookmarkSnapshot, applicationId: newAppId }, ...prev]);

    setNotification({
      isOpen: true,
      message: `已将【${freshBookmark.companyName} - ${freshBookmark.jobTitle}】标为已投递，并移入投递追踪看板！`,
      canUndo: true,
    });
  };

  const handleSaveBookmark = (data: any) => {
    addBookmark(data);
  };

  return (
    <div className={styles.container}>

      {isModalOpen && (
        <JobAddModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveBookmark}
          suggestedTitles={suggestedTitles}
        />
      )}

      <header className={styles.header}>
        <div>
          <h1 className="text-h1" style={{ marginBottom: '4px' }}>招聘信息池</h1>
          <p style={{ color: 'var(--text-secondary)' }}>囤积有意向的岗位，一键转化为正式投递记录。</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-accent">
          <Plus size={16} /> 添加收藏
        </button>
      </header>

      <div className={styles.tableContainer}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', zIndex: 1 }}>
              <tr>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>公司与岗位</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>薪资范围</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>工作地点</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>信息来源</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>截止日期</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {bookmarks.map(b => (
                <tr
                  key={b.id}
                  style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{b.companyName}</span>
                      {b.url && b.url.trim() ? (
                        <a
                          href={b.url.startsWith('http') ? b.url.trim() : `https://${b.url.trim()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            backgroundColor: 'rgba(59, 130, 246, 0.08)',
                            color: 'var(--primary, #3b82f6)',
                            textDecoration: 'none',
                            fontWeight: 500,
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            transition: 'all 0.15s ease',
                          }}
                          title={`在新标签页打开招聘主页: ${b.url}`}
                        >
                          <ExternalLink size={12} />
                          <span>招聘官网</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const inputUrl = prompt(`为【${b.companyName} - ${b.jobTitle}】设置招聘链接：`);
                            if (inputUrl && inputUrl.trim()) {
                              updateBookmark(b.id, { url: inputUrl.trim() });
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            background: 'transparent',
                            border: '1px dashed var(--border-color)',
                            cursor: 'pointer',
                          }}
                          title="点击补充投递网址"
                        >
                          <Link2 size={11} /> 补充链接
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{b.jobTitle}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <input
                      value={b.salary || ''}
                      onChange={e => updateBookmark(b.id, { salary: e.target.value })}
                      placeholder="-"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '14px', width: '100px' }}
                    />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <input
                      value={b.location || ''}
                      onChange={e => updateBookmark(b.id, { location: e.target.value })}
                      placeholder="-"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '14px', width: '100px' }}
                    />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <input
                      value={b.source || ''}
                      onChange={e => updateBookmark(b.id, { source: e.target.value })}
                      placeholder="-"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '14px', width: '100px' }}
                    />
                  </td>
                  <td style={{ padding: '16px' }}>
                    {(() => {
                      const rawDeadline = b.deadline || '';
                      let normalizedDate = '';
                      if (rawDeadline) {
                        const cleaned = rawDeadline.trim().replace(/[/.年月]/g, '-').replace(/日/g, '');
                        const parts = cleaned.split('-').filter(Boolean);
                        if (parts.length === 3) {
                          const year = parts[0].padStart(4, '20');
                          const month = parts[1].padStart(2, '0');
                          const day = parts[2].padStart(2, '0');
                          normalizedDate = `${year}-${month}-${day}`;
                        } else {
                          normalizedDate = rawDeadline;
                        }
                      }

                      let color = 'var(--text-secondary)';
                      let urgencyLabel = null;
                      if (normalizedDate) {
                        const daysLeft = Math.ceil((new Date(normalizedDate).getTime() - Date.now()) / 86400000);
                        if (daysLeft < 0) color = 'var(--danger)';
                        else if (daysLeft <= 7) color = '#f59e0b';
                        if (daysLeft < 0) urgencyLabel = <span style={{ fontSize: '11px', marginLeft: '6px', color: 'var(--danger)' }}>已截止</span>;
                        else if (daysLeft <= 7) urgencyLabel = <span style={{ fontSize: '11px', marginLeft: '6px', color: '#f59e0b' }}>还剩 {daysLeft} 天</span>;
                      }
                      return (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarClock size={13} style={{ marginRight: '6px', color: normalizedDate ? color : 'var(--text-tertiary)', flexShrink: 0 }} />
                          <input
                            type="date"
                            value={normalizedDate}
                            onChange={e => updateBookmark(b.id, { deadline: e.target.value })}
                            style={{ background: 'transparent', border: 'none', color, outline: 'none', fontSize: '13px', cursor: 'pointer', width: '120px' }}
                          />
                          {urgencyLabel}
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                      {/* 按钮 1：去投递（跳转到原招聘网页） */}
                      <button
                        type="button"
                        onClick={() => handleOpenJobUrl(b)}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                        title={b.url ? `前往 ${b.companyName} 官网进行投递` : '点击填写并打开投递链接'}
                      >
                        <ExternalLink size={13} /> 去投递
                      </button>

                      {/* 按钮 2：标为已投（改变投递状态并移入看板） */}
                      <button
                        type="button"
                        onClick={() => handleMarkAsApplied(b)}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                        title="已在外部官网完成投递？点击将该岗位状态转为【已投递】并移入投递追踪看板"
                      >
                        <CheckCircle2 size={13} style={{ color: 'var(--success, #10b981)' }} /> 标为已投
                      </button>

                      {/* 按钮 3：删除收藏 */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`确认删除【${b.companyName} - ${b.jobTitle}】的招聘收藏吗？`)) deleteBookmark(b.id);
                        }}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="删除"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {bookmarks.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '64px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    暂无收藏的招聘信息。开始海投收集吧！
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 投递状态流转成功提示 Floating Toast */}
      {notification.isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={18} style={{ color: 'var(--success, #10b981)', flexShrink: 0 }} />
          <div style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
            {notification.message}
          </div>
          {notification.canUndo && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleUndo}
              style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="撤回本次标为已投操作 (Ctrl+Z)"
            >
              <RotateCcw size={12} /> 撤回 (Ctrl+Z)
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/applications')}
            style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            前往投递看板 <ArrowRight size={12} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setNotification({ isOpen: false, message: '' })}
            style={{ padding: '2px', marginLeft: '4px', color: 'var(--text-tertiary)' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default JobBoard;
