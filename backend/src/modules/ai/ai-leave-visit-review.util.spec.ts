import {
  LEAVE_VISIT_REVIEW_BOUNDARY_PROMPTS,
  LEAVE_VISIT_REVIEW_PROMPTS,
  LEAVE_VISIT_REVIEW_RESCUE_SCENARIOS,
} from './ai-leave-visit-review.fixtures.js';
import { LEAVE_VISIT_REVIEW_MULTILINGUAL_SCENARIOS } from './ai-leave-visit-review-multilingual.fixtures.js';
import {
  enrichLeaveVisitReviewParamsFromPrompt,
  extractVisitReviewRatingFromPrompt,
  isLeaveVisitReviewIntent,
  isLeaveVisitReviewPrompt,
  matchCustomerReviewableBooking,
  parseLeaveVisitReviewFromPrompt,
  rescueLeaveVisitReviewIntent,
  buildLeaveVisitReviewAmbiguousSummary,
} from './ai-leave-visit-review.util.js';

describe('ai-leave-visit-review.util (ai-cmd-customer-4.12.1)', () => {
  it.each(LEAVE_VISIT_REVIEW_PROMPTS.map((row) => [row.id, row.prompt]))(
    'detects prompt %s',
    (_id, prompt) => {
      expect(isLeaveVisitReviewPrompt(prompt)).toBe(true);
    },
  );

  it.each(
    LEAVE_VISIT_REVIEW_MULTILINGUAL_SCENARIOS.map((row) => [
      row.id,
      row.prompt,
    ]),
  )('detects multilingual prompt %s', (_id, prompt) => {
    expect(isLeaveVisitReviewPrompt(prompt)).toBe(true);
  });

  it.each(LEAVE_VISIT_REVIEW_BOUNDARY_PROMPTS)(
    'rejects boundary prompt $id',
    ({ prompt }) => {
      expect(isLeaveVisitReviewPrompt(prompt)).toBe(false);
    },
  );

  it('e2e-bug.146 — does not steal sales tax / commission rate mutates', () => {
    expect(
      isLeaveVisitReviewPrompt('Set my sales tax rate to 8.5 percent'),
    ).toBe(false);
    expect(
      isLeaveVisitReviewPrompt(
        'Set commission rate for Gevorg Gasparyan to 20 percent',
      ),
    ).toBe(false);
  });

  it.each(LEAVE_VISIT_REVIEW_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueLeaveVisitReviewIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('extracts rating from prompt and params', () => {
    expect(
      extractVisitReviewRatingFromPrompt(
        'Give 5 stars for my last appointment',
        {},
      ),
    ).toBe(5);
    expect(
      extractVisitReviewRatingFromPrompt('Rate my visit', { rating: 4 }),
    ).toBe(4);
  });

  it('parses leave_visit_review params', () => {
    const parsed = parseLeaveVisitReviewFromPrompt(
      "Leave a review for today's haircut",
      {},
    );
    expect(parsed?.serviceName).toMatch(/haircut/i);
  });

  it('e2e-bug.111 — strips my/visit wrapper from service name + rating', () => {
    const parsed = parseLeaveVisitReviewFromPrompt(
      'leave a 5 star review for my facemassage visit',
      {},
    );
    expect(parsed?.rating).toBe(5);
    expect(parsed?.serviceName?.toLowerCase()).toBe('facemassage');
  });

  it('enriches params and matches reviewable bookings', () => {
    expect(
      enrichLeaveVisitReviewParamsFromPrompt(
        {},
        'Give 5 stars for my last visit',
      ),
    ).toMatchObject({ rating: 5 });
    const matched = matchCustomerReviewableBooking(
      [
        {
          id: 'b1',
          serviceName: 'Haircut',
          startTime: '2030-01-01T10:00:00.000Z',
          endTime: '2030-01-01T11:00:00.000Z',
          canReview: true,
        },
        {
          id: 'b2',
          serviceName: 'Massage',
          startTime: '2030-01-02T10:00:00.000Z',
          endTime: '2030-01-02T11:00:00.000Z',
          canReview: true,
        },
      ],
      {},
      'Rate my last visit',
      'UTC',
    );
    expect(matched.booking?.id).toBe('b2');
    expect(
      buildLeaveVisitReviewAmbiguousSummary([
        { serviceName: 'Facial', startTime: '2030-01-01T10:00:00.000Z' },
      ]),
    ).toMatch(/Multiple completed visits/);
  });

  it('recognizes leave_visit_review intent', () => {
    expect(isLeaveVisitReviewIntent('leave_visit_review')).toBe(true);
  });

  it('extracts Armenian and Russian ratings', () => {
    expect(
      extractVisitReviewRatingFromPrompt('5 աստղ վերջին այցի համար', {}),
    ).toBe(5);
    expect(extractVisitReviewRatingFromPrompt('Поставьте 4 звезды', {})).toBe(
      4,
    );
  });

  it('parses quoted review comments', () => {
    const parsed = parseLeaveVisitReviewFromPrompt(
      'Rate my last visit "Great stylist"',
      {},
    );
    expect(parsed?.comment).toBe('Great stylist');
  });

  it('resolves bookingId matches', () => {
    const matched = matchCustomerReviewableBooking(
      [
        {
          id: 'b1',
          serviceName: 'Haircut',
          startTime: '2030-01-01T10:00:00.000Z',
          endTime: '2030-01-01T11:00:00.000Z',
          canReview: true,
        },
      ],
      { bookingId: 'b1' },
      'Rate my visit',
      'UTC',
    );
    expect(matched.booking?.id).toBe('b1');
  });
});
