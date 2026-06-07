import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import api from '@/lib/api';
import type { ClinicLabOrderBookingAction } from '@/lib/clinic-lab-booking-request';
import {
  BookingLabOrderPushPanel,
  ClinicLabOrderPushControls,
} from './booking-lab-order-push-panel';

vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <input
      data-testid="date-picker"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

const baseActions: ClinicLabOrderBookingAction = {
  orderId: 'order-1',
  displayNames: 'CBC',
  status: 'NotCollected',
  customerId: 'cust-1',
  bookingId: 'booking-1',
  collectionBookingId: null,
  collectionServiceId: null,
  bookingRequestPushedAt: null,
  canPush: true,
  canStaffBook: false,
  supportedCollectionServices: [{ id: 'svc-1', name: 'Lab blood draw' }],
};

describe('BookingLabOrderPushPanel integration', () => {
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
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    queryClient.clear();
  });

  function render(ui: React.ReactNode) {
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale="en">{ui}</I18nProvider>
        </QueryClientProvider>,
      );
    });
  }

  it('renders push controls when booking actions allow push', async () => {
    mockedApi.get.mockResolvedValue({
      data: { data: baseActions },
    });

    render(<BookingLabOrderPushPanel businessId="biz-1" orderId="order-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/businesses/biz-1/clinic-test-results/orders/order-1/booking-actions',
    );
    expect(container.textContent).toContain('Push to patient');

    const button = Array.from(container.querySelectorAll('button')).find((el) =>
      el.textContent?.includes('Push to patient'),
    );
    mockedApi.post.mockResolvedValue({
      data: {
        data: {
          ...baseActions,
          bookingRequestPushedAt: '2026-06-22T10:00:00.000Z',
        },
      },
    });

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/businesses/biz-1/clinic-test-results/orders/order-1/push-to-patient',
      { collectionServiceId: 'svc-1' },
    );
  });

  it('renders staff book controls and books a collection slot', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/booking-actions')) {
        return {
          data: {
            data: {
              ...baseActions,
              canPush: false,
              canStaffBook: true,
            },
          },
        };
      }
      if (url.includes('/bookings/availability')) {
        return {
          data: {
            slots: [
              {
                slotId: 'slot-1',
                startTime: '2026-06-10T09:00:00.000Z',
                endTime: '2026-06-10T09:15:00.000Z',
                employeeId: 'emp-2',
                employeeName: 'Alex Lab',
              },
            ],
          },
        };
      }
      return { data: { data: [] } };
    });

    render(<BookingLabOrderPushPanel businessId="biz-1" orderId="order-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Book collection for patient');
    expect(container.textContent).toContain('Alex Lab');

    const slotButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Alex Lab'),
    );
    await act(async () => {
      slotButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    mockedApi.post.mockResolvedValue({
      data: {
        data: {
          ...baseActions,
          canStaffBook: false,
          collectionBookingId: 'collection-booking-1',
        },
      },
    });

    const bookButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Book collection'),
    );
    await act(async () => {
      bookButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/businesses/biz-1/clinic-test-results/orders/order-1/book-collection',
      {
        collectionServiceId: 'svc-1',
        employeeId: 'emp-2',
        startTime: '2026-06-10T09:00:00.000Z',
      },
    );
  });

  it('shows no slots message in staff book controls', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/booking-actions')) {
        return {
          data: {
            data: {
              ...baseActions,
              canPush: false,
              canStaffBook: true,
            },
          },
        };
      }
      if (url.includes('/bookings/availability')) {
        return { data: { slots: [] } };
      }
      return { data: { data: [] } };
    });

    render(<BookingLabOrderPushPanel businessId="biz-1" orderId="order-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('No lab collection slots on this date.');
  });

  it('shows collection service picker in staff book controls', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/booking-actions')) {
        return {
          data: {
            data: {
              ...baseActions,
              canPush: false,
              canStaffBook: true,
              supportedCollectionServices: [
                { id: 'svc-1', name: 'Morning draw' },
                { id: 'svc-2', name: 'Walk-in draw' },
              ],
            },
          },
        };
      }
      if (url.includes('/bookings/availability')) {
        return { data: { slots: [] } };
      }
      return { data: { data: [] } };
    });

    render(<BookingLabOrderPushPanel businessId="biz-1" orderId="order-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Morning draw');
    expect(container.textContent).toContain('Walk-in draw');
  });

  it('shows pushed state alongside staff book controls', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/booking-actions')) {
        return {
          data: {
            data: {
              ...baseActions,
              canPush: false,
              canStaffBook: true,
              bookingRequestPushedAt: '2026-06-22T10:00:00.000Z',
            },
          },
        };
      }
      if (url.includes('/bookings/availability')) {
        return { data: { slots: [] } };
      }
      return { data: { data: [] } };
    });

    render(<BookingLabOrderPushPanel businessId="biz-1" orderId="order-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Booking request sent');
    expect(container.textContent).toContain('Book collection for patient');
    expect(container.textContent).not.toContain('Push to patient');
  });

  it('shows collection booked state on the panel', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: {
          ...baseActions,
          collectionBookingId: 'collection-booking-1',
        },
      },
    });

    render(<BookingLabOrderPushPanel businessId="biz-1" orderId="order-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Collection appointment booked');
    expect(container.textContent).not.toContain('Push to patient');
  });

  it('shows collection service picker for multiple lab services', () => {
    render(
      <ClinicLabOrderPushControls
        actions={{
          ...baseActions,
          supportedCollectionServices: [
            { id: 'svc-1', name: 'Morning draw' },
            { id: 'svc-2', name: 'Walk-in draw' },
          ],
        }}
        collectionServiceId="svc-1"
        onCollectionServiceIdChange={() => undefined}
        onPush={() => undefined}
        pushing={false}
        pushLabel="Push to patient"
        selectLabel="Collection service"
        t={(key) => key}
      />,
    );

    expect(container.querySelector('select')).toBeTruthy();
    expect(container.textContent).toContain('Morning draw');
    expect(container.textContent).toContain('Walk-in draw');
  });

  it('hides push controls when push is not allowed', () => {
    render(
      <ClinicLabOrderPushControls
        actions={{
          ...baseActions,
          canPush: false,
          supportedCollectionServices: [],
        }}
        collectionServiceId=""
        onCollectionServiceIdChange={() => undefined}
        onPush={() => undefined}
        pushing={false}
        pushLabel="Push to patient"
        selectLabel="Collection service"
        t={(key) => key}
      />,
    );

    expect(container.textContent?.trim()).toBe('');
  });
});
