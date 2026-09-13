import { useAppearance } from '@/contexts/AppearanceContext';

export type Theme = 'light' | 'dark';

/** Compatibility hook for charts and older components while appearance tokens are adopted. */
export const useTheme = () => {
  const { preferences, save } = useAppearance();
  const theme: Theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  const toggleTheme = () => {
    void save({ ...preferences, mode: theme === 'dark' ? 'light' : 'dark' });
  };

  return { theme, toggleTheme };
};
