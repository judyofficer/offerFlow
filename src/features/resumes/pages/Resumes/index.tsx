import React, { useRef, useState, useEffect } from 'react';
import { Plus, Copy, Trash2, FileText, Download, UploadCloud, Loader2, Edit3, X, FileDown, Undo2, Redo2, Sliders, Sparkles, RotateCcw, ChevronDown, FileCode, Globe, AlignLeft, Database, ChevronLeft, Eye } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useResumeStore, defaultResumeLayout } from '../../store/useResumeStore';
import type { ResumeLayoutConfig } from '../../types/resume';
import ResumeEditor from '../../components/ResumeEditor';
import ResumePreview from '../../components/ResumePreview';
import { extractTextFromPdf, parseTextWithLLM } from '../../services/resumeParser';
import { saveFileToIDB, getFileFromIDB } from '../../../../core/services/storage';
import { resumeToMarkdown, resumeToTxt, resumeToHtml, downloadFile } from '../../utils/exportFormats';
import styles from './Resumes.module.css';


const PRESETS: Record<string, { label: string; config: ResumeLayoutConfig }> = {
  compact: {
    label: '紧凑单页',
    config: { pagePadding: 28, sectionSpacing: 12, itemSpacing: 9, lineHeight: 1.42, baseFontSize: 12.5 },
  },
  standard: {
    label: '标准平衡',
    config: { pagePadding: 36, sectionSpacing: 16, itemSpacing: 12, lineHeight: 1.5, baseFontSize: 13 },
  },
  relaxed: {
    label: '宽松大方',
    config: { pagePadding: 44, sectionSpacing: 22, itemSpacing: 16, lineHeight: 1.6, baseFontSize: 13.5 },
  },
};

