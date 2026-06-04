import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PUBLIC_LOCALE_COOKIE } from '@/i18n';
import {
  readClientLocaleForPublicApi,
  readPublicBookingLocalePreference,
  readPublicCookieLocale,
  writePublicCookieLocale,
} from './public-locale-cookie';

function expireCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

function withCookieGetter(
  value: string,
  run: () => void,
): void {
  const previous = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    enumerable: true,
    get: () => value,
    set: () => undefined,
  });
  try {
    run();
  } finally {
    if (previous) {
      Object.defineProperty(document, 'cookie', previous);
    } else {
      delete (document as { cookie?: string }).cookie;
    }
  }
}

function withCookieSetter(run: (writes: string[]) => void): void {
  const writes: string[] = [];
  const previous = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    enumerable: true,
    get: () => writes.at(-1) ?? '',
    set: (next: string) => {
      writes.push(next);
    },
  });
  try {
    run(writes);
  } finally {
    if (previous) {
      Object.defineProperty(document, 'cookie', previous);
    } else {
      delete (document as { cookie?: string }).cookie;
    }
  }
}

describe('public-locale-cookie', () => {
  const originalRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

  beforeEach(() => {
    expireCookie(PUBLIC_LOCALE_COOKIE);
    vi.stubGlobal('location', {
      protocol: 'http:',
      hostname: 'localhost',
    });
    delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  });

  afterEach(() => {
    expireCookie(PUBLIC_LOCALE_COOKIE);
    vi.unstubAllGlobals();
    if (originalRootDomain === undefined) {
      delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    } else {
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = originalRootDomain;
    }
  });

  it('reads and writes the public-locale cookie', () => {
    expect(readPublicCookieLocale()).toBeNull();
    writePublicCookieLocale('hy');
    expect(readPublicCookieLocale()).toBe('hy');
    expect(document.cookie).toContain(`${PUBLIC_LOCALE_COOKIE}=hy`);
  });

  it('ignores invalid cookie values', () => {
    withCookieGetter(`${PUBLIC_LOCALE_COOKIE}=de`, () => {
      expect(readPublicCookieLocale()).toBeNull();
    });
  });

  it('returns null without document', () => {
    const doc = globalThis.document;
    vi.stubGlobal('document', undefined);
    expect(readPublicCookieLocale()).toBeNull();
    vi.stubGlobal('document', doc);
  });

  it('returns null when cookie name is absent', () => {
    withCookieGetter('other=value', () => {
      expect(readPublicCookieLocale()).toBeNull();
    });
  });

  it('adds secure on https', () => {
    withCookieSetter((writes) => {
      vi.stubGlobal('location', {
        protocol: 'https:',
        hostname: 'localhost',
      });
      writePublicCookieLocale('ru');
      expect(writes.at(-1)).toContain('secure');
    });
  });

  it('sets parent domain on tenant subdomains', () => {
    withCookieSetter((writes) => {
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'example.com:443';
      vi.stubGlobal('location', {
        protocol: 'https:',
        hostname: 'salon.example.com',
      });
      writePublicCookieLocale('en');
      expect(writes.at(-1)).toContain('domain=.example.com');
    });
  });

  it('skips parent domain for localhost root host', () => {
    withCookieSetter((writes) => {
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'localhost';
      vi.stubGlobal('location', {
        protocol: 'http:',
        hostname: 'tenant.localhost',
      });
      writePublicCookieLocale('en');
      expect(writes.at(-1)).not.toContain('domain=');
    });
  });

  it('skips parent domain when hostname is not a tenant subdomain', () => {
    withCookieSetter((writes) => {
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'example.com';
      vi.stubGlobal('location', {
        protocol: 'http:',
        hostname: 'other.org',
      });
      writePublicCookieLocale('hy');
      expect(writes.at(-1)).not.toContain('domain=');
    });
  });

  it('skips parent domain when root host is 127.0.0.1', () => {
    withCookieSetter((writes) => {
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = '127.0.0.1';
      vi.stubGlobal('location', {
        protocol: 'http:',
        hostname: '127.0.0.1',
      });
      writePublicCookieLocale('en');
      expect(writes.at(-1)).not.toContain('domain=');
    });
  });

  it('readPublicBookingLocalePreference prefers stored cookie', () => {
    withCookieGetter(`${PUBLIC_LOCALE_COOKIE}=ru`, () => {
      expect(readPublicBookingLocalePreference('hy')).toBe('ru');
    });
  });

  it('readPublicBookingLocalePreference falls back to business locale', () => {
    expect(readPublicBookingLocalePreference('hy')).toBe('hy');
  });

  it('readPublicBookingLocalePreference defaults to en', () => {
    expect(readPublicBookingLocalePreference('de')).toBe('en');
    expect(readPublicBookingLocalePreference()).toBe('en');
  });

  it('readClientLocaleForPublicApi returns only public cookie', () => {
    withCookieGetter('', () => {
      expect(readClientLocaleForPublicApi()).toBeNull();
    });
    withCookieGetter(`${PUBLIC_LOCALE_COOKIE}=hy`, () => {
      expect(readClientLocaleForPublicApi()).toBe('hy');
    });
  });

  it('writePublicCookieLocale is a no-op without document', () => {
    const doc = globalThis.document;
    vi.stubGlobal('document', undefined);
    expect(() => writePublicCookieLocale('en')).not.toThrow();
    vi.stubGlobal('document', doc);
  });

  it('omits secure and domain flags when window is unavailable', () => {
    withCookieSetter((writes) => {
      const win = globalThis.window;
      vi.stubGlobal('window', undefined);
      writePublicCookieLocale('en');
      expect(writes.at(-1)).not.toContain('secure');
      expect(writes.at(-1)).not.toContain('domain=');
      vi.stubGlobal('window', win);
    });
  });
});
