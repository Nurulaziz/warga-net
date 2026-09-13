export type AppearanceMode = 'light' | 'dark' | 'system';
export type AccentChoice = 'blue' | 'green' | 'orange' | 'custom';
export type FontChoice = 'geist' | 'archivo' | 'mono';
export type TextSize = 'small' | 'standard' | 'large';
export type RadiusChoice = 'square' | 'subtle' | 'rounded';
export type DensityChoice = 'compact' | 'comfortable';

export interface AppearancePreferences {
  mode: AppearanceMode;
  accent: AccentChoice;
  customAccent?: string;
  font: FontChoice;
  textSize: TextSize;
  radius: RadiusChoice;
  density: DensityChoice;
}

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  mode: 'system',
  accent: 'blue',
  font: 'geist',
  textSize: 'standard',
  radius: 'subtle',
  density: 'comfortable',
};

export const ACCENT_COLORS = {
  blue: '#2563eb',
  green: '#15803d',
  orange: '#c2410c',
} as const;

export const APPEARANCE_CACHE_KEY = 'warganet-appearance-active';

function isOneOf<T extends string>(value: unknown, choices: readonly T[]): value is T {
  return typeof value === 'string' && choices.includes(value as T);
}

export function normalizeAppearance(value: unknown): AppearancePreferences {
  if (!value || typeof value !== 'object') return { ...DEFAULT_APPEARANCE };
  const source = value as Partial<AppearancePreferences>;
  const accent = isOneOf(source.accent, ['blue', 'green', 'orange', 'custom'])
    ? source.accent
    : DEFAULT_APPEARANCE.accent;
  const customAccent =
    accent === 'custom' && isAccessibleAccent(source.customAccent || '')
      ? source.customAccent!.toLowerCase()
      : undefined;
  return {
    mode: isOneOf(source.mode, ['light', 'dark', 'system']) ? source.mode : DEFAULT_APPEARANCE.mode,
    accent: accent === 'custom' && !customAccent ? 'blue' : accent,
    ...(customAccent ? { customAccent } : {}),
    font: isOneOf(source.font, ['geist', 'archivo', 'mono'])
      ? source.font
      : DEFAULT_APPEARANCE.font,
    textSize: isOneOf(source.textSize, ['small', 'standard', 'large'])
      ? source.textSize
      : DEFAULT_APPEARANCE.textSize,
    radius: isOneOf(source.radius, ['square', 'subtle', 'rounded'])
      ? source.radius
      : DEFAULT_APPEARANCE.radius,
    density: isOneOf(source.density, ['compact', 'comfortable'])
      ? source.density
      : DEFAULT_APPEARANCE.density,
  };
}

function luminance(hex: string): number | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const channels = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  if (a === null || b === null) return 0;
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function isAccessibleAccent(color: string): boolean {
  return contrastRatio(color, '#ffffff') >= 4.5;
}

export function resolveDarkMode(mode: AppearanceMode, systemDark: boolean): boolean {
  return mode === 'dark' || (mode === 'system' && systemDark);
}

export function applyAppearance(
  preferences: AppearancePreferences,
  systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches,
) {
  const root = document.documentElement;
  const accent =
    preferences.accent === 'custom'
      ? preferences.customAccent || ACCENT_COLORS.blue
      : ACCENT_COLORS[preferences.accent];
  root.classList.toggle('dark', resolveDarkMode(preferences.mode, systemDark));
  root.dataset.appearanceMode = preferences.mode;
  root.dataset.font = preferences.font;
  root.dataset.textSize = preferences.textSize;
  root.dataset.radius = preferences.radius;
  root.dataset.density = preferences.density;
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-hover', accent);
  const rgb = [1, 3, 5].map((index) => parseInt(accent.slice(index, index + 2), 16)).join(' ');
  root.style.setProperty('--accent-rgb', rgb);
  root.style.setProperty('--accent-hover-rgb', rgb);
}

export function readCachedAppearance(
  storage: Pick<Storage, 'getItem'> = localStorage,
): AppearancePreferences {
  try {
    const current = storage.getItem(APPEARANCE_CACHE_KEY);
    if (current) return normalizeAppearance(JSON.parse(current));
    const legacyTheme = storage.getItem('warganet-theme');
    if (legacyTheme === 'light' || legacyTheme === 'dark') {
      return { ...DEFAULT_APPEARANCE, mode: legacyTheme };
    }
    return { ...DEFAULT_APPEARANCE };
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

export function cacheAppearance(
  preferences: AppearancePreferences,
  storage: Pick<Storage, 'setItem'> = localStorage,
) {
  storage.setItem(APPEARANCE_CACHE_KEY, JSON.stringify(preferences));
}
