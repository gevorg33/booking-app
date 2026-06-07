import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ResultsActionHistoryModal } from './results-action-history-modal';
import api from '@/lib/api';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  X: () => <span data-testid="close-icon" />,
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

const historyRow = {
  id: 'hist-1',
  action: 'ResultReleased',
  editedBy: { employeeId: 'emp-1', fullName: 'Alex Lab', role: null },
  changes: [{ propertyName: 'status', fromValue: 'Reviewed', toValue: 'Released' }],
  createdAt: '2026-06-07T12:00:00.000Z',
};

describe('ResultsActionHistoryModal integration', () => {
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
    mockedApi.get.mockResolvedValue({ data: { data: [historyRow] } });
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
            <ResultsActionHistoryModal
              open
              businessId="biz-1"
              scope="result"
              resultId="result-1"
              bookingId="booking-1"
              onClose={() => undefined}
            />
          </I18nProvider>
        </QueryClientProvider>,
      );
    });
  }

  it('renders English change-history action labels', async () => {
    render();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Result action history');
    expect(container.textContent).toContain('Result released');
    expect(container.textContent).toContain('Status');
    expect(container.textContent).toContain('Alex Lab');
  });

  it('renders Armenian change-history action labels', async () => {
    render('hy');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Արդյունքի գործողությունների պատմություն');
    expect(container.textContent).toContain('Արդյունքը ազատվել է');
    expect(container.textContent).toContain('Կարգավիճակ');
  });

  it('renders Russian change-history action labels', async () => {
    render('ru');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('История действий по результату');
    expect(container.textContent).toContain('Результат выпущен');
    expect(container.textContent).toContain('Статус');
  });
});
