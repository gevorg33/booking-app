// @vitest-environment happy-dom
import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseBusinessDateToKey } from '../lib/business-date-format';
import { I18nProvider } from '../i18n';
import { useAuthStore } from '../services/auth-store';
import { DatePicker } from './DatePicker';

describe('Sprint 34 — fmt-1.8 provider DatePicker integration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let onChange: ReturnType<typeof vi.fn<(dateKey: string) => void>>;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    useAuthStore.setState({
      user: { id: 'u1', email: 'p@test.com' },
      business: {
        id: 'biz-1',
        name: 'Salon',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      },
      token: 'token',
      isAuthenticated: true,
      employee: null,
      businesses: [],
    });
    onChange = vi.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function mount(props: Partial<ComponentProps<typeof DatePicker>> = {}) {
    act(() => {
      root.render(
        <I18nProvider>
          <DatePicker value="" onChange={onChange} {...props} />
        </I18nProvider>,
      );
    });
  }

  it.each([
    {
      id: 'us',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      placeholder: '12/31/2026',
      value: '2026-06-04',
      display: '06/04/2026',
      typed: '06/04/2026',
      key: '2026-06-04',
    },
    {
      id: 'eu',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      placeholder: '31/12/2026',
      value: '2026-06-04',
      display: '04/06/2026',
      typed: '04/06/2026',
      key: '2026-06-04',
    },
    {
      id: 'iso',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      placeholder: '2026-12-31',
      value: '2026-06-04',
      display: '2026-06-04',
      typed: '2026-06-04',
      key: '2026-06-04',
    },
  ])(
    '$id — placeholder, hint, display, and parse follow auth business format',
    ({ dateFormat, timeFormat, placeholder, value, display, typed, key }) => {
      useAuthStore.setState({
        business: {
          id: 'biz-1',
          name: 'Salon',
          dateFormat,
          timeFormat,
        },
      });
      mount({ value });
      const input = container.querySelector('input.date-picker-input') as HTMLInputElement;
      expect(input.placeholder).toBe(placeholder);
      expect(input.value).toBe(display);
      expect(container.textContent).toMatch(new RegExp(dateFormat.replace(/\//g, '\\/')));
      expect(parseBusinessDateToKey(typed, dateFormat as never)).toBe(key);
    },
  );

  it('allowTyping=false renders calendar trigger only', () => {
    mount({ allowTyping: false, value: '2026-06-04' });
    expect(container.querySelector('input.date-picker-input')).toBeNull();
    expect(container.textContent).toMatch(/06\/04\/2026/);
  });

  it('hides format hint when showFormatHint is false', () => {
    mount({ showFormatHint: false });
    expect(container.textContent).not.toMatch(/Use MM\/DD\/YYYY format/);
  });
});
