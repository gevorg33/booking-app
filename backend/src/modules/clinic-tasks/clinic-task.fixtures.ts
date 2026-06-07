import type { ClinicTask } from './entities/clinic-task.entity.js';

export const CLINIC_TASK_FIXTURES = [
  {
    id: 'task-result-1',
    businessId: 'biz-1',
    taskType: 'ResultReview',
    status: 'open',
    title: 'Review CBC result',
    notes: 'Flagged for provider review',
    priority: 'high',
    dueAt: new Date('2026-06-22T17:00:00.000Z'),
    customerId: 'cust-1',
    bookingId: 'book-1',
    testOrderId: 'order-1',
    testResultId: 'result-1',
    specimenId: null,
    encounterId: null,
    assigneeEmployeeId: 'emp-provider-1',
    isAutoManaged: false,
    createdByEmployeeId: 'emp-lab-1',
    completedByEmployeeId: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: new Date('2026-06-22T09:00:00.000Z'),
    updatedAt: new Date('2026-06-22T09:00:00.000Z'),
  },
  {
    id: 'task-specimen-1',
    businessId: 'biz-1',
    taskType: 'SpecimenCollection',
    status: 'in_progress',
    title: 'Collect fasting blood sample',
    notes: null,
    priority: 'normal',
    dueAt: new Date('2026-06-22T12:00:00.000Z'),
    customerId: 'cust-2',
    bookingId: 'book-2',
    testOrderId: 'order-2',
    testResultId: null,
    specimenId: 'spec-1',
    encounterId: null,
    assigneeEmployeeId: 'emp-provider-1',
    isAutoManaged: false,
    createdByEmployeeId: 'emp-lab-1',
    completedByEmployeeId: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: new Date('2026-06-22T08:00:00.000Z'),
    updatedAt: new Date('2026-06-22T08:30:00.000Z'),
  },
  {
    id: 'task-callback-1',
    businessId: 'biz-1',
    taskType: 'PatientCallback',
    status: 'open',
    title: 'Call patient about abnormal result',
    notes: 'Use interpreter if needed',
    priority: 'high',
    dueAt: new Date('2026-06-22T15:00:00.000Z'),
    customerId: 'cust-1',
    bookingId: null,
    testOrderId: null,
    testResultId: null,
    specimenId: null,
    encounterId: 'enc-1',
    assigneeEmployeeId: null,
    isAutoManaged: false,
    createdByEmployeeId: 'emp-front-1',
    completedByEmployeeId: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: new Date('2026-06-22T10:00:00.000Z'),
    updatedAt: new Date('2026-06-22T10:00:00.000Z'),
  },
] as const satisfies ReadonlyArray<Partial<ClinicTask>>;

export const CLINIC_TASK_CREATE_PAYLOADS = [
  {
    id: 'create-result-review',
    dto: {
      taskType: 'ResultReview',
      title: 'Review lipid panel',
      testResultId: 'result-1',
      testOrderId: 'order-1',
      customerId: 'cust-1',
      priority: 'high',
      dueAt: '2026-06-23T16:00:00.000Z',
      assigneeEmployeeId: 'emp-provider-1',
    },
  },
  {
    id: 'create-specimen-collection',
    dto: {
      taskType: 'SpecimenCollection',
      specimenId: 'spec-1',
      bookingId: 'book-2',
    },
  },
  {
    id: 'create-patient-callback',
    dto: {
      taskType: 'PatientCallback',
      customerId: 'cust-1',
      notes: 'Follow up on missed call',
    },
  },
] as const;

export const FORBIDDEN_IVF_TASK_TYPE_SCENARIOS = [
  { id: 'reject-egg-thaw', taskType: 'EggThaw' },
  { id: 'reject-plan-trigger', taskType: 'PlanTrigger' },
  {
    id: 'reject-high-priority-result-review',
    taskType: 'HighPriorityResultReview',
  },
] as const;

export const CLINIC_TASK_LINK_VALIDATION_SCENARIOS = [
  {
    id: 'result-review-missing-links',
    taskType: 'ResultReview' as const,
    links: {},
    expectedError: 'Result review tasks require a test result or order link',
  },
  {
    id: 'specimen-collection-missing-links',
    taskType: 'SpecimenCollection' as const,
    links: { customerId: 'cust-1' },
    expectedError:
      'Specimen collection tasks require a specimen, order, or booking link',
  },
  {
    id: 'patient-callback-missing-links',
    taskType: 'PatientCallback' as const,
    links: { testOrderId: 'order-1' },
    expectedError:
      'Patient callback tasks require a customer, booking, or encounter link',
  },
] as const;

export const CLINIC_TASK_STATUS_TRANSITION_SCENARIOS = [
  { id: 'open-to-in-progress', from: 'open', to: 'in_progress', allowed: true },
  { id: 'open-to-completed', from: 'open', to: 'completed', allowed: true },
  { id: 'completed-to-open', from: 'completed', to: 'open', allowed: false },
  { id: 'cancelled-to-open', from: 'cancelled', to: 'open', allowed: false },
] as const;
