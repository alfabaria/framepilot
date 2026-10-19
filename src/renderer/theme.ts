import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_OPTIONS: readonly { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const STORAGE_KEY = 'framepilot.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function parseThemePreference(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function resolveTheme(preference: ThemePreference, systemIsDark: boolean): ResolvedTheme {
  if (preference === 'system') return systemIsDark ? 'dark' : 'light';
  return preference;
}

function loadPreference(): ThemePreference {
  try {
    return parseThemePreference(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'system';
  }
}

function apply(preference: ThemePreference): void {
  document.documentElement.dataset.theme = resolveTheme(preference, window.matchMedia(DARK_QUERY).matches);
}

/** Applies the saved theme before the first paint so there is no flash of the wrong theme. */
export function applySavedTheme(): void {
  apply(loadPreference());
}

/** The saved theme preference. "System" follows the OS appearance and updates live when it changes. */
export function useTheme(): [ThemePreference, (next: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>(loadPreference);

  useEffect(() => {
    apply(preference);
    if (preference !== 'system') return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => apply('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference]);

  const choose = useCallback((next: ThemePreference) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the choice still applies for this session.
    }
    setPreference(next);
  }, []);

  return [preference, choose];
}
