import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMessages, translate } from '@/i18n';
import { I18nProvider } from '@/i18n/I18nProvider';
import { BookingIntakeSection } from './booking-intake-section';
import api from '@/lib/api';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  Plus: () => <span data-testid="plus" />,
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('BookingIntakeSection integration', () => {
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
    mockedApi.get.mockResolvedValue({ data: null });
    mockedApi.post.mockResolvedValue({ data: { data: { id: 'intake-1' } } });
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

  it('renders empty booking intake state with assign action', async () => {
    render(<BookingIntakeSection businessId="biz-1" bookingId="booking-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/businesses/biz-1/bookings/booking-1/pre-visit-intake',
    );
    expect(container.textContent).toContain('Pre-visit intake');

    const assignButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Assign pre-visit intake'),
    );
    expect(assignButton).toBeTruthy();
    await act(async () => {
      assignButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/businesses/biz-1/bookings/booking-1/pre-visit-intake',
      {},
    );
  });

  it('renders intake flow when booking already has intake', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/pre-visit-intake')) {
        return {
          data: {
            data: {
              id: 'intake-1',
              businessId: 'biz-1',
              bookingId: 'booking-1',
              customerId: 'cust-1',
              questionnaireId: 'q-1',
              status: 'assigned',
              questionnaire: {
                id: 'q-1',
                code: 'pre-visit-intake',
                title: 'Pre-visit intake',
                revision: 1,
              },
            },
          },
        };
      }
      if (url.includes('/pre-visit-intakes/intake-1')) {
        return {
          data: {
            data: {
              id: 'intake-1',
              businessId: 'biz-1',
              customerId: 'cust-1',
              bookingId: 'booking-1',
              questionnaireId: 'q-1',
              responseId: null,
              status: 'assigned',
              assignedByEmployeeId: null,
              completedAt: null,
              createdAt: '2026-06-07T09:00:00.000Z',
              updatedAt: '2026-06-07T09:00:00.000Z',
              questionnaire: {
                id: 'q-1',
                code: 'pre-visit-intake',
                title: 'Pre-visit intake',
                revision: 1,
              },
              introTitle: null,
              introBody: null,
              nextQuestion: null,
              answers: {},
              isCompleted: false,
            },
          },
        };
      }
      return { data: { data: null } };
    });

    render(<BookingIntakeSection businessId="biz-1" bookingId="booking-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Pre-visit intake');
    expect(container.textContent).toContain('Start intake');
    expect(mockedApi.get).toHaveBeenCalledWith('/businesses/biz-1/pre-visit-intakes/intake-1');
  });

  it('renders booking intake labels in Armenian (i18n-clinic-v2-8)', async () => {
    const hy = getMessages('hy');
    render(<BookingIntakeSection businessId="biz-1" bookingId="booking-1" />, 'hy');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain(translate(hy, 'clinic.intakeForm.bookingTitle'));
    expect(container.textContent).toContain(
      translate(hy, 'clinic.intakeForm.assignBookingIntake'),
    );
  });

  it('renders booking intake empty state in Russian (i18n-clinic-v2-8)', async () => {
    const ru = getMessages('ru');
    render(<BookingIntakeSection businessId="biz-1" bookingId="booking-1" />, 'ru');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain(translate(ru, 'clinic.intakeForm.bookingEmpty'));
  });
});
