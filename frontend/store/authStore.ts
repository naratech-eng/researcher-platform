import { create } from 'zustand';
import type { User, AuthState } from '../types/auth';

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, token?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    error: null
  }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  login: (user, token) => {
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  },
}));
