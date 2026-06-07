import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMessages, translate } from '@/i18n';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ExternalDoctorsTab } from './external-doctors-tab';
import { ClinicQuestionnairesTab } from './clinic-questionnaires-tab';
import api from '@/lib/api';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  Plus: () => <span data-testid="plus" />,
  Pencil: () => <span data-testid="pencil" />,
  Stethoscope: () => <span data-testid="stethoscope" />,
  ClipboardList: () => <span data-testid="clipboard" />,
  Send: () => <span data-testid="send" />,
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('clinic admin tabs integration', () => {
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
    mockedApi.get.mockResolvedValue({ data: { data: { items: [], totalItems: 0, page: 1, pageSize: 50 } } });
    mockedApi.post.mockResolvedValue({ data: { data: { id: 'new-1' } } });
    mockedApi.put.mockResolvedValue({ data: { data: { id: 'q-1' } } });
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

  it('renders external doctors empty state and opens create form', async () => {
    render(<ExternalDoctorsTab businessId="biz-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/businesses/biz-1/external-doctors', {
      params: { q: undefined, page: 1, pageSize: 50, activeOnly: false },
    });
    expect(container.textContent).toContain('External / referring doctors');

    const addButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Add referring doctor'),
    );
    await act(async () => {
      addButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Doctor name');
  });

  it('renders external doctor rows from list payload', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              id: 'doc-1',
              businessId: 'biz-1',
              name: 'Dr. Smith',
              clinicName: 'City Clinic',
              specialty: 'GP',
              street: '1 Main St',
              unit: null,
              city: 'Boston',
              province: 'MA',
              country: 'US',
              postalCode: '02101',
              fax: null,
              address: '1 Main St, Boston, MA 02101',
              phone: null,
              email: null,
              isActive: true,
              createdAt: '2026-06-07T10:00:00.000Z',
              updatedAt: '2026-06-07T10:00:00.000Z',
            },
          ],
          totalItems: 1,
          page: 1,
          pageSize: 50,
        },
      },
    });

    render(<ExternalDoctorsTab businessId="biz-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Dr. Smith');
    expect(container.textContent).toContain('City Clinic');
  });

  it('renders external doctors registry in Armenian (i18n-clinic-v2-5)', async () => {
    const hy = getMessages('hy');
    render(<ExternalDoctorsTab businessId="biz-1" />, 'hy');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain(translate(hy, 'externalDoctors.title'));
    expect(container.textContent).toContain(translate(hy, 'externalDoctors.empty'));
  });

  it('renders external doctors registry in Russian (i18n-clinic-v2-5)', async () => {
    const ru = getMessages('ru');
    render(<ExternalDoctorsTab businessId="biz-1" />, 'ru');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain(translate(ru, 'externalDoctors.title'));
    expect(container.textContent).toContain(translate(ru, 'externalDoctors.addDoctor'));
  });

  it('renders questionnaires admin in Armenian (i18n-clinic-v2-8)', async () => {
    const hy = getMessages('hy');
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/clinic-questionnaires')) {
        return { data: { data: [] } };
      }
      return { data: { data: { items: [], totalItems: 0, page: 1, pageSize: 50 } } };
    });

    render(<ClinicQuestionnairesTab businessId="biz-1" />, 'hy');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain(translate(hy, 'clinicQuestionnaires.title'));
    expect(container.textContent).toContain(translate(hy, 'clinicQuestionnaires.empty'));
  });

  it('renders questionnaires admin in Russian (i18n-clinic-v2-8)', async () => {
    const ru = getMessages('ru');
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/clinic-questionnaires')) {
        return { data: { data: [] } };
      }
      return { data: { data: { items: [], totalItems: 0, page: 1, pageSize: 50 } } };
    });

    render(<ClinicQuestionnairesTab businessId="biz-1" />, 'ru');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain(translate(ru, 'clinicQuestionnaires.addQuestionnaire'));
  });

  it('renders questionnaires empty state and create form', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/clinic-questionnaires')) {
        return { data: { data: [] } };
      }
      return { data: { data: {} } };
    });

    render(<ClinicQuestionnairesTab businessId="biz-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain('Clinic questionnaires');

    const addButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Add questionnaire'),
    );
    await act(async () => {
      addButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Code');
  });

  it('selects questionnaire and loads definition', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/clinic-questionnaires')) {
        return {
          data: {
            data: [
              {
                id: 'q-1',
                code: 'pre-visit-intake',
                internalName: 'Pre-visit intake',
                title: 'Pre-visit intake',
                status: 'draft',
                revision: 1,
                questionCount: 2,
                updatedAt: '2026-06-07T10:00:00.000Z',
              },
            ],
          },
        };
      }
      if (url.includes('/clinic-questionnaires/q-1')) {
        return {
          data: {
            data: {
              id: 'q-1',
              code: 'pre-visit-intake',
              title: 'Pre-visit intake',
              revision: 1,
              questions: [{ id: 'q1', type: 'string', text: 'Symptoms?' }],
            },
          },
        };
      }
      return { data: { data: {} } };
    });

    render(<ClinicQuestionnairesTab businessId="biz-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const rowButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Pre-visit intake'),
    );
    expect(rowButton).toBeTruthy();

    await act(async () => {
      rowButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/businesses/biz-1/clinic-questionnaires/q-1');
    expect(container.textContent).toContain('Symptoms?');
  });
});
