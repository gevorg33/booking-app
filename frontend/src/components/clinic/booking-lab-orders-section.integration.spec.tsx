import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import api from '@/lib/api';
import { BookingLabOrdersSection } from './booking-lab-orders-section';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('BookingLabOrdersSection integration', () => {
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
    mockedApi.post.mockResolvedValue({ data: { data: {} } });
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
            <BookingLabOrdersSection businessId="biz-1" bookingId="booking-1" />
          </I18nProvider>
        </QueryClientProvider>,
      );
    });
  }

  it('renders catalog picker with tests and panels', async () => {
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
        return {
          data: {
            data: [
              {
                id: 'tp-1',
                title: 'Lipid panel',
                code: 'LIPID',
                isActive: true,
                items: [],
              },
            ],
          },
        };
      }
      return { data: { data: [] } };
    });

    render();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Add from catalog');
    expect(container.textContent).toContain('CBC');
    expect(container.textContent).toContain('Lipid panel');
  });

  it('places catalog order with selected items', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/bookings/booking-1/orders')) {
        return { data: { data: [] } };
      }
      if (url.includes('/catalog/test-types')) {
        return {
          data: {
            data: [
              { id: 'tt-1', title: 'CBC', code: 'CBC', isActive: true },
              { id: 'tt-2', title: 'BMP', code: 'BMP', isActive: true },
            ],
          },
        };
      }
      if (url.includes('/catalog/test-panels')) {
        return { data: { data: [] } };
      }
      return { data: { data: [] } };
    });

    render();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    await act(async () => {
      checkboxes[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      checkboxes[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain('2 selected');

    const placeButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Place catalog order'),
    );
    await act(async () => {
      placeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/businesses/biz-1/clinic-test-results/bookings/booking-1/orders',
      {
        items: [
          { type: 'test_type', testTypeId: 'tt-1', label: 'CBC' },
          { type: 'test_type', testTypeId: 'tt-2', label: 'BMP' },
        ],
      },
    );
  });

  it('creates service-linked order without catalog items', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/bookings/booking-1/orders')) {
        return { data: { data: [] } };
      }
      return { data: { data: [] } };
    });

    render();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const serviceButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Create from appointment service'),
    );
    await act(async () => {
      serviceButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/businesses/biz-1/clinic-test-results/bookings/booking-1/orders',
    );
  });

  it('renders Armenian booking orders tab copy', async () => {
    render('hy');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Լաբորատոր պատվերներ');
    expect(container.textContent).toContain('Ավելացնել կատալոգից');
  });

  it('renders Russian booking orders tab copy', async () => {
    render('ru');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Лабораторные заказы');
    expect(container.textContent).toContain('Создать из услуги записи');
  });

  it('shows empty catalog message when no active items', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/bookings/booking-1/orders')) {
        return { data: { data: [] } };
      }
      return { data: { data: [] } };
    });

    render();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('No active tests or panels in the catalog');
  });
});
