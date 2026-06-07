export const CLINIC_TASK_TYPES = [
  'ResultReview',
  'SpecimenCollection',
  'PatientCallback',
] as const;

export type ClinicTaskType = (typeof CLINIC_TASK_TYPES)[number];

export const CLINIC_TASK_STATUSES = [
  'open',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export type ClinicTaskStatus = (typeof CLINIC_TASK_STATUSES)[number];

export const CLINIC_TASK_PRIORITIES = ['normal', 'high'] as const;

export type ClinicTaskPriority = (typeof CLINIC_TASK_PRIORITIES)[number];

/** Pollin IVF `AutomatedTaskType` values — must never ship in Booking clinic_tasks. */
export const FORBIDDEN_IVF_CLINIC_TASK_TYPES = [
  'EggThaw',
  'EggFreeze',
  'PlanTrigger',
  'PlanMilestone',
  'PartnerCycle',
  'StimSheetReview',
  'CohortReview',
  'OHSSMonitoring',
  'HighPriorityResultReview',
] as const;

export interface ClinicTaskLinkFields {
  customerId?: string | null;
  bookingId?: string | null;
  testOrderId?: string | null;
  testResultId?: string | null;
  specimenId?: string | null;
  encounterId?: string | null;
}

export interface ClinicTaskView extends ClinicTaskLinkFields {
  id: string;
  businessId: string;
  taskType: ClinicTaskType;
  status: ClinicTaskStatus;
  title: string;
  notes: string | null;
  priority: ClinicTaskPriority;
  dueAt: string | null;
  assigneeEmployeeId: string | null;
  createdByEmployeeId: string | null;
  completedByEmployeeId: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  isAutoManaged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicTaskListResponse {
  items: ClinicTaskView[];
  totalItems: number;
  page: number;
  pageSize: number;
}
