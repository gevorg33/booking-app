import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import api from '@/lib/api';
import { PatientChartCatalogOrderPanel } from './patient-chart-catalog-order-panel';

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

describe('PatientChartCatalogOrderPanel integration', () => {
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

  function render() {
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale="en">
            <PatientChartCatalogOrderPanel businessId="biz-1" customerId="cust-1" />
          </I18nProvider>
        </QueryClientProvider>,
      );
    });
  }

  it('shows message when patient has no confirmed visits', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/detail')) {
        return {
          data: {
            data: {
              appointments: [
                {
                  id: 'booking-1',
                  startTime: '2026-06-07T10:00:00.000Z',
                  endTime: '2026-06-07T10:30:00.000Z',
                  status: 'completed',
                  service: { name: 'Consultation' },
                },
              ],
            },
          },
        };
      }
      return { data: { data: [] } };
    });

    render();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain(
      'No confirmed visits for this patient',
    );
  });

  it('shows empty catalog message when no active tests or panels', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/detail')) {
        return {
          data: {
            data: {
              appointments: [
                {
                  id: 'booking-1',
                  startTime: '2026-06-07T10:00:00.000Z',
                  endTime: '2026-06-07T10:30:00.000Z',
                  status: 'confirmed',
                  service: { name: 'Consultation' },
                },
              ],
            },
          },
        };
      }
      return { data: { data: [] } };
    });

    render();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('No active tests or panels in the catalog');
  });

  it('places catalog panel order', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/detail')) {
        return {
          data: {
            data: {
              appointments: [
                {
                  id: 'booking-1',
                  startTime: '2026-06-07T10:00:00.000Z',
                  endTime: '2026-06-07T10:30:00.000Z',
                  status: 'confirmed',
                  service: { name: 'Consultation' },
                },
              ],
            },
          },
        };
      }
      if (url.includes('/catalog/test-types')) {
        return { data: { data: [] } };
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

    expect(container.textContent).toContain('Panels');
    expect(container.textContent).toContain('Lipid panel');

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await act(async () => {
      checkbox?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain('1 selected');

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
        items: [{ type: 'test_panel', testPanelId: 'tp-1', label: 'Lipid panel' }],
      },
    );
  });
});
