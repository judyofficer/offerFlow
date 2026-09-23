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

const DIRTY_MODULES_KEY = '_offerflow_dirty_modules';

/**
 * Get the set of modules that have pending un-pushed changes (e.g. edited while offline)
 */
const getDirtyModules = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DIRTY_MODULES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const markModuleDirty = (module: string, isDirty: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    const dirty = getDirtyModules();
    if (isDirty) dirty.add(module);
    else dirty.delete(module);
    localStorage.setItem(DIRTY_MODULES_KEY, JSON.stringify(Array.from(dirty)));
  } catch (e) {
    console.error('[SyncEngine] Failed to update dirty modules:', e);
  }
};

/**
 * Calculate the latest modification timestamp of a local module (in ms).
 * Reads both the explicit timestamp tag and deep entity timestamps.
 */
export const getLocalModuleTimestamp = (module: string, rawData?: string | null): number => {
  let explicitTs = 0;
  if (typeof window !== 'undefined') {
    const tag = localStorage.getItem(`_offerflow_ts_${module}`);
    if (tag) {
      const num = parseInt(tag, 10);
      if (!isNaN(num)) explicitTs = num;
    }
  }

  const raw = rawData !== undefined ? rawData : (typeof window !== 'undefined' ? localStorage.getItem(module) : null);
  if (!raw) return explicitTs;

  try {
    const parsed = JSON.parse(raw);
    const state = parsed?.state || parsed;
    let deepTs = 0;

    if (module === 'offerflow-resume-storage' && Array.isArray(state?.resumes)) {
      for (const r of state.resumes) {
        if (r.updatedAt && r.updatedAt > deepTs) deepTs = r.updatedAt;
        if (r.createdAt && r.createdAt > deepTs) deepTs = r.createdAt;
      }
    } else if (module === 'offerflow-application-storage' && Array.isArray(state?.applications)) {
      for (const a of state.applications) {
        if (a.updatedAt && a.updatedAt > deepTs) deepTs = a.updatedAt;
        if (a.appliedAt && a.appliedAt > deepTs) deepTs = a.appliedAt;
      }
    } else if (module === 'offerflow-schedule-storage' && Array.isArray(state?.events)) {
      for (const e of state.events) {
        if (e.updatedAt && e.updatedAt > deepTs) deepTs = e.updatedAt;
        if (e.createdAt && e.createdAt > deepTs) deepTs = e.createdAt;
        if (e.archivedAt && e.archivedAt > deepTs) deepTs = e.archivedAt;
      }
    } else if (module === 'offerflow-job-board' && Array.isArray(state?.bookmarks)) {
      for (const b of state.bookmarks) {
        if (b.createdAt && b.createdAt > deepTs) deepTs = b.createdAt;
      }
    }

    return Math.max(explicitTs, deepTs);
  } catch {
    return explicitTs;
  }
};

/**
 * Entity-level merge helper to prevent losing items edited concurrently or offline
 */
