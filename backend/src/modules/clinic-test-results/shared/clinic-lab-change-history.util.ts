export type ClinicLabChangeHistoryEntityType = 'order' | 'result';

export type ClinicLabChangeHistoryAction =
  | 'Created'
  | 'StatusChanged'
  | 'ResultReviewed'
  | 'ResultReleased'
  | 'OrderCancelled';

export interface ClinicLabChangeHistoryChange {
  propertyName: string;
  from: string | null;
  to: string;
}

export interface ClinicLabChangeHistoryEditedBy {
  employeeId: string | null;
  fullName: string | null;
  role: string | null;
}

export interface ClinicLabChangeHistoryItem {
  id: string;
  entityType: ClinicLabChangeHistoryEntityType;
  entityId: string;
  action: ClinicLabChangeHistoryAction;
  date: string;
  changes: ClinicLabChangeHistoryChange[];
  editedBy: ClinicLabChangeHistoryEditedBy;
  note: string | null;
}

export interface ClinicLabStatusHistoryRow {
  id: string;
  status: string;
  previousStatus?: string | null;
  note?: string | null;
  createdAt: Date;
  employee?: { id: string; name?: string | null } | null;
  employeeId?: string | null;
}

export function resolveClinicLabChangeHistoryAction(
  entityType: ClinicLabChangeHistoryEntityType,
  status: string,
  previousStatus: string | null | undefined,
): ClinicLabChangeHistoryAction {
  if (!previousStatus) return 'Created';
  if (entityType === 'result') {
    if (status === 'Released') return 'ResultReleased';
    if (status === 'Reviewed' || status === 'AutomaticallyReviewed') {
      return 'ResultReviewed';
    }
  }
  if (entityType === 'order' && status === 'Cancelled') return 'OrderCancelled';
  return 'StatusChanged';
}

export function buildClinicLabStatusChangeRows(
  status: string,
  previousStatus: string | null | undefined,
): ClinicLabChangeHistoryChange[] {
  return [
    {
      propertyName: 'status',
      from: previousStatus ?? null,
      to: status,
    },
  ];
}

export function mapClinicLabStatusHistoryRow(
  entityType: ClinicLabChangeHistoryEntityType,
  entityId: string,
  row: ClinicLabStatusHistoryRow,
  note: string | null = row.note ?? null,
): ClinicLabChangeHistoryItem {
  return {
    id: row.id,
    entityType,
    entityId,
    action: resolveClinicLabChangeHistoryAction(
      entityType,
      row.status,
      row.previousStatus,
    ),
    date: row.createdAt.toISOString(),
    changes: buildClinicLabStatusChangeRows(row.status, row.previousStatus),
    editedBy: {
      employeeId: row.employeeId ?? row.employee?.id ?? null,
      fullName: row.employee?.name ?? null,
      role: null,
    },
    note,
  };
}

export function sortClinicLabChangeHistoryItems(
  items: ClinicLabChangeHistoryItem[],
): ClinicLabChangeHistoryItem[] {
  return [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
