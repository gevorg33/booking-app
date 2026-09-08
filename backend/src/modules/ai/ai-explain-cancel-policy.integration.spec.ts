import { validateCommand } from './command-completion.validator.js';
import { handleExplainCancelPolicyLogic } from './ai-explain-cancel-policy.logic.js';
import {
  EXPLAIN_CANCEL_POLICY_PROMPTS,
  EXPLAIN_CANCEL_POLICY_RESCUE_SCENARIOS,
} from './ai-explain-cancel-policy.fixtures.js';
import { rescueExplainCancelPolicyIntent } from './ai-explain-cancel-policy.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_EXPLAIN_CANCEL_POLICY_CASES } from './eval/ai-command-eval.cases.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai-explain-cancel-policy integration (ai-cmd-customer-4.4.4)', () => {
  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: {
          publicBooking: {
            customerSelfService: {
              allowCancel: true,
              allowReschedule: true,
              minimumNoticeHours: 24,
              maxReschedulesPerBooking: 3,
              allowProviderChangeOnReschedule: false,
            },
            defaultServicePrepaymentMode: 'deposit',
          },
        },
      })),
    },
    bookingRepo: { findOne: jest.fn(async () => null) },
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(EXPLAIN_CANCEL_POLICY_PROMPTS)(
    'validates and executes $id',
    async ({ prompt }) => {
      const validation = validateCommand(makeResolvedCommand({
        action: 'explain_cancel_policy',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const result = await handleExplainCancelPolicyLogic(
        deps() as any,
        'biz-1',
        { sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_cancel_policy');
    },
  );

  it.each(
    EXPLAIN_CANCEL_POLICY_RESCUE_SCENARIOS.filter(
      (s) => !('expectNoRescue' in s),
    ),
  )(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainCancelPolicyIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(
    EXPLAIN_CANCEL_POLICY_RESCUE_SCENARIOS.filter((s) => 'expectNoRescue' in s),
  )(
    'does not rescue deposit prompt to cancel policy for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainCancelPolicyIntent(prompt, misclassifiedAction),
      ).toBeNull();
    },
  );

  it.each(EXPLAIN_CANCEL_POLICY_PROMPTS.slice(0, 3))(
    'pipeline rescues explain_cancel_policy for $id',
    ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        surface: 'customer',
      });
      expect(rescued?.action).toBe('explain_cancel_policy');
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_CANCEL_POLICY_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