const mergeModuleData = (module: string, localParsed: any, cloudData: any): any => {
  if (!localParsed) return cloudData;
  if (!cloudData) return localParsed;

  const localState = localParsed?.state || localParsed;
  const cloudState = cloudData?.state || cloudData;

  // 1. Resumes merge by ID + updatedAt
  if (module === 'offerflow-resume-storage' && Array.isArray(localState?.resumes) && Array.isArray(cloudState?.resumes)) {
    const map = new Map<string, any>();
    for (const r of cloudState.resumes) {
      map.set(r.id, r);
    }
    for (const r of localState.resumes) {
      const existing = map.get(r.id);
      if (!existing || (r.updatedAt || 0) >= (existing.updatedAt || 0)) {
        map.set(r.id, r);
      }
    }
    const mergedResumes = Array.from(map.values());
    const activeResumeId = localState.activeResumeId || cloudState.activeResumeId || mergedResumes[0]?.id || null;

    return {
      ...cloudData,
      ...localParsed,
      state: {
        ...cloudState,
        ...localState,
        resumes: mergedResumes,
        activeResumeId,
      }
    };
  }

  // 2. Applications merge by ID + updatedAt
  if (module === 'offerflow-application-storage' && Array.isArray(localState?.applications) && Array.isArray(cloudState?.applications)) {
    const map = new Map<string, any>();
    for (const a of cloudState.applications) {
      map.set(a.id, a);
    }
    for (const a of localState.applications) {
      const existing = map.get(a.id);
      if (!existing || (a.updatedAt || 0) >= (existing.updatedAt || 0)) {
        map.set(a.id, a);
      }
    }
    return {
      ...cloudData,
      ...localParsed,
      state: {
        ...cloudState,
        ...localState,
        applications: Array.from(map.values()),
      }
    };
  }

  // 3. Schedule events merge by ID + updatedAt
  if (module === 'offerflow-schedule-storage' && Array.isArray(localState?.events) && Array.isArray(cloudState?.events)) {
    const map = new Map<string, any>();
    for (const e of cloudState.events) {
      map.set(e.id, e);
    }
    for (const e of localState.events) {
      const existing = map.get(e.id);
      if (!existing || (e.updatedAt || 0) >= (existing.updatedAt || 0)) {
        map.set(e.id, e);
      }
    }
    return {
      ...cloudData,
      ...localParsed,
      state: {
        ...cloudState,
        ...localState,
        events: Array.from(map.values()),
      }
    };
  }

  // 4. Job bookmarks merge by ID + createdAt
  if (module === 'offerflow-job-board' && Array.isArray(localState?.bookmarks) && Array.isArray(cloudState?.bookmarks)) {
    const map = new Map<string, any>();
    for (const b of cloudState.bookmarks) {
      map.set(b.id, b);
    }
    for (const b of localState.bookmarks) {
      const existing = map.get(b.id);
      if (!existing || (b.createdAt || 0) >= (existing.createdAt || 0)) {
        map.set(b.id, b);
      }
    }
    return {
      ...cloudData,
      ...localParsed,
      state: {
        ...cloudState,
        ...localState,
        bookmarks: Array.from(map.values()),
      }
    };
  }

  // Default fallback: return cloudData
  return cloudData;
};

