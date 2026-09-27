import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  user: User | null;
  isGuest: boolean;
  isDemo: boolean;
  setUser: (user: User | null) => void;
  setGuestMode: (isGuest: boolean, isDemo?: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isGuest: false,
      isDemo: false,
      setUser: (user) => set({ user }),
      setGuestMode: (isGuest, isDemo = false) => {
        if (typeof window !== 'undefined') {
          if (isGuest && isDemo) {
            localStorage.setItem('_offerflow_is_demo', 'true');
          } else if (isGuest && !isDemo) {
            localStorage.setItem('_offerflow_is_demo', 'false');
          }
        }
        set({ isGuest, isDemo: isGuest ? isDemo : false });
      },
      logout: async () => {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('_offerflow_is_demo');
        }
        set({ user: null, isGuest: false, isDemo: false });
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
