import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearStoredLocale, readStoredLocale, writeStoredLocale } from './locale-storage';

describe('locale-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reads and writes supported locales', () => {
    expect(readStoredLocale()).toBeNull();
    writeStoredLocale('hy');
    expect(readStoredLocale()).toBe('hy');
    writeStoredLocale('ru');
    expect(readStoredLocale()).toBe('ru');
    clearStoredLocale();
    expect(readStoredLocale()).toBeNull();
  });

  it('returns null for unsupported stored values', () => {
    localStorage.setItem('provider-app-locale', 'de');
    expect(readStoredLocale()).toBeNull();
  });

  it('no-ops when localStorage is unavailable', () => {
    const storage = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true });
    expect(readStoredLocale()).toBeNull();
    expect(() => writeStoredLocale('en')).not.toThrow();
    expect(() => clearStoredLocale()).not.toThrow();
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  });
});
