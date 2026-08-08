import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Resume, ResumeContent } from '../types/resume';
import { createDebouncedStorage } from '../../../core/services/debouncedStorage';

const initialResumeContent: ResumeContent = {
  personalInfo: { name: '', email: '', phone: '', summary: '' },
  education: [],
  experience: [],
  projects: [],
  skills: [],
  campusExperience: [],
  awards: [],
};

type SectionKey = 'education' | 'experience' | 'projects' | 'skills' | 'campusExperience' | 'awards';

interface ResumeState {
  resumes: Resume[];
  activeResumeId: string | null;
  addResume: (name: string) => void;
  updateActiveResume: (content: Partial<ResumeContent>) => void;
  setActiveResume: (id: string) => void;
  deleteResume: (id: string) => void;
  duplicateResume: (id: string, newName: string) => void;
  renameResume: (id: string, newName: string) => void;
  importResume: (name: string, content: ResumeContent, sourceFileId?: string, sourceFileName?: string) => void;
  
  // Section Array Manipulations for the Active Resume
  addSectionItem: (section: SectionKey, item: any) => void;
  updateSectionItem: (section: SectionKey, id: string, item: any) => void;
  deleteSectionItem: (section: SectionKey, id: string) => void;
  reorderSectionItems: (section: SectionKey, startIndex: number, endIndex: number) => void;

  // Undo/Redo
  past: Resume[][];
  future: Resume[][];
  undo: () => void;
  redo: () => void;
  commitHistory: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

let historyTimeout: ReturnType<typeof setTimeout> | null = null;
const MAX_HISTORY = 50;

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      resumes: [],
      activeResumeId: null,
      past: [],
      future: [],

      commitHistory: () => set((state) => {
        // Deep clone resumes array
        const currentResumes = JSON.parse(JSON.stringify(state.resumes));
        const newPast = [...state.past, currentResumes].slice(-MAX_HISTORY);
        return { past: newPast, future: [] };
      }),

      undo: () => set((state) => {
        if (state.past.length === 0) return state;
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);
        const currentResumes = JSON.parse(JSON.stringify(state.resumes));
        return {
          resumes: previous,
          past: newPast,
          future: [currentResumes, ...state.future].slice(-MAX_HISTORY),
        };
      }),

      redo: () => set((state) => {
        if (state.future.length === 0) return state;
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        const currentResumes = JSON.parse(JSON.stringify(state.resumes));
        return {
          resumes: next,
          past: [...state.past, currentResumes].slice(-MAX_HISTORY),
          future: newFuture,
        };
      }),

      addResume: (name) => {
        get().commitHistory();
        set((state) => {
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
        });
      },

      updateActiveResume: (content) => {
        if (!historyTimeout) get().commitHistory();
        else clearTimeout(historyTimeout);
        historyTimeout = setTimeout(() => { historyTimeout = null; }, 1000);

        set((state) => {
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
        });
      },

      setActiveResume: (id) => set({ activeResumeId: id }),

      deleteResume: (id) => {
        get().commitHistory();
        set((state) => ({
          resumes: state.resumes.filter((r) => r.id !== id),
          activeResumeId: state.activeResumeId === id ? null : state.activeResumeId,
        }));
      },

      duplicateResume: (id, newName) => {
        get().commitHistory();
        set((state) => {
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
        });
      },

      renameResume: (id, newName) => {
        get().commitHistory();
        set((state) => {
          const updatedResumes = state.resumes.map((resume) => {
            if (resume.id === id) {
              return {
                ...resume,
                name: newName,
                updatedAt: Date.now(),
              };
            }
            return resume;
          });
          return { resumes: updatedResumes };
        });
      },

      importResume: (name, content, sourceFileId, sourceFileName) => {
        get().commitHistory();
        set((state) => {
          const newResume: Resume = {
            id: generateId(),
            name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            content,
            sourceFileId,
            sourceFileName
          };
          return {
            resumes: [...state.resumes, newResume],
            activeResumeId: newResume.id,
          };
        });
      },

      addSectionItem: (section, item) => {
        get().commitHistory();
        set((state) => {
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
        });
      },

      updateSectionItem: (section, id, item) => {
        if (!historyTimeout) get().commitHistory();
        else clearTimeout(historyTimeout);
        historyTimeout = setTimeout(() => { historyTimeout = null; }, 1000);

        set((state) => {
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
        });
      },

      deleteSectionItem: (section, id) => {
        get().commitHistory();
        set((state) => {
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
        });
      },

      reorderSectionItems: (section, startIndex, endIndex) => {
        get().commitHistory();
        set((state) => {
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
        });
      }

    }),
    {
      name: 'offerflow-resume-storage',
      storage: createJSONStorage(() => createDebouncedStorage(window.localStorage, 1000)),
      partialize: (state) => ({
        resumes: state.resumes,
        activeResumeId: state.activeResumeId,
      }),
    }
  )
);
