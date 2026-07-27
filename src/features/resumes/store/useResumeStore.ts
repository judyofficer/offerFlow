import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Resume, ResumeContent } from '../types/resume';

const initialResumeContent: ResumeContent = {
  personalInfo: { name: '', email: '', phone: '', summary: '' },
  education: [],
  experience: [],
  projects: [],
  skills: [],
};

type SectionKey = 'education' | 'experience' | 'projects' | 'skills';

interface ResumeState {
  resumes: Resume[];
  activeResumeId: string | null;
  addResume: (name: string) => void;
  updateActiveResume: (content: Partial<ResumeContent>) => void;
  setActiveResume: (id: string) => void;
  deleteResume: (id: string) => void;
  duplicateResume: (id: string, newName: string) => void;
  importResume: (name: string, content: ResumeContent) => void;
  
  // Section Array Manipulations for the Active Resume
  addSectionItem: (section: SectionKey, item: any) => void;
  updateSectionItem: (section: SectionKey, id: string, item: any) => void;
  deleteSectionItem: (section: SectionKey, id: string) => void;
  reorderSectionItems: (section: SectionKey, startIndex: number, endIndex: number) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      resumes: [],
      activeResumeId: null,

      addResume: (name) => set((state) => {
        const newResume: Resume = {
          id: generateId(),
          name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          content: initialResumeContent,
        };
        return {
          resumes: [...state.resumes, newResume],
          activeResumeId: newResume.id,
        };
      }),

      updateActiveResume: (content) => set((state) => {
        if (!state.activeResumeId) return state;
        const updatedResumes = state.resumes.map((resume) => {
          if (resume.id === state.activeResumeId) {
            return {
              ...resume,
              content: { ...resume.content, ...content },
              updatedAt: Date.now(),
            };
          }
          return resume;
        });
        return { resumes: updatedResumes };
      }),

      setActiveResume: (id) => set({ activeResumeId: id }),

      deleteResume: (id) => set((state) => ({
        resumes: state.resumes.filter((r) => r.id !== id),
        activeResumeId: state.activeResumeId === id ? null : state.activeResumeId,
      })),

      duplicateResume: (id, newName) => set((state) => {
        const sourceResume = state.resumes.find((r) => r.id === id);
        if (!sourceResume) return state;
        const duplicatedResume: Resume = {
          ...sourceResume,
          id: generateId(),
          name: newName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return {
          resumes: [...state.resumes, duplicatedResume],
        };
      }),

      importResume: (name, content) => set((state) => {
        const newResume: Resume = {
          id: generateId(),
          name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          content,
        };
        return {
          resumes: [...state.resumes, newResume],
          activeResumeId: newResume.id,
        };
      }),

      addSectionItem: (section, item) => set((state) => {
        if (!state.activeResumeId) return state;
        const updatedResumes = state.resumes.map(resume => {
          if (resume.id === state.activeResumeId) {
            const newItem = { ...item, id: generateId() };
            return {
              ...resume,
              content: {
                ...resume.content,
                [section]: [...resume.content[section], newItem]
              },
              updatedAt: Date.now(),
            };
          }
          return resume;
        });
        return { resumes: updatedResumes };
      }),

      updateSectionItem: (section, id, item) => set((state) => {
        if (!state.activeResumeId) return state;
        const updatedResumes = state.resumes.map(resume => {
          if (resume.id === state.activeResumeId) {
            return {
              ...resume,
              content: {
                ...resume.content,
                [section]: (resume.content[section] as any[]).map(i => i.id === id ? { ...i, ...item } : i)
              },
              updatedAt: Date.now(),
            };
          }
          return resume;
        });
        return { resumes: updatedResumes };
      }),

      deleteSectionItem: (section, id) => set((state) => {
        if (!state.activeResumeId) return state;
        const updatedResumes = state.resumes.map(resume => {
          if (resume.id === state.activeResumeId) {
            return {
              ...resume,
              content: {
                ...resume.content,
                [section]: (resume.content[section] as any[]).filter(i => i.id !== id)
              },
              updatedAt: Date.now(),
            };
          }
          return resume;
        });
        return { resumes: updatedResumes };
      }),

      reorderSectionItems: (section, startIndex, endIndex) => set((state) => {
        if (!state.activeResumeId) return state;
        const updatedResumes = state.resumes.map(resume => {
          if (resume.id === state.activeResumeId) {
            const result = Array.from(resume.content[section] as any[]);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return {
              ...resume,
              content: {
                ...resume.content,
                [section]: result
              },
              updatedAt: Date.now(),
            };
          }
          return resume;
        });
        return { resumes: updatedResumes };
      })

    }),
    {
      name: 'offerflow-resume-storage',
    }
  )
);
