import React, { useRef, useState, useEffect } from 'react';
import { Plus, Copy, Trash2, FileText, Download, UploadCloud, Loader2, Sidebar, Edit3, SidebarClose, EyeOff, X, FileDown, Undo2, Redo2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useResumeStore } from '../../store/useResumeStore';
import ResumeEditor from '../../components/ResumeEditor';
import ResumePreview from '../../components/ResumePreview';
import { extractTextFromPdf, parseTextWithLLM } from '../../services/resumeParser';
import { saveFileToIDB, getFileFromIDB } from '../../../../core/services/storage';
import styles from './Resumes.module.css';

const Resumes: React.FC = () => {
  const { resumes, activeResumeId, addResume, setActiveResume, deleteResume, duplicateResume, importResume } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);
  
  const componentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Layout state
  const [showVersions, setShowVersions] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  
  // Modal State
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: 'create' | 'duplicate' | 'rename'; targetId?: string }>({ isOpen: false, type: 'create' });
  const [modalInput, setModalInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modalState.isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [modalState.isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }
      if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          useResumeStore.getState().redo();
        } else {
          useResumeStore.getState().undo();
        }
      } else if (e.key.toLowerCase() === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        useResumeStore.getState().redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Resume',
  });

  const openCreateModal = () => {
    setModalInput('');
    setModalState({ isOpen: true, type: 'create' });
  };

  const openDuplicateModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const sourceResume = resumes.find(r => r.id === id);
    setModalInput(sourceResume ? `${sourceResume.name} - 副本` : '');
    setModalState({ isOpen: true, type: 'duplicate', targetId: id });
  };

  const openRenameModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const sourceResume = resumes.find(r => r.id === id);
    setModalInput(sourceResume ? sourceResume.name : '');
    setModalState({ isOpen: true, type: 'rename', targetId: id });
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = modalInput.trim();
    if (!trimmedInput) return;

    if (modalState.type === 'create') {
      addResume(trimmedInput);
    } else if (modalState.type === 'duplicate' && modalState.targetId) {
      duplicateResume(modalState.targetId, trimmedInput);
    } else if (modalState.type === 'rename' && modalState.targetId) {
      useResumeStore.getState().renameResume(modalState.targetId, trimmedInput);
    }
    
    setModalState({ isOpen: false, type: 'create' });
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
      // 3. Save source file to IndexedDB to avoid localStorage quota issues
      const fileId = await saveFileToIDB(file);
      // 4. Save to store with file reference
      importResume(`解析版 - ${file.name}`, parsedContent, fileId, file.name);
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

  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const handlePreviewSource = async () => {
    if (!activeResume?.sourceFileId || !activeResume?.sourceFileName) return;
    
    try {
      const file = await getFileFromIDB(activeResume.sourceFileId);
      if (!file) {
        alert('未找到源文件，可能已被清理。');
        return;
      }
      
      const url = URL.createObjectURL(file);
      setPreviewPdfUrl(url);
    } catch (error) {
      alert('预览源文件失败');
      console.error(error);
    }
  };

  const closePreview = () => {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* PDF Preview Modal */}
      {previewPdfUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', width: '90vw', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} />
                {activeResume?.sourceFileName}
              </h3>
              <button onClick={closePreview} style={{ color: 'var(--text-secondary)', cursor: 'pointer', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '4px' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ flex: 1, backgroundColor: '#525659' }}>
              <iframe src={`${previewPdfUrl}#view=FitH`} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
            </div>
          </div>
        </div>
      )}
      {/* Naming Modal */}
      {modalState.isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="text-h3">
                {modalState.type === 'create' && '新建简历'}
                {modalState.type === 'duplicate' && '复制简历'}
                {modalState.type === 'rename' && '重命名简历'}
              </h3>
              <button onClick={() => setModalState({ isOpen: false, type: 'create' })} style={{ color: 'var(--text-tertiary)', cursor: 'pointer', background: 'transparent', border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleModalSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>简历名称</label>
                <input 
                  ref={inputRef}
                  type="text" 
                  className={styles.input} 
                  value={modalInput} 
                  onChange={e => setModalInput(e.target.value)} 
                  placeholder={
                    modalState.type === 'create' ? "例如: 前端开发-大厂特供版" : 
                    modalState.type === 'rename' ? "请输入新的简历名称" : "请输入复制后的名称"
                  }
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className={`${styles.button} ${styles.buttonOutline}`} onClick={() => setModalState({ isOpen: false, type: 'create' })}>取消</button>
                <button type="submit" className={styles.button} disabled={!modalInput.trim()}>确认</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isParsing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: 'white' }}>
          <Loader2 size={48} className="lucide-spin" style={{ animation: 'spin 2s linear infinite', marginBottom: '24px', color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>AI 正在智能解析您的简历...</h2>
          <p style={{ color: '#ccc' }}>这可能需要大约 10-15 秒，请耐心等待。</p>
        </div>
      )}

      {/* Sidebar: Resume Versions List */}
      {showVersions && (
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
              <button className={`${styles.button}`} onClick={openCreateModal} title="新建简历">
                <Plus size={16} />
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
                  <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px', wordBreak: 'break-all' }}>{resume.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{new Date(resume.updatedAt).toLocaleDateString()}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={(e) => openRenameModal(resume.id, e)} title="重命名">
                        <Edit3 size={14} color="var(--text-secondary)" />
                      </button>
                      <button onClick={(e) => openDuplicateModal(resume.id, e)} title="复制">
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
      )}

      {/* Main Workspace: Editor and Preview side-by-side */}
      <main className={styles.workspace}>
        {showEditor && (
          <div className={styles.editorPane}>
            <ResumeEditor />
          </div>
        )}
        
        <div className={styles.previewPane}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '794px', margin: '0 auto' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={styles.buttonOutline} style={{ padding: '6px 12px' }} onClick={() => setShowVersions(!showVersions)} title="切换版本列表">
                    {showVersions ? <SidebarClose size={16} /> : <Sidebar size={16} />}
                    <span style={{ marginLeft: '6px' }}>版本列表</span>
                  </button>
                  <button className={styles.buttonOutline} style={{ padding: '6px 12px' }} onClick={() => setShowEditor(!showEditor)} title="切换编辑器">
                    {showEditor ? <EyeOff size={16} /> : <Edit3 size={16} />}
                    <span style={{ marginLeft: '6px' }}>编辑器</span>
                  </button>
                  <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
                  <button 
                    className={styles.buttonOutline} 
                    style={{ padding: '6px 8px', opacity: useResumeStore(s => s.past).length === 0 ? 0.5 : 1 }} 
                    onClick={() => useResumeStore.getState().undo()} 
                    disabled={useResumeStore(s => s.past).length === 0}
                    title="撤销 (Ctrl+Z)"
                  >
                    <Undo2 size={16} />
                  </button>
                  <button 
                    className={styles.buttonOutline} 
                    style={{ padding: '6px 8px', opacity: useResumeStore(s => s.future).length === 0 ? 0.5 : 1 }} 
                    onClick={() => useResumeStore.getState().redo()} 
                    disabled={useResumeStore(s => s.future).length === 0}
                    title="重做 (Ctrl+Shift+Z)"
                  >
                    <Redo2 size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {activeResume?.sourceFileId && (
                    <button 
                      className={`${styles.button} ${styles.buttonOutline}`} 
                      onClick={handlePreviewSource}
                      title="预览原始 PDF"
                    >
                      <FileDown size={16} /> 预览源文件
                    </button>
                  )}
                  <button 
                    className={styles.button} 
                    onClick={() => handlePrint()} 
                    disabled={!activeResumeId}
                  >
                    <Download size={16} /> 导出 PDF
                  </button>
                </div>
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
