import { validateCommand } from './command-completion.validator.js';
import { handleExplainDepositForfeitureLogic } from './ai-explain-deposit-forfeiture.logic.js';
import {
  EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS,
  EXPLAIN_DEPOSIT_FORFEITURE_RESCUE_SCENARIOS,
} from './ai-explain-deposit-forfeiture.fixtures.js';
import { rescueExplainDepositForfeitureIntent } from './ai-explain-deposit-forfeiture.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_EXPLAIN_DEPOSIT_FORFEITURE_CASES } from './eval/ai-command-eval.cases.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { rescueExplainCancelPolicyIntent } from './ai-explain-cancel-policy.util.js';
import { EXPLAIN_CANCEL_POLICY_RESCUE_SCENARIOS } from './ai-explain-cancel-policy.fixtures.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai-explain-deposit-forfeiture integration (ai-cmd-customer-4.20.2)', () => {
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
            defaultServiceDepositPercent: 50,
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

  it.each(
    EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS.filter((e) => e.surface === 'customer'),
  )('validates and executes $id', async ({ prompt }) => {
    const validation = validateCommand(makeResolvedCommand({
      action: 'explain_deposit_forfeiture',
      params: {},
      enrichedParams: {},
      entities: { employees: [], services: [] },
      reasoning: 'test',
      prompt,
    }));
    expect(validation.issues).toEqual([]);

    const result = await handleExplainDepositForfeitureLogic(
      deps() as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_deposit_forfeiture');
  });

  it.each(EXPLAIN_DEPOSIT_FORFEITURE_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainDepositForfeitureIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(
    EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS.filter(
      (e) => e.surface === 'customer',
    ).slice(0, 3),
  )('pipeline rescues explain_deposit_forfeiture for $id', ({ prompt }) => {
    const rescued = rescue.rescue({
      prompt,
      action: 'unknown',
      params: {},
      surface: 'customer',
    });
    expect(rescued?.action).toBe('explain_deposit_forfeiture');
  });

  it.each(
    EXPLAIN_CANCEL_POLICY_RESCUE_SCENARIOS.filter((s) => 'expectNoRescue' in s),
  )(
    'cancel policy does not steal deposit prompt $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainCancelPolicyIntent(prompt, misclassifiedAction),
      ).toBeNull();
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_DEPOSIT_FORFEITURE_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
