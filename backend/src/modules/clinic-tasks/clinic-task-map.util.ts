import type { ClinicTaskView } from '../../common/utils/clinic-task.types.js';
import type { ClinicTask } from './entities/clinic-task.entity.js';

export function mapClinicTaskView(task: ClinicTask): ClinicTaskView {
  return {
    id: task.id,
    businessId: task.businessId,
    taskType: task.taskType,
    status: task.status,
    title: task.title,
    notes: task.notes ?? null,
    priority: task.priority,
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    customerId: task.customerId ?? null,
    bookingId: task.bookingId ?? null,
    testOrderId: task.testOrderId ?? null,
    testResultId: task.testResultId ?? null,
    specimenId: task.specimenId ?? null,
    encounterId: task.encounterId ?? null,
    assigneeEmployeeId: task.assigneeEmployeeId ?? null,
    createdByEmployeeId: task.createdByEmployeeId ?? null,
    completedByEmployeeId: task.completedByEmployeeId ?? null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    cancelledAt: task.cancelledAt ? task.cancelledAt.toISOString() : null,
    isAutoManaged: task.isAutoManaged,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
