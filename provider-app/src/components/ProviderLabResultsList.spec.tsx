import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderLabResultsList } from './ProviderLabResultsList';

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        'provider.labResultsEmpty':
          'No lab results for your assigned patients in this period.',
        'clinic.labState.resultsTab.unnamedResult': 'Lab result',
        'provider.labResultsTapBooking': 'Tap to open appointment',
        'common.provider': 'Provider',
      };
      if (labels[key]) return labels[key];
      if (key.startsWith('clinic.labState.')) {
        return key.split('.').pop() ?? key;
      }
      return key;
    },
  }),
}));

vi.mock('../lib/date-format', () => ({
  formatDateDisplay: (value: string) => value.slice(0, 10),
  formatTimeDisplay: (value: string) => value.slice(11, 16),
}));

describe('ProviderLabResultsList', () => {
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

  function render(
    props: Partial<React.ComponentProps<typeof ProviderLabResultsList>> = {},
  ) {
    act(() => {
      root.render(
        <ProviderLabResultsList
          results={[]}
          loading={false}
          showEmployeeName={false}
          onSelectBooking={() => undefined}
          {...props}
        />,
      );
    });
  }

  it('renders empty state', () => {
    render();
    expect(container.textContent).toContain(
      'No lab results for your assigned patients in this period.',
    );
  });

  it('renders result rows with status badges', () => {
    render({
      results: [
        {
          id: 'result-1',
          status: 'Pending',
          testName: 'CBC',
          orderId: 'order-1',
          orderStatus: 'AwaitingResults',
          bookingId: 'booking-1',
          customerName: 'Jane Doe',
          bookingStartTime: '2026-06-07T10:00:00.000Z',
          employeeName: 'Dr Smith',
          department: 'Hematology',
          measurementFlag: 'Normal',
          completedAt: null,
          reviewedAt: null,
          releasedAt: null,
          createdAt: '2026-06-07T09:00:00.000Z',
        },
      ],
    });

    expect(container.textContent).toContain('CBC');
    expect(container.textContent).toContain('Jane Doe');
    expect(container.textContent).toContain('Pending');
    expect(container.textContent).toContain('AwaitingResults');
    expect(container.textContent).toContain('Normal');
  });

  it('shows employee name in team view', () => {
    render({
      showEmployeeName: true,
      results: [
        {
          id: 'result-2',
          status: 'Released',
          testName: null,
          orderId: null,
          orderStatus: null,
          bookingId: null,
          customerName: 'Alex',
          bookingStartTime: null,
          employeeName: 'Dr Lee',
          department: null,
          measurementFlag: null,
          completedAt: null,
          reviewedAt: null,
          releasedAt: null,
          createdAt: '2026-06-07T09:00:00.000Z',
        },
      ],
    });

    expect(container.textContent).toContain('Lab result');
    expect(container.textContent).toContain('Provider: Dr Lee');
  });

  it('renders loading state', () => {
    render({ loading: true });
    expect(container.querySelector('ion-spinner')).toBeTruthy();
  });

  it('opens booking detail when a result card is tapped', () => {
    const onSelectBooking = vi.fn();
    render({
      onSelectBooking,
      results: [
        {
          id: 'result-3',
          status: 'Completed',
          testName: 'Lipid panel',
          orderId: 'order-3',
          orderStatus: 'Completed',
          bookingId: 'booking-3',
          customerName: 'Sam',
          bookingStartTime: '2026-06-07T10:00:00.000Z',
          employeeName: null,
          department: null,
          measurementFlag: null,
          completedAt: null,
          reviewedAt: null,
          releasedAt: null,
          createdAt: '2026-06-07T09:00:00.000Z',
        },
      ],
    });

    const card = container.querySelector('ion-card');
    expect(card).toBeTruthy();
    act(() => {
      card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onSelectBooking).toHaveBeenCalledWith('booking-3');
  });
});
