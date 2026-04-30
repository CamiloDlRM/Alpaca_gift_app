import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggleTheme: () => {
        const next = !get().isDark;
        set({ isDark: next });
        document.documentElement.classList.toggle('dark', next);
      },
    }),
    { name: 'wg-theme' }
  )
);

export function applyStoredTheme() {
  try {
    const raw = localStorage.getItem('wg-theme');
    if (raw) {
      const { state } = JSON.parse(raw) as { state: { isDark: boolean } };
      if (state?.isDark) document.documentElement.classList.add('dark');
    }
  } catch { /* ignore */ }
}
