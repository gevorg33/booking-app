import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ClinicSpecimenLabelPrintModal } from './clinic-specimen-label-print-modal';
import { ClinicSpecimenLabelSheet } from './clinic-specimen-label-sheet';
import { ClinicSpecimenBarcode } from './clinic-specimen-barcode';
import api from '@/lib/api';
import bwipjs from 'bwip-js/browser';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('bwip-js/browser', () => ({
  default: {
    toCanvas: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);
const mockedBwip = vi.mocked(bwipjs);

const labelFixture = {
  specimenId: 'spec-1',
  specimenIdentifier: 'SP-SPEC1',
  barcodeValue: 'SP-SPEC1',
  customerName: 'Jane Doe',
  orderDisplayNames: 'CBC',
  bookingStartTime: '2026-06-23T10:00:00.000Z',
  status: 'NotCollected',
  department: 'Laboratory',
  collectedAt: null,
};

describe('clinic specimen label print', () => {
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
    mockedApi.get.mockResolvedValue({ data: { data: labelFixture } });
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

  it('renders printable label sheet content', () => {
    render(
      <ClinicSpecimenLabelSheet
        label={{ ...labelFixture, collectedAt: '2026-06-23T11:00:00.000Z' }}
        businessName="City Clinic"
        labels={{
          specimenId: 'Specimen ID',
          customer: 'Patient',
          test: 'Test',
          appointment: 'Appointment',
          department: 'Department',
          status: 'Status',
          collected: 'Collected',
        }}
      />,
    );

    expect(container.textContent).toContain('City Clinic');
    expect(container.textContent).toContain('Jane Doe');
    expect(container.textContent).toContain('CBC');
    expect(container.textContent).toContain('SP-SPEC1');
    expect(container.textContent).toContain('Collected');
  });

  it('surfaces barcode render errors', () => {
    mockedBwip.toCanvas.mockImplementation(() => {
      throw new Error('bad barcode');
    });

    render(<ClinicSpecimenBarcode value="SP-SPEC1" />);

    expect(container.textContent).toContain('bad barcode');
  });

  it('loads label data in the print modal', async () => {
    render(
      <ClinicSpecimenLabelPrintModal
        businessId="biz-1"
        businessName="City Clinic"
        specimenId="spec-1"
        onClose={() => undefined}
      />,
    );

    await act(async () => {
      await queryClient.invalidateQueries();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/businesses/biz-1/clinic-test-results/specimens/spec-1/label',
    );
    expect(container.textContent).toContain('Specimen label');
    expect(container.textContent).toContain('Jane Doe');
    expect(container.textContent).toContain('Print label');
  });

  it('renders Russian label modal copy (i18n-clinic-v2-9)', async () => {
    render(
      <ClinicSpecimenLabelPrintModal
        businessId="biz-1"
        businessName="City Clinic"
        specimenId="spec-1"
        onClose={() => undefined}
      />,
      'ru',
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Этикетка образца');
    expect(container.textContent).toContain('Печать этикетки');
  });

  it('renders Armenian label modal copy', async () => {
    render(
      <ClinicSpecimenLabelPrintModal
        businessId="biz-1"
        businessName="City Clinic"
        specimenId="spec-1"
        onClose={() => undefined}
      />,
      'hy',
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Նմուշի պիտակ');
    expect(container.textContent).toContain('Տպել պիտակ');
  });

  it('shows load errors in the print modal', async () => {
    mockedApi.get.mockRejectedValue(new Error('network'));

    render(
      <ClinicSpecimenLabelPrintModal
        businessId="biz-1"
        businessName="City Clinic"
        specimenId="spec-1"
        onClose={() => undefined}
      />,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Unable to load specimen label data.');
  });

  it('invokes print and close actions from the modal', async () => {
    const onClose = vi.fn();
    const printSpy = vi.spyOn(window, 'open').mockReturnValue({
      document: { write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    } as never);

    render(
      <ClinicSpecimenLabelPrintModal
        businessId="biz-1"
        businessName="City Clinic"
        specimenId="spec-1"
        onClose={onClose}
      />,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const closeButton = container.querySelector('button[aria-label="Close"]');
    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalled();

    const printButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Print label'),
    );
    printButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(printSpy).toHaveBeenCalled();
  });
});
