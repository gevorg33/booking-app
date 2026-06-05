import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { AiClarifyForm } from './ai-clarify-form';

vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input
      data-testid="date-picker"
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('AiClarifyForm integration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let submitted: string | null;

  beforeEach(() => {
    submitted = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function mountForm(
    issues: Parameters<typeof AiClarifyForm>[0]['issues'],
    options?: Parameters<typeof AiClarifyForm>[0]['options'],
  ) {
    act(() => {
      root.render(
        <I18nProvider initialLocale="en">
          <AiClarifyForm
            issues={issues}
            options={options}
            onSubmit={(prompt) => {
              submitted = prompt;
            }}
          />
        </I18nProvider>,
      );
    });
  }

  it('submits composed value from employee select', () => {
    mountForm(
      [{ field: 'employeeName', label: 'Provider', message: 'required' }],
      {
        employees: [
          { id: 'e1', name: 'Anna', isActive: true },
          { id: 'e2', name: 'Bob', isActive: true },
        ],
        services: [],
      },
    );

    const employeeSelect = container.querySelector('select') as HTMLSelectElement;
    act(() => {
      employeeSelect.value = 'Anna';
      employeeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(submitted).toBe('Provider: Anna');
  });

  it('falls back to first example when submit with empty values', () => {
    mountForm([
      {
        field: 'date',
        label: 'Date',
        message: 'required',
        example: 'Book for tomorrow',
      },
    ]);

    const form = container.querySelector('form') as HTMLFormElement;
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(submitted).toBe('Book for tomorrow');
  });

  it('renders date picker for date fields', () => {
    mountForm([{ field: 'date', label: 'Date', message: 'required' }]);
    expect(container.querySelector('[data-testid="date-picker"]')).toBeTruthy();
  });
});
