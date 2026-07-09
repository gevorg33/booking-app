import { validateCommand } from './command-completion.validator.js';
import { handleResumeBookingDraftLogic } from './ai-resume-booking-draft.logic.js';
import {
  RESUME_BOOKING_DRAFT_PROMPTS,
  RESUME_BOOKING_DRAFT_RESCUE_SCENARIOS,
} from './ai-resume-booking-draft.fixtures.js';
import { rescueResumeBookingDraftIntent } from './ai-resume-booking-draft.util.js';

describe('ai resume booking draft integration (ai-cmd-customer-4.18.3)', () => {
  it.each(RESUME_BOOKING_DRAFT_PROMPTS)('validates $id', ({ prompt }) => {
    const validation = validateCommand({
      action: 'resume_booking_draft',
      params: {},
      enrichedParams: {},
      entities: {},
      reasoning: 'test',
      confidence: 0.9,
      prompt,
    });
    expect(validation.issues).toEqual([]);
  });

  it.each(RESUME_BOOKING_DRAFT_RESCUE_SCENARIOS)(
    'pipeline rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueResumeBookingDraftIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('executes handler with device draft context', async () => {
    const result = await handleResumeBookingDraftLogic(
      'biz-1',
      {
        bookingDraft: {
          slug: 'glow-nails',
          serviceId: 'svc-1',
          date: '2026-06-10',
          slot: '2026-06-10T14:00:00.000Z',
          updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
      },
      'Continue where I left off',
    );
    expect(result.action).toBe('resume_booking_draft');
    expect(result.success).toBe(true);
    expect(result.details?.abandonedStep).toBe('confirm');
  });
});
