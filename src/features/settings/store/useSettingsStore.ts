import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LLMProvider = 'openai' | 'deepseek' | 'gemini' | 'custom';

export interface SettingsState {
  llmProvider: LLMProvider;
  apiKey: string;
  apiUrl: string;
  model: string;
  updateSettings: (settings: Partial<Omit<SettingsState, 'updateSettings'>>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      llmProvider: 'openai',
      apiKey: '',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o',
      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
    }),
    {
      name: 'offerflow-settings-storage',
    }
  )
);
