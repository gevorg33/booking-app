import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCALE_COOKIE } from '@/i18n';
import { readCookieLocale, writeCookieLocale } from './locale-cookie';

function expireCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

function withCookieGetter(value: string, run: () => void): void {
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

describe('locale-cookie', () => {
  const originalRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

  beforeEach(() => {
    expireCookie(LOCALE_COOKIE);
    vi.stubGlobal('location', {
      protocol: 'http:',
      hostname: 'localhost',
    });
    delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  });

  afterEach(() => {
    expireCookie(LOCALE_COOKIE);
    vi.unstubAllGlobals();
    if (originalRootDomain === undefined) {
      delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    } else {
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = originalRootDomain;
    }
  });

  it('reads and writes the app-locale cookie', () => {
    expect(readCookieLocale()).toBeNull();
    writeCookieLocale('ru');
    expect(readCookieLocale()).toBe('ru');
    expect(document.cookie).toContain(`${LOCALE_COOKIE}=ru`);
  });

  it('ignores invalid cookie values', () => {
    withCookieGetter(`${LOCALE_COOKIE}=xx`, () => {
      expect(readCookieLocale()).toBeNull();
    });
  });

  it('returns null without document', () => {
    const doc = globalThis.document;
    vi.stubGlobal('document', undefined);
    expect(readCookieLocale()).toBeNull();
    vi.stubGlobal('document', doc);
  });

  it('adds secure on https', () => {
    withCookieSetter((writes) => {
      vi.stubGlobal('location', {
        protocol: 'https:',
        hostname: 'localhost',
      });
      writeCookieLocale('hy');
      expect(writes.at(-1)).toContain('secure');
    });
  });

  it('sets parent domain on tenant subdomains', () => {
    withCookieSetter((writes) => {
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'book.io';
      vi.stubGlobal('location', {
        protocol: 'https:',
        hostname: 'spa.book.io',
      });
      writeCookieLocale('en');
      expect(writes.at(-1)).toContain('domain=.book.io');
    });
  });

  it('writeCookieLocale is a no-op without document', () => {
    const doc = globalThis.document;
    vi.stubGlobal('document', undefined);
    expect(() => writeCookieLocale('en')).not.toThrow();
    vi.stubGlobal('document', doc);
  });

  it('omits secure and domain flags when window is unavailable', () => {
    withCookieSetter((writes) => {
      const win = globalThis.window;
      vi.stubGlobal('window', undefined);
      writeCookieLocale('en');
      expect(writes.at(-1)).not.toContain('secure');
      expect(writes.at(-1)).not.toContain('domain=');
      vi.stubGlobal('window', win);
    });
  });
});