const Resumes: React.FC = () => {
  const { resumes, activeResumeId, addResume, setActiveResume, deleteResume, duplicateResume, importResume, updateActiveResumeLayout, past, future } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);
  const currentLayout = { ...defaultResumeLayout, ...(activeResume?.content.layout || {}) };
  const canUndo = (past?.length || 0) > 0;
  const canRedo = (future?.length || 0) > 0;
  
  const componentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isLayoutSettingsOpen, setIsLayoutSettingsOpen] = useState(false);

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
    documentTitle: activeResume?.name || '简历',
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 0mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print,
        .measurement-sandbox,
        .page-divider {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          position: absolute !important;
          top: -99999px !important;
          left: -99999px !important;
        }
        .resume-pages-wrapper {
          width: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .resume-pages-container {
          display: block !important;
          width: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
          gap: 0 !important;
        }
        .a4-page {
          box-shadow: none !important;
          margin: 0 !important;
          width: 210mm !important;
          max-width: 210mm !important;
          min-height: auto !important;
          height: auto !important;
          box-sizing: border-box !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: always !important;
          break-after: page !important;
          overflow: visible !important;
          background: #fff !important;
        }
        .a4-page.last-page,
        .a4-page:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
      }
    `,
  });

  const handleAutoFitOnePage = () => {
    if (!componentRef.current) return;
    
    // Measure all unpaginated chunks from the measurement sandbox
    const chunkEls = componentRef.current.querySelectorAll('.measurement-sandbox [data-chunk-id]');
    let totalChunkHeight = 0;
    chunkEls.forEach(el => {
      totalChunkHeight += (el as HTMLElement).offsetHeight;
    });

    const currentPagePadding = currentLayout.pagePadding || 36;
    const currentTotalHeight = totalChunkHeight > 0 
      ? totalChunkHeight + currentPagePadding * 2 
      : (componentRef.current.scrollHeight || 1123);

    // Target total height to fill ~95-97% of an A4 page (1123px)
    // 1070px leaves an elegant cushion, looking fully filled without overflowing
    const TARGET_HEIGHT = 1070;
    
    // Scale ratio: > 1 means expand to fill white space, < 1 means compress to fit in 1 page
    const ratio = Math.max(0.7, Math.min(1.45, TARGET_HEIGHT / currentTotalHeight));

    const currentFontSize = currentLayout.baseFontSize || 13;
    const currentLineHeight = currentLayout.lineHeight || 1.5;
    const currentSectionSpacing = currentLayout.sectionSpacing || 16;
    const currentItemSpacing = currentLayout.itemSpacing || 12;

    // Apply intelligent adaptive scaling
    const newFontSize = Math.max(11.5, Math.min(14.5, currentFontSize * Math.pow(ratio, 0.35)));
    const newLineHeight = Math.max(1.35, Math.min(1.70, currentLineHeight * Math.pow(ratio, 0.35)));
    const newSectionSpacing = Math.max(8, Math.min(26, currentSectionSpacing * Math.pow(ratio, 0.85)));
    const newItemSpacing = Math.max(5, Math.min(20, currentItemSpacing * Math.pow(ratio, 0.85)));
    const newPadding = Math.max(24, Math.min(46, currentPagePadding * Math.pow(ratio, 0.5)));

    updateActiveResumeLayout({
      baseFontSize: parseFloat(newFontSize.toFixed(1)),
      lineHeight: parseFloat(newLineHeight.toFixed(2)),
      sectionSpacing: Math.round(newSectionSpacing),
      itemSpacing: Math.round(newItemSpacing),
      pagePadding: Math.round(newPadding),
    });
  };

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
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleExportMd = () => {
    if (!activeResume) return;
    const md = resumeToMarkdown(activeResume);
    const filename = `${activeResume.name || '简历'}.md`;
    downloadFile(md, filename, 'text/markdown');
  };

  const handleExportTxt = () => {
    if (!activeResume) return;
    const txt = resumeToTxt(activeResume);
    const filename = `${activeResume.name || '简历'}.txt`;
    downloadFile(txt, filename, 'text/plain');
  };

  const handleExportHtml = () => {
    if (!activeResume) return;
    const html = resumeToHtml(activeResume, currentLayout);
    const filename = `${activeResume.name || '简历'}.html`;
    downloadFile(html, filename, 'text/html');
  };

  const handleExportJson = () => {
    if (!activeResume) return;
    const json = JSON.stringify(activeResume, null, 2);
    const filename = `${activeResume.name || '简历'}.json`;
    downloadFile(json, filename, 'application/json');
  };

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

  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [mobileZoomMode, setMobileZoomMode] = useState<'fit' | 'full'>('fit');
  const [mobileZoomFactor, setMobileZoomFactor] = useState(1);
  const [autoScale, setAutoScale] = useState(0.46);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        const screenW = window.innerWidth;
        const availableW = Math.max(280, screenW - 16);
        setAutoScale(Math.min(1, parseFloat((availableW / 794).toFixed(3))));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectResumeMobile = (id: string) => {
    setActiveResume(id);
    setMobileTab('editor');
  };

  const effectiveZoom = mobileZoomMode === 'fit' ? autoScale : mobileZoomFactor;

  const renderExportDropdown = () => (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn btn-accent btn-sm" 
        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
        disabled={!activeResumeId}
        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px' }}
      >
        <Download size={14} /> 导出 <ChevronDown size={13} style={{ opacity: 0.8, transform: isExportMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {isExportMenuOpen && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 100 }} 
            onClick={() => setIsExportMenuOpen(false)} 
          />
          <div 
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '6px',
              width: '230px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
              padding: '6px',
              zIndex: 101,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            <button
              type="button"
              className={styles.exportMenuItem}
              onClick={() => { setIsExportMenuOpen(false); handlePrint(); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={16} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>PDF 物理排版 (.pdf)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>A4 标准排版 / 求职投递</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              className={styles.exportMenuItem}
              onClick={() => { setIsExportMenuOpen(false); handleExportMd(); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCode size={16} color="#10b981" />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>Markdown 格式 (.md)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>AI 润色 / 知识库 / Notion</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              className={styles.exportMenuItem}
              onClick={() => { setIsExportMenuOpen(false); handleExportHtml(); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={16} color="#6366f1" />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>HTML 单文件 (.html)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>独立离线网页 / 邮件发送</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              className={styles.exportMenuItem}
              onClick={() => { setIsExportMenuOpen(false); handleExportTxt(); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlignLeft size={16} color="#f59e0b" />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>纯文本格式 (.txt)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>招聘网站文本框快速粘贴</div>
                </div>
              </div>
            </button>

            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

            <button
              type="button"
              className={styles.exportMenuItem}
              onClick={() => { setIsExportMenuOpen(false); handleExportJson(); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={16} color="#8b5cf6" />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>JSON 数据备份 (.json)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>完整结构备份与跨端迁移</div>
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderModals = () => (
    <>
      {/* PDF Preview Modal */}
      {previewPdfUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', width: '90vw', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} />
                {activeResume?.sourceFileName}
              </h3>
              <button onClick={closePreview} className="btn btn-ghost btn-icon">
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
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: 'var(--radius-lg)', width: '90vw', maxWidth: '400px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="text-h3">
                {modalState.type === 'create' && '新建简历'}
                {modalState.type === 'duplicate' && '复制简历'}
                {modalState.type === 'rename' && '重命名简历'}
              </h3>
              <button onClick={() => setModalState({ isOpen: false, type: 'create' })} className="btn btn-ghost btn-icon">
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
                <button type="button" className="btn btn-outline" onClick={() => setModalState({ isOpen: false, type: 'create' })}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={!modalInput.trim()}>确认</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isParsing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: 'white' }}>
          <Loader2 size={48} className="lucide-spin" style={{ animation: 'spin 2s linear infinite', marginBottom: '24px', color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '22px', marginBottom: '8px', textAlign: 'center', padding: '0 16px' }}>AI 正在智能解析您的简历...</h2>
          <p style={{ color: '#ccc', textAlign: 'center' }}>这可能需要大约 10-15 秒，请耐心等待。</p>
        </div>
      )}

      {/* Layout Settings Modal */}
      {isLayoutSettingsOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: 'var(--radius-lg)', width: '92vw', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Sliders size={18} /> 排版间距与字号微调
              </h2>
              <button onClick={() => setIsLayoutSettingsOpen(false)} className="btn btn-ghost btn-icon">
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label className={styles.label}>快捷排版预设</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => updateActiveResumeLayout(preset.config)}
                      style={{ fontSize: '12px', padding: '8px 4px', textAlign: 'center', borderColor: JSON.stringify(currentLayout) === JSON.stringify(preset.config) ? 'var(--primary)' : undefined, backgroundColor: JSON.stringify(currentLayout) === JSON.stringify(preset.config) ? 'var(--bg-tertiary)' : undefined }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className={styles.label} style={{ marginBottom: 0 }}>页面边距 (Page Padding)</label>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{currentLayout.pagePadding}px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="52"
                  step="2"
                  value={currentLayout.pagePadding}
                  onChange={(e) => updateActiveResumeLayout({ pagePadding: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className={styles.label} style={{ marginBottom: 0 }}>模块间距 (Section Spacing)</label>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{currentLayout.sectionSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="28"
                  step="1"
                  value={currentLayout.sectionSpacing}
                  onChange={(e) => updateActiveResumeLayout({ sectionSpacing: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className={styles.label} style={{ marginBottom: 0 }}>条目间距 (Item Spacing)</label>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{currentLayout.itemSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="20"
                  step="1"
                  value={currentLayout.itemSpacing}
                  onChange={(e) => updateActiveResumeLayout({ itemSpacing: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className={styles.label} style={{ marginBottom: 0 }}>文本行高 (Line Height)</label>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{currentLayout.lineHeight}</span>
                </div>
                <input
                  type="range"
                  min="1.25"
                  max="1.75"
                  step="0.05"
                  value={currentLayout.lineHeight}
                  onChange={(e) => updateActiveResumeLayout({ lineHeight: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className={styles.label} style={{ marginBottom: 0 }}>基础字号 (Base Font Size)</label>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{currentLayout.baseFontSize}px</span>
                </div>
                <input
                  type="range"
                  min="11.5"
                  max="15"
                  step="0.5"
                  value={currentLayout.baseFontSize}
                  onChange={(e) => updateActiveResumeLayout({ baseFontSize: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => updateActiveResumeLayout(defaultResumeLayout)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={14} /> 恢复默认
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsLayoutSettingsOpen(false)}
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Dedicated Mobile Layout Render
  if (isMobile) {
    return (
      <div className={styles.mobileContainer}>
        {renderModals()}

        {!activeResumeId ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className={styles.mobileHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--primary)" />
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>简历管理</h2>
                <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {resumes.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '5px 8px' }}>
                  <UploadCloud size={14} /> 导入
                </button>
                <input 
                  type="file" 
                  accept=".pdf" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
                <button className="btn btn-accent btn-sm" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '5px 8px' }}>
                  <Plus size={14} /> 新建
                </button>
              </div>
            </div>

            <div className={styles.mobileVersionsContainer}>
              {resumes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-tertiary)' }}>
                  <FileText size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>暂无简历版本</p>
                  <button className="btn btn-accent btn-sm" onClick={openCreateModal}>
                    立即新建简历
                  </button>
                </div>
              ) : (
                resumes.map(resume => (
                  <div 
                    key={resume.id}
                    className={styles.mobileResumeCard}
                    onClick={() => handleSelectResumeMobile(resume.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                        {resume.name}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 500 }}>
                        编辑 ➔
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>更新于 {new Date(resume.updatedAt).toLocaleDateString()}</span>
                      <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                        <button onClick={(e) => openRenameModal(resume.id, e)} className="btn btn-ghost btn-icon btn-sm" title="重命名">
                          <Edit3 size={15} color="var(--text-secondary)" />
                        </button>
                        <button onClick={(e) => openDuplicateModal(resume.id, e)} className="btn btn-ghost btn-icon btn-sm" title="复制">
                          <Copy size={15} color="var(--text-secondary)" />
                        </button>
                        <button onClick={(e) => handleDelete(resume.id, e)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} title="删除">
                          <Trash2 size={15} color="var(--danger)" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className={styles.mobileHeader}>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setActiveResume(null as any)}
                style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '-4px' }}
              >
                <ChevronLeft size={18} />
                <span style={{ fontSize: '13px' }}>列表</span>
              </button>

              <div 
                style={{ fontWeight: 600, fontSize: '13px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                onClick={(e) => openRenameModal(activeResumeId, e)}
                title="点击修改名称"
              >
                <span>{activeResume?.name}</span>
                <Edit3 size={11} color="var(--text-tertiary)" />
              </div>

              <div className={styles.mobileTabGroup}>
                <button 
                  className={`${styles.mobileTabBtn} ${mobileTab === 'editor' ? styles.activeTab : ''}`}
                  onClick={() => setMobileTab('editor')}
                >
                  <Edit3 size={13} /> 编辑
                </button>
                <button 
                  className={`${styles.mobileTabBtn} ${mobileTab === 'preview' ? styles.activeTab : ''}`}
                  onClick={() => setMobileTab('preview')}
                >
                  <Eye size={13} /> 预览
                </button>
              </div>
            </div>

            {mobileTab === 'editor' ? (
              <div className={styles.mobileEditorWrapper}>
                <ResumeEditor />
                
                <button 
                  className={`btn btn-accent ${styles.mobileFloatingBtn}`}
                  onClick={() => setMobileTab('preview')}
                >
                  <Eye size={15} /> 预览 A4 排版
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className={styles.mobileToolbar}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleAutoFitOnePage}
                      title="一键单页适配"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', color: 'var(--primary)' }}
                    >
                      <Sparkles size={13} /> 单页适配
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setIsLayoutSettingsOpen(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px' }}
                    >
                      <Sliders size={13} /> 排版
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', backgroundColor: 'var(--bg-tertiary)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                      <button
                        className={`btn btn-sm ${mobileZoomMode === 'fit' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => { setMobileZoomMode('fit'); }}
                        style={{ fontSize: '11px', padding: '2px 6px', height: '24px' }}
                      >
                        适应
                      </button>
                      <button
                        className={`btn btn-sm ${mobileZoomMode === 'full' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => { setMobileZoomMode('full'); setMobileZoomFactor(1); }}
                        style={{ fontSize: '11px', padding: '2px 6px', height: '24px' }}
                      >
                        100%
                      </button>
                    </div>
                    {renderExportDropdown()}
                  </div>
                </div>

                <div 
                  className={styles.mobilePreviewWrapper}
                  style={{ overflowX: mobileZoomMode === 'fit' ? 'hidden' : 'auto' }}
                >
                  <div
                    style={{
                      width: `${Math.round(794 * effectiveZoom)}px`,
                      transformOrigin: 'top center',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '794px',
                        transform: `scale(${effectiveZoom})`,
                        transformOrigin: 'top left',
                      }}
                    >
                      <div ref={componentRef} className={styles.a4Page}>
                        <ResumePreview />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Group orientation="horizontal" className={styles.container}>
      {renderModals()}

      <Panel defaultSize="50" minSize="25" maxSize="75">
        {!activeResumeId ? (
          <aside className={styles.versionsPanel}>
            <div className={styles.versionsHeader}>
              <h3 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                <FileText size={18} />
                简历版本
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud size={16} /> 导入
                </button>
                <input 
                  type="file" 
                  accept=".pdf" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
                <button className="btn btn-accent" onClick={openCreateModal} title="新建简历">
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
                        <button onClick={(e) => openRenameModal(resume.id, e)} className="btn btn-ghost btn-icon" title="重命名">
                          <Edit3 size={14} color="var(--text-secondary)" />
                        </button>
                        <button onClick={(e) => openDuplicateModal(resume.id, e)} className="btn btn-ghost btn-icon" title="复制">
                          <Copy size={14} color="var(--text-secondary)" />
                        </button>
                        <button onClick={(e) => handleDelete(resume.id, e)} className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} title="删除">
                          <Trash2 size={14} color="var(--danger)" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        ) : (
          <div className={styles.editorPane}>
            <ResumeEditor />
          </div>
        )}
      </Panel>

      <Separator className={styles.resizer} />

      <Panel minSize="30">
        <div className={styles.previewPane}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '794px', margin: '0 auto' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    className="btn btn-outline btn-sm" 
                    style={{ padding: '6px 8px', opacity: canUndo ? 1 : 0.5 }} 
                    onClick={() => useResumeStore.getState().undo()} 
                    disabled={!canUndo}
                    title="撤销 (Ctrl+Z)"
                  >
                    <Undo2 size={16} />
                  </button>
                  <button 
                    className="btn btn-outline btn-sm" 
                    style={{ padding: '6px 8px', opacity: canRedo ? 1 : 0.5 }} 
                    onClick={() => useResumeStore.getState().redo()} 
                    disabled={!canRedo}
                    title="重做 (Ctrl+Shift+Z)"
                  >
                    <Redo2 size={16} />
                  </button>
                </div>

                {activeResumeId && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleAutoFitOnePage}
                      title="根据当前经历内容多少，自动计算并调整间距与字号，让简历刚好收进 1 页 A4 纸内"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}
                    >
                      <Sparkles size={14} /> 一键单页适配
                    </button>

                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setIsLayoutSettingsOpen(true)}
                      title="自定义页面边距、模块间距、行高与基础字号"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Sliders size={14} /> 排版间距
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {activeResume?.sourceFileId && (
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={handlePreviewSource}
                      title="预览原始 PDF"
                    >
                      <FileDown size={16} /> 预览源文件
                    </button>
                  )}
                  {renderExportDropdown()}
                </div>
             </div>
             
             {/* A4 Paper Canvas */}
             <div ref={componentRef} className={styles.a4Page}>
                <ResumePreview />
             </div>
          </div>
        </div>
      </Panel>
    </Group>
  );
};

export default Resumes;
