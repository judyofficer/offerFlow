import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Application, ApplicationStatus } from '../types/application';

interface ApplicationState {
  applications: Application[];
  addApplication: (app: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'appliedAt'>) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  updateApplication: (id: string, data: Partial<Application>) => void;
  deleteApplication: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set) => ({
      applications: [],

      addApplication: (appData) => set((state) => {
        const newApp: Application = {
          ...appData,
          id: generateId(),
          appliedAt: Date.now(),
          updatedAt: Date.now(),
        };
        return { applications: [...state.applications, newApp] };
      }),

      updateApplicationStatus: (id, status) => set((state) => ({
        applications: state.applications.map(app => 
          app.id === id ? { ...app, status, updatedAt: Date.now() } : app
        )
      })),

      updateApplication: (id, data) => set((state) => ({
        applications: state.applications.map(app => 
          app.id === id ? { ...app, ...data, updatedAt: Date.now() } : app
        )
      })),

      deleteApplication: (id) => set((state) => ({
        applications: state.applications.filter(app => app.id !== id)
      })),
    }),
    {
      name: 'offerflow-application-storage',
    }
  )
);
