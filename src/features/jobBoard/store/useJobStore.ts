import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JobBookmark } from '../types/job';

interface JobStore {
  bookmarks: JobBookmark[];
  addBookmark: (bookmark: Omit<JobBookmark, 'id' | 'createdAt'>) => void;
  updateBookmark: (id: string, updates: Partial<JobBookmark>) => void;
  deleteBookmark: (id: string) => void;
}

export const useJobStore = create<JobStore>()(
  persist(
    (set) => ({
      bookmarks: [],
      addBookmark: (bookmark) => set((state) => ({
        bookmarks: [
          {
            ...bookmark,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          },
          ...state.bookmarks,
        ],
      })),
      updateBookmark: (id, updates) => set((state) => ({
        bookmarks: state.bookmarks.map((b) =>
          b.id === id ? { ...b, ...updates } : b
        ),
      })),
      deleteBookmark: (id) => set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== id),
      })),
    }),
    {
      name: 'offerflow-job-board',
    }
  )
);
