import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUBLIC_LOCALE_COOKIE } from '@/i18n';

const cookiesMock = vi.fn();

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

import { resolvePublicBookingLocale } from './server-public-locale';

function mockCookieStore(values: Record<string, string | undefined>) {
  cookiesMock.mockResolvedValue({
    get: (name: string) => {
      const value = values[name];
      return value === undefined ? undefined : { value };
    },
  });
}

describe('resolvePublicBookingLocale', () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it('returns visitor public-locale cookie when supported', async () => {
    mockCookieStore({ [PUBLIC_LOCALE_COOKIE]: 'ru' });
    await expect(resolvePublicBookingLocale('hy')).resolves.toBe('ru');
  });

  it('ignores unsupported public cookie and uses business default', async () => {
    mockCookieStore({ [PUBLIC_LOCALE_COOKIE]: 'de' });
    await expect(resolvePublicBookingLocale('hy')).resolves.toBe('hy');
  });

  it('uses business locale when no public cookie', async () => {
    mockCookieStore({});
    await expect(resolvePublicBookingLocale('hy')).resolves.toBe('hy');
  });

  it('falls back to en when cookie and business locale are missing or invalid', async () => {
    mockCookieStore({});
    await expect(resolvePublicBookingLocale()).resolves.toBe('en');
    await expect(resolvePublicBookingLocale('de')).resolves.toBe('en');
  });

  it('constrains visitor cookie to tenant enabled locales', async () => {
    mockCookieStore({ [PUBLIC_LOCALE_COOKIE]: 'ru' });
    await expect(
      resolvePublicBookingLocale({
        enabledLocales: ['en', 'hy'],
        defaultLocale: 'hy',
      }),
    ).resolves.toBe('hy');
  });

  it('accepts visitor cookie when locale is enabled', async () => {
    mockCookieStore({ [PUBLIC_LOCALE_COOKIE]: 'hy' });
    await expect(
      resolvePublicBookingLocale({
        enabledLocales: ['en', 'hy'],
        defaultLocale: 'en',
      }),
    ).resolves.toBe('hy');
  });
});
