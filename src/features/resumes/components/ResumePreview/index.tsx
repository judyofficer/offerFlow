import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import { useResumeStore, defaultResumeLayout } from '../../store/useResumeStore';

const A4_PAGE_HEIGHT = 1123; // Standard A4 height at 794px width (96 DPI)

const ResumePreview: React.FC = () => {
  const { resumes, activeResumeId } = useResumeStore();
  const measureRef = useRef<HTMLDivElement>(null);
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  
  const activeResume = resumes.find(r => r.id === activeResumeId);

  const layout = useMemo(() => ({
    ...defaultResumeLayout,
    ...(activeResume?.content.layout || {})
  }), [activeResume?.content.layout]);

  const {
    pagePadding = 36,
    sectionSpacing = 16,
    itemSpacing = 12,
    lineHeight = 1.5,
    baseFontSize = 13,
  } = layout;

  const sectionTitleStyle: React.CSSProperties = {
    backgroundColor: '#f2f4f7',
    borderLeft: '4px solid #1f2937',
    padding: `${Math.max(2, baseFontSize * 0.25)}px ${Math.max(8, baseFontSize * 0.75)}px`,
    fontSize: `${baseFontSize + 3}px`,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: `${Math.max(6, sectionSpacing * 0.6)}px`,
    letterSpacing: '1px',
    lineHeight: '1.3',
  };

  const itemHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '2px',
  };

  const itemTitleStyle: React.CSSProperties = {
    fontSize: `${baseFontSize + 1.5}px`,
    fontWeight: 'bold',
    color: '#111827',
  };

  const itemDateStyle: React.CSSProperties = {
    fontSize: `${Math.max(11, baseFontSize - 0.5)}px`,
    color: '#4b5563',
  };

  const itemSubtitleStyle: React.CSSProperties = {
    fontSize: `${baseFontSize + 0.5}px`,
    color: '#374151',
    marginBottom: `${Math.max(2, itemSpacing * 0.35)}px`,
  };

  const renderBold = (text: string) => {
    if (!text) return text;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ fontWeight: 600, color: '#111827' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const formatDescription = (desc: string, prefixNode?: React.ReactNode) => {
    if (!desc) return null;
    const lines = desc.split('\n').filter(line => line.trim() !== '');
    
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} style={{ margin: '0 0 3px 0', paddingLeft: '16px', fontSize: `${baseFontSize}px`, color: '#374151', lineHeight: lineHeight, listStyleType: 'disc' }}>
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const listMatch = line.match(/^[-•*·]\s*/);
      if (listMatch) {
        const cleanLine = line.substring(listMatch[0].length);
        currentList.push(
          <li key={index} style={{ marginBottom: `${Math.max(1, itemSpacing * 0.2)}px` }}>
            {index === 0 && prefixNode}
            {renderBold(cleanLine)}
          </li>
        );
      } else {
        flushList();
        elements.push(
          <div key={`div-${index}`} style={{ fontSize: `${baseFontSize}px`, color: '#374151', lineHeight: lineHeight, marginBottom: `${Math.max(1, itemSpacing * 0.2)}px` }}>
            {index === 0 && prefixNode}
            {renderBold(line)}
          </div>
        );
      }
    });
    flushList();

    return <>{elements}</>;
  };

  // Build atomic chunks
  const chunks: Array<{ id: string; node: React.ReactNode }> = [];

  if (activeResume) {
    const { personalInfo, education, experience, projects, skills, campusExperience, awards } = activeResume.content;

    // 1. Header
    const contactItems = [
      personalInfo.phone && `电话：${personalInfo.phone}`,
      personalInfo.email && `邮箱：${personalInfo.email}`,
      personalInfo.city && `现居城市：${personalInfo.city}`,
    ].filter(Boolean);

    const linkItems = [
      personalInfo.github && (
        <React.Fragment key="github">
          Github：
          <a href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
            {personalInfo.github.replace(/^https?:\/\//, '')}
          </a>
        </React.Fragment>
      ),
      personalInfo.website && (
        <React.Fragment key="website">
          主页：
          <a href={personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
            {personalInfo.website.replace(/^https?:\/\//, '')}
          </a>
        </React.Fragment>
      ),
    ].filter(Boolean);

    const demographicItems = [
      personalInfo.gender && `性别：${personalInfo.gender}`,
      personalInfo.birthDate && `生日：${personalInfo.birthDate}`,
      personalInfo.ethnicity && `民族：${personalInfo.ethnicity}`,
      personalInfo.politicalStatus && `政治面貌：${personalInfo.politicalStatus}`,
    ].filter(Boolean);

    const customItems = (personalInfo.customFields || [])
      .filter(f => f.label && f.value)
      .map(f => {
        const isUrl = /^https?:\/\//i.test(f.value) || /^(www\.|github\.com|gitee\.com|linkedin\.com)/i.test(f.value);
        if (isUrl) {
          const href = f.value.startsWith('http') ? f.value : `https://${f.value}`;
          return (
            <React.Fragment key={f.id}>
              {f.label}：
              <a href={href} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                {f.value.replace(/^https?:\/\//, '')}
              </a>
            </React.Fragment>
          );
        }
        return `${f.label}：${f.value}`;
      });

    const intentItems = [
      personalInfo.intendedCity && `意向城市：${personalInfo.intendedCity}`,
      personalInfo.intendedRole && `求职意向：${personalInfo.intendedRole}`,
    ].filter(Boolean);

    const infoRows = [contactItems, linkItems, demographicItems, customItems, intentItems].filter(row => row.length > 0);

    chunks.push({
      id: 'header',
      node: (
        <header style={{ marginBottom: `${Math.max(12, sectionSpacing * 0.9)}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: '16px' }}>
            <h1 style={{ fontSize: `${baseFontSize + 14}px`, fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0', letterSpacing: '1.5px' }}>
              {personalInfo.name || '您的名字'}
            </h1>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${Math.max(4, Math.round(baseFontSize * 0.3))}px`, fontSize: `${baseFontSize}px`, color: '#4b5563', lineHeight: 1.35 }}>
              {infoRows.map((rowItems, rIdx) => (
                <div key={rIdx} style={{ display: 'flex', columnGap: '8px', rowGap: `${Math.max(4, Math.round(baseFontSize * 0.3))}px`, flexWrap: 'wrap', alignItems: 'center' }}>
                  {rowItems.map((node, idx, arr) => (
                    <React.Fragment key={idx}>
                      <span>{node}</span>
                      {idx < arr.length - 1 && <span style={{ color: '#d1d5db', userSelect: 'none' }}>|</span>}
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          {personalInfo.avatar && (
            <div style={{ flexShrink: 0, marginLeft: '16px' }}>
              <img 
                src={personalInfo.avatar} 
                alt="Profile Avatar" 
                style={{ width: `${Math.round(baseFontSize * 5.8)}px`, height: `${Math.round(baseFontSize * 7.8)}px`, objectFit: 'cover', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }} 
              />
            </div>
          )}
        </header>
      )
    });

    // 2. Education
    if (education && education.length > 0) {
      education.forEach((edu, idx) => {
        chunks.push({
          id: `edu-${edu.id || idx}`,
          node: (
            <div style={{ marginBottom: `${idx === education.length - 1 ? sectionSpacing : itemSpacing}px` }}>
              {idx === 0 && <h2 style={sectionTitleStyle}>教育经历</h2>}
              <div style={itemHeaderStyle}>
                <span style={itemTitleStyle}>{edu.school}</span>
                <span style={itemDateStyle}>{edu.startDate} {edu.startDate && edu.endDate ? '-' : ''} {edu.endDate}</span>
              </div>
              <div style={itemSubtitleStyle}>
                <span>{edu.major} {edu.major && edu.degree ? ' | ' : ''} {edu.degree}</span>
                {edu.gpa && <span style={{ marginLeft: '12px', color: '#4b5563', fontWeight: 'normal' }}>GPA：{edu.gpa}</span>}
              </div>
              {edu.courses && (
                <div style={{ fontSize: `${baseFontSize - 1}px`, color: '#4b5563', marginTop: '3px', lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>主修课程：</span>
                  <span>{edu.courses}</span>
                </div>
              )}
              {(edu.customFields || []).filter(f => f.label && f.value).map(f => (
                <div key={f.id} style={{ fontSize: `${baseFontSize - 1}px`, color: '#4b5563', marginTop: '2px', lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>{f.label}：</span>
                  <span>{f.value}</span>
                </div>
              ))}
              {formatDescription(edu.description)}
            </div>
          )
        });
      });
    }

    // 3. Experience
    if (experience && experience.length > 0) {
      experience.forEach((exp, idx) => {
        chunks.push({
          id: `exp-${exp.id || idx}`,
          node: (
            <div style={{ marginBottom: `${idx === experience.length - 1 ? sectionSpacing : itemSpacing}px` }}>
              {idx === 0 && <h2 style={sectionTitleStyle}>工作经历</h2>}
              <div style={itemHeaderStyle}>
                <span style={itemTitleStyle}>{exp.company}</span>
                <span style={itemDateStyle}>{exp.startDate} {exp.startDate && exp.endDate ? '-' : ''} {exp.endDate}</span>
              </div>
              <div style={itemSubtitleStyle}>{exp.title}</div>
              {formatDescription(exp.description)}
            </div>
          )
        });
      });
    }

    // 4. Projects
    if (projects && projects.length > 0) {
      projects.forEach((proj, idx) => {
        chunks.push({
          id: `proj-${proj.id || idx}`,
          node: (
            <div style={{ marginBottom: `${idx === projects.length - 1 ? sectionSpacing : itemSpacing}px` }}>
              {idx === 0 && <h2 style={sectionTitleStyle}>项目经历</h2>}
              <div style={itemHeaderStyle}>
                <span style={itemTitleStyle}>
                  {proj.name} {proj.link && <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noreferrer" style={{ fontSize: `${baseFontSize}px`, fontWeight: 'normal', color: '#2563eb', textDecoration: 'none', marginLeft: '8px' }}>{proj.link.replace(/^https?:\/\//, '')}</a>}
                </span>
                <span style={itemDateStyle}>{proj.startDate} {proj.startDate && proj.endDate ? '-' : ''} {proj.endDate}</span>
              </div>
              <div style={itemSubtitleStyle}>{proj.role}</div>
              <div style={{ marginTop: `${Math.max(2, itemSpacing * 0.35)}px` }}>
                {proj.techStack && (
                  <div style={{ fontSize: `${baseFontSize}px`, color: '#374151', lineHeight: lineHeight, marginBottom: `${Math.max(1, itemSpacing * 0.2)}px` }}>
                    <strong style={{ fontWeight: 600 }}>技术栈：</strong>
                    {proj.techStack}
                  </div>
                )}
                {proj.description && (
                  <div style={{ marginTop: `${Math.max(1, itemSpacing * 0.2)}px` }}>
                    {formatDescription(proj.description, <strong style={{ fontWeight: 600 }}>项目介绍：</strong>)}
                  </div>
                )}
                {proj.highlights && (
                  <div style={{ marginTop: `${Math.max(1, itemSpacing * 0.2)}px` }}>
                    <div style={{ fontSize: `${baseFontSize}px`, color: '#374151', lineHeight: lineHeight, marginBottom: '2px' }}>
                      <strong style={{ fontWeight: 600 }}>项目亮点：</strong>
                    </div>
                    {formatDescription(proj.highlights)}
                  </div>
                )}
              </div>
            </div>
          )
        });
      });
    }

    // 5. Campus Experience
    if (campusExperience && campusExperience.length > 0) {
      campusExperience.forEach((camp, idx) => {
        chunks.push({
          id: `camp-${camp.id || idx}`,
          node: (
            <div style={{ marginBottom: `${idx === campusExperience.length - 1 ? sectionSpacing : itemSpacing}px` }}>
              {idx === 0 && <h2 style={sectionTitleStyle}>校园经历</h2>}
              <div style={itemHeaderStyle}>
                <span style={itemTitleStyle}>{camp.organization}</span>
                <span style={itemDateStyle}>{camp.startDate} {camp.startDate && camp.endDate ? '-' : ''} {camp.endDate}</span>
              </div>
              <div style={itemSubtitleStyle}>{camp.role}</div>
              {formatDescription(camp.description)}
            </div>
          )
        });
      });
    }

    // 6. Awards
    if (awards && awards.length > 0) {
      awards.forEach((award, idx) => {
        chunks.push({
          id: `award-${award.id || idx}`,
          node: (
            <div style={{ marginBottom: `${idx === awards.length - 1 ? sectionSpacing : itemSpacing}px` }}>
              {idx === 0 && <h2 style={sectionTitleStyle}>荣誉奖项</h2>}
              <div style={itemHeaderStyle}>
                <span style={itemTitleStyle}>{award.name}</span>
                <span style={itemDateStyle}>{award.date}</span>
              </div>
              <div style={itemSubtitleStyle}>{award.awarder}</div>
              {formatDescription(award.description)}
            </div>
          )
        });
      });
    }

    // 7. Skills
    if (skills && skills.length > 0) {
      skills.forEach((skill, idx) => {
        chunks.push({
          id: `skill-${skill.id || idx}`,
          node: (
            <div style={{ marginBottom: `${idx === skills.length - 1 ? sectionSpacing : Math.max(3, itemSpacing * 0.4)}px` }}>
              {idx === 0 && <h2 style={sectionTitleStyle}>专业技能</h2>}
              <div style={{ display: 'flex', alignItems: 'flex-start', fontSize: `${baseFontSize}px`, color: '#374151' }}>
                <span style={{ fontWeight: 'bold', color: '#111827', marginRight: '6px', whiteSpace: 'nowrap' }}>· {skill.category}：</span>
                <span style={{ lineHeight: lineHeight }}>{renderBold(skill.items.join(''))}</span>
              </div>
            </div>
          )
        });
      });
    }

    // 8. Summary
    if (personalInfo.summary) {
      chunks.push({
        id: 'summary',
        node: (
          <div style={{ marginBottom: `${sectionSpacing}px` }}>
            <h2 style={sectionTitleStyle}>自我评价</h2>
            {formatDescription(personalInfo.summary)}
          </div>
        )
      });
    }
  }

  // Layout Measurement with flow-root to capture all margins
  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const elements = measureRef.current.querySelectorAll('[data-chunk-id]');
    const newHeights: Record<string, number> = {};
    elements.forEach((el) => {
      const id = el.getAttribute('data-chunk-id');
      if (id) {
        // flow-root wrapper guarantees offsetHeight contains all internal child margins
        newHeights[id] = (el as HTMLElement).offsetHeight;
      }
    });

    setMeasuredHeights(newHeights);
  }, [activeResume, layout, pagePadding, baseFontSize, lineHeight, sectionSpacing, itemSpacing]);

  if (!activeResume) return null;

  // Pagination calculation with 24px safety buffer
  const availableContentHeight = A4_PAGE_HEIGHT - pagePadding * 2 - 24;
  const pages: Array<Array<{ id: string; node: React.ReactNode }>> = [];
  let currentPage: Array<{ id: string; node: React.ReactNode }> = [];
  let currentH = 0;

  chunks.forEach((chunk) => {
    const chunkH = measuredHeights[chunk.id] || 0;
    if (currentH + chunkH > availableContentHeight && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [chunk];
      currentH = chunkH;
    } else {
      currentPage.push(chunk);
      currentH += chunkH;
    }
  });

  if (currentPage.length > 0 || pages.length === 0) {
    pages.push(currentPage);
  }

  return (
    <div className="resume-pages-wrapper" style={{ width: '100%', maxWidth: '794px', margin: '0 auto' }}>
      {/* Hidden Measurement Sandbox (1:1 styling with flow-root wrapper, strictly hidden from print) */}
      <div 
        ref={measureRef}
        className="measurement-sandbox no-print"
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '794px',
          padding: `${pagePadding}px`,
          visibility: 'hidden',
          pointerEvents: 'none',
          boxSizing: 'border-box',
          fontFamily: '"Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif',
          lineHeight: lineHeight,
        }}
      >
        {chunks.map(chunk => (
          <div key={chunk.id} data-chunk-id={chunk.id} style={{ display: 'flow-root' }}>
            {chunk.node}
          </div>
        ))}
      </div>

      {/* Real Multi-Page Cards */}
      <div className="resume-pages-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {pages.map((pageChunks, pageIndex) => (
          <React.Fragment key={pageIndex}>
            {pageIndex > 0 && (
              <div 
                className="page-divider no-print" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '12px',
                  color: 'var(--text-secondary)', 
                  fontSize: '12px',
                  fontWeight: 500,
                  userSelect: 'none',
                  padding: '4px 0',
                }}
              >
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                <span>—— 第 {pageIndex + 1} / {pages.length} 页 ——</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
              </div>
            )}
            
            <div 
              className={`resume-paper a4-page ${pageIndex === pages.length - 1 ? 'last-page' : ''}`}
              data-page-index={pageIndex}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '794px', 
                minHeight: `${A4_PAGE_HEIGHT}px`,
                backgroundColor: '#fff',
                boxShadow: 'var(--shadow-md)',
                padding: `${pagePadding}px`,
                color: '#000',
                fontFamily: '"Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif',
                lineHeight: lineHeight,
                boxSizing: 'border-box',
              }}
            >
              {pageChunks.map(c => (
                <div key={c.id} style={{ display: 'flow-root' }}>
                  {c.node}
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ResumePreview;
