import { supabase } from './supabaseClient';
import { useAuthStore } from '../store/useAuthStore';

// The modules that correspond to localStorage keys used by Zustand persist
const SYNC_MODULES = [
  'offerflow-resume-storage',
  'offerflow-application-storage',
  'offerflow-job-board',
  'offerflow-schedule-storage',
  'offerflow-settings-storage'
];

export const syncEngine = {
  /**
   * Push local JSON data to Supabase for a specific module
   */
  pushToCloud: async (module: string, data: string) => {
    const { user, isGuest } = useAuthStore.getState();
    if (!user || isGuest) return;

    try {
      // Upsert into user_sync_states
      const { error } = await supabase
        .from('user_sync_states')
        .upsert(
          {
            user_id: user.id,
            module: module,
            data: JSON.parse(data),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id, module',
          }
        );

      if (error) {
        console.error(`[SyncEngine] Failed to push ${module}:`, error);
      }
    } catch (e) {
      console.error(`[SyncEngine] Error pushing ${module}:`, e);
    }
  },

  /**
   * Pull all modules from Supabase and overwrite localStorage.
   * If `clearIfEmpty` is true and the cloud has no data for a module, it will wipe the local module.
   */
  pullFromCloud: async (clearIfEmpty: boolean = false) => {
    const { user, isGuest } = useAuthStore.getState();
    if (!user || isGuest) return;

    try {
      const { data, error } = await supabase
        .from('user_sync_states')
        .select('*');

      if (error) throw error;

      // Create a map of cloud data
      const cloudMap = new Map();
      if (data) {
        for (const row of data) {
          cloudMap.set(row.module, row.data);
        }
      }

      // Iterate over our known modules
      let dataChanged = false;
      for (const module of SYNC_MODULES) {
        const cloudData = cloudMap.get(module);
        
        if (cloudData) {
          localStorage.setItem(module, JSON.stringify(cloudData));
          dataChanged = true;
        } else if (clearIfEmpty) {
          // New user or empty cloud state, clear the lingering local/demo data
          localStorage.removeItem(module);
          dataChanged = true;
        }
      }

      return dataChanged;

    } catch (e) {
      console.error('[SyncEngine] Pull failed:', e);
      return false;
    }
  }
};
