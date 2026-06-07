import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ConsumerMyResultsList } from './ConsumerMyResultsList.js';

describe('ConsumerMyResultsList', () => {
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
    props: Partial<React.ComponentProps<typeof ConsumerMyResultsList>> = {},
  ) {
    act(() => {
      root.render(
        <ConsumerMyResultsList
          results={[]}
          loading={false}
          error={null}
          locale="en"
          {...props}
        />,
      );
    });
  }

  it('renders empty state', () => {
    render();
    expect(container.textContent).toContain('No released lab results yet');
  });

  it('renders empty state in Armenian when locale is hy', () => {
    render({ locale: 'hy' });
    expect(container.textContent).toContain('Ազատված լաբորատոր արդյունքներ');
  });

  it('renders released rows with badges', () => {
    render({
      results: [
        {
          id: 'result-1',
          orderId: 'order-1',
          bookingId: 'booking-1',
          status: 'Released',
          testName: 'CBC',
          measurementFlag: 'Normal',
          releasedAt: '2026-06-07T12:00:00.000Z',
          measurements: [],
        },
      ],
    });

    expect(container.textContent).toContain('CBC');
    expect(container.textContent).toContain('Released');
    expect(container.textContent).toContain('Normal');
  });

  it('renders loading state', () => {
    render({ loading: true });
    expect(container.querySelector('ion-spinner')).toBeTruthy();
  });

  it('renders result without release timestamp', () => {
    render({
      results: [
        {
          id: 'result-2',
          orderId: null,
          bookingId: null,
          status: 'Released',
          testName: 'Lipid panel',
          measurementFlag: null,
          releasedAt: null,
          measurements: [],
        },
      ],
    });

    expect(container.textContent).toContain('Lipid panel');
    expect(container.textContent).toContain('Released');
  });

  it('omits released badge for non-released rows', () => {
    render({
      results: [
        {
          id: 'result-3',
          orderId: null,
          bookingId: null,
          status: 'Reviewed',
          testName: 'Pending result',
          measurementFlag: 'Abnormal',
          releasedAt: null,
          measurements: [],
        },
      ],
    });

    expect(container.textContent).toContain('Pending result');
    expect(container.textContent).toContain('Abnormal');
    expect(container.textContent).not.toContain('Released');
  });

  it('renders error state', () => {
    render({ error: 'Failed to load' });
    expect(container.textContent).toContain('Failed to load');
  });

  it('renders measurement rows with reference range and low flag', () => {
    render({
      results: [
        {
          id: 'result-4',
          orderId: 'order-1',
          bookingId: 'booking-1',
          status: 'Released',
          testName: 'Thyroid panel',
          measurementFlag: 'Low',
          releasedAt: '2026-06-07T12:00:00.000Z',
          measurements: [
            {
              id: 'm-1',
              name: 'TSH',
              value: '0.2',
              unit: 'mIU/L',
              referenceRange: '0.4-4.0',
              measurementFlag: 'Low',
            },
          ],
        },
      ],
    });

    expect(container.textContent).toContain('TSH');
    expect(container.textContent).toContain('0.2 mIU/L');
    expect(container.textContent).toContain('0.4-4.0');
    expect(container.textContent).toContain('Low');
  });

  it('renders em dash when measurement flag is missing', () => {
    render({
      results: [
        {
          id: 'result-5',
          orderId: 'order-1',
          bookingId: 'booking-1',
          status: 'Released',
          testName: 'Basic metabolic panel',
          measurementFlag: null,
          releasedAt: '2026-06-07T12:00:00.000Z',
          measurements: [
            {
              id: 'm-2',
              name: 'Glucose',
              value: '95',
              unit: 'mg/dL',
              referenceRange: null,
              measurementFlag: null,
            },
          ],
        },
      ],
    });

    expect(container.textContent).toContain('Glucose');
    expect(container.textContent).toContain('—');
  });

  it('renders unnamed results without a released date', () => {
    render({
      results: [
        {
          id: 'result-6',
          orderId: null,
          bookingId: null,
          status: 'Released',
          testName: null,
          measurementFlag: null,
          releasedAt: null,
          measurements: [],
        },
      ],
    });

    expect(container.textContent).toContain('Lab result');
  });
});
