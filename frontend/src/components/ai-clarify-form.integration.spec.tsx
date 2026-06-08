import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { AiClarifyForm } from './ai-clarify-form';
import { AiClarifyWizard } from './ai-command-wizard';

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
    extras?: Pick<
      Parameters<typeof AiClarifyForm>[0],
      'entityOptions' | 'originalPrompt'
    >,
  ) {
    act(() => {
      root.render(
        <I18nProvider initialLocale="en">
          <AiClarifyForm
            issues={issues}
            options={options}
            entityOptions={extras?.entityOptions}
            originalPrompt={extras?.originalPrompt}
            onSubmit={(prompt) => {
              submitted = prompt;
            }}
          />
        </I18nProvider>,
      );
    });
  }

  it('submits immediately when provider chip is tapped (single field)', () => {
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

    const annaChip = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Anna',
    );
    expect(annaChip).toBeTruthy();
    act(() => {
      annaChip!.click();
    });

    expect(submitted).toBe('Provider: Anna');
  });

  it('does not submit empty form without structured values', () => {
    mountForm([
      {
        field: 'customerName',
        label: 'Customer',
        message: 'required',
        example: 'Book for tomorrow',
      },
    ]);

    const form = container.querySelector('form') as HTMLFormElement;
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(submitted).toBeNull();
  });

  it('renders date picker for date fields', () => {
    mountForm([{ field: 'date', label: 'Date', message: 'required' }]);
    expect(container.querySelector('[data-testid="date-picker"]')).toBeTruthy();
  });

  it('submits time slot tap deterministically when slots are available', () => {
    mountForm(
      [{ field: 'timeSlot', label: 'Time', message: 'required' }],
      {
        employees: [],
        services: [],
        availabilityProviders: [
          {
            name: 'Anna',
            previewTimes: ['10:00'],
          },
        ],
      },
    );

    const slotButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('10:00'),
    );
    expect(slotButton).toBeTruthy();
    act(() => {
      slotButton!.click();
    });

    expect(submitted).toBe('Time: 10:00');
  });

  it('auto-submits when all multi-field chips are selected', () => {
    mountForm(
      [
        { field: 'employeeName', label: 'Provider', message: 'required' },
        { field: 'serviceName', label: 'Service', message: 'required' },
      ],
      {
        employees: [{ id: 'e1', name: 'Anna', isActive: true }],
        services: [{ id: 's1', name: 'Cut', isActive: true }],
      },
    );

    const annaChip = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Anna',
    );
    const cutChip = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Cut',
    );

    act(() => {
      annaChip!.click();
    });
    expect(submitted).toBeNull();

    act(() => {
      cutChip!.click();
    });
    expect(submitted).toBe('Provider: Anna. Service: Cut');
  });

  it('submits pre-resolved entity catalog tap with follow-up NL (n99-1.2)', () => {
    mountForm(
      [],
      {
        employees: [
          { id: 'e1', name: 'Anna Smith', isActive: true },
          { id: 'e2', name: 'Anna Jones', isActive: true },
          { id: 'e3', name: 'Bob', isActive: true },
        ],
        services: [],
      },
      {
        entityOptions: [
          { id: 'e1', field: 'employeeName', label: 'Anna Smith', value: 'Anna Smith' },
          { id: 'e2', field: 'employeeName', label: 'Anna Jones', value: 'Anna Jones' },
        ],
        originalPrompt: 'book with Anna tomorrow',
      },
    );

    expect(container.textContent).toContain('Which provider did you mean?');
    expect(container.textContent).not.toContain('Bob');

    const annaSmith = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Anna Smith',
    );
    act(() => {
      annaSmith!.click();
    });
    expect(submitted).toBe('book with Anna tomorrow. I meant Anna Smith.');
  });

  it('does not render free-text input for ambiguous entity without catalog options', () => {
    mountForm([{ field: 'employeeName', label: 'Provider', message: 'required' }], {
      employees: [],
      services: [],
    });
    expect(container.querySelector('input[type="text"]')).toBeNull();
    expect(container.textContent).toContain('Pick one of the options above');
  });

  it('shows Continue until every required field is answered for entity + slot (n99-1.3)', () => {
    mountForm(
      [{ field: 'date', label: 'Date', message: 'required' }],
      { employees: [], services: [] },
      {
        entityOptions: [
          { id: 'e1', field: 'employeeName', label: 'Anna Smith', value: 'Anna Smith' },
          { id: 'e2', field: 'employeeName', label: 'Anna Jones', value: 'Anna Jones' },
        ],
        originalPrompt: 'book with Anna',
      },
    );

    const annaSmith = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Anna Smith',
    );

    act(() => {
      annaSmith!.click();
    });

    expect(submitted).toBeNull();
    expect(container.querySelector('button[type="submit"]')).toBeTruthy();
    expect(container.textContent).toContain('Which provider did you mean?');
    expect(container.textContent).toContain('Date');
  });
});

describe('AiClarifyWizard integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders wizard shell with structured clarify form', () => {
    act(() => {
      root.render(
        <I18nProvider initialLocale="en">
          <AiClarifyWizard
            issues={[{ field: 'serviceName', label: 'Service', message: 'required' }]}
            options={{
              employees: [],
              services: [{ id: 's1', name: 'Massage', isActive: true }],
            }}
            onSubmit={() => undefined}
          />
        </I18nProvider>,
      );
    });

    expect(container.textContent).toContain('Complete missing details');
    expect(container.textContent).toContain('Massage');
  });
});
