import { beforeEach, describe, expect, it } from 'vitest';
import {
  MOCK_REVIEWABLE_BOOKING,
  POST_VISIT_REVIEW_SCENARIOS,
} from './store-review-prompt.fixtures.js';
import {
  buildDefaultSupportTicketMessage,
  buildPublicSupportUrl,
  getCompletedBookingCount,
  incrementCompletedBookingCount,
  markPostVisitReviewPrompted,
  resetStoreReviewPromptForTests,
  resolvePostBookingSupportHandoff,
  resolvePostVisitReviewCandidate,
  resolveStoreReviewUrl,
  shouldPromptPostVisitReview,
} from './store-review-prompt.util.js';

describe('store-review-prompt.util', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStoreReviewPromptForTests();
  });

  it.each(POST_VISIT_REVIEW_SCENARIOS)(
    'shouldPromptPostVisitReview $id',
    ({ booking, expected }) => {
      expect(shouldPromptPostVisitReview(booking)).toBe(expected);
    },
  );

  it('prompts only once per completed booking', () => {
    expect(shouldPromptPostVisitReview(MOCK_REVIEWABLE_BOOKING)).toBe(true);
    markPostVisitReviewPrompted(MOCK_REVIEWABLE_BOOKING.id);
    expect(shouldPromptPostVisitReview(MOCK_REVIEWABLE_BOOKING)).toBe(false);
  });

  it('resolves the most recent reviewable booking', () => {
    const candidate = resolvePostVisitReviewCandidate([
      {
        ...MOCK_REVIEWABLE_BOOKING,
        id: 'bk-old',
        endTime: '2026-04-01T10:00:00.000Z',
      },
      {
        ...MOCK_REVIEWABLE_BOOKING,
        id: 'bk-new',
        endTime: '2026-05-01T10:00:00.000Z',
      },
    ]);
    expect(candidate?.id).toBe('bk-new');
  });

  it('tracks completed booking count', () => {
    expect(getCompletedBookingCount()).toBe(0);
    expect(incrementCompletedBookingCount()).toBe(1);
    expect(getCompletedBookingCount()).toBe(1);
  });

  it('resolveStoreReviewUrl returns null when env unset', () => {
    expect(resolveStoreReviewUrl('web')).toBeNull();
  });

  it('builds support ticket default message with service name', () => {
    expect(buildDefaultSupportTicketMessage('Haircut')).toContain('Haircut');
  });

  it('buildPublicSupportUrl adds support query params', () => {
    expect(buildPublicSupportUrl('salon-a', 'bk-1', 'https://app.test')).toBe(
      'https://app.test/book/salon-a?support=1&bookingId=bk-1',
    );
  });

  it.each([
    {
      id: 'zendesk-ticket',
      input: {
        slug: 'salon-a',
        bookingId: 'bk-1',
        hasCustomerToken: true,
        customerEmail: 'a@test.com',
      },
      expected: 'zendesk_ticket' as const,
    },
    {
      id: 'support-web',
      input: {
        slug: 'salon-a',
        bookingId: 'bk-1',
        hasCustomerToken: false,
        customerEmail: null,
        zendeskWidgetConfigured: true,
      },
      expected: 'support_web' as const,
    },
  ])('resolvePostBookingSupportHandoff $id', ({ input, expected }) => {
    expect(
      resolvePostBookingSupportHandoff({
        slug: input.slug,
        bookingId: input.bookingId,
        hasCustomerToken: input.hasCustomerToken,
        customerEmail: input.customerEmail,
        zendeskWidgetConfigured: input.zendeskWidgetConfigured ?? false,
      }),
    ).toBe(expected);
  });
});
