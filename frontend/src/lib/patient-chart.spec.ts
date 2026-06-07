import { describe, expect, it } from 'vitest';
import {
  buildCatalogOrderItemsPayload,
  canSubmitCatalogOrder,
  filterConfirmedVisitsForCatalogOrder,
  isCatalogPickerSelected,
  toggleCatalogPickerSelection,
} from './patient-chart-catalog-order';
import {
  buildPatientChartPath,
  isPatientChartTabEnabled,
  mapCustomerAppointmentsToVisits,
  PATIENT_CHART_DEFAULT_TAB,
  resolvePatientChartTab,
  unwrapPatientChartList,
} from './patient-chart';

describe('patient-chart', () => {
  it('resolves enabled tabs and falls back to profile', () => {
    expect(resolvePatientChartTab('results')).toBe('results');
    expect(resolvePatientChartTab('encounters')).toBe('encounters');
    expect(resolvePatientChartTab('staffNotes')).toBe('staffNotes');
    expect(resolvePatientChartTab('documents')).toBe('documents');
    expect(resolvePatientChartTab('intake')).toBe('intake');
    expect(resolvePatientChartTab(undefined)).toBe(PATIENT_CHART_DEFAULT_TAB);
  });

  it('detects enabled vs placeholder tabs', () => {
    expect(isPatientChartTabEnabled('orders')).toBe(true);
    expect(isPatientChartTabEnabled('encounters')).toBe(true);
    expect(isPatientChartTabEnabled('staffNotes')).toBe(true);
    expect(isPatientChartTabEnabled('documents')).toBe(true);
    expect(isPatientChartTabEnabled('intake')).toBe(true);
  });

  it('builds chart paths with optional tab query', () => {
    expect(buildPatientChartPath('cust-1')).toBe('/dashboard/patient-chart/cust-1');
    expect(buildPatientChartPath('cust-1', 'visits')).toBe(
      '/dashboard/patient-chart/cust-1?tab=visits',
    );
  });

  it('unwraps nested API list payloads', () => {
    expect(unwrapPatientChartList<{ id: string }>({ data: [{ id: 'a' }] })).toEqual([
      { id: 'a' },
    ]);
    expect(
      unwrapPatientChartList<{ id: string }>({ data: { data: [{ id: 'b' }] } }),
    ).toEqual([{ id: 'b' }]);
  });

  it('filters confirmed visits for catalog orders', () => {
    expect(
      filterConfirmedVisitsForCatalogOrder([
        {
          id: 'b-1',
          startTime: '2026-06-01T10:00:00.000Z',
          endTime: '2026-06-01T10:30:00.000Z',
          status: 'confirmed',
          serviceName: 'Consultation',
          providerName: 'Dr. Lee',
        },
        {
          id: 'b-2',
          startTime: '2026-06-02T10:00:00.000Z',
          endTime: '2026-06-02T10:30:00.000Z',
          status: 'completed',
          serviceName: 'Follow-up',
          providerName: 'Dr. Lee',
        },
      ]),
    ).toEqual([
      {
        id: 'b-1',
        startTime: '2026-06-01T10:00:00.000Z',
        endTime: '2026-06-01T10:30:00.000Z',
        status: 'confirmed',
        serviceName: 'Consultation',
        providerName: 'Dr. Lee',
      },
    ]);
  });

  it('toggles catalog picker selections and builds order payload', () => {
    const first = toggleCatalogPickerSelection([], {
      kind: 'test_type',
      id: 'tt-1',
      label: 'CBC',
    });
    expect(isCatalogPickerSelected(first, 'test_type', 'tt-1')).toBe(true);

    const second = toggleCatalogPickerSelection(first, {
      kind: 'test_panel',
      id: 'tp-1',
      label: 'Lipid panel',
    });
    const third = toggleCatalogPickerSelection(second, {
      kind: 'test_type',
      id: 'tt-1',
      label: 'CBC',
    });
    expect(third).toEqual([
      { kind: 'test_panel', id: 'tp-1', label: 'Lipid panel' },
    ]);

    expect(buildCatalogOrderItemsPayload(second)).toEqual([
      { type: 'test_type', testTypeId: 'tt-1', label: 'CBC' },
      { type: 'test_panel', testPanelId: 'tp-1', label: 'Lipid panel' },
    ]);
    expect(canSubmitCatalogOrder('booking-1', second)).toBe(true);
    expect(canSubmitCatalogOrder('', second)).toBe(false);
    expect(canSubmitCatalogOrder('booking-1', [])).toBe(false);
  });

  it('maps customer appointments into visit rows', () => {
    expect(
      mapCustomerAppointmentsToVisits([
        {
          id: 'b-1',
          startTime: '2026-06-01T10:00:00.000Z',
          endTime: '2026-06-01T10:30:00.000Z',
          status: 'completed',
          service: { name: 'Consultation' },
          employee: { name: 'Dr. Lee' },
        },
      ]),
    ).toEqual([
      {
        id: 'b-1',
        startTime: '2026-06-01T10:00:00.000Z',
        endTime: '2026-06-01T10:30:00.000Z',
        status: 'completed',
        serviceName: 'Consultation',
        providerName: 'Dr. Lee',
      },
    ]);
  });
});
