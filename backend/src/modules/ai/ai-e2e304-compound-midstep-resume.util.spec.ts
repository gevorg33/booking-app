import {
  AgentType,
  PlanStatus,
  type AgentPlan,
} from '../../engine/agent/interfaces/agent.interfaces.js';
import {
  E2E304_CLARIFY_FIELD_CASES,
  E2E304_FOLLOW_UP_CASES,
} from './ai-e2e304-compound-midstep-resume.fixtures.js';
import {
  attachCompoundResumeToClarifyResult,
  extractClarifyFieldsFromFollowUpPrompt,
  isCompoundClarifyFollowUpPrompt,
  prependCompoundQueuedSummary,
  readCompoundResumeFromContext,
  shouldContinueCompoundResume,
} from './ai-compound-resume.util.js';

function samplePlan(intent: string): AgentPlan {
  return {
    id: `plan-${intent}`,
    agentType: AgentType.SCHEDULING_OPTIMIZATION,
    businessId: 'biz-1',
    intent,
    reasoning: `plan for ${intent}`,
    steps: [
      {
        id: `step-${intent}`,
        action: intent,
        description: intent,
        params: {},
        dependsOn: [],
      },
    ],
    constraints: [],
    riskAssessment: { level: 'low', factors: [] },
    status: PlanStatus.VALIDATED,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
  };
}

describe('e2e-bug.304: compound mid-step clarify resume', () => {
  const resumeContext = {
    compoundResumePlans: [
      {
        ...samplePlan('reschedule_booking'),
        createdAt: '2026-08-01T00:00:00.000Z',
      },
    ],
    compoundResumeSubIntents: [
      {
        action: 'reschedule_booking',
        params: { customerName: 'Gevorg' },
        reasoning: 'move',
      },
      {
        action: 'create_booking',
        params: { customerName: 'Anna', serviceName: 'massage' },
        reasoning: 'book',
      },
    ],
    compoundStepIndex: 1,
    compoundActions: ['reschedule_booking', 'create_booking'],
    compoundConfirmationPrompt:
      "Move Gevorg's appointment to Friday; then book a second massage for Anna",
  };

  it.each(E2E304_FOLLOW_UP_CASES)(
    'follow-up detect $id',
    ({ prompt, expectFollowUp, expectResume }) => {
      expect(isCompoundClarifyFollowUpPrompt(prompt)).toBe(expectFollowUp);
      expect(shouldContinueCompoundResume(prompt, resumeContext)).toBe(
        expectResume,
      );
    },
  );

  it.each(E2E304_CLARIFY_FIELD_CASES)(
    'extract fields $id',
    ({ prompt, expect: expected }) => {
      expect(extractClarifyFieldsFromFollowUpPrompt(prompt)).toEqual(
        expect.objectContaining(expected),
      );
    },
  );

  it('reads resume payload from context', () => {
    const resume = readCompoundResumeFromContext(resumeContext);
    expect(resume?.plans).toHaveLength(1);
    expect(resume?.plans[0].intent).toBe('reschedule_booking');
    expect(resume?.stepIndex).toBe(1);
    expect(resume?.compoundActions).toEqual([
      'reschedule_booking',
      'create_booking',
    ]);
  });

  it('attaches resume plans and sets action to compound_intent', () => {
    const clarify = attachCompoundResumeToClarifyResult(
      {
        success: false,
        action: 'create_booking',
        summary: 'I need one more detail: Start time is required.',
        details: {
          needsClarification: true,
          sessionContext: { customerName: 'Anna' },
        },
      },
      {
        plans: [samplePlan('reschedule_booking')],
        subIntents: resumeContext.compoundResumeSubIntents,
        stepIndex: 1,
        compoundActions: ['reschedule_booking', 'create_booking'],
        confirmationPrompt: resumeContext.compoundConfirmationPrompt,
        compoundStep: 'create_booking',
      },
    );

    expect(clarify.action).toBe('compound_intent');
    expect(clarify.summary).toContain('Also queued from earlier steps');
    expect(clarify.summary).toContain('reschedule_booking');
    expect(clarify.details?.compoundResumePlans).toHaveLength(1);
    expect(clarify.details?.compoundStep).toBe('create_booking');
    expect(clarify.details?.confirmationPrompt).toBe(
      resumeContext.compoundConfirmationPrompt,
    );
    expect(
      (clarify.details?.sessionContext as Record<string, unknown>)
        ?.compoundResumePlans,
    ).toHaveLength(1);
  });

  it('attaches resume even when prior plans array is empty', () => {
    const clarify = attachCompoundResumeToClarifyResult(
      {
        success: false,
        action: 'create_booking',
        summary: 'I need one more detail: Start time is required.',
        details: { needsClarification: true },
      },
      {
        plans: [],
        subIntents: resumeContext.compoundResumeSubIntents,
        stepIndex: 1,
        compoundActions: ['reschedule_booking', 'create_booking'],
        confirmationPrompt: resumeContext.compoundConfirmationPrompt,
        compoundStep: 'create_booking',
      },
    );
    expect(clarify.action).toBe('compound_intent');
    expect(clarify.summary).toContain('Also continuing compound');
    expect(clarify.details?.compoundResumeSubIntents).toHaveLength(2);
    expect(clarify.details?.compoundResumePlans).toEqual([]);
  });

  it('prepends queued summary', () => {
    expect(
      prependCompoundQueuedSummary('Need start time.', [
        samplePlan('reschedule_booking'),
      ]),
    ).toBe(
      'Also queued from earlier steps (reschedule_booking). Need start time.',
    );
  });
});
