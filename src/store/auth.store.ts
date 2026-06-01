import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { User } from '@types/index';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    setUser: (user) =>
      set({ user, isAuthenticated: !!user, isLoading: false }),

    setLoading: (isLoading) => set({ isLoading }),

    logout: () =>
      set({ user: null, isAuthenticated: false, isLoading: false }),
  }))
);
