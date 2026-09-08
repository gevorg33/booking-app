import { validateCommand } from './command-completion.validator.js';
import { handleExplainPostVisitReviewPromptLogic } from './ai-explain-post-visit-review-prompt.logic.js';
import {
  EXPLAIN_POST_VISIT_REVIEW_PROMPT_PROMPTS,
  EXPLAIN_POST_VISIT_REVIEW_PROMPT_RESCUE_SCENARIOS,
} from './ai-explain-post-visit-review-prompt.fixtures.js';
import { rescueExplainPostVisitReviewPromptIntent } from './ai-explain-post-visit-review-prompt.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_EXPLAIN_POST_VISIT_REVIEW_PROMPT_CASES } from './eval/ai-command-eval.cases.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai-explain-post-visit-review-prompt integration (ai-cmd-customer-4.12.2)', () => {
  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        slug: 'glow-salon',
      })),
    },
    publicCustomerAuthService: {
      listBookings: jest.fn(async () => ({ bookings: [] })),
    },
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(EXPLAIN_POST_VISIT_REVIEW_PROMPT_PROMPTS)(
    'validates and executes $id',
    async ({ prompt }) => {
      const validation = validateCommand(makeResolvedCommand({
        action: 'explain_post_visit_review_prompt',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const result = await handleExplainPostVisitReviewPromptLogic(
        deps() as any,
        'biz-1',
        { sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_post_visit_review_prompt');
    },
  );

  it.each(EXPLAIN_POST_VISIT_REVIEW_PROMPT_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainPostVisitReviewPromptIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(EXPLAIN_POST_VISIT_REVIEW_PROMPT_PROMPTS.slice(0, 3))(
    'pipeline rescues explain_post_visit_review_prompt for $id',
    ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        surface: 'customer',
      });
      expect(rescued?.action).toBe('explain_post_visit_review_prompt');
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_POST_VISIT_REVIEW_PROMPT_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
