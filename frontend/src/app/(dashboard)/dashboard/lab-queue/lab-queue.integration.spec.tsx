import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import LabQueuePage from './page';
import api from '@/lib/api';
import { LAB_QUEUE_AWAITING_PATIENT_BOOKING_FILTER } from '@/lib/clinic-lab-queue';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  FlaskConical: () => <span data-testid="flask" />,
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/store', () => ({
  useAuthStore: (selector?: (state: {
    business: { id: string; settings: { businessType: string } };
    token: string;
  }) => unknown) => {
    const state = {
      business: {
        id: 'biz-1',
        settings: { businessType: 'clinic' },
      },
      token: 'test-token',
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('LabQueuePage integration', () => {
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
    mockedApi.get.mockResolvedValue({ data: { data: [] } });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    queryClient.clear();
  });

  function render(locale: 'en' | 'hy' | 'ru' = 'en') {
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale={locale}>
            <LabQueuePage />
          </I18nProvider>
        </QueryClientProvider>,
      );
    });
  }

  it('renders lab queue empty state for clinic businesses', async () => {
    render();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Lab queue');
    expect(mockedApi.get).toHaveBeenCalledWith('/businesses/biz-1/clinic-test-results/orders', {
      params: {},
    });
    expect(container.textContent).toContain('No lab orders match the current filters.');
  });

  it('renders lab queue rows with status badges', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'order-1',
            status: 'AwaitingResults',
            displayNames: 'CBC',
            customerName: 'Maria Lopez',
            bookingId: 'booking-1',
            visitBookingId: 'booking-1',
            collectionBookingId: null,
            bookingStartTime: '2026-06-07T10:00:00.000Z',
            visitBookingStartTime: '2026-06-07T10:00:00.000Z',
            collectionBookingStartTime: null,
            bookingRequestPushedAt: null,
            awaitingPatientBooking: false,
            department: 'Lab',
            employeeName: 'Dr. Kim',
          },
        ],
      },
    });

    render();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('CBC');
    expect(container.textContent).toContain('Maria Lopez');
    expect(container.textContent).toContain('Awaiting results');
    expect(container.textContent).toContain('Dr. Kim');
  });

  it('shows awaiting patient booking badge, push date, and collection appointment', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'order-awaiting',
            status: 'NotCollected',
            displayNames: 'CBC',
            customerName: 'Jane Doe',
            bookingId: 'visit-1',
            visitBookingId: 'visit-1',
            collectionBookingId: null,
            bookingStartTime: '2026-06-20T09:00:00.000Z',
            visitBookingStartTime: '2026-06-20T09:00:00.000Z',
            collectionBookingStartTime: null,
            bookingRequestPushedAt: '2026-06-22T10:00:00.000Z',
            awaitingPatientBooking: true,
            department: 'Laboratory',
            employeeName: 'Dr Smith',
          },
          {
            id: 'order-linked',
            status: 'NotCollected',
            displayNames: 'Lipid panel',
            customerName: 'Alex Kim',
            bookingId: 'collection-1',
            visitBookingId: 'visit-2',
            collectionBookingId: 'collection-1',
            bookingStartTime: '2026-06-25T14:00:00.000Z',
            visitBookingStartTime: '2026-06-20T09:00:00.000Z',
            collectionBookingStartTime: '2026-06-25T14:00:00.000Z',
            bookingRequestPushedAt: '2026-06-22T10:00:00.000Z',
            awaitingPatientBooking: false,
            department: 'Laboratory',
            employeeName: 'Lab Tech',
          },
        ],
      },
    });

    render();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Awaiting patient booking');
    expect(container.textContent).toContain('Push sent');
    expect(container.textContent).toContain('Collection');
    expect(container.querySelector('a[href="/dashboard/appointments?bookingId=visit-1"]')).not.toBeNull();
    expect(container.querySelector('a[href="/dashboard/appointments?bookingId=collection-1"]')).not.toBeNull();
  });

  it('renders Armenian lab queue copy', async () => {
    render('hy');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Լաբորատոր հերթ');
    expect(container.textContent).toContain('Ընթացիկ ֆիլտրերով պատվերներ չկան');
  });

  it('renders Russian lab queue status badge copy', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'order-1',
            status: 'NotCollected',
            displayNames: 'CBC',
            customerName: 'Иван',
            bookingId: 'booking-1',
            visitBookingId: 'booking-1',
            collectionBookingId: null,
            bookingStartTime: '2026-06-07T10:00:00.000Z',
            visitBookingStartTime: '2026-06-07T10:00:00.000Z',
            collectionBookingStartTime: null,
            bookingRequestPushedAt: null,
            awaitingPatientBooking: true,
            department: 'Lab',
            employeeName: 'Dr. Kim',
          },
        ],
      },
    });

    render('ru');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Ожидает записи пациента');
    expect(container.textContent).toContain('Не собран');
  });

  it('requests awaiting patient booking filter from status dropdown', async () => {
    render();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).not.toBeNull();

    await act(async () => {
      select.value = LAB_QUEUE_AWAITING_PATIENT_BOOKING_FILTER;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/businesses/biz-1/clinic-test-results/orders', {
      params: { awaitingPatientBooking: 'true' },
    });
  });
});
