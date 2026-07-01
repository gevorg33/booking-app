import { handleResumeBookingDraftLogic } from './ai-resume-booking-draft.logic.js';
import {
  RESUME_BOOKING_DRAFT_HANDLER_FIXTURES,
  RESUME_BOOKING_DRAFT_PROMPTS,
} from './ai-resume-booking-draft.fixtures.js';

describe('ai-resume-booking-draft.logic', () => {
  it.each(RESUME_BOOKING_DRAFT_HANDLER_FIXTURES)(
    'returns step-specific copy for $id',
    async ({ draft, abandonedStep }) => {
      const result = await handleResumeBookingDraftLogic(
        'biz-1',
        {
          bookingDraft: draft,
        },
        'Continue where I left off',
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('resume_booking_draft');
      expect(result.details?.abandonedStep).toBe(abandonedStep);
      expect(result.details?.navigate).toMatchObject({
        path: 'checkout',
        query: expect.objectContaining({
          resume: '1',
          serviceId: draft.serviceId,
        }),
      });
    },
  );

  it('fails when no draft on device', async () => {
    const result = await handleResumeBookingDraftLogic(
      'biz-1',
      {},
      RESUME_BOOKING_DRAFT_PROMPTS[0].prompt,
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('resume_booking_draft');
    expect(result.details?.missing).toEqual([
      'bookingDraftSlug',
      'bookingDraftServiceId',
      'bookingDraftUpdatedAt',
    ]);
  });

  it('fails when draft is stale', async () => {
    const result = await handleResumeBookingDraftLogic(
      'biz-1',
      {
        bookingDraft: {
          slug: 'glow-nails',
          serviceId: 'svc-1',
          date: '2026-06-10',
          updatedAt: '2020-01-01T00:00:00.000Z',
        },
      },
      'Restore my half-finished booking',
    );
    expect(result.success).toBe(false);
    expect(result.details?.stale).toBe(true);
  });

  it('fails clarify when prompt does not match', async () => {
    const result = await handleResumeBookingDraftLogic(
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
