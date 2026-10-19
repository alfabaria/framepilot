import { describe, expect, it } from 'vitest';
import { parseThemePreference, resolveTheme } from '../src/renderer/theme';

describe('theme preference', () => {
  it('System follows the OS appearance; explicit choices ignore it', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('falls back to System for missing or corrupted saved values', () => {
    expect(parseThemePreference(null)).toBe('system');
    expect(parseThemePreference('blue')).toBe('system');
    expect(parseThemePreference('dark')).toBe('dark');
  });
});
