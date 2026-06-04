import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCALE_COOKIE } from '@/i18n';

const cookiesMock = vi.fn();

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

import { getServerLocale } from './server-locale';

function mockCookieStore(values: Record<string, string | undefined>) {
  cookiesMock.mockResolvedValue({
    get: (name: string) => {
      const value = values[name];
      return value === undefined ? undefined : { value };
    },
  });
}

describe('getServerLocale', () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it('returns supported app-locale cookie', async () => {
    mockCookieStore({ [LOCALE_COOKIE]: 'hy' });
    await expect(getServerLocale()).resolves.toBe('hy');
  });

  it('defaults to en for missing or unsupported cookie', async () => {
    mockCookieStore({});
    await expect(getServerLocale()).resolves.toBe('en');
    mockCookieStore({ [LOCALE_COOKIE]: 'fr' });
    await expect(getServerLocale()).resolves.toBe('en');
  });
});
