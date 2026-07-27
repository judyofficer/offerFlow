import React, { useRef, useState } from 'react';
import { Plus, Copy, Trash2, FileText, Download, UploadCloud, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useResumeStore } from '../../store/useResumeStore';
import ResumeEditor from '../../components/ResumeEditor';
import ResumePreview from '../../components/ResumePreview';
import { extractTextFromPdf, parseTextWithLLM } from '../../services/resumeParser';
import styles from './Resumes.module.css';

const Resumes: React.FC = () => {
  const { resumes, activeResumeId, addResume, setActiveResume, deleteResume, duplicateResume, importResume } = useResumeStore();
  
  const componentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Resume',
  });

  const handleCreateNew = () => {
    const name = prompt('请输入新简历的名称 (例如: 前端开发-通用版):');
    if (name) {
      addResume(name);
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt('请输入复制后的简历名称:');
    if (name) {
      duplicateResume(id, name);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('您确定要删除这份简历吗？该操作无法恢复。')) {
      deleteResume(id);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('目前仅支持上传 PDF 格式的简历。');
      return;
    }

    try {
      setIsParsing(true);
      // 1. Extract text from PDF
      const extractedText = await extractTextFromPdf(file);
      // 2. Parse text with LLM
      const parsedContent = await parseTextWithLLM(extractedText);
      // 3. Save to store
      importResume(`解析版 - ${file.name}`, parsedContent);
      alert('简历解析成功！');
    } catch (error: any) {
      alert(error.message || '解析失败，请检查设置中的 API 配置。');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={styles.container}>
      {isParsing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: 'white' }}>
          <Loader2 size={48} className="lucide-spin" style={{ animation: 'spin 2s linear infinite', marginBottom: '24px', color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>AI 正在智能解析您的简历...</h2>
          <p style={{ color: '#ccc' }}>这可能需要大约 10-15 秒，请耐心等待。</p>
        </div>
      )}

      {/* Sidebar: Resume Versions List */}
      <aside className={styles.versionsPanel}>
        <div className={styles.versionsHeader}>
          <h3 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} />
            简历版本
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={`${styles.button} ${styles.buttonOutline}`} onClick={() => fileInputRef.current?.click()} title="导入简历 (PDF)">
              <UploadCloud size={16} /> 导入
            </button>
            <input 
              type="file" 
              accept=".pdf" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
            />
            <button className={`${styles.button}`} onClick={handleCreateNew}>
              <Plus size={16} /> 新建
            </button>
          </div>
        </div>
        
        <div className={styles.versionList}>
          {resumes.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', textAlign: 'center', marginTop: '24px' }}>
              暂无简历版本，请点击右上角新建！
            </div>
          ) : (
            resumes.map(resume => (
              <div 
                key={resume.id}
                className={`${styles.versionItem} ${resume.id === activeResumeId ? styles.active : ''}`}
                onClick={() => setActiveResume(resume.id)}
              >
                <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>{resume.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{new Date(resume.updatedAt).toLocaleDateString()}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={(e) => handleDuplicate(resume.id, e)} title="复制">
                      <Copy size={14} color="var(--text-secondary)" />
                    </button>
                    <button onClick={(e) => handleDelete(resume.id, e)} title="删除">
                      <Trash2 size={14} color="var(--danger)" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Workspace: Editor and Preview side-by-side */}
      <main className={styles.workspace}>
        <div className={styles.editorPane}>
          <ResumeEditor />
        </div>
        <div className={styles.previewPane}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '794px', margin: '0 auto' }}>
             <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button 
                  className={styles.button} 
                  onClick={() => handlePrint()} 
                  disabled={!activeResumeId}
                >
                  <Download size={16} /> 导出 PDF
                </button>
             </div>
             
             <div ref={componentRef}>
                <ResumePreview />
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Resumes;
