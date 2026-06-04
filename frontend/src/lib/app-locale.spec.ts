import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import { resolveDisplayLocale, toIntlLocale } from './app-locale';

describe('app-locale', () => {
  const doc = { documentElement: { lang: 'en' } };

  beforeAll(() => {
    vi.stubGlobal('document', doc);
  });

  afterEach(() => {
    doc.documentElement.lang = 'en';
  });

  it('maps supported locales to Intl tags', () => {
    expect(toIntlLocale('hy')).toBe('hy-AM');
    expect(toIntlLocale('ru')).toBe('ru-RU');
    expect(toIntlLocale('en')).toBe('en-GB');
    expect(toIntlLocale('de')).toBeUndefined();
    expect(toIntlLocale()).toBeUndefined();
  });

  it('resolveDisplayLocale prefers explicit locale', () => {
    expect(resolveDisplayLocale('ru')).toBe('ru');
    doc.documentElement.lang = 'xx';
    expect(resolveDisplayLocale('fr')).toBeUndefined();
  });

  it('resolveDisplayLocale reads document.lang when explicit is missing', () => {
    doc.documentElement.lang = 'hy';
    expect(resolveDisplayLocale()).toBe('hy');
    doc.documentElement.lang = 'xx';
    expect(resolveDisplayLocale()).toBeUndefined();
  });

  it('resolveDisplayLocale skips document when unavailable (SSR)', () => {
    vi.unstubAllGlobals();
    expect(resolveDisplayLocale('en')).toBe('en');
    expect(resolveDisplayLocale()).toBeUndefined();
    vi.stubGlobal('document', doc);
  });
});
