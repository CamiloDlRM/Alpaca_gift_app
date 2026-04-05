import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionStatus: 'FREE' | 'PRO';
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: async (email, password) => {
        const res = await apiClient.post('/auth/login', { email, password });
        localStorage.setItem('wealthgift_token', res.data.token);
        set({
          token: res.data.token,
          user: { ...res.data.user, subscriptionStatus: res.data.user.subscriptionStatus ?? 'FREE' },
        });
      },
      register: async (email, password, name) => {
        const res = await apiClient.post('/auth/register', { email, password, name });
        localStorage.setItem('wealthgift_token', res.data.token);
        set({
          token: res.data.token,
          user: { ...res.data.user, subscriptionStatus: res.data.user.subscriptionStatus ?? 'FREE' },
        });
      },
      logout: () => {
        localStorage.removeItem('wealthgift_token');
        set({ token: null, user: null });
      },
      updateUser: (partial) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        }));
      },
    }),
    { name: 'wealthgift-auth' }
  )
);
