import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  CONSUMER_LOCALE_CHANGED_EVENT,
  localeStorageKey,
  readDefaultLocale,
  readEnabledLocales,
  resolveAppConsumerLocale,
  resolveConsumerLocale,
  shouldApplyConsumerLocaleChange,
  writeStoredConsumerLocale,
} from './tenant-locale.js';

describe('tenant-locale (Sprint 29)', () => {
  const profile = {
    locale: 'en',
    defaultLocale: 'hy',
    enabledLocales: ['en', 'hy'],
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('reads enabled locales with backward-compatible default', () => {
    expect(readEnabledLocales({})).toEqual(['en', 'hy', 'ru']);
    expect(readEnabledLocales(profile)).toEqual(['en', 'hy']);
  });

  it('reads default locale from tenant settings', () => {
    expect(readDefaultLocale(profile)).toBe('hy');
    expect(
      readDefaultLocale({
        defaultLocale: 'ru',
        enabledLocales: ['en', 'hy'],
      }),
    ).toBe('en');
  });

  it('persists and resolves consumer locale per slug', () => {
    writeStoredConsumerLocale('salon', 'hy');
    expect(resolveConsumerLocale('salon', profile)).toBe('hy');
    expect(localStorage.getItem(localeStorageKey('salon'))).toBe('hy');
  });

  it('ignores stored locale when it is not enabled', () => {
    writeStoredConsumerLocale('salon', 'ru');
    expect(resolveConsumerLocale('salon', profile)).toBe('hy');
  });

  it('resolveAppConsumerLocale prefers any stored consumer-locale (e2e-bug.54)', () => {
    writeStoredConsumerLocale('glow-nails', 'ru');
    expect(resolveAppConsumerLocale()).toBe('ru');
  });

  it('e2e-bug.22: writeStoredConsumerLocale dispatches locale-changed event', () => {
    const handler = vi.fn();
    window.addEventListener(CONSUMER_LOCALE_CHANGED_EVENT, handler);
    writeStoredConsumerLocale('salon', 'hy');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ slug: 'salon', locale: 'hy' });
    window.removeEventListener(CONSUMER_LOCALE_CHANGED_EVENT, handler);
  });

  it.each([
    {
      id: 'e2e-bug.22-same-slug-enabled',
      eventSlug: 'salon',
      hookSlug: 'salon',
      nextLocale: 'hy',
      enabledLocales: ['en', 'hy'],
      expected: true,
    },
    {
      id: 'e2e-bug.22-other-slug-ignored',
      eventSlug: 'other',
      hookSlug: 'salon',
      nextLocale: 'hy',
      enabledLocales: ['en', 'hy'],
      expected: false,
    },
    {
      id: 'e2e-bug.22-disabled-locale-ignored',
      eventSlug: 'salon',
      hookSlug: 'salon',
      nextLocale: 'ru',
      enabledLocales: ['en', 'hy'],
      expected: false,
    },
  ])('$id', ({ eventSlug, hookSlug, nextLocale, enabledLocales, expected }) => {
    expect(
      shouldApplyConsumerLocaleChange({
        eventSlug,
        hookSlug,
        nextLocale,
        enabledLocales,
      }),
    ).toBe(expected);
  });
});

