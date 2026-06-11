import { create } from 'zustand';
import { api } from '../api/client';

interface User {
  id: string;
  email: string;
  handle: string;
  displayName: string;
  planTier?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: async () => {
    // Revoke the refresh token server-side before clearing local state.
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore — clear local state regardless */
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },
}));
