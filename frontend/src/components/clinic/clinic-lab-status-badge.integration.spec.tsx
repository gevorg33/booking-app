import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ClinicLabStatusBadge } from './clinic-lab-status-badge';
import { BookingLabResultsSection } from './booking-lab-results-section';
import { BookingLabOrdersSection } from './booking-lab-orders-section';

import api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('clinic lab status badges', () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
    mockedApi.get.mockResolvedValue({ data: { data: [] } });
    mockedApi.post.mockResolvedValue({ data: { data: { id: 'order-1' } } });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    queryClient.clear();
  });

  function render(ui: React.ReactNode, locale: 'en' | 'hy' | 'ru' = 'en') {
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale={locale}>{ui}</I18nProvider>
        </QueryClientProvider>,
      );
    });
  }

  it('renders localized order and measurement badges', () => {
    render(
      <div>
        <ClinicLabStatusBadge kind="order" status="AwaitingResults" />
        <ClinicLabStatusBadge kind="measurement" status="Abnormal" />
      </div>,
    );

    expect(container.textContent).toContain('Awaiting results');
    expect(container.textContent).toContain('Abnormal');
    expect(container.querySelector('[style*="background"]')).toBeTruthy();
  });

  it('renders Armenian result badge copy', () => {
    render(<ClinicLabStatusBadge kind="result" status="Released" />, 'hy');
    expect(container.textContent).toContain('Հրապարակված');
  });

  it('renders Russian order badge copy', () => {
    render(<ClinicLabStatusBadge kind="order" status="Cancelled" />, 'ru');
    expect(container.textContent).toContain('Отменён');
  });

  it('renders booking lab results empty state', () => {
    render(
      <BookingLabResultsSection
        businessId="biz-1"
        bookingId="booking-1"
        results={[]}
      />,
    );

    expect(container.textContent).toContain('Lab results');
    expect(container.textContent).toContain(
      'No lab orders linked to this appointment yet.',
    );
  });

  it('renders result rows with status badges', () => {
    render(
      <BookingLabResultsSection
        businessId="biz-1"
        bookingId="booking-1"
        results={[
          {
            id: 'r1',
            testName: 'CBC',
            orderStatus: 'AwaitingResults',
            resultStatus: 'Pending',
            specimenStatus: 'Collected',
            measurementFlag: 'Normal',
          },
        ]}
      />,
    );

    expect(container.textContent).toContain('CBC');
    expect(container.textContent).toContain('Awaiting results');
    expect(container.textContent).toContain('Pending');
    expect(container.textContent).toContain('Collected');
    expect(container.textContent).toContain('Normal');
  });

  it('fetches booking lab summaries when results prop omitted', async () => {
    render(
      <BookingLabResultsSection businessId="biz-1" bookingId="booking-1" />,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain('Lab results');
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/businesses/biz-1/clinic-test-results/bookings/booking-1/summaries',
    );
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/businesses/biz-1/clinic-test-results/bookings/booking-1/results',
    );
  });

  it('renders result workflow actions and history controls', () => {
    render(
      <BookingLabResultsSection
        businessId="biz-1"
        bookingId="booking-1"
        results={[
          {
            id: 'order-1',
            testName: 'CBC',
            orderStatus: 'AwaitingResults',
            resultStatus: 'Completed',
            specimenStatus: 'Collected',
          },
        ]}
      />,
    );

    expect(container.textContent).toContain('Audit history');
    expect(container.textContent).not.toContain('History');
  });

  it('merges result records for transitions and per-result history', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/summaries')) {
        return {
          data: {
            data: [
              {
                id: 'order-1',
                testName: 'CBC',
                orderStatus: 'AwaitingResults',
                resultStatus: 'Pending',
                specimenStatus: 'Collected',
              },
            ],
          },
        };
      }
      if (url.endsWith('/results')) {
        return {
          data: {
            data: [
              {
                id: 'result-1',
                orderId: 'order-1',
                status: 'Completed',
                testName: 'CBC',
                measurementFlag: 'Normal',
                completedAt: '2026-06-07T12:00:00.000Z',
                reviewedAt: null,
                releasedAt: null,
              },
            ],
          },
        };
      }
      return { data: { data: [] } };
    });

    render(
      <BookingLabResultsSection businessId="biz-1" bookingId="booking-1" />,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Mark reviewed');
    expect(container.textContent).toContain('History');

    const historyButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('History'),
    );
    await act(async () => {
      historyButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/businesses/biz-1/clinic-test-results/results/result-1/change-history',
    );

    const reviewButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Mark reviewed'),
    );
    await act(async () => {
      reviewButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/businesses/biz-1/clinic-test-results/results/result-1/transition',
      { toStatus: 'Reviewed' },
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  });

  it('renders booking lab orders empty state', async () => {
    mockedApi.get.mockResolvedValue({ data: { data: [] } });
    render(
      <BookingLabOrdersSection businessId="biz-1" bookingId="booking-1" />,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Lab orders');
    expect(container.textContent).toContain('No lab orders for this appointment yet.');
  });

  it('renders lab order rows with status badges', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'order-1',
            status: 'AwaitingResults',
            displayNames: 'CBC',
            testTypeId: 'type-1',
            createdAt: '2026-06-07T10:00:00.000Z',
          },
        ],
      },
    });

    render(
      <BookingLabOrdersSection businessId="biz-1" bookingId="booking-1" />,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('CBC');
    expect(container.textContent).toContain('Awaiting results');
  });

  it('renders unnamed order fallback label', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'order-2',
            status: 'NotCollected',
            displayNames: null,
            testTypeId: null,
            createdAt: '2026-06-07T10:00:00.000Z',
          },
        ],
      },
    });

    render(
      <BookingLabOrdersSection businessId="biz-1" bookingId="booking-1" />,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain('Lab order');
  });

  it('unwraps doubly nested order list payloads', async () => {
    mockedApi.get.mockResolvedValue({
      data: { data: { data: [] } },
    });

    render(
      <BookingLabOrdersSection businessId="biz-1" bookingId="booking-1" />,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('No lab orders for this appointment yet.');
  });

  it('opens booking audit history modal with timeline rows', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/change-history')) {
        return {
          data: {
            data: [
              {
                id: 'hist-1',
                entityType: 'result',
                entityId: 'result-1',
                action: 'ResultReleased',
                date: '2026-06-07T15:00:00.000Z',
                changes: [{ propertyName: 'status', from: 'Reviewed', to: 'Released' }],
                editedBy: { employeeId: 'emp-1', fullName: 'Alex Lab', role: null },
                note: null,
              },
            ],
          },
        };
      }
      return { data: { data: [] } };
    });

    render(
      <BookingLabResultsSection businessId="biz-1" bookingId="booking-1" results={[]} />,
    );

    const auditButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Audit history'),
    );
    await act(async () => {
      auditButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/businesses/biz-1/clinic-test-results/bookings/booking-1/change-history',
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain('Lab audit history');
    expect(container.textContent).toContain('Alex Lab');
    expect(container.textContent).toContain('Result released');

    const closeButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent === 'Close',
    );
    await act(async () => {
      closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).not.toContain('Lab audit history');
  });

  it('renders catalog picker on booking lab orders section', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/bookings/booking-1/orders')) {
        return { data: { data: [] } };
      }
      if (url.includes('/catalog/test-types')) {
        return {
          data: {
            data: [{ id: 'tt-1', title: 'CBC', code: 'CBC', isActive: true }],
          },
        };
      }
      if (url.includes('/catalog/test-panels')) {
        return { data: { data: [] } };
      }
      return { data: { data: [] } };
    });

    render(
      <BookingLabOrdersSection businessId="biz-1" bookingId="booking-1" />,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Add from catalog');
    expect(container.textContent).toContain('Place catalog order');
    expect(container.textContent).toContain('Create from appointment service');
  });
});
