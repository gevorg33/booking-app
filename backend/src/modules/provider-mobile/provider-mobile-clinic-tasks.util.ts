import {
  canClaimClinicTask,
  canCompleteClinicTask,
} from '../../common/utils/clinic-task-access.util.js';
import type { ClinicLabStaffContext } from '../../common/utils/clinic-lab-access.util.js';
import type {
  ClinicTaskStatus,
  ClinicTaskView,
} from '../../common/utils/clinic-task.types.js';

export const CLINIC_PROVIDER_TASK_INBOX_STATUSES = [
  'open',
  'in_progress',
] as const satisfies readonly ClinicTaskStatus[];

export const CLINIC_PROVIDER_TASK_INBOX_PAGE_SIZE = 100;

export interface ProviderClinicTaskItem {
  id: string;
  taskType: ClinicTaskView['taskType'];
  status: ClinicTaskView['status'];
  title: string;
  notes: string | null;
  priority: ClinicTaskView['priority'];
  dueAt: string | null;
  customerId: string | null;
  customerName: string | null;
  bookingId: string | null;
  assigneeEmployeeId: string | null;
  assigneeName: string | null;
  isAutoManaged: boolean;
  canClaim: boolean;
  canComplete: boolean;
  createdAt: string;
}

export interface ProviderClinicTaskInbox {
  viewMode: 'provider' | 'team' | 'admin' | 'owner';
  labFeaturesEnabled: boolean;
  employee: { id: string; name: string } | null;
  tasks: ProviderClinicTaskItem[];
}

export interface ProviderClinicTaskNameLookups {
  customerNames: ReadonlyMap<string, string>;
  assigneeNames: ReadonlyMap<string, string>;
}

export function mergeClinicTaskInboxItems(
  ...lists: readonly ClinicTaskView[][]
): ClinicTaskView[] {
  const byId = new Map<string, ClinicTaskView>();
  for (const list of lists) {
    for (const task of list) {
      byId.set(task.id, task);
    }
  }
  return sortClinicTasksForInbox([...byId.values()]);
}

export function sortClinicTasksForInbox(
  tasks: readonly ClinicTaskView[],
): ClinicTaskView[] {
  return [...tasks].sort((left, right) => {
    const leftDue = left.dueAt
      ? Date.parse(left.dueAt)
      : Number.POSITIVE_INFINITY;
    const rightDue = right.dueAt
      ? Date.parse(right.dueAt)
      : Number.POSITIVE_INFINITY;
    if (leftDue !== rightDue) return leftDue - rightDue;
    return Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });
}

export function buildProviderClinicTaskNameLookups(
  customers: ReadonlyArray<{ id: string; name: string }>,
  employees: ReadonlyArray<{ id: string; name: string }>,
): ProviderClinicTaskNameLookups {
  return {
    customerNames: new Map(
      customers.map((customer) => [customer.id, customer.name]),
    ),
    assigneeNames: new Map(
      employees.map((employee) => [employee.id, employee.name]),
    ),
  };
}

export function mapProviderClinicTaskItem(
  task: ClinicTaskView,
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
  lookups: ProviderClinicTaskNameLookups,
): ProviderClinicTaskItem {
  return {
    id: task.id,
    taskType: task.taskType,
    status: task.status,
    title: task.title,
    notes: task.notes,
    priority: task.priority,
    dueAt: task.dueAt,
    customerId: task.customerId ?? null,
    customerName: task.customerId
      ? (lookups.customerNames.get(task.customerId) ?? null)
      : null,
    bookingId: task.bookingId ?? null,
    assigneeEmployeeId: task.assigneeEmployeeId,
    assigneeName: task.assigneeEmployeeId
      ? (lookups.assigneeNames.get(task.assigneeEmployeeId) ?? null)
      : null,
    isAutoManaged: task.isAutoManaged,
    canClaim: canClaimClinicTask(ctx, task),
    canComplete: canCompleteClinicTask(ctx, task),
    createdAt: task.createdAt,
  };
}

export function mapProviderClinicTaskInboxItems(
  tasks: readonly ClinicTaskView[],
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
  lookups: ProviderClinicTaskNameLookups,
): ProviderClinicTaskItem[] {
  return tasks.map((task) => mapProviderClinicTaskItem(task, ctx, lookups));
}
