import type { ClinicSpecimenStatus } from './clinic-lab-state';

export type ClinicSpecimenOpsView = 'collection' | 'tracking';

export interface ClinicSpecimenQueueItem {
  id: string;
  status: string;
  specimenIdentifier: string | null;
  orderId: string;
  orderDisplayNames: string | null;
  bookingId: string | null;
  customerName: string | null;
  bookingStartTime: string | null;
  employeeName: string | null;
  department: string | null;
  collectedAt: string | null;
  storageLocationName: string | null;
  transportFolderCode: string | null;
  createdAt: string;
}

export interface ClinicSpecimenQueueFilters {
  view: ClinicSpecimenOpsView;
  status?: string;
  from?: string;
  to?: string;
  department?: string;
}

export const CLINIC_SPECIMEN_COLLECTION_STATUSES = [
  'NotCollected',
  'RecollectRequired',
] as const satisfies readonly ClinicSpecimenStatus[];

export const CLINIC_SPECIMEN_TRACKING_STATUSES = [
  'Collected',
  'ReadyForTransport',
  'InTransit',
  'ReceivedInLab',
  'RetestRequired',
] as const satisfies readonly ClinicSpecimenStatus[];

export const CLINIC_SPECIMEN_STATUSES_BY_VIEW: Record<
  ClinicSpecimenOpsView,
  readonly ClinicSpecimenStatus[]
> = {
  collection: CLINIC_SPECIMEN_COLLECTION_STATUSES,
  tracking: CLINIC_SPECIMEN_TRACKING_STATUSES,
};

export interface ClinicSpecimenTransitionAction {
  toStatus: ClinicSpecimenStatus;
  labelKey: string;
  v1ShortPath?: boolean;
}

const COLLECTION_ACTIONS: Partial<
  Record<ClinicSpecimenStatus, ClinicSpecimenTransitionAction[]>
> = {
  NotCollected: [
    { toStatus: 'Collected', labelKey: 'markCollected' },
    { toStatus: 'Rejected', labelKey: 'reject' },
  ],
  RecollectRequired: [
    { toStatus: 'Collected', labelKey: 'markCollected' },
    { toStatus: 'Rejected', labelKey: 'reject' },
  ],
};

const TRACKING_ACTIONS: Partial<
  Record<ClinicSpecimenStatus, ClinicSpecimenTransitionAction[]>
> = {
  Collected: [
    { toStatus: 'ReceivedInLab', labelKey: 'markReceivedInLab', v1ShortPath: true },
    { toStatus: 'ReadyForTransport', labelKey: 'markReadyForTransport' },
    { toStatus: 'Rejected', labelKey: 'reject' },
  ],
  ReadyForTransport: [
    { toStatus: 'InTransit', labelKey: 'markInTransit' },
    { toStatus: 'Rejected', labelKey: 'reject' },
  ],
  InTransit: [
    { toStatus: 'ReceivedInLab', labelKey: 'markReceivedInLab' },
    { toStatus: 'Rejected', labelKey: 'reject' },
  ],
  ReceivedInLab: [
    { toStatus: 'Completed', labelKey: 'markComplete' },
    { toStatus: 'RecollectRequired', labelKey: 'markRecollectRequired' },
    { toStatus: 'RetestRequired', labelKey: 'markRetestRequired' },
    { toStatus: 'Rejected', labelKey: 'reject' },
  ],
  RetestRequired: [
    { toStatus: 'Collected', labelKey: 'markCollected' },
    { toStatus: 'Rejected', labelKey: 'reject' },
  ],
};

export function buildSpecimenQueueQueryParams(
  filters: ClinicSpecimenQueueFilters,
): Record<string, string> {
  const params: Record<string, string> = { view: filters.view };
  if (filters.status?.trim()) params.status = filters.status.trim();
  if (filters.from?.trim()) params.from = `${filters.from.trim()}T00:00:00.000Z`;
  if (filters.to?.trim()) params.to = `${filters.to.trim()}T23:59:59.999Z`;
  if (filters.department?.trim()) params.department = filters.department.trim();
  return params;
}

export function getSpecimenTransitionActions(
  view: ClinicSpecimenOpsView,
  status: string,
): ClinicSpecimenTransitionAction[] {
  const map = view === 'collection' ? COLLECTION_ACTIONS : TRACKING_ACTIONS;
  return map[status as ClinicSpecimenStatus] ?? [];
}

export function specimenOpsBasePath(view: ClinicSpecimenOpsView): string {
  return `/dashboard/lab-specimens/${view}`;
}
