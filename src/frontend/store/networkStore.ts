import { create } from 'zustand';

interface NetworkStore {
  isOffline: boolean;
  isLoading: boolean;
  setOffline: () => void;
  setOnline: () => void;
  setLoading: (isLoading: boolean) => void;
}

const useNetworkStore = create<NetworkStore>((set) => ({
  isOffline: false,
  isLoading: false,
  setOffline: () => set({ isOffline: true }),
  setOnline: () => set({ isOffline: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export default useNetworkStore;
