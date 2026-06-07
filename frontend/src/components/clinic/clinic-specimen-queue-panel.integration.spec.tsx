import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ClinicSpecimenQueuePanel } from './clinic-specimen-queue-panel';
import api from '@/lib/api';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  Printer: () => <span data-testid="printer" />,
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
  useAuthStore: () => ({
    business: {
      id: 'biz-1',
      name: 'City Clinic',
      settings: { businessType: 'clinic' },
    },
  }),
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

const trackingRow = {
  id: 'spec-1',
  status: 'InTransit',
  specimenIdentifier: 'SP-1',
  orderId: 'order-1',
  orderDisplayNames: 'CBC',
  bookingId: 'booking-1',
  customerName: 'Maria Lopez',
  bookingStartTime: '2026-06-07T10:00:00.000Z',
  employeeName: 'Dr. Kim',
  department: 'Laboratory',
  collectedAt: '2026-06-07T09:30:00.000Z',
  storageLocationName: 'Fridge A',
  transportFolderCode: 'FOLDER-12',
  createdAt: '2026-06-07T09:00:00.000Z',
};

describe('ClinicSpecimenQueuePanel integration', () => {
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
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    queryClient.clear();
  });

  function render(view: 'collection' | 'tracking', locale: 'en' | 'hy' | 'ru' = 'en') {
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale={locale}>
            <ClinicSpecimenQueuePanel view={view} />
          </I18nProvider>
        </QueryClientProvider>,
      );
    });
  }

  it('renders collection empty state in English', async () => {
    render('collection');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Specimen collection');
    expect(container.textContent).toContain('No specimens need collection');
  });

  it('renders Armenian collection tab labels', async () => {
    render('collection', 'hy');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Նմուշների հավաքում');
    expect(container.textContent).toContain('Հավաքում');
    expect(container.textContent).toContain('Հետևում');
  });

  it('renders Russian tracking view with storage and transport labels', async () => {
    mockedApi.get.mockResolvedValue({ data: { data: [trackingRow] } });

    render('tracking', 'ru');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Отслеживание образцов');
    expect(container.textContent).toContain('Хранение');
    expect(container.textContent).toContain('Fridge A');
    expect(container.textContent).toContain('Транспортная папка');
    expect(container.textContent).toContain('FOLDER-12');
    expect(container.textContent).toContain('В пути');
    expect(container.textContent).toContain('Получен в лаб.');
  });
});
