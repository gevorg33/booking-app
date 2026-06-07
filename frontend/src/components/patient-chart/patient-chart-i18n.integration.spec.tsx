import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMessages, translate } from '@/i18n';
import { I18nProvider } from '@/i18n/I18nProvider';
import { PatientChartEmrShell } from './patient-chart-emr-shell';
import { PatientChartProfileTab } from './patient-chart-profile-tab';
import { PatientChartEncountersTab } from './patient-chart-encounters-tab';
import { PatientChartStaffNotesTab } from './patient-chart-staff-notes-tab';
import { PatientChartDocumentsTab } from './patient-chart-documents-tab';
import api from '@/lib/api';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  Save: () => <span data-testid="save" />,
  Plus: () => <span data-testid="plus" />,
  Lock: () => <span data-testid="lock" />,
  ShieldAlert: () => <span data-testid="shield" />,
  Upload: () => <span data-testid="upload" />,
  ExternalLink: () => <span data-testid="external" />,
  UserCheck: () => <span data-testid="user-check" />,
  UserX: () => <span data-testid="user-x" />,
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

describe('patient chart i18n integration (i18n-clinic-v2-5)', () => {
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

  it('renders EMR tab labels in Armenian', () => {
    const hy = getMessages('hy');
    render(
      <PatientChartEmrShell activeTab="profile" onTabChange={() => undefined}>
        <div />
      </PatientChartEmrShell>,
      'hy',
    );

    expect(container.textContent).toContain(
      translate(hy, 'clinic.patientChart.tabs.profile'),
    );
    expect(container.textContent).toContain(
      translate(hy, 'clinic.patientChart.tabs.encounters'),
    );
    expect(container.textContent).toContain(
      translate(hy, 'clinic.patientChart.tabs.staffNotes'),
    );
    expect(container.textContent).toContain(
      translate(hy, 'clinic.patientChart.tabs.documents'),
    );
  });

  it('renders EMR tab labels in Russian', () => {
    const ru = getMessages('ru');
    render(
      <PatientChartEmrShell activeTab="documents" onTabChange={() => undefined}>
        <div />
      </PatientChartEmrShell>,
      'ru',
    );

    expect(container.textContent).toContain(
      translate(ru, 'clinic.patientChart.tabs.documents'),
    );
    expect(container.textContent).toContain(
      translate(ru, 'clinic.patientChart.tabs.encounters'),
    );
    expect(container.textContent).toContain(
      translate(ru, 'clinic.patientChart.tabs.staffNotes'),
    );
  });

  it('renders profile demographics and clinical profile labels in hy', async () => {
    const hy = getMessages('hy');
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
        return { data: { data: { referringExternalDoctorId: null } } };
      }
      if (url.includes('/external-doctors')) {
        return { data: { data: { items: [], totalItems: 0, page: 1, pageSize: 100 } } };
      }
      return { data: { data: [] } };
    });

    render(<PatientChartProfileTab businessId="biz-1" customerId="cust-1" />, 'hy');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain(
      translate(hy, 'clinic.patientChart.demographicsTitle'),
    );
    expect(container.textContent).toContain(
      translate(hy, 'clinic.patientChart.clinicalProfileTitle'),
    );
    expect(container.textContent).toContain(
      translate(hy, 'clinic.patientChart.fields.allergies'),
    );
    expect(container.textContent).toContain(
      translate(hy, 'clinic.patientChart.fields.chronicProblems'),
    );
    expect(container.textContent).toContain(
      translate(hy, 'clinic.patientChart.fields.referringDoctor'),
    );
  });

  it('renders encounters empty state in Russian', async () => {
    const ru = getMessages('ru');
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/encounters')) {
        return { data: { data: [] } };
      }
      return { data: { data: [] } };
    });

    render(<PatientChartEncountersTab businessId="biz-1" customerId="cust-1" />, 'ru');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain(
      translate(ru, 'clinic.patientChart.encountersEmpty'),
    );
  });

  it('renders staff notes internal notice in Armenian', async () => {
    const hy = getMessages('hy');
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/staff-notes')) {
        return { data: { data: { notes: [], canCreate: false } } };
      }
      return { data: { data: [] } };
    });

    render(<PatientChartStaffNotesTab businessId="biz-1" customerId="cust-1" />, 'hy');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain(
      translate(hy, 'clinic.patientChart.staffNotesInternalNotice'),
    );
    expect(container.textContent).toContain(
      translate(hy, 'clinic.patientChart.staffNotesEmpty'),
    );
  });

  it('renders documents empty state and category labels in Russian', async () => {
    const ru = getMessages('ru');
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url.includes('/documents')) {
        return {
          data: {
            data: {
              documents: [],
              categories: ['lab_report', 'referral_letter', 'imaging_report', 'other'],
              canUpload: false,
            },
          },
        };
      }
      return { data: { data: [] } };
    });

    render(<PatientChartDocumentsTab businessId="biz-1" customerId="cust-1" />, 'ru');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain(
      translate(ru, 'clinic.patientChart.documentsEmpty'),
    );
    expect(container.textContent).toContain(
      translate(ru, 'clinic.patientChart.documentCategories.lab_report'),
    );
  });
});
