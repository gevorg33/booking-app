import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import api from '@/lib/api';
import type { ClinicLabOrderBookingAction } from '@/lib/clinic-lab-booking-request';
import { ClinicLabOrderStaffBookControls } from './booking-lab-order-staff-book-controls';

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
  collectionServiceId: 'svc-1',
  bookingRequestPushedAt: null,
  canPush: false,
  canStaffBook: true,
  supportedCollectionServices: [{ id: 'svc-1', name: 'Lab blood draw' }],
};

describe('ClinicLabOrderStaffBookControls integration', () => {
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
    mockedApi.get.mockResolvedValue({ data: { slots: [] } });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    queryClient.clear();
  });

  function render(actions: ClinicLabOrderBookingAction = baseActions) {
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale="en">
            <ClinicLabOrderStaffBookControls
              businessId="biz-1"
              orderId="order-1"
              actions={actions}
            />
          </I18nProvider>
        </QueryClientProvider>,
      );
    });
  }

  it('returns null when staff booking is not allowed', () => {
    render({ ...baseActions, canStaffBook: false });
    expect(container.textContent?.trim()).toBe('');
  });

  it('returns null when no collection services are configured', () => {
    render({ ...baseActions, supportedCollectionServices: [] });
    expect(container.textContent?.trim()).toBe('');
  });

  it('renders slots without provider names and switches collection services', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/bookings/availability')) {
        return {
          data: {
            slots: [
              {
                slotId: null,
                startTime: '2026-06-10T11:00:00.000Z',
                endTime: '2026-06-10T11:15:00.000Z',
                employeeId: 'emp-3',
              },
            ],
          },
        };
      }
      return { data: { slots: [] } };
    });

    render({
      ...baseActions,
      supportedCollectionServices: [
        { id: 'svc-1', name: 'Morning draw' },
        { id: 'svc-2', name: 'Walk-in draw' },
      ],
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).not.toContain('undefined');

    const select = container.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      select.value = 'svc-2';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/businesses/biz-1/bookings/availability',
      expect.objectContaining({
        params: expect.objectContaining({ serviceId: 'svc-2' }),
      }),
    );
  });
});
