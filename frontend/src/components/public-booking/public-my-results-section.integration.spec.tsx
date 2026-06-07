import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { PublicMyResultsSection } from './public-my-results-section';

describe('PublicMyResultsSection', () => {
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
    props: Partial<React.ComponentProps<typeof PublicMyResultsSection>> = {},
    locale: 'en' | 'hy' | 'ru' = 'en',
  ) {
    act(() => {
      root.render(
        <I18nProvider initialLocale={locale}>
          <PublicMyResultsSection
            results={[]}
            loading={false}
            error={null}
            locale={locale}
            {...props}
          />
        </I18nProvider>,
      );
    });
  }

  it('renders empty state', () => {
    render();
    expect(container.textContent).toContain('No released lab results yet');
  });

  it('renders released result rows with badges', () => {
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
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders error state', () => {
    render({ loading: false, error: 'Failed to load' });
    expect(container.textContent).toContain('Failed to load');
  });

  it('renders Armenian my results empty state', () => {
    render({}, 'hy');
    expect(container.textContent).toContain('Ազատված լաբորատոր արդյունքներ դեռ չկան');
  });

  it('renders measurement rows with reference range and abnormal flags', () => {
    render({
      results: [
        {
          id: 'result-1',
          orderId: 'order-1',
          bookingId: 'booking-1',
          status: 'Released',
          testName: 'Metabolic panel',
          measurementFlag: 'High',
          releasedAt: '2026-06-07T12:00:00.000Z',
          measurements: [
            {
              id: 'm-1',
              name: 'Glucose',
              value: '120',
              unit: 'mg/dL',
              referenceRange: '70-100',
              measurementFlag: 'High',
            },
            {
              id: 'm-2',
              name: 'TSH',
              value: '2.1',
              unit: 'mIU/L',
              referenceRange: '0.4-4.0',
              measurementFlag: 'Normal',
            },
          ],
        },
      ],
    });

    expect(container.textContent).toContain('Glucose');
    expect(container.textContent).toContain('120 mg/dL');
    expect(container.textContent).toContain('70-100');
    expect(container.textContent).toContain('High');
    expect(container.textContent).toContain('Normal');
  });

  it('renders Russian released result badges', () => {
    render(
      {
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
      },
      'ru',
    );

    expect(container.textContent).toContain('Выпущен');
    expect(container.textContent).toContain('Норма');
  });
});
