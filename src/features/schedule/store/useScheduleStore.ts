import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createDebouncedStorage } from '../../../core/services/debouncedStorage';
import type { ScheduleEvent } from '../types/schedule';

interface ScheduleState {
  events: ScheduleEvent[];
  addEvent: (event: Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEvent: (id: string, data: Partial<ScheduleEvent>) => void;
  toggleCompleteEvent: (id: string) => void;
  deleteEvent: (id: string) => void;
  deleteCompletedEvents: (ids?: string[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      events: [],

      addEvent: (eventData) => set((state) => {
        const isDeadline = eventData.timeType === 'deadline' || eventData.type === 'deadline';
        const todayStr = new Date().toISOString().split('T')[0];
        const newEvent: ScheduleEvent = {
          ...eventData,
          isCompleted: eventData.isCompleted ?? false,
          timeType: eventData.timeType ?? 'specific',
          startDate: eventData.startDate || (isDeadline ? todayStr : undefined),
          id: generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return { events: [...state.events, newEvent] };
      }),

      updateEvent: (id, data) => set((state) => ({
        events: state.events.map(event =>
          event.id === id ? { ...event, ...data, updatedAt: Date.now() } : event
        )
      })),

      toggleCompleteEvent: (id) => set((state) => ({
        events: state.events.map(event =>
          event.id === id ? { ...event, isCompleted: !event.isCompleted, updatedAt: Date.now() } : event
        )
      })),

      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(event => event.id !== id)
      })),

      deleteCompletedEvents: (ids) => set((state) => ({
        events: state.events.filter(event => {
          if (ids && ids.length > 0) {
            return !ids.includes(event.id);
          }
          return !event.isCompleted;
        })
      })),
    }),
    {
      name: 'offerflow-schedule-storage',
      storage: createJSONStorage(() => createDebouncedStorage(window.localStorage, 1000)),
    }
  )
);
