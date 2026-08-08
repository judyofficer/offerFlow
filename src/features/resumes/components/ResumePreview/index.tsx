import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';

const ResumePreview: React.FC = () => {
  const { resumes, activeResumeId } = useResumeStore();
  
  const activeResume = resumes.find(r => r.id === activeResumeId);

  if (!activeResume) return null;

  const { personalInfo, education, experience, projects, skills, campusExperience, awards } = activeResume.content;

  const sectionTitleStyle: React.CSSProperties = {
    backgroundColor: '#f2f4f7',
    borderLeft: '5px solid #1f2937',
    padding: '4px 12px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px',
    letterSpacing: '1px',
    lineHeight: '1.4'
  };

  const itemHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '4px'
  };

  const itemTitleStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#111827'
  };

  const itemDateStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#4b5563'
  };

  const itemSubtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#374151',
    marginBottom: '8px'
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
          <ul key={`ul-${elements.length}`} style={{ margin: '0 0 4px 0', paddingLeft: '18px', fontSize: '13px', color: '#374151', lineHeight: '1.6', listStyleType: 'disc' }}>
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const listMatch = line.match(/^[\-•\*·]\s*/);
      if (listMatch) {
        const cleanLine = line.substring(listMatch[0].length);
        currentList.push(
          <li key={index} style={{ marginBottom: '4px' }}>
            {index === 0 && prefixNode}
            {renderBold(cleanLine)}
          </li>
        );
      } else {
        flushList();
        elements.push(
          <div key={`div-${index}`} style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6', marginBottom: '4px' }}>
            {index === 0 && prefixNode}
            {renderBold(line)}
          </div>
        );
      }
    });
    flushList();

    return <>{elements}</>;
  };

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
      {/* Header */}
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, paddingRight: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 12px 0', letterSpacing: '2px' }}>
            {personalInfo.name || '您的名字'}
          </h1>
          
          <div style={{ fontSize: '13px', color: '#4b5563', display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            {[
              personalInfo.phone && `电话：${personalInfo.phone}`,
              personalInfo.email && `邮箱：${personalInfo.email}`,
              personalInfo.city && `现居城市：${personalInfo.city}`,
              personalInfo.github && (
                <>
                  Github：
                  <a href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                    {personalInfo.github.replace(/^https?:\/\//, '')}
                  </a>
                </>
              ),
              personalInfo.website && (
                <>
                  主页：
                  <a href={personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                    {personalInfo.website.replace(/^https?:\/\//, '')}
                  </a>
                </>
              )
            ].filter(Boolean).map((node, idx, arr) => (
              <React.Fragment key={idx}>
                <span>{node}</span>
                {idx < arr.length - 1 && <span style={{ color: '#d1d5db' }}>|</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Second Row: gender, birthDate, ethnicity */}
          {(personalInfo.gender || personalInfo.birthDate || personalInfo.ethnicity) && (
            <div style={{ fontSize: '13px', color: '#4b5563', display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              {[
                personalInfo.gender && `性别：${personalInfo.gender}`,
                personalInfo.birthDate && `生日：${personalInfo.birthDate}`,
                personalInfo.ethnicity && `民族：${personalInfo.ethnicity}`
              ].filter(Boolean).map((text, idx, arr) => (
                <React.Fragment key={idx}>
                  <span>{text}</span>
                  {idx < arr.length - 1 && <span style={{ color: '#d1d5db' }}>|</span>}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Third Row: intendedCity, intendedRole */}
          {(personalInfo.intendedCity || personalInfo.intendedRole) && (
            <div style={{ fontSize: '13px', color: '#4b5563', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                personalInfo.intendedCity && `意向城市：${personalInfo.intendedCity}`,
                personalInfo.intendedRole && `求职意向：${personalInfo.intendedRole}`
              ].filter(Boolean).map((text, idx, arr) => (
                <React.Fragment key={idx}>
                  <span>{text}</span>
                  {idx < arr.length - 1 && <span style={{ color: '#d1d5db' }}>|</span>}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
        
        {personalInfo.avatar && (
          <div style={{ flexShrink: 0, marginLeft: '16px' }}>
            <img 
              src={personalInfo.avatar} 
              alt="Profile Avatar" 
              style={{ width: '80px', height: '105px', objectFit: 'cover', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }} 
            />
          </div>
        )}
      </header>



      {/* Education */}
      {education && education.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={sectionTitleStyle}>教育经历</h2>
          {education.map(edu => (
            <div key={edu.id} style={{ marginBottom: '16px' }}>
              <div style={itemHeaderStyle}>
                <span style={itemTitleStyle}>{edu.school}</span>
                <span style={itemDateStyle}>{edu.startDate} {edu.startDate && edu.endDate ? '-' : ''} {edu.endDate}</span>
              </div>
              <div style={itemSubtitleStyle}>
                {edu.major} {edu.major && edu.degree ? ' | ' : ''} {edu.degree}
              </div>
              {formatDescription(edu.description)}
            </div>
          ))}
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={sectionTitleStyle}>工作经历</h2>
          {experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: '16px' }}>
              <div style={itemHeaderStyle}>
                <span style={itemTitleStyle}>{exp.company}</span>
                <span style={itemDateStyle}>{exp.startDate} {exp.startDate && exp.endDate ? '-' : ''} {exp.endDate}</span>
              </div>
              <div style={itemSubtitleStyle}>{exp.title}</div>
              {formatDescription(exp.description)}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={sectionTitleStyle}>项目经历</h2>
          {projects.map(proj => (
            <div key={proj.id} style={{ marginBottom: '16px' }}>
              <div style={itemHeaderStyle}>
                <span style={itemTitleStyle}>
                  {proj.name} {proj.link && <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', fontWeight: 'normal', color: '#2563eb', textDecoration: 'none', marginLeft: '8px' }}>{proj.link.replace(/^https?:\/\//, '')}</a>}
                </span>
                <span style={itemDateStyle}>{proj.startDate} {proj.startDate && proj.endDate ? '-' : ''} {proj.endDate}</span>
              </div>
              <div style={itemSubtitleStyle}>{proj.role}</div>
              <div style={{ marginTop: '8px' }}>
                {proj.techStack && (
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6', marginBottom: '4px' }}>
                    <strong style={{ fontWeight: 600 }}>技术栈：</strong>
                    {proj.techStack}
                  </div>
                )}
                {proj.description && (
                  <div style={{ marginTop: '4px' }}>
                    {formatDescription(proj.description, <strong style={{ fontWeight: 600 }}>项目介绍：</strong>)}
                  </div>
                )}
                {proj.highlights && (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6', marginBottom: '2px' }}>
                      <strong style={{ fontWeight: 600 }}>项目亮点：</strong>
                    </div>
                    {formatDescription(proj.highlights)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Campus Experience */}
      {campusExperience && campusExperience.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={sectionTitleStyle}>校园经历</h2>
          {campusExperience.map(exp => (
            <div key={exp.id} style={{ marginBottom: '16px' }}>
              <div style={itemHeaderStyle}>
                <span style={itemTitleStyle}>{exp.organization}</span>
                <span style={itemDateStyle}>{exp.startDate} {exp.startDate && exp.endDate ? '-' : ''} {exp.endDate}</span>
              </div>
              <div style={itemSubtitleStyle}>{exp.role}</div>
              {formatDescription(exp.description)}
            </div>
          ))}
        </section>
      )}

      {/* Awards */}
      {awards && awards.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={sectionTitleStyle}>荣誉奖项</h2>
          {awards.map(award => (
            <div key={award.id} style={{ marginBottom: '16px' }}>
              <div style={itemHeaderStyle}>
                <span style={itemTitleStyle}>{award.name}</span>
                <span style={itemDateStyle}>{award.date}</span>
              </div>
              <div style={itemSubtitleStyle}>{award.awarder}</div>
              {formatDescription(award.description)}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={sectionTitleStyle}>专业技能</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#374151' }}>
            {skills.map(skill => (
              <div key={skill.id} style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold', color: '#111827', marginRight: '6px', whiteSpace: 'nowrap' }}>· {skill.category}：</span>
                <span style={{ lineHeight: '1.5' }}>{renderBold(skill.items.join(' / '))}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Summary (Moved to Bottom) */}
      {personalInfo.summary && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={sectionTitleStyle}>自我评价</h2>
          {formatDescription(personalInfo.summary)}
        </section>
      )}
    </div>
  );
};

export default ResumePreview;
