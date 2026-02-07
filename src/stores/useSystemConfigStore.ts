import { create } from 'zustand';
import type { SystemConfig } from '@/types';

interface SystemConfigStore {
  config: SystemConfig | null;
  loading: boolean;
  error: string | null;
  setConfig: (config: SystemConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSystemConfigStore = create<SystemConfigStore>((set) => ({
  config: null,
  loading: true,
  error: null,
  setConfig: (config) => set({ config, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));
