import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCALE_COOKIE, PUBLIC_LOCALE_COOKIE } from '@/i18n';
import * as appLocaleCookie from '@/lib/locale-cookie';
import * as publicLocaleCookie from '@/lib/public-locale-cookie';
import { I18nProvider, useI18n, useOptionalI18n } from './I18nProvider';

type I18nSnapshot = ReturnType<typeof useI18n>;

function expireCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

function Probe({ onReady }: { onReady: (ctx: I18nSnapshot) => void }) {
  const ctx = useI18n();
  onReady(ctx);
  return <span data-locale={ctx.locale} />;
}

describe('I18nProvider', () => {
  let container: HTMLDivElement;
  let root: Root;
  let latest: I18nSnapshot | null;
  let mountKey = 0;

  beforeEach(() => {
    expireCookie(LOCALE_COOKIE);
    expireCookie(PUBLIC_LOCALE_COOKIE);
    document.documentElement.lang = '';
    latest = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.cookie = '';
  });

  function mountProvider(props: {
    initialLocale?: 'en' | 'hy' | 'ru';
    localeCookie?: 'app' | 'public';
  }) {
    mountKey += 1;
    act(() => {
      root.render(
        <I18nProvider key={mountKey} {...props}>
          <Probe onReady={(ctx) => { latest = ctx; }} />
        </I18nProvider>,
      );
    });
  }

  it('uses initialLocale on server render', () => {
    const html = renderToString(
      <I18nProvider initialLocale="hy">
        <span />
      </I18nProvider>,
    );
    expect(html).toContain('');
  });

  it('SSR state initializer ignores cookies when window is unavailable', () => {
    const win = globalThis.window;
    const previous = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      enumerable: true,
      get: () => `${PUBLIC_LOCALE_COOKIE}=ru`,
      set: () => undefined,
    });
    try {
      vi.stubGlobal('window', undefined);
      let capturedLocale = '';
      function Capture() {
        capturedLocale = useI18n().locale;
        return null;
      }
      renderToString(
        <I18nProvider initialLocale="hy" localeCookie="public">
          <Capture />
        </I18nProvider>,
      );
      expect(capturedLocale).toBe('hy');
    } finally {
      vi.stubGlobal('window', win);
      if (previous) {
        Object.defineProperty(document, 'cookie', previous);
      }
    }
  });

  it('uses business initial locale when no visitor cookie (public scope)', () => {
    vi.spyOn(publicLocaleCookie, 'readPublicCookieLocale').mockReturnValue(null);
    mountProvider({ initialLocale: 'hy', localeCookie: 'public' });
    expect(latest!.locale).toBe('hy');
    vi.restoreAllMocks();
  });

  it('prefers public-locale cookie over business default', () => {
    publicLocaleCookie.writePublicCookieLocale('ru');
    mountProvider({ initialLocale: 'hy', localeCookie: 'public' });
    expect(latest!.locale).toBe('ru');
  });

  it('prefers app-locale cookie for dashboard scope', () => {
    vi.spyOn(appLocaleCookie, 'readCookieLocale').mockReturnValue('hy');
    mountProvider({ initialLocale: 'en', localeCookie: 'app' });
    expect(latest!.locale).toBe('hy');
    vi.restoreAllMocks();
  });

  it('persists visitor choice in public-locale cookie', () => {
    mountProvider({ initialLocale: 'hy', localeCookie: 'public' });
    act(() => {
      latest!.setLocale('ru');
    });
    expect(latest!.locale).toBe('ru');
    expect(document.cookie).toContain(`${PUBLIC_LOCALE_COOKIE}=ru`);
  });

  it('can update locale without persisting', () => {
    const writeSpy = vi.spyOn(publicLocaleCookie, 'writePublicCookieLocale');
    mountProvider({ initialLocale: 'hy', localeCookie: 'public' });
    act(() => {
      latest!.setLocale('ru', { persist: false });
    });
    expect(latest!.locale).toBe('ru');
    expect(writeSpy).not.toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it('updates document lang when locale changes and exposes translate helpers', async () => {
    expireCookie(LOCALE_COOKIE);
    expireCookie(PUBLIC_LOCALE_COOKIE);
    mountProvider({ initialLocale: 'hy', localeCookie: 'app' });
    await act(async () => {
      await Promise.resolve();
    });
    expect(document.documentElement.lang).toBe('hy');
    act(() => {
      latest!.setLocale('en');
    });
    expect(document.documentElement.lang).toBe('en');
    expect(latest!.t('common.poweredBy')).toBeTruthy();
    expect(latest!.locales).toEqual(['en', 'hy', 'ru']);
    expect(latest!.localeLabels.en).toBe('English');
  });

  it('throws when useI18n is used outside a provider', () => {
    function Orphan() {
      useI18n();
      return null;
    }
    expect(() => renderToString(<Orphan />)).toThrow('useI18n must be used within I18nProvider');
  });

  it('useOptionalI18n returns null outside a provider', () => {
    function Orphan() {
      return <span data-has={String(useOptionalI18n() === null)} />;
    }
    const html = renderToString(<Orphan />);
    expect(html).toContain('data-has="true"');
  });
});
