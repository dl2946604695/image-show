import { create } from 'zustand';
import type { User, AuthState } from '@/types';
import { login as apiLogin, signup as apiSignup, logout as apiLogout, checkAuth } from '@/lib/api';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  setUser: (user) => set({ 
    user, 
    isAuthenticated: user !== null,
    loading: false,
  }),

  initAuth: async () => {
    try {
      const user = await checkAuth();
      if (user) {
        set({ user, isAuthenticated: true });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    
    if (!result.success) {
      throw new Error(result.error || '登录失败');
    }
    
    set({ user: result.data.user, isAuthenticated: true });
  },

  logout: async () => {
    await apiLogout();
    set({ user: null, isAuthenticated: false });
  },

  signup: async (email: string, password: string, name: string) => {
    const result = await apiSignup(email, password, name);
    
    if (!result.success) {
      throw new Error(result.error || '注册失败');
    }
    
    set({ user: result.data.user, isAuthenticated: true });
  },
}));