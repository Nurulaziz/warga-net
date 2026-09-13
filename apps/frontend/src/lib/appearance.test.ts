import { beforeEach, describe, expect, it } from 'vitest';
import {
  APPEARANCE_CACHE_KEY,
  DEFAULT_APPEARANCE,
  applyAppearance,
  cacheAppearance,
  contrastRatio,
  isAccessibleAccent,
  normalizeAppearance,
  readCachedAppearance,
  resolveDarkMode,
} from './appearance';

describe('appearance preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('style');
  });

  it('migrates partial or invalid legacy values to safe defaults', () => {
    expect(normalizeAppearance({ mode: 'night', font: 'unknown', density: 'compact' })).toEqual({
      ...DEFAULT_APPEARANCE,
      density: 'compact',
    });
  });

  it('stores and restores preferences', () => {
    const preferences = {
      ...DEFAULT_APPEARANCE,
      mode: 'dark' as const,
      textSize: 'large' as const,
    };
    cacheAppearance(preferences);
    expect(localStorage.getItem(APPEARANCE_CACHE_KEY)).toBeTruthy();
    expect(readCachedAppearance()).toEqual(preferences);
  });

  it('migrates the legacy light and dark setting without deleting it', () => {
    localStorage.setItem('warganet-theme', 'dark');
    expect(readCachedAppearance().mode).toBe('dark');
    expect(localStorage.getItem('warganet-theme')).toBe('dark');
  });

  it('follows system mode and explicit mode correctly', () => {
    expect(resolveDarkMode('system', true)).toBe(true);
    expect(resolveDarkMode('system', false)).toBe(false);
    expect(resolveDarkMode('dark', false)).toBe(true);
    expect(resolveDarkMode('light', true)).toBe(false);
  });

  it('rejects accents that cannot support readable white text', () => {
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
    expect(isAccessibleAccent('#ffff00')).toBe(false);
    expect(isAccessibleAccent('#1e40af')).toBe(true);
    expect(isAccessibleAccent('blue')).toBe(false);
  });

  it('applies tokens and responsive-friendly density attributes', () => {
    applyAppearance(
      {
        ...DEFAULT_APPEARANCE,
        mode: 'dark',
        accent: 'green',
        font: 'archivo',
        textSize: 'large',
        radius: 'rounded',
        density: 'compact',
      },
      false,
    );
    const root = document.documentElement;
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.dataset.font).toBe('archivo');
    expect(root.dataset.textSize).toBe('large');
    expect(root.dataset.radius).toBe('rounded');
    expect(root.dataset.density).toBe('compact');
    expect(root.style.getPropertyValue('--accent')).toBe('#15803d');
  });
});
