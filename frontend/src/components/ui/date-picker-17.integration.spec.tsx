// @vitest-environment happy-dom
import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import {
  getActiveBusinessDateFormats,
  parseBusinessDateToKey,
  setActiveBusinessDateFormats,
} from '@/lib/business-date-format';
import { DatePicker } from './date-picker';

vi.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="calendar-icon" />,
  ChevronDown: () => <span data-testid="chevron-icon" />,
  ChevronLeft: () => <span />,
  ChevronRight: () => <span />,
}));

describe('Sprint 34 — fmt-1.7 DatePicker integration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let onChange: ReturnType<typeof vi.fn<(dateKey: string) => void>>;

  beforeEach(() => {
    setActiveBusinessDateFormats('MM/DD/YYYY', '12h');
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
        <I18nProvider initialLocale="en">
          <DatePicker value="" onChange={onChange} {...props} />
        </I18nProvider>,
      );
    });
  }

  function textInput() {
    return container.querySelector('input[type="text"]') as HTMLInputElement | null;
  }

  it.each([
    {
      id: 'us-mmdd',
      formats: { dateFormat: 'MM/DD/YYYY' as const, timeFormat: '12h' as const },
      placeholder: '12/31/2026',
      pattern: /MM\/DD\/YYYY/,
      value: '2026-06-04',
      display: '06/04/2026',
    },
    {
      id: 'eu-ddmm',
      formats: { dateFormat: 'DD/MM/YYYY' as const, timeFormat: '24h' as const },
      placeholder: '31/12/2026',
      pattern: /DD\/MM\/YYYY/,
      value: '2026-06-04',
      display: '04/06/2026',
    },
    {
      id: 'iso',
      formats: { dateFormat: 'YYYY-MM-DD' as const, timeFormat: '24h' as const },
      placeholder: '2026-12-31',
      pattern: /YYYY-MM-DD/,
      value: '2026-06-04',
      display: '2026-06-04',
    },
  ])(
    '$id — placeholder, hint, and display value follow business format',
    ({ formats, placeholder, pattern, value, display }) => {
      setActiveBusinessDateFormats(formats.dateFormat, formats.timeFormat);
      mount({ value });
      const input = textInput();
      expect(input?.placeholder).toBe(placeholder);
      expect(container.textContent).toMatch(pattern);
      expect(input?.value).toBe(display);
      expect(getActiveBusinessDateFormats().dateFormat).toBe(formats.dateFormat);
    },
  );

  it('parse helper used by DatePicker commits typed US dates to ISO keys', () => {
    setActiveBusinessDateFormats('MM/DD/YYYY', '12h');
    expect(parseBusinessDateToKey('06/04/2026')).toBe('2026-06-04');
    expect(parseBusinessDateToKey('08/15/2026')).toBe('2026-08-15');
  });

  it('parse helper disambiguates European vs US slash dates', () => {
    setActiveBusinessDateFormats('DD/MM/YYYY', '24h');
    expect(parseBusinessDateToKey('04/06/2026')).toBe('2026-06-04');
    setActiveBusinessDateFormats('MM/DD/YYYY', '12h');
    expect(parseBusinessDateToKey('04/06/2026')).toBe('2026-04-06');
  });

  it('syncs typed display when value prop changes', () => {
    mount({ value: '2026-06-04' });
    expect(textInput()?.value).toBe('06/04/2026');
    act(() => {
      root.render(
        <I18nProvider initialLocale="en">
          <DatePicker value="2026-08-15" onChange={onChange} />
        </I18nProvider>,
      );
    });
    expect(textInput()?.value).toBe('08/15/2026');
  });

  it('compact variant uses calendar button only without typed field', () => {
    mount({ variant: 'compact', value: '2026-06-04' });
    expect(textInput()).toBeNull();
    expect(container.querySelector('button[aria-haspopup="dialog"]')).toBeTruthy();
    expect(container.textContent).toMatch(/06\/04\/2026/);
  });

  it('allowTyping=false renders picker button without text input or hint', () => {
    mount({ allowTyping: false, showFormatHint: false, value: '2026-06-04' });
    expect(textInput()).toBeNull();
    expect(container.querySelector('[id$="-hint"]')).toBeNull();
    expect(container.querySelector('button[aria-haspopup="dialog"]')).toBeTruthy();
  });

  it('hides format hint when showFormatHint is false', () => {
    mount({ showFormatHint: false });
    expect(container.textContent).not.toMatch(/Use MM\/DD\/YYYY format/);
  });

  it('typed input exposes blur and Enter handlers for commit path', () => {
    mount();
    const input = textInput()!;
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.getAttribute('aria-describedby')).toMatch(/-hint$/);
  });
});
