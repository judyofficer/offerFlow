import { StateStorage } from 'zustand/middleware';

export const createDebouncedStorage = (
  storage: StateStorage,
  delay: number = 1000
): StateStorage => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingKey: string | null = null;
  let pendingValue: string | null = null;

  const flush = () => {
    if (pendingKey && pendingValue !== null) {
      storage.setItem(pendingKey, pendingValue);
      pendingKey = null;
      pendingValue = null;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flush);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    });
  }

  return {
    getItem: (name) => storage.getItem(name),
    setItem: (name, value) => {
      pendingKey = name;
      pendingValue = value;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        flush();
      }, delay);
    },
    removeItem: (name) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingKey = null;
      pendingValue = null;
      storage.removeItem(name);
    },
  };
};
