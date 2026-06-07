import type { PatientChartVisitRow } from './patient-chart';

export type CatalogOrderPickerSelection =
  | { kind: 'test_type'; id: string; label: string }
  | { kind: 'test_panel'; id: string; label: string };

export interface CreateCatalogOrderItemPayload {
  type: 'test_type' | 'test_panel';
  testTypeId?: string;
  testPanelId?: string;
  label: string;
}

export function catalogPickerKey(
  kind: CatalogOrderPickerSelection['kind'],
  id: string,
): string {
  return `${kind}:${id}`;
}

export function isCatalogPickerSelected(
  selections: CatalogOrderPickerSelection[],
  kind: CatalogOrderPickerSelection['kind'],
  id: string,
): boolean {
  const key = catalogPickerKey(kind, id);
  return selections.some((item) => catalogPickerKey(item.kind, item.id) === key);
}

export function toggleCatalogPickerSelection(
  current: CatalogOrderPickerSelection[],
  item: CatalogOrderPickerSelection,
): CatalogOrderPickerSelection[] {
  const key = catalogPickerKey(item.kind, item.id);
  if (current.some((entry) => catalogPickerKey(entry.kind, entry.id) === key)) {
    return current.filter((entry) => catalogPickerKey(entry.kind, entry.id) !== key);
  }
  return [...current, item];
}

export function buildCatalogOrderItemsPayload(
  selections: CatalogOrderPickerSelection[],
): CreateCatalogOrderItemPayload[] {
  return selections.map((item) => {
    if (item.kind === 'test_type') {
      return { type: 'test_type', testTypeId: item.id, label: item.label };
    }
    return { type: 'test_panel', testPanelId: item.id, label: item.label };
  });
}

export function filterConfirmedVisitsForCatalogOrder(
  visits: PatientChartVisitRow[],
): PatientChartVisitRow[] {
  return visits.filter((visit) => visit.status === 'confirmed');
}

export function canSubmitCatalogOrder(
  bookingId: string,
  selections: CatalogOrderPickerSelection[],
): boolean {
  return !!bookingId && selections.length > 0;
}
