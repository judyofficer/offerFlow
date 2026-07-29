import React from 'react';
import { Mail, Phone, Link, Globe } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';

const ResumePreview: React.FC = () => {
  const { resumes, activeResumeId } = useResumeStore();
  
  const activeResume = resumes.find(r => r.id === activeResumeId);

  if (!activeResume) return null;

  const { personalInfo, education, experience, projects, skills } = activeResume.content;

  return (
    <div style={{
      width: '100%',
      maxWidth: '794px', 
      minHeight: '1123px',
      backgroundColor: '#fff',
      boxShadow: 'var(--shadow-md)',
      padding: '48px',
      color: '#000',
      fontFamily: '"Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif',
      lineHeight: '1.5'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '32px', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
          {personalInfo.name || '您的名字'}
        </h1>
        <div style={{ fontSize: '14px', color: '#444', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {personalInfo.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {personalInfo.email}</span>}
          {personalInfo.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {personalInfo.phone}</span>}
          {personalInfo.github && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Link size={14} /> {personalInfo.github.replace('https://', '')}</span>}
          {personalInfo.website && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={14} /> {personalInfo.website.replace('https://', '')}</span>}
        </div>
      </header>

      {personalInfo.summary && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #ccc' }}>个人总结</h2>
          <p style={{ fontSize: '14px' }}>{personalInfo.summary}</p>
        </section>
      )}

      {education && education.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #ccc' }}>教育经历</h2>
          {education.map(edu => (
            <div key={edu.id} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span style={{ fontSize: '15px' }}>{edu.school}</span>
                <span style={{ fontSize: '14px' }}>{edu.startDate} {edu.startDate && edu.endDate ? '-' : ''} {edu.endDate}</span>
              </div>
              <div style={{ fontStyle: 'italic', fontSize: '14px' }}>
                {edu.degree} {edu.degree && edu.major ? ' | ' : ''} {edu.major}
              </div>
            </div>
          ))}
        </section>
      )}

      {experience && experience.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #ccc' }}>工作经历</h2>
          {experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span style={{ fontSize: '15px' }}>{exp.company}</span>
                <span style={{ fontSize: '14px' }}>{exp.startDate} {exp.startDate && exp.endDate ? '-' : ''} {exp.endDate}</span>
              </div>
              <div style={{ fontStyle: 'italic', fontSize: '14px', marginBottom: '4px' }}>{exp.title}</div>
              {exp.description && (
                <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>{exp.description}</div>
              )}
            </div>
          ))}
        </section>
      )}

      {projects && projects.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #ccc' }}>项目经历</h2>
          {projects.map(proj => (
            <div key={proj.id} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span style={{ fontSize: '15px' }}>
                  {proj.name} {proj.link && <a href={proj.link} target="_blank" rel="noreferrer" style={{ fontSize: '12px', fontWeight: 'normal', color: '#0056b3' }}>[Link]</a>}
                </span>
                <span style={{ fontSize: '14px' }}>{proj.startDate} {proj.startDate && proj.endDate ? '-' : ''} {proj.endDate}</span>
              </div>
              <div style={{ fontStyle: 'italic', fontSize: '14px', marginBottom: '4px' }}>{proj.role}</div>
              {proj.description && (
                <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>{proj.description}</div>
              )}
            </div>
          ))}
        </section>
      )}

      {skills && skills.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #ccc' }}>专业技能</h2>
          {skills.map(skill => (
            <div key={skill.id} style={{ fontSize: '14px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold' }}>{skill.category}: </span>
              <span>{skill.items.join(', ')}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default ResumePreview;
