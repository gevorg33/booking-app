import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { PatientChartEmrShell } from './patient-chart-emr-shell';
import { PatientChartAlertsBanner } from './patient-chart-alerts-banner';
import { PatientChartOrdersTab } from './patient-chart-orders-tab';
import { PatientChartResultsTab } from './patient-chart-results-tab';
import { PatientChartProfileTab } from './patient-chart-profile-tab';
import api from '@/lib/api';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  AlertTriangle: () => <span data-testid="alert" />,
  X: () => <span data-testid="close" />,
  Save: () => <span data-testid="save" />,
  ShieldAlert: () => <span data-testid="shield" />,
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

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('patient chart integration', () => {
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
    mockedApi.put.mockReset();
    mockedApi.get.mockResolvedValue({ data: { data: [] } });
    mockedApi.post.mockResolvedValue({ data: { data: {} } });
    mockedApi.put.mockResolvedValue({ data: { data: {} } });
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

  it('renders EMR tab shell with profile tab selected', () => {
    const onTabChange = vi.fn();
    render(
      <PatientChartEmrShell activeTab="profile" onTabChange={onTabChange}>
        <div>Profile content</div>
      </PatientChartEmrShell>,
    );

    expect(container.textContent).toContain('Profile');
    expect(container.textContent).toContain('Profile content');

    const ordersTab = Array.from(container.querySelectorAll('[role="tab"]')).find((tab) =>
      tab.textContent?.includes('Orders'),
    );
    act(() => {
      ordersTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onTabChange).toHaveBeenCalledWith('orders');
  });

  it('renders patient chart alerts and dismisses an alert', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: {
          alerts: [
            {
              id: 'alert-1',
              type: 'TestResultReleased',
              sourceId: 'result-1',
              bookingId: 'booking-1',
              title: 'CBC released',
              messages: [{ title: 'CBC' }],
              chartTab: 'results',
              createdAt: '2026-06-07T12:00:00.000Z',
              testName: 'CBC',
              questionnaireTitle: null,
            },
          ],
          totalCount: 1,
        },
      },
    });

    render(
      <PatientChartAlertsBanner
        businessId="biz-1"
        customerId="cust-1"
        onOpenTab={vi.fn()}
      />,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('CBC');

    const dismissButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Dismiss'),
    );
    await act(async () => {
      dismissButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/businesses/biz-1/customers/cust-1/patient-chart/alerts/TestResultReleased/result-1/dismiss',
    );
  });

  it('renders orders tab empty state with catalog picker', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/patient-chart/orders')) {
        return { data: { data: [] } };
      }
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
                  employee: { name: 'Dr. Lee' },
                },
              ],
            },
          },
        };
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

    render(<PatientChartOrdersTab businessId="biz-1" customerId="cust-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/businesses/biz-1/customers/cust-1/patient-chart/orders',
    );
    expect(container.textContent).toContain('Order lab tests from catalog');
    expect(container.textContent).toContain('No lab orders linked to this patient yet.');
    expect(container.textContent).toContain('CBC');
  });

  it('places catalog order from patient chart orders tab', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/patient-chart/orders')) {
        return { data: { data: [] } };
      }
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

    render(<PatientChartOrdersTab businessId="biz-1" customerId="cust-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await act(async () => {
      checkbox?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

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
        items: [{ type: 'test_type', testTypeId: 'tt-1', label: 'CBC' }],
      },
    );
  });

  it('renders orders tab rows with status badges and push panel', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/patient-chart/orders')) {
        return {
          data: {
            data: [
              {
                id: 'order-1',
                status: 'AwaitingResults',
                displayNames: 'CBC',
                bookingId: 'booking-1',
                bookingStartTime: '2026-06-07T10:00:00.000Z',
                createdAt: '2026-06-07T09:00:00.000Z',
              },
            ],
          },
        };
      }
      if (url.includes('/booking-actions')) {
        return {
          data: {
            data: {
              orderId: 'order-1',
              displayNames: 'CBC',
              status: 'AwaitingResults',
              bookingId: 'booking-1',
              collectionBookingId: null,
              collectionServiceId: null,
              bookingRequestPushedAt: null,
              canPush: true,
              canStaffBook: false,
              customerId: 'cust-1',
              supportedCollectionServices: [{ id: 'svc-1', name: 'Lab draw' }],
            },
          },
        };
      }
      if (url.includes('/detail')) {
        return { data: { data: { appointments: [] } } };
      }
      if (url.includes('/catalog/')) {
        return { data: { data: [] } };
      }
      return { data: { data: [] } };
    });

    render(<PatientChartOrdersTab businessId="biz-1" customerId="cust-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('CBC');
    expect(container.textContent).toContain('Awaiting results');
    expect(container.textContent).toContain('Push to patient');
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/businesses/biz-1/clinic-test-results/orders/order-1/booking-actions',
    );
  });

  it('renders results tab empty state', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/patient-chart/results')) {
        return { data: { data: [] } };
      }
      return { data: { data: [] } };
    });

    render(<PatientChartResultsTab businessId="biz-1" customerId="cust-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/businesses/biz-1/customers/cust-1/patient-chart/results',
    );
    expect(container.textContent).toContain('No lab results linked to this patient yet.');
  });

  it('loads clinical profile form fields', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/detail')) {
        return {
          data: {
            data: {
              customer: {
                id: 'cust-1',
                name: 'Maria Lopez',
                email: 'maria@test.com',
                phone: null,
                segment: 'regular',
                createdAt: '2026-01-01T00:00:00.000Z',
              },
            },
          },
        };
      }
      if (url.includes('/clinical-profile')) {
        return {
          data: {
            data: {
              allergies: 'Peanuts',
              chronicProblems: 'Asthma',
              emergencyContactName: 'Alex',
              emergencyContactPhone: '+15551234567',
              emergencyContactRelationship: 'Spouse',
              bloodType: 'O+',
              referringExternalDoctorId: null,
            },
          },
        };
      }
      if (url.includes('/external-doctors')) {
        return { data: { data: { items: [], totalItems: 0, page: 1, pageSize: 100 } } };
      }
      return { data: { data: [] } };
    });

    render(<PatientChartProfileTab businessId="biz-1" customerId="cust-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Maria Lopez');
    expect((container.querySelector('textarea') as HTMLTextAreaElement | null)?.value).toBe(
      'Peanuts',
    );
  });
});
