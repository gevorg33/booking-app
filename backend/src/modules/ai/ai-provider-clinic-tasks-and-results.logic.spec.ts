import {
  handleClaimClinicTaskLogic,
  handleCompleteClinicTaskLogic,
  handleExplainClinicTaskLogic,
  handleListBookingLabSummariesLogic,
  handleListClinicTasksLogic,
  handleListLabResultsQueueLogic,
  type ProviderClinicTasksAndResultsLogicDeps,
} from './ai-provider-clinic-tasks-and-results.logic.js';

function buildDeps(
  overrides: {
    providerMobile?: Record<string, any>;
    clinicTestResultsService?: Record<string, any>;
    clinicLabAccessService?: Record<string, any>;
  } = {},
): ProviderClinicTasksAndResultsLogicDeps {
  return {
    providerMobile: {
      getProviderLabResultsQueue: jest.fn(async () => ({
        lookbackDays: 30,
        viewMode: 'provider',
        labFeaturesEnabled: true,
        employee: { id: 'emp-1', name: 'Alex' },
        results: [],
      })),
      getProviderClinicTaskInbox: jest.fn(async () => ({
        viewMode: 'provider',
        labFeaturesEnabled: true,
        employee: { id: 'emp-1', name: 'Alex' },
        tasks: [
          {
            id: 'task-1',
            taskType: 'follow_up_call',
            status: 'open',
            title: 'Follow-up call',
            notes: null,
            priority: 'normal',
            dueAt: null,
            customerId: 'c1',
            customerName: 'Jane',
            bookingId: null,
            assigneeEmployeeId: null,
            assigneeName: null,
            isAutoManaged: false,
            canClaim: true,
            canComplete: true,
            createdAt: '2026-06-01T00:00:00.000Z',
          },
        ],
      })),
      claimProviderClinicTask: jest.fn(async () => ({ id: 'task-1' })),
      completeProviderClinicTask: jest.fn(async () => ({ id: 'task-1' })),
      ...overrides.providerMobile,
    } as any,
    clinicTestResultsService: {
      listBookingLabSummaries: jest.fn(async () => []),
      ...overrides.clinicTestResultsService,
    } as any,
    clinicLabAccessService: {
      assertBookingLabAccess: jest.fn(async () => ({})),
      ...overrides.clinicLabAccessService,
    } as any,
  };
}

