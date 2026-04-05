import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: async (email, password) => {
        const res = await apiClient.post('/auth/login', { email, password });
        localStorage.setItem('wealthgift_token', res.data.token);
        set({ token: res.data.token, user: res.data.user });
      },
      register: async (email, password, name) => {
        const res = await apiClient.post('/auth/register', { email, password, name });
        localStorage.setItem('wealthgift_token', res.data.token);
        set({ token: res.data.token, user: res.data.user });
      },
      logout: () => {
        localStorage.removeItem('wealthgift_token');
        set({ token: null, user: null });
      },
    }),
    { name: 'wealthgift-auth' }
  )
);
