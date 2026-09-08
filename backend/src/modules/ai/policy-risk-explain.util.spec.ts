import { describe, expect, it } from '@jest/globals';
import { buildPolicyRiskExplain } from './policy-risk-explain.util.js';
import {
  makeAgentPlan,
  makeAgentPlanStep,
} from '../../engine/agent/interfaces/agent.test-fixture.js';

describe('buildPolicyRiskExplain', () => {
  it('describes multi-provider multi-day high risk', () => {
    const result = buildPolicyRiskExplain({
      policyPreview: {
        decision: 'requires_approval',
        riskLevel: 'high',
        violations: ['Too many bookings affected'],
      },
      plan: makeAgentPlan({
        steps: [makeAgentPlanStep({ id: '1' }), makeAgentPlanStep({ id: '2' })],
        riskAssessment: { level: 'high', factors: [] },
      }),
      employeeCount: 3,
      daySpan: 7,
    });
    expect(result.headline).toContain('3 providers × 7 days');
    expect(result.riskLevel).toBe('high');
    expect(result.explanation).toContain('approval');
    expect(result.explanation).toContain('Too many bookings');
  });

  it('falls back to step count for small scope', () => {
    const result = buildPolicyRiskExplain({
      plan: makeAgentPlan({ steps: [makeAgentPlanStep({ id: 'a' })], riskAssessment: { level: 'low', factors: [] } }),
      employeeCount: 1,
      daySpan: 1,
    });
    expect(result.riskLevel).toBe('low');
    expect(result.headline).toContain('1 step');
  });

  it('maps critical risk to high', () => {
    const result = buildPolicyRiskExplain({
      policyPreview: { riskLevel: 'critical', violations: [] },
      plan: makeAgentPlan({ steps: [] }),
    });
    expect(result.riskLevel).toBe('high');
  });

  it('uses provider-only and day-only scope phrases', () => {
    const providersOnly = buildPolicyRiskExplain({
      plan: makeAgentPlan({ steps: [makeAgentPlanStep({ id: '1' }), makeAgentPlanStep({ id: '2' })] }),
      employeeCount: 4,
      daySpan: 1,
    });
    expect(providersOnly.headline).toContain('4 providers');

    const daysOnly = buildPolicyRiskExplain({
      plan: makeAgentPlan({ steps: [makeAgentPlanStep({ id: '1' })] }),
      employeeCount: 1,
      daySpan: 5,
    });
    expect(daysOnly.headline).toContain('5 days');

    const stepsOnly = buildPolicyRiskExplain({
      plan: makeAgentPlan({ steps: [makeAgentPlanStep({ id: '1' }), makeAgentPlanStep({ id: '2' }), makeAgentPlanStep({ id: '3' })] }),
      employeeCount: 1,
      daySpan: 1,
    });
    expect(stepsOnly.headline).toContain('3 step');
  });

  it('covers non-approval decision and medium risk without violations', () => {
    const result = buildPolicyRiskExplain({
      policyPreview: {
        decision: 'allow',
        riskLevel: 'unknown',
        violations: [],
      },
      plan: makeAgentPlan({ steps: [makeAgentPlanStep({ id: '1' })] }),
      employeeCount: 1,
      daySpan: 1,
    });
    expect(result.riskLevel).toBe('medium');
    expect(result.explanation).toContain('flagged this 1-step plan');
    expect(result.headline).toContain('Review required');
  });

  it('uses providers-only scope when multiple providers and one day', () => {
    const result = buildPolicyRiskExplain({
      plan: makeAgentPlan({ steps: [makeAgentPlanStep({ id: '1' }), makeAgentPlanStep({ id: '2' })] }),
      employeeCount: 3,
      daySpan: 1,
    });
    expect(result.headline).toContain('3 providers');
    expect(result.headline).not.toContain('×');
  });

  it('handles missing plan steps', () => {
    const result = buildPolicyRiskExplain({
      policyPreview: { riskLevel: 'medium', violations: [] },
    });
    expect(result.explanation).toContain('0-step plan');
  });

  it('uses low-risk headline', () => {
    const result = buildPolicyRiskExplain({
      policyPreview: { riskLevel: 'low', violations: [] },
      plan: makeAgentPlan({ steps: [makeAgentPlanStep({ id: '1' })] }),
      employeeCount: 1,
      daySpan: 1,
    });
    expect(result.headline).toContain('Policy check');
  });
});
