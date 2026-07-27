import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import PersonalInfoEditor from './PersonalInfoEditor';
import EducationEditor from './EducationEditor';
import ExperienceEditor from './ExperienceEditor';
import ProjectEditor from './ProjectEditor';
import SkillEditor from './SkillEditor';

const ResumeEditor: React.FC = () => {
  const { resumes, activeResumeId } = useResumeStore();
  const activeResume = resumes.find(r => r.id === activeResumeId);

  if (!activeResume) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
        Please select or create a resume version.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-h2" style={{ marginBottom: '24px' }}>Edit Resume: {activeResume.name}</h2>
      <PersonalInfoEditor />
      <EducationEditor />
      <ExperienceEditor />
      <ProjectEditor />
      <SkillEditor />
    </div>
  );
};

export default ResumeEditor;
