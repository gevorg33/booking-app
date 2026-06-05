import { describe, expect, it } from '@jest/globals';
import {
  buildApprovalAlertPayload,
  buildPendingApprovalDetails,
  mapExecutionTimeline,
} from './orchestration-result.util.js';

describe('orchestration-result.util', () => {
  describe('mapExecutionTimeline', () => {
    it('maps workflow steps with plan descriptions', () => {
      const timeline = mapExecutionTimeline({
        plan: { steps: [{ id: 's1', description: 'Apply template' }] },
        result: {
          steps: [
            { stepId: 's1', status: 'completed' },
            { stepId: 's2', status: 'failed', error: 'busy' },
          ],
        },
      });
      expect(timeline).toHaveLength(2);
      expect(timeline![0].description).toBe('Apply template');
      expect(timeline![1].canRetry).toBe(true);
      expect(timeline![1].error).toBe('busy');
    });

    it('returns undefined for empty or missing steps', () => {
      expect(mapExecutionTimeline({})).toBeUndefined();
      expect(mapExecutionTimeline({ result: { steps: [] } })).toBeUndefined();
    });
  });

  describe('buildPendingApprovalDetails', () => {
    it('includes wizard mode for setup_week_schedule', () => {
      const details = buildPendingApprovalDetails({
        action: 'setup_week_schedule',
        taskId: 't1',
        status: 'requires_approval',
        planDiff: [
          { id: '1', action: 'apply_template', description: 'Apply', impact: 'Team' },
          { id: '2', action: 'fill_schedule_gaps', description: 'Fill', impact: 'Slots' },
        ],
        policyPreview: {
          decision: 'requires_approval',
          riskLevel: 'high',
          violations: ['bulk change'],
        },
        employeeCount: 3,
        daySpan: 7,
      });
      expect(details.wizardMode).toBe(true);
      expect(details.wizardSteps).toHaveLength(2);
      expect(details.policyExplain).toMatchObject({
        riskLevel: 'high',
      });
      expect(details.requiresApproval).toBe(true);
    });

    it('skips wizard for single-step plans', () => {
      const details = buildPendingApprovalDetails({
        action: 'setup_week_schedule',
        taskId: 't1',
        status: 'validated',
        planDiff: [{ id: '1', action: 'x', description: 'One', impact: 'One' }],
      });
      expect(details.wizardMode).toBe(false);
      expect(details.wizardSteps).toBeUndefined();
    });
  });

  describe('buildApprovalAlertPayload', () => {
    it('builds conflict alert with resolve prompt', () => {
      const alert = buildApprovalAlertPayload('resolve_conflicts', 'task-1', 4);
      expect(alert.alertType).toBe('conflict');
      expect(alert.prompt).toContain('Resolve');
      expect(alert.taskId).toBe('task-1');
    });

    it('builds generic approval alert', () => {
      const alert = buildApprovalAlertPayload('setup_week_schedule', 'task-2', 3);
      expect(alert.alertType).toBe('approval');
      expect(alert.prompt).toBeUndefined();
      expect(alert.message).toContain('3-step');
    });
  });
});