export const syncEngine = {
  /**
   * Push local JSON data to Supabase for a specific module
   */
  pushToCloud: async (module: string, data: string): Promise<boolean> => {
    const { user, isGuest } = useAuthStore.getState();
    if (!user || isGuest) return false;

    try {
      let parsedData: any;
      try {
        parsedData = JSON.parse(data);
      } catch {
        parsedData = data;
      }

      const updatedAtStr = new Date().toISOString();
      const { error } = await supabase
        .from('user_sync_states')
        .upsert(
          {
            user_id: user.id,
            module: module,
            data: parsedData,
            updated_at: updatedAtStr,
          },
          {
            onConflict: 'user_id, module',
          }
        );

      if (error) {
        console.error(`[SyncEngine] Failed to push ${module}:`, error);
        markModuleDirty(module, true);
        return false;
      }

      // Successfully synced to cloud
      markModuleDirty(module, false);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`_offerflow_ts_${module}`, Date.now().toString());
      }
      return true;
    } catch (e) {
      console.error(`[SyncEngine] Error pushing ${module}:`, e);
      markModuleDirty(module, true);
      return false;
    }
  },

  /**
   * Pull all modules from Supabase with smart LWW (Last-Write-Wins) timestamp arbitration and merge protection.
   * If local has newer edits (e.g. edited offline), local will NOT be overwritten and will instead be pushed to cloud.
   */
  pullFromCloud: async (clearIfEmpty: boolean = false): Promise<boolean> => {
    const { user, isGuest } = useAuthStore.getState();
    if (!user || isGuest) return false;

    try {
      const { data, error } = await supabase
        .from('user_sync_states')
        .select('*');

      if (error) throw error;

      // Create a map of cloud data and timestamp
      const cloudMap = new Map<string, { data: any; updatedAt: number }>();
      if (data) {
        for (const row of data) {
          const ts = row.updated_at ? new Date(row.updated_at).getTime() : 0;
          cloudMap.set(row.module, { data: row.data, updatedAt: ts });
        }
      }

      let dataChanged = false;

      for (const module of SYNC_MODULES) {
        const cloudRecord = cloudMap.get(module);
        const localRaw = typeof window !== 'undefined' ? localStorage.getItem(module) : null;
        const localTs = getLocalModuleTimestamp(module, localRaw);
        const cloudTs = cloudRecord?.updatedAt || 0;

        if (cloudRecord) {
          if (localRaw) {
            // Both cloud and local exist
            const localParsed = JSON.parse(localRaw);
            const timeDiff = localTs - cloudTs;

            if (timeDiff > 1000) {
              // Local is significantly newer (offline edit scenario!)
              // Merge safety: merge to avoid losing any items, and keep local newer content
              const merged = mergeModuleData(module, localParsed, cloudRecord.data);
              const mergedStr = JSON.stringify(merged);
              localStorage.setItem(module, mergedStr);
              localStorage.setItem(`_offerflow_ts_${module}`, Date.now().toString());
              
              // Push merged newer state to cloud to keep cloud updated
              syncEngine.pushToCloud(module, mergedStr);
              dataChanged = true;
            } else if (timeDiff < -1000) {
              // Cloud is significantly newer (edited on another device)
              const merged = mergeModuleData(module, localParsed, cloudRecord.data);
              localStorage.setItem(module, JSON.stringify(merged));
              localStorage.setItem(`_offerflow_ts_${module}`, cloudTs.toString());
              dataChanged = true;
            } else {
              // Timestamps are close, perform entity merge to keep all unique items
              const merged = mergeModuleData(module, localParsed, cloudRecord.data);
              localStorage.setItem(module, JSON.stringify(merged));
              localStorage.setItem(`_offerflow_ts_${module}`, Math.max(localTs, cloudTs).toString());
            }
          } else {
            // Local is empty, populate from cloud
            localStorage.setItem(module, JSON.stringify(cloudRecord.data));
            localStorage.setItem(`_offerflow_ts_${module}`, cloudTs.toString());
            dataChanged = true;
          }
        } else {
          // Cloud has no data for this module
          if (localRaw) {
            if (clearIfEmpty) {
              // Wipe lingering demo data for brand new account
              localStorage.removeItem(module);
              localStorage.removeItem(`_offerflow_ts_${module}`);
              dataChanged = true;
            } else {
              // Push existing local data to cloud
              syncEngine.pushToCloud(module, localRaw);
            }
          }
        }
      }

      return dataChanged;
    } catch (e) {
      console.error('[SyncEngine] Pull failed:', e);
      return false;
    }
  },

  /**
   * Full bidirectional synchronization: pushes dirty/un-synced local changes to cloud
   * and pulls cloud updates. Called automatically on network reconnect.
   */
  syncAll: async (): Promise<void> => {
    const { user, isGuest } = useAuthStore.getState();
    if (!user || isGuest) return;

    try {
      const dirty = getDirtyModules();
      for (const module of dirty) {
        const localRaw = localStorage.getItem(module);
        if (localRaw) {
          await syncEngine.pushToCloud(module, localRaw);
        }
      }

      // Then pull & reconcile with cloud
      await syncEngine.pullFromCloud(false);
    } catch (e) {
      console.error('[SyncEngine] Sync all failed:', e);
    }
  }
};

// Listen for browser online event & page visibility to auto-compensate sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncEngine] Network connection restored. Compensating offline sync...');
    syncEngine.syncAll();
  });

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const dirty = getDirtyModules();
      if (dirty.size > 0) {
        syncEngine.syncAll();
      }
    }
  });
}
