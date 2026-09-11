import {
  buildHolidayModePlanMeta,
  buildOnboardProviderPlanMeta,
  buildRebalanceCapacityPlanMeta,
  buildRebalanceCapacityPlanSteps,
  buildSwapSchedulesPlanMeta,
  buildSwapSchedulesPlanSteps,
  mergeHolidayModeSteps,
  mergeOnboardProviderSteps,
} from './ai-scheduling-plan.util.js';
import { makeAgentPlanStep } from '../../engine/agent/interfaces/agent.test-fixture.js';

describe('ai-scheduling-plan.util', () => {
  const period = {
    startTime: '09:00',
    endTime: '17:00',
    type: 'service_block',
    serviceIds: [],
  };
  let id = 0;
  const idFactory = () => `step-${++id}`;

  beforeEach(() => {
    id = 0;
  });

  it('builds swap schedule steps for one and many days', () => {
    const steps = buildSwapSchedulesPlanSteps({
      businessId: 'biz-1',
      userId: 'u1',
      idFactory,
      swaps: [
        {
          date: '2026-06-06',
          employeeA: { id: 'e1', name: 'Gevorg', periods: [period] },
          employeeB: { id: 'e2', name: 'Maria', periods: [period] },
        },
        {
          date: '2026-06-07',
          employeeA: { id: 'e1', name: 'Gevorg', periods: [period] },
          employeeB: { id: 'e2', name: 'Maria', periods: [period] },
        },
      ],
    });
    expect(steps).toHaveLength(8);
    expect(steps[2].dependsOn).toEqual(['step-1', 'step-2']);

    const lowRisk = buildSwapSchedulesPlanMeta(
      [{ employeeA: { name: 'Gevorg' }, employeeB: { name: 'Maria' } }],
      steps.slice(0, 4),
    );
    expect(lowRisk.risk.level).toBe('medium');

    const highRisk = buildSwapSchedulesPlanMeta(
      [{ employeeA: { name: 'Gevorg' }, employeeB: { name: 'Maria' } }],
      steps,
    );
    expect(highRisk.risk.level).toBe('high');
    expect(highRisk.reasoning).toContain('Gevorg ↔ Maria');
  });

  it('builds rebalance capacity steps and risk metadata', () => {
    const steps = buildRebalanceCapacityPlanSteps({
      businessId: 'biz-1',
      toName: 'Maria',
      idFactory,
      moves: [
        {
          bookingId: 'b1',
          label: 'Move booking',
          startTime: '2026-06-06T10:00:00.000Z',
          employeeId: 'e2',
          serviceId: 's1',
        },
      ],
    });
    expect(steps[0].action).toBe('reschedule_booking');

    const low = buildRebalanceCapacityPlanMeta({
      fromName: 'Gevorg',
      toName: 'Maria',
      serviceName: 'facemassage',
      date: '2026-06-06',
      movesCount: 2,
    });
    expect(low.risk.level).toBe('low');

    const medium = buildRebalanceCapacityPlanMeta({
      fromName: 'Gevorg',
      toName: 'Maria',
      serviceName: 'facemassage',
      date: '2026-06-06',
      movesCount: 4,
    });
    expect(medium.risk.level).toBe('medium');
  });

  it('uses default id factories when none are provided', () => {
    const steps = buildSwapSchedulesPlanSteps({
      businessId: 'biz-1',
      swaps: [
        {
          date: '2026-06-06',
          employeeA: { id: 'e1', name: 'Gevorg', periods: [period] },
          employeeB: { id: 'e2', name: 'Maria', periods: [period] },
        },
      ],
    });
    expect(steps).toHaveLength(4);
    expect(
      buildRebalanceCapacityPlanSteps({
        businessId: 'biz-1',
        toName: 'Maria',
        moves: [
          {
            bookingId: 'b1',
            label: 'Move',
            startTime: '2026-06-06T10:00:00.000Z',
            employeeId: 'e2',
            serviceId: 's1',
          },
        ],
      }),
    ).toHaveLength(1);
  });

  it('merges holiday mode steps and metadata', () => {
    const merged = mergeHolidayModeSteps({
      blockSteps: [
        {
          id: 'b1',
          action: 'create_block_schedule',
          description: 'close',
          params: {},
          dependsOn: [],
        },
      ],
      extendPlans: [
        {
          steps: [
            makeAgentPlanStep({
              id: 'e1',
              action: 'create_direct_schedule',
              description: 'extend',
            }),
          ],
        },
      ],
    });
    expect(merged).toHaveLength(2);
    expect(merged[1].dependsOn).toContain('b1');

    const withoutExtend = buildHolidayModePlanMeta({
      closeDates: ['2026-12-24'],
      allStepsCount: 3,
    });
    expect(withoutExtend.reasoning).not.toContain('extend');

    const withExtend = buildHolidayModePlanMeta({
      closeDates: ['2026-12-24', '2026-12-25'],
      extendDate: '2026-12-23',
      allStepsCount: 9,
    });
    expect(withExtend.risk.level).toBe('high');
    expect(withExtend.reasoning).toContain('2026-12-23');
  });

  it('merges onboard provider steps and metadata', () => {
    const merged = mergeOnboardProviderSteps({
      applySteps: [
        {
          id: 'a1',
          action: 'apply_template',
          description: 'apply',
          params: {},
          dependsOn: [],
        },
      ],
      assignSteps: [
        makeAgentPlanStep({
          id: 's1',
          action: 'assign_employee_services',
          description: 'assign',
        }),
      ],
    });
    expect(merged[1].dependsOn).toContain('a1');

    const withServices = buildOnboardProviderPlanMeta({
      employeeName: 'Anna',
      templateName: 'Weekday',
      serviceNames: ['massage'],
      hasAssignPlan: true,
      allStepsCount: 2,
    });
    expect(withServices.reasoning).toContain('assign massage');

    const scheduleOnly = buildOnboardProviderPlanMeta({
      employeeName: 'Anna',
      templateName: 'Weekday',
      serviceNames: [],
      hasAssignPlan: false,
      allStepsCount: 5,
    });
    expect(scheduleOnly.risk.level).toBe('medium');
    expect(scheduleOnly.risk.factors).toContain('Schedule only');
  });
});
