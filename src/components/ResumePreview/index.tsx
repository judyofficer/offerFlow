import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';

const ResumePreview: React.FC = () => {
  const { resumes, activeResumeId } = useResumeStore();
  
  const activeResume = resumes.find(r => r.id === activeResumeId);

  if (!activeResume) {
    return null;
  }

  const { personalInfo } = activeResume.content;

  return (
    <div style={{
      width: '100%',
      maxWidth: '794px', // A4 Width approx in pixels at 96dpi (210mm)
      minHeight: '1123px', // A4 Height (297mm)
      backgroundColor: '#fff',
      boxShadow: 'var(--shadow-md)',
      padding: '48px',
      color: '#000',
      fontFamily: 'serif' // Classic resume look
    }}>
      <header style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '32px', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
          {personalInfo.name || 'YOUR NAME'}
        </h1>
        <div style={{ fontSize: '14px', color: '#444', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
        </div>
      </header>

      {personalInfo.summary && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '8px' }}>Summary</h2>
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{personalInfo.summary}</p>
        </section>
      )}

      {/* Placeholders for other sections */}
      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '8px' }}>Experience</h2>
        <div style={{ fontSize: '14px', color: '#888', fontStyle: 'italic' }}>Experience details will appear here.</div>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '8px' }}>Education</h2>
        <div style={{ fontSize: '14px', color: '#888', fontStyle: 'italic' }}>Education details will appear here.</div>
      </section>
    </div>
  );
};

export default ResumePreview;
