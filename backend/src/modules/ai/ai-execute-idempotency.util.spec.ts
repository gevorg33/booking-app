import {
  buildExecuteRevalidationRejection,
  buildExecuteRevalidationSummary,
  detectIntraPlanDuplicateMutations,
  extractPlanMutationSteps,
  isTaskAlreadyExecuted,
  revalidatePlanBeforeExecute,
} from './ai-execute-idempotency.util.js';
import {
  EXECUTE_REVALIDATION_SUMMARY_SCENARIOS,
  INTRA_PLAN_DUPLICATE_SCENARIOS,
} from './ai-execute-idempotency.fixtures.js';
import { PlanStatus } from '../../engine/agent/interfaces/agent.interfaces.js';

describe('ai-execute-idempotency.util (acc-5.6)', () => {
  it.each(INTRA_PLAN_DUPLICATE_SCENARIOS)(
    '$id detectIntraPlanDuplicateMutations',
    (scenario) => {
      const issues = detectIntraPlanDuplicateMutations(
        extractPlanMutationSteps(scenario.plan),
      );
      expect(issues.map((issue) => issue.kind)).toEqual(
        scenario.expectIssueKinds,
      );
    },
  );

  it.each(EXECUTE_REVALIDATION_SUMMARY_SCENARIOS)(
    '$id buildExecuteRevalidationSummary',
    (scenario) => {
      const summary = buildExecuteRevalidationSummary(scenario.issues);
      expect(summary.toLowerCase()).toContain(
        scenario.expectIncludes.toLowerCase(),
      );
    },
  );

  it('buildExecuteRevalidationRejection marks stale plans as clarify', () => {
    const result = buildExecuteRevalidationRejection('create_booking', [
      { kind: 'stale_plan', message: 'stale' },
    ]);
    expect(result.details?.stalePlan).toBe(true);
    expect(result.details?.executeRevalidationFailed).toBe(true);
  });

  it('isTaskAlreadyExecuted blocks completed workflow tasks', () => {
    expect(
      isTaskAlreadyExecuted({
        status: PlanStatus.COMPLETED,
        workflowExecutionId: 'wf-1',
        result: { steps: [] },
      }),
    ).toBe(true);
  });

  it('isTaskAlreadyExecuted allows retry after post-exec assertion failure', () => {
    expect(
      isTaskAlreadyExecuted({
        status: PlanStatus.COMPLETED,
        workflowExecutionId: 'wf-1',
        result: { postExecAssertionFailed: true },
      }),
    ).toBe(false);
  });

  it('revalidatePlanBeforeExecute rejects stale plans at execute time', async () => {
    const result = await revalidatePlanBeforeExecute(
      {
        slotResolver: {
          checkSlotAvailability: jest.fn(),
          describeUnavailable: jest.fn(),
        },
        bookingRepo: {
          findOne: jest.fn(),
          createQueryBuilder: jest.fn(),
        },
        employeeRepo: { findOne: jest.fn() },
        serviceRepo: { findOne: jest.fn() },
      },
      {
        businessId: 'biz-1',
        plan: {
          ...INTRA_PLAN_DUPLICATE_SCENARIOS[2]!.plan,
          createdAt: new Date(Date.now() - 6 * 60 * 1000),
        },
        nowMs: Date.now(),
      },
    );
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.kind).toBe('stale_plan');
  });

  it('revalidatePlanBeforeExecute re-checks slot availability before execute', async () => {
    const checkSlotAvailability = jest.fn(async () => ({
      available: false,
      employeeId: 'e1',
      employeeName: 'Anna',
      hasSchedule: true,
      openSlots: [],
      reason: 'slot_unavailable',
    }));
    const describeUnavailable = jest.fn(
      () => 'Anna is not free at 09:00 on 2026-06-10 for Haircut.',
    );

    const result = await revalidatePlanBeforeExecute(
      {
        slotResolver: { checkSlotAvailability, describeUnavailable },
        bookingRepo: {
          findOne: jest.fn(async () => null),
          createQueryBuilder: jest.fn(),
        },
        employeeRepo: {
          findOne: jest.fn(async () => ({
            id: 'e1',
            name: 'Anna',
            businessId: 'biz-1',
            isActive: true,
          })),
        },
        serviceRepo: {
          findOne: jest.fn(async () => ({
            id: 'svc1',
            name: 'Haircut',
            businessId: 'biz-1',
          })),
        },
      },
      {
        businessId: 'biz-1',
        plan: INTRA_PLAN_DUPLICATE_SCENARIOS[2]!.plan,
      },
    );

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.kind).toBe('slot_unavailable');
    expect(checkSlotAvailability).toHaveBeenCalled();
  });
});
