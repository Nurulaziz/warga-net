import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import {
  APPEARANCE_CACHE_KEY,
  DEFAULT_APPEARANCE,
  applyAppearance,
  cacheAppearance,
  normalizeAppearance,
  readCachedAppearance,
  type AppearancePreferences,
} from '@/lib/appearance';

interface AppearanceContextValue {
  preferences: AppearancePreferences;
  preview: (preferences: AppearancePreferences) => void;
  save: (preferences: AppearancePreferences) => Promise<void>;
  cancelPreview: () => void;
  reset: () => Promise<void>;
  saving: boolean;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, currentUser } = useAuth();
  const [preferences, setPreferences] = useState(readCachedAppearance);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => applyAppearance(preferences, media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [preferences]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;
    void api
      .get<AppearancePreferences | null>('/users/me/appearance')
      .then(({ data }) => {
        let accountCache: unknown = null;
        try {
          accountCache = JSON.parse(
            localStorage.getItem(`warganet-appearance:${currentUser.id}`) || 'null',
          );
        } catch {
          accountCache = null;
        }
        const normalized = normalizeAppearance(data || accountCache || DEFAULT_APPEARANCE);
        setPreferences(normalized);
        cacheAppearance(normalized);
        localStorage.setItem(`warganet-appearance:${currentUser.id}`, JSON.stringify(normalized));
      })
      .catch(() => {
        const cached = localStorage.getItem(`warganet-appearance:${currentUser.id}`);
        if (cached) {
          try {
            const normalized = normalizeAppearance(JSON.parse(cached));
            setPreferences(normalized);
            cacheAppearance(normalized);
          } catch {
            setPreferences({ ...DEFAULT_APPEARANCE });
          }
        }
      });
  }, [currentUser, isAuthenticated]);

  const preview = useCallback((next: AppearancePreferences) => {
    applyAppearance(normalizeAppearance(next));
  }, []);

  const cancelPreview = useCallback(() => applyAppearance(preferences), [preferences]);

  const save = useCallback(
    async (next: AppearancePreferences) => {
      const normalized = normalizeAppearance(next);
      setSaving(true);
      try {
        if (isAuthenticated && currentUser) {
          await api.put('/users/me/appearance', normalized);
          localStorage.setItem(`warganet-appearance:${currentUser.id}`, JSON.stringify(normalized));
        }
        setPreferences(normalized);
        cacheAppearance(normalized);
      } finally {
        setSaving(false);
      }
    },
    [currentUser, isAuthenticated],
  );

  const reset = useCallback(async () => save({ ...DEFAULT_APPEARANCE }), [save]);
  const value = useMemo(
    () => ({ preferences, preview, save, cancelPreview, reset, saving }),
    [preferences, preview, save, cancelPreview, reset, saving],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance harus digunakan di dalam AppearanceProvider');
  return context;
}

export function bootstrapAppearance() {
  const preferences = readCachedAppearance();
  applyAppearance(preferences);
  if (!localStorage.getItem(APPEARANCE_CACHE_KEY)) cacheAppearance(preferences);
}
