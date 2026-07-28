import React, { useState } from 'react';
import { useJobStore } from '../../store/useJobStore';
import { useApplicationStore } from '../../../applications/store/useApplicationStore';
import { ExternalLink, Plus, Trash2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JobAddModal } from '../../components/JobAddModal';

const JobBoard: React.FC = () => {
  const { bookmarks, addBookmark, updateBookmark, deleteBookmark } = useJobStore();
  const { applications, addApplication } = useApplicationStore();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract unique job titles for autocomplete suggestion
  const suggestedTitles = Array.from(new Set([
    ...bookmarks.map(b => b.jobTitle),
    ...applications.map(a => a.jobTitle)
  ])).filter(Boolean);

  const handleApply = (bookmark: any) => {
    if (confirm(`准备投递【${bookmark.companyName} - ${bookmark.jobTitle}】吗？这将其从收藏池移入投递追踪看板。`)) {
      addApplication({
        companyName: bookmark.companyName,
        jobTitle: bookmark.jobTitle,
        jobDescription: '',
        url: bookmark.url,
        salary: bookmark.salary,
        location: bookmark.location,
        source: bookmark.source,
        status: 'applied'
      });
      deleteBookmark(bookmark.id);
      navigate('/applications');
    }
  };

  const handleSaveBookmark = (data: any) => {
    addBookmark(data);
  };

  return (
    <div style={{ padding: '32px 48px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {isModalOpen && (
        <JobAddModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveBookmark}
          suggestedTitles={suggestedTitles}
        />
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-h1" style={{ marginBottom: '4px' }}>招聘信息池</h1>
          <p style={{ color: 'var(--text-secondary)' }}>囤积有意向的岗位，一键转化为正式投递记录。</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{
          backgroundColor: 'var(--accent-color)', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
        }}>
          <Plus size={16} /> 添加收藏
        </button>
      </header>

      <div style={{ flex: 1, backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', zIndex: 1 }}>
              <tr>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>公司与岗位</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>薪资范围</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>工作地点</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>信息来源</th>
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
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {b.companyName}
                      {b.url && (
                        <a
                          href={b.url.startsWith('http') ? b.url : `https://${b.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}
                          title="跳转至原招聘链接"
                        >
                          <ExternalLink size={14} />
                        </a>
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
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleApply(b)}
                      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500, marginRight: '12px' }}
                    >
                      <Send size={14} /> 投递
                    </button>
                    <button
                      onClick={() => { if (confirm('确定删除此收藏？')) deleteBookmark(b.id) }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px' }}
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {bookmarks.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '64px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    暂无收藏的招聘信息。开始海投收集吧！
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JobBoard;
