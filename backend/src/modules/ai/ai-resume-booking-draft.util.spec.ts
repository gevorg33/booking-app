import {
  CUSTOMER_PUBLIC_RESUME_BOOKING_DRAFT_CLASSIFIER_RULES,
  isResumeBookingDraftPrompt,
  parseBookingDraftFromParams,
  parseResumeBookingDraftFromPrompt,
  rescueResumeBookingDraftIntent,
  buildResumeBookingDraftNavigate,
  resolveAbandonedStepFromDraft,
  hasResumableBookingProgress,
  isBookingDraftStale,
} from './ai-resume-booking-draft.util.js';
import {
  RESUME_BOOKING_DRAFT_PROMPTS,
  RESUME_BOOKING_DRAFT_RESCUE_SCENARIOS,
} from './ai-resume-booking-draft.fixtures.js';
import { RESUME_BOOKING_DRAFT_MULTILINGUAL_SCENARIOS } from './ai-resume-booking-draft-multilingual.fixtures.js';
import { isResumePendingPaymentPrompt } from './ai-resume-pending-payment.util.js';

describe('ai-resume-booking-draft.util', () => {
  it('exports classifier rules for resume_booking_draft', () => {
    expect(CUSTOMER_PUBLIC_RESUME_BOOKING_DRAFT_CLASSIFIER_RULES).toContain(
      'resume_booking_draft',
    );
  });

  it.each(RESUME_BOOKING_DRAFT_PROMPTS.map((row) => [row.id, row] as const))(
    'detects resume booking draft prompt for $id',
    (_id, row) => {
      expect(isResumeBookingDraftPrompt(row.prompt)).toBe(true);
      expect(parseResumeBookingDraftFromPrompt(row.prompt)).toEqual({
        draft: null,
      });
      expect(rescueResumeBookingDraftIntent(row.prompt, 'unknown')).toEqual({
        action: 'resume_booking_draft',
        rescueReason: 'resume_booking_draft',
      });
    },
  );

  it.each(
    RESUME_BOOKING_DRAFT_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual resume booking draft prompt for $id', (_id, row) => {
    expect(isResumeBookingDraftPrompt(row.prompt)).toBe(true);
    expect(rescueResumeBookingDraftIntent(row.prompt, 'unknown')?.action).toBe(
      'resume_booking_draft',
    );
  });

  it.each(
    RESUME_BOOKING_DRAFT_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues $id from misclassified action', (_id, row) => {
    expect(
      rescueResumeBookingDraftIntent(row.prompt, row.misclassifiedAction),
    ).toEqual({
      action: row.expectedAction,
      rescueReason: 'resume_booking_draft',
    });
  });

  it('steals generic left-off from resume_pending_payment', () => {
    expect(isResumeBookingDraftPrompt('Continue where I left off')).toBe(true);
    expect(isResumePendingPaymentPrompt('Continue where I left off')).toBe(
      false,
    );
    expect(
      isResumePendingPaymentPrompt('Pick up where I left off on payment'),
    ).toBe(true);
    expect(
      isResumeBookingDraftPrompt('Pick up where I left off on payment'),
    ).toBe(false);
  });

  it('parses booking draft from nested session params', () => {
    expect(
      parseBookingDraftFromParams({
        bookingDraft: {
          slug: 'glow-nails',
          serviceId: 'svc-1',
          date: '2026-06-10',
          slot: '2026-06-10T14:00:00.000Z',
          updatedAt: '2026-06-09T12:00:00.000Z',
        },
      }),
    ).toEqual({
      slug: 'glow-nails',
      serviceId: 'svc-1',
      date: '2026-06-10',
      slot: '2026-06-10T14:00:00.000Z',
      updatedAt: '2026-06-09T12:00:00.000Z',
    });
  });

  it('parses booking draft from flat session params', () => {
    expect(
      parseBookingDraftFromParams({
        bookingDraftSlug: 'glow-nails',
        bookingDraftServiceId: 'svc-1',
        bookingDraftUpdatedAt: '2026-06-09T12:00:00.000Z',
        bookingDraftDate: '2026-06-10',
      }),
    ).toEqual({
      slug: 'glow-nails',
      serviceId: 'svc-1',
      date: '2026-06-10',
      updatedAt: '2026-06-09T12:00:00.000Z',
    });
  });

  it('resolves abandoned step and navigate payload', () => {
    const draft = {
      slug: 'glow-nails',
      serviceId: 'svc-1',
      date: '2026-06-10',
      slot: '2026-06-10T14:00:00.000Z',
      updatedAt: '2026-06-09T12:00:00.000Z',
    };
    expect(resolveAbandonedStepFromDraft(draft)).toBe('confirm');
    expect(hasResumableBookingProgress(draft)).toBe(true);
    expect(buildResumeBookingDraftNavigate(draft)).toEqual({
      path: 'checkout',
      query: {
        serviceId: 'svc-1',
        resume: '1',
        date: '2026-06-10',
        slot: '2026-06-10T14:00:00.000Z',
        startTime: '2026-06-10T14:00:00.000Z',
      },
    });
  });

  it('detects stale booking drafts', () => {
    const draft = {
      slug: 'glow-nails',
      serviceId: 'svc-1',
      updatedAt: '2020-01-01T00:00:00.000Z',
    };
    expect(
      isBookingDraftStale(draft, new Date('2026-06-01T00:00:00.000Z')),
    ).toBe(true);
  });
});
