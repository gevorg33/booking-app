import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildClinicSpecimenLabelPath,
  buildClinicSpecimenLabelPrintTitle,
  CLINIC_SPECIMEN_BARCODE_OPTIONS,
  printClinicSpecimenLabel,
  unwrapClinicSpecimenLabel,
} from './clinic-specimen-label';

describe('clinic-specimen-label', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => null),
    });
    vi.stubGlobal('window', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds label API paths', () => {
    expect(buildClinicSpecimenLabelPath('biz-1', 'spec-1')).toBe(
      '/businesses/biz-1/clinic-test-results/specimens/spec-1/label',
    );
  });

  it('unwraps nested label payloads', () => {
    expect(
      unwrapClinicSpecimenLabel({
        data: {
          data: {
            specimenId: 'spec-1',
            specimenIdentifier: 'SP-SPEC1',
            barcodeValue: 'SP-SPEC1',
            customerName: 'Jane Doe',
            orderDisplayNames: 'CBC',
            bookingStartTime: null,
            status: 'NotCollected',
            department: 'Laboratory',
            collectedAt: null,
          },
        },
      }),
    ).toMatchObject({
      specimenIdentifier: 'SP-SPEC1',
      customerName: 'Jane Doe',
    });
  });

  it('builds print titles with test names', () => {
    expect(
      buildClinicSpecimenLabelPrintTitle(
        { orderDisplayNames: 'CBC', specimenIdentifier: 'SP-SPEC1' },
        'Specimen label',
      ),
    ).toBe('CBC · SP-SPEC1');
  });

  it('uses code128 barcode defaults', () => {
    expect(CLINIC_SPECIMEN_BARCODE_OPTIONS.bcid).toBe('code128');
    expect(CLINIC_SPECIMEN_BARCODE_OPTIONS.includetext).toBe(true);
  });

  it('no-ops when the print root is missing', () => {
    expect(printClinicSpecimenLabel('missing-root')).toBeUndefined();
  });

  it('opens a print window for rendered label markup', () => {
    const write = vi.fn();
    const close = vi.fn();
    const print = vi.fn();
    const labelRoot = { innerHTML: '<p>Label body</p>' };
    vi.stubGlobal('document', {
      getElementById: vi.fn((id: string) =>
        id === 'clinic-specimen-label-print-root' ? labelRoot : null,
      ),
    });
    vi.stubGlobal('window', {
      open: vi.fn(() => ({
        document: { write, close },
        focus: vi.fn(),
        print,
        close: vi.fn(),
      })),
    });

    printClinicSpecimenLabel('clinic-specimen-label-print-root');

    expect(write).toHaveBeenCalled();
    expect(print).toHaveBeenCalled();
  });

  it('returns early when the browser blocks print popups', () => {
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => ({ innerHTML: '<p>Label</p>' })),
    });
    vi.stubGlobal('window', { open: vi.fn(() => null) });

    expect(printClinicSpecimenLabel('clinic-specimen-label-print-root')).toBeUndefined();
  });
});
