import React, { useRef } from 'react';
import { Plus, Copy, Trash2, FileText, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useResumeStore } from '../../store/useResumeStore';
import ResumeEditor from '../../components/ResumeEditor';
import ResumePreview from '../../components/ResumePreview';
import styles from './Resumes.module.css';

const Resumes: React.FC = () => {
  const { resumes, activeResumeId, addResume, setActiveResume, deleteResume, duplicateResume } = useResumeStore();
  
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Resume',
  });

  const handleCreateNew = () => {
    const name = prompt('Enter new resume name (e.g. Frontend Dev):');
    if (name) {
      addResume(name);
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt('Enter new resume name for the copy:');
    if (name) {
      duplicateResume(id, name);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this resume?')) {
      deleteResume(id);
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar: Resume Versions List */}
      <aside className={styles.versionsPanel}>
        <div className={styles.versionsHeader}>
          <h3 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} />
            Versions
          </h3>
          <button className={`${styles.button}`} onClick={handleCreateNew}>
            <Plus size={16} /> New
          </button>
        </div>
        
        <div className={styles.versionList}>
          {resumes.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', textAlign: 'center', marginTop: '24px' }}>
              No resumes found. Create your first one!
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
                    <button onClick={(e) => handleDuplicate(resume.id, e)} title="Duplicate">
                      <Copy size={14} color="var(--text-secondary)" />
                    </button>
                    <button onClick={(e) => handleDelete(resume.id, e)} title="Delete">
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
                  <Download size={16} /> Download PDF
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