describe('ai-provider-clinic-tasks-and-results.logic (ai-cmd-provider-6.9)', () => {
  describe('handleListClinicTasksLogic (ai-cmd-provider-5.11.6)', () => {
    it('lists outstanding clinic tasks', async () => {
      const deps = buildDeps();

      const result = await handleListClinicTasksLogic(deps, 'biz-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.action).toBe('list_clinic_tasks');
      expect(result.summary).toContain('Follow-up call');
      expect(result.details?.count).toBe(1);
    });

    it('fails gracefully when clinic features are disabled', async () => {
      const deps = buildDeps({
        providerMobile: {
          getProviderClinicTaskInbox: jest.fn(async () => ({
            viewMode: 'provider',
            labFeaturesEnabled: false,
            employee: null,
            tasks: [],
          })),
        },
      });

      const result = await handleListClinicTasksLogic(deps, 'biz-1', 'user-1');

      expect(result.success).toBe(false);
      expect(result.details?.clinicOnly).toBe(true);
    });
  });

  describe('handleExplainClinicTaskLogic (ai-cmd-provider-5.19.5)', () => {
    it('explains a single task detail, including who assigned it', async () => {
      const deps = buildDeps({
        providerMobile: {
          getProviderClinicTaskInbox: jest.fn(async () => ({
            viewMode: 'provider',
            labFeaturesEnabled: true,
            employee: { id: 'emp-1', name: 'Alex' },
            tasks: [
              {
                id: 'task-1',
                taskType: 'follow_up_call',
                status: 'open',
                title: 'Follow-up call',
                notes: 'Call about missed appointment',
                priority: 'high',
                dueAt: '2026-06-05T00:00:00.000Z',
                customerId: 'c1',
                customerName: 'Jane',
                bookingId: null,
                assigneeEmployeeId: 'emp-1',
                assigneeName: 'Alex',
                createdByEmployeeId: 'emp-2',
                createdByName: 'Sam',
                isAutoManaged: false,
                canClaim: false,
                canComplete: true,
                createdAt: '2026-06-01T00:00:00.000Z',
              },
            ],
          })),
        },
      });

      const result = await handleExplainClinicTaskLogic(
        deps,
        'biz-1',
        'user-1',
        {},
        'What is this follow-up task?',
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_clinic_task');
      expect(result.summary).toContain('Follow-up call');
      expect(result.summary).toContain('assigned by Sam');
      expect(result.summary).toContain('Call about missed appointment');
    });

    it('clarifies when multiple tasks match and none is specified', async () => {
      const deps = buildDeps({
        providerMobile: {
          getProviderClinicTaskInbox: jest.fn(async () => ({
            viewMode: 'provider',
            labFeaturesEnabled: true,
            employee: { id: 'emp-1', name: 'Alex' },
            tasks: [
              {
                id: 'task-1',
                taskType: 'follow_up_call',
                status: 'open',
                title: 'Follow-up call',
                notes: null,
                priority: 'normal',
                dueAt: null,
                customerId: 'c1',
                customerName: 'Jane',
                bookingId: null,
                assigneeEmployeeId: null,
                assigneeName: null,
                createdByEmployeeId: null,
                createdByName: null,
                isAutoManaged: false,
                canClaim: true,
                canComplete: true,
                createdAt: '2026-06-01T00:00:00.000Z',
              },
              {
                id: 'task-2',
                taskType: 'lab_review',
                status: 'open',
                title: 'Review CBC',
                notes: null,
                priority: 'normal',
                dueAt: null,
                customerId: 'c2',
                customerName: 'John',
                bookingId: null,
                assigneeEmployeeId: null,
                assigneeName: null,
                createdByEmployeeId: null,
                createdByName: null,
                isAutoManaged: false,
                canClaim: true,
                canComplete: true,
                createdAt: '2026-06-01T00:00:00.000Z',
              },
            ],
          })),
        },
      });

      const result = await handleExplainClinicTaskLogic(
        deps,
        'biz-1',
        'user-1',
        {},
        'What is this task?',
      );

      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });
  });

  describe('handleListLabResultsQueueLogic', () => {
    it('lists the assigned lab results queue', async () => {
      const deps = buildDeps({
        providerMobile: {
          getProviderLabResultsQueue: jest.fn(async () => ({
            lookbackDays: 30,
            viewMode: 'provider',
            labFeaturesEnabled: true,
            employee: { id: 'emp-1', name: 'Alex' },
            results: [
              {
                id: 'r1',
                testName: 'CBC',
                customerName: 'Jane',
                status: 'pending_review',
                measurementFlag: 'high',
              },
            ],
          })),
        },
      });

      const result = await handleListLabResultsQueueLogic(
        deps,
        'biz-1',
        'user-1',
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('list_lab_results_queue');
      expect(result.summary).toContain('1 flagged');
    });

    it('fails when clinic lab features are not enabled', async () => {
      const deps = buildDeps({
        providerMobile: {
          getProviderLabResultsQueue: jest.fn(async () => ({
            lookbackDays: 30,
            viewMode: 'provider',
            labFeaturesEnabled: false,
            employee: null,
            results: [],
          })),
        },
      });

      const result = await handleListLabResultsQueueLogic(
        deps,
        'biz-1',
        'user-1',
      );

      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clinicOnly: true });
    });
  });

  describe('handleClaimClinicTaskLogic', () => {
    it('claims a task by explicit taskId', async () => {
      const deps = buildDeps();
      const result = await handleClaimClinicTaskLogic(
        deps,
        'biz-1',
        'user-1',
        { taskId: 'task-1' },
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('claim_clinic_task');
      expect(deps.providerMobile.claimProviderClinicTask).toHaveBeenCalledWith(
        'biz-1',
        'user-1',
        'task-1',
      );
    });

    it('resolves a task by customerName when unambiguous', async () => {
      const deps = buildDeps();
      const result = await handleClaimClinicTaskLogic(
        deps,
        'biz-1',
        'user-1',
        { customerName: 'Jane' },
      );

      expect(result.success).toBe(true);
      expect(deps.providerMobile.claimProviderClinicTask).toHaveBeenCalledWith(
        'biz-1',
        'user-1',
        'task-1',
      );
    });

    it('auto-resolves the only task in the inbox when no filters given', async () => {
      const deps = buildDeps();
      const result = await handleClaimClinicTaskLogic(deps, 'biz-1', 'user-1', {});

      expect(result.success).toBe(true);
    });

    it('clarifies when the task cannot be uniquely resolved', async () => {
      const deps = buildDeps({
        providerMobile: {
          getProviderClinicTaskInbox: jest.fn(async () => ({
            viewMode: 'provider',
            labFeaturesEnabled: true,
            employee: null,
            tasks: [
              {
                id: 'task-1',
                taskType: 'follow_up_call',
                status: 'open',
                title: 'Follow-up call',
                notes: null,
                priority: 'normal',
                dueAt: null,
                customerId: 'c1',
                customerName: 'Jane',
                bookingId: null,
                assigneeEmployeeId: null,
                assigneeName: null,
                isAutoManaged: false,
                canClaim: true,
                canComplete: true,
                createdAt: '2026-06-01T00:00:00.000Z',
              },
              {
                id: 'task-2',
                taskType: 'follow_up_call',
                status: 'open',
                title: 'Follow-up call 2',
                notes: null,
                priority: 'normal',
                dueAt: null,
                customerId: 'c2',
                customerName: 'Jane Smith',
                bookingId: null,
                assigneeEmployeeId: null,
                assigneeName: null,
                isAutoManaged: false,
                canClaim: true,
                canComplete: true,
                createdAt: '2026-06-01T00:00:00.000Z',
              },
            ],
          })),
        },
      });

      const result = await handleClaimClinicTaskLogic(
        deps,
        'biz-1',
        'user-1',
        { customerName: 'Jane' },
      );

      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('fails when the resolved task cannot be claimed', async () => {
      const deps = buildDeps({
        providerMobile: {
          getProviderClinicTaskInbox: jest.fn(async () => ({
            viewMode: 'provider',
            labFeaturesEnabled: true,
            employee: null,
            tasks: [
              {
                id: 'task-1',
                taskType: 'follow_up_call',
                status: 'open',
                title: 'Follow-up call',
                notes: null,
                priority: 'normal',
                dueAt: null,
                customerId: 'c1',
                customerName: 'Jane',
                bookingId: null,
                assigneeEmployeeId: 'other-emp',
                assigneeName: 'Sam',
                isAutoManaged: false,
                canClaim: false,
                canComplete: false,
                createdAt: '2026-06-01T00:00:00.000Z',
              },
            ],
          })),
        },
      });

      const result = await handleClaimClinicTaskLogic(
        deps,
        'biz-1',
        'user-1',
        { taskId: 'task-1' },
      );

      expect(result.success).toBe(false);
      expect(result.summary).toContain('cannot be claimed');
    });
  });

  describe('handleCompleteClinicTaskLogic', () => {
    it('completes a task with optional notes', async () => {
      const deps = buildDeps();
      const result = await handleCompleteClinicTaskLogic(
        deps,
        'biz-1',
        'user-1',
        { taskId: 'task-1', notes: 'Called patient, no answer' },
      );

      expect(result.success).toBe(true);
      expect(
        deps.providerMobile.completeProviderClinicTask,
      ).toHaveBeenCalledWith('biz-1', 'user-1', 'task-1', {
        notes: 'Called patient, no answer',
      });
    });
  });

  describe('handleListBookingLabSummariesLogic', () => {
    it('lists lab summaries for a booking with access', async () => {
      const deps = buildDeps({
        clinicTestResultsService: {
          listBookingLabSummaries: jest.fn(async () => [
            {
              id: 's1',
              testName: 'CBC',
              orderStatus: 'completed',
              resultStatus: 'released',
              measurementFlag: 'high',
            },
          ]),
        },
      });

      const result = await handleListBookingLabSummariesLogic(
        deps,
        'biz-1',
        'user-1',
        { bookingId: 'b1' },
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('list_booking_lab_summaries');
      expect(
        deps.clinicLabAccessService.assertBookingLabAccess,
      ).toHaveBeenCalledWith('biz-1', 'user-1', 'b1');
    });

    it('clarifies when no bookingId is given', async () => {
      const deps = buildDeps();
      const result = await handleListBookingLabSummariesLogic(
        deps,
        'biz-1',
        'user-1',
        {},
      );

      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('fails when access is denied', async () => {
      const deps = buildDeps({
        clinicLabAccessService: {
          assertBookingLabAccess: jest.fn(async () => {
            throw new Error('Not assigned to this booking');
          }),
        },
      });

      const result = await handleListBookingLabSummariesLogic(
        deps,
        'biz-1',
        'user-1',
        { bookingId: 'b1' },
      );

      expect(result.success).toBe(false);
      expect(result.summary).toBe('Not assigned to this booking');
    });
  });
});
