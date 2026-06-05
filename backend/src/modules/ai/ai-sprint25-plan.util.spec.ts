import {
  buildHitlEscalationPlanMeta,
  buildHitlEscalationPlanSteps,
} from './ai-sprint25-plan.util.js';

describe('ai-sprint25-plan.util', () => {
  it('builds HITL escalation plan steps and meta', () => {
    const steps = buildHitlEscalationPlanSteps({
      businessId: 'biz-1',
      taskId: 'task-1',
      intent: 'swap_schedules',
      stuckMinutes: 35,
      idFactory: () => 'step-1',
    });
    expect(steps).toHaveLength(1);
    expect(steps[0].action).toBe('notify_owner');
    expect(steps[0].params.taskId).toBe('task-1');

    const meta = buildHitlEscalationPlanMeta({
      intent: 'swap_schedules',
      taskId: 'task-1',
      stuckMinutes: 35,
    });
    expect(meta.reasoning).toContain('swap_schedules');
    expect(meta.risk.level).toBe('medium');
  });

  it('uses default id factory', () => {
    const steps = buildHitlEscalationPlanSteps({
      businessId: 'biz-1',
      taskId: 'task-2',
      intent: 'holiday_mode',
      stuckMinutes: 45,
    });
    expect(steps[0].id).toBeTruthy();
  });
});
