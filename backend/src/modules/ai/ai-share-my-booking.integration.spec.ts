import { validateCommand } from './command-completion.validator.js';
import { handleShareMyBookingLogic } from './ai-share-my-booking.logic.js';
import {
  SHARE_MY_BOOKING_PROMPTS,
  SHARE_MY_BOOKING_RESCUE_SCENARIOS,
} from './ai-share-my-booking.fixtures.js';
import { rescueShareMyBookingIntent } from './ai-share-my-booking.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_SHARE_MY_BOOKING_CASES } from './eval/ai-command-eval.cases.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('ai-share-my-booking integration (ai-cmd-customer-4.3.7)', () => {
  const deps = () => ({
    publicBookingService: {
      getCustomerShareRewards: jest.fn(async () => ({
        bookingShareEnabled: false,
        bookingRewardSummary: '',
        salonShareEnabled: false,
        salonRewardSummary: '',
      })),
    },
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'glow-salon' })),
    },
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(SHARE_MY_BOOKING_PROMPTS)(
    'validates and executes $id',
    async ({ prompt, bookingId }) => {
      const validation = validateCommand({
        action: 'share_my_booking',
        params: bookingId ? { bookingId } : {},
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleShareMyBookingLogic(
        deps() as any,
        'biz-1',
        {
          sessionCustomerId: 'cust-1',
          slug: 'glow-salon',
          ...(bookingId ? { bookingId } : {}),
        },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('share_my_booking');
    },
  );

  it.each(SHARE_MY_BOOKING_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueShareMyBookingIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(SHARE_MY_BOOKING_PROMPTS.slice(0, 3))(
    'pipeline rescues share_my_booking for $id',
    ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        surface: 'customer',
      });
      expect(rescued?.action).toBe('share_my_booking');
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_SHARE_MY_BOOKING_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
