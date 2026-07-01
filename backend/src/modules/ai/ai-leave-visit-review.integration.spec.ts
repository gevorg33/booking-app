import { validateCommand } from './command-completion.validator.js';
import { handleLeaveVisitReviewLogic } from './ai-leave-visit-review.logic.js';
import {
  LEAVE_VISIT_REVIEW_PROMPTS,
  LEAVE_VISIT_REVIEW_RESCUE_SCENARIOS,
} from './ai-leave-visit-review.fixtures.js';
import { rescueLeaveVisitReviewIntent } from './ai-leave-visit-review.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_LEAVE_VISIT_REVIEW_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-leave-visit-review integration (ai-cmd-customer-4.12.1)', () => {
  const booking = {
    id: 'book-1',
    startTime: '2030-06-01T10:00:00.000Z',
    endTime: '2030-06-01T11:00:00.000Z',
    status: 'completed',
    serviceName: 'Haircut',
    employeeName: 'Alex',
    canReview: true,
  };

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'glow-salon' })),
    },
    publicCustomerAuthService: {
      listBookings: jest.fn(async () => ({ bookings: [booking] })),
    },
    publicBookingService: {
      submitCustomerReview: jest.fn(async () => ({
        id: 'rev-1',
        rating: 5,
      })),
    },
    bookingRepo: {},
    publicCustomerBookingService: {},
    publicCustomerWaitlistService: {},
    notificationsService: {},
    packagesService: {},
    subscriptionsService: {},
    multiServiceBookingsService: {},
    configService: {},
    serviceRepo: {},
  });

  it.each(LEAVE_VISIT_REVIEW_PROMPTS)(
    'validates and executes $id',
    async ({ prompt, serviceName, rating }) => {
      const validation = validateCommand({
        action: 'leave_visit_review',
        params: {},
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const localDeps = deps();
      if (serviceName) {
        localDeps.publicCustomerAuthService.listBookings = jest.fn(
          async () => ({
            bookings: [
              {
                ...booking,
                serviceName:
                  serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
              },
            ],
          }),
        );
      }

      const result = await handleLeaveVisitReviewLogic(
        localDeps as any,
        'biz-1',
        { sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('leave_visit_review');
      if (rating) {
        expect(
          localDeps.publicBookingService.submitCustomerReview,
        ).toHaveBeenCalled();
      }
    },
  );

  it.each(LEAVE_VISIT_REVIEW_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueLeaveVisitReviewIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_LEAVE_VISIT_REVIEW_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
