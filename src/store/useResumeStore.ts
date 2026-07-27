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

interface ResumeState {
  resumes: Resume[];
  activeResumeId: string | null;
  addResume: (name: string) => void;
  updateActiveResume: (content: Partial<ResumeContent>) => void;
  setActiveResume: (id: string) => void;
  deleteResume: (id: string) => void;
  duplicateResume: (id: string, newName: string) => void;
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
    }),
    {
      name: 'offerflow-resume-storage', // key in localStorage
    }
  )
);
