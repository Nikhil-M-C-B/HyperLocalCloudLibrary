/**
 * useAppStore — single source of truth for auth & profile state.
 *
 * Persists to AsyncStorage so the session survives refreshes.
 * Works on web (uses AsyncStorage, not SecureStore for storage key).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type AppRole = 'USER' | 'LIBRARIAN' | 'ADMIN';

export interface AppProfile {
  profileId: string;
  name: string;
  accountType: 'PARENT' | 'CHILD';
  ageGroup?: string;
  age: number; // numeric, derived from ageGroup or set directly
  preferredGenres?: string[];
  preferredLanguages?: string[];
}

interface SetAuthPayload {
  userId: string;
  email: string;
  token: string;
  role: AppRole;
  profiles: Omit<AppProfile, 'age'>[] &
  Partial<Pick<AppProfile, 'age'>>[];
}

interface AppStore {
  userId: string | null;
  email: string | null;
  token: string | null;
  activeProfileId: string | null;
  role: AppRole;
  profiles: AppProfile[];
  isAuthenticated: boolean;
  isLoading: boolean;

  hydrate: () => Promise<void>;
  setAuth: (data: SetAuthPayload) => Promise<void>;
  addProfile: (profile: Omit<AppProfile, 'age'> & { age?: number }) => Promise<void>;
  setActiveProfile: (profileId: string) => Promise<void>;
  clearAuth: () => Promise<void>;
}

const STORAGE_KEY = '@app_auth_v1';

/** Convert backend ageGroup string ("6-8") to a display number (6). */
export function ageGroupToNum(ag?: string): number {
  if (!ag) return 25;
  const n = parseInt(ag.split('-')[0], 10);
  return isNaN(n) ? 25 : n;
}

/** Convert a numeric age to the closest backend ageGroup. */
export function numToAgeGroup(age: number): AppProfile['ageGroup'] {
  if (age <= 3) return '0-3';
  if (age <= 6) return '4-6';
  if (age <= 8) return '6-8';
  if (age <= 10) return '8-10';
  if (age <= 12) return '10-12';
  if (age <= 15) return '12-15';
  return '15+';
}

const useAppStore = create<AppStore>((set, get) => ({
  userId: null,
  email: null,
  token: null,
  activeProfileId: null,
  role: 'USER',
  profiles: [],
  isAuthenticated: false,
  isLoading: true,

  // ── Hydrate from AsyncStorage (call on app launch) ──────────────────────────
  hydrate: async () => {
    set({ isLoading: true });
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        set({ ...data, isAuthenticated: !!data.token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  // ── Store auth + profiles after login / register ────────────────────────────
  setAuth: async ({ userId, email, token, role, profiles }) => {
    const augmented: AppProfile[] = profiles.map((p) => ({
      profileId: (p as any).profileId ?? String(Date.now() + Math.random()),
      name: (p as any).name,
      accountType: (p as any).accountType ?? 'PARENT',
      ageGroup: (p as any).ageGroup,
      age: (p as any).age ?? ageGroupToNum((p as any).ageGroup),
      preferredGenres: (p as any).preferredGenres ?? [],
      preferredLanguages: (p as any).preferredLanguages ?? [],
    }));
    const state = {
      userId, email, token, role, profiles: augmented, isAuthenticated: true,
    };
    set(state);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  // ── Add a child profile (after sign-up) ────────────────────────────────────
  addProfile: async (profile) => {
    const p: AppProfile = {
      profileId: profile.profileId ?? String(Date.now() + Math.random()),
      name: profile.name,
      accountType: profile.accountType ?? 'CHILD',
      ageGroup: profile.ageGroup ?? numToAgeGroup(profile.age ?? 10),
      age: profile.age ?? ageGroupToNum(profile.ageGroup),
      preferredGenres: profile.preferredGenres ?? [],
      preferredLanguages: profile.preferredLanguages ?? [],
    };
    const profiles = [...get().profiles, p];
    set({ profiles });
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, profiles }));
      }
    } catch { /* non-critical */ }
  },

  // ── Set active profile ──────────────────────────────────────────────────────
  setActiveProfile: async (profileId) => {
    set({ activeProfileId: profileId });
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, activeProfileId: profileId }));
      }
    } catch { /* non-critical */ }
  },

  // ── Sign out ────────────────────────────────────────────────────────────────
  clearAuth: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({
      userId: null, email: null, token: null, activeProfileId: null, role: 'USER',
      profiles: [], isAuthenticated: false,
    });
  },
}));

export default useAppStore;
