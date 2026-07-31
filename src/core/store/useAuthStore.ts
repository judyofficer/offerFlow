import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  user: User | null;
  isGuest: boolean;
  setUser: (user: User | null) => void;
  setGuestMode: (isGuest: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isGuest: false,
      setUser: (user) => set({ user }),
      setGuestMode: (isGuest) => set({ isGuest }),
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isGuest: false });
      },
    }),
    {
      name: 'offerflow-auth-storage',
    }
  )
);

// Subscribe to Supabase auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setUser(session?.user || null);
});
