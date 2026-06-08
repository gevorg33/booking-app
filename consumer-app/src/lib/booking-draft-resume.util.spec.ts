import { describe, expect, it } from 'vitest';
import {
  BOOKING_DRAFT_REDIRECT_SCENARIOS,
  BOOKING_DRAFT_RESUME_CONTEXT_SCENARIOS,
  BOOKING_DRAFT_RESUME_COPY_SCENARIOS,
} from './booking-draft-resume.fixtures.js';
import {
  buildBookingDraftResumeCopy,
  readBookingDraftResumeContext,
  resolveAbandonedBookingRedirectPath,
  resolveBookingDraftResumeAnalyticsProps,
  shouldDeferNavigationForAbandonedBooking,
  shouldRedirectToAbandonedBooking,
} from './booking-draft-resume.util.js';

describe('booking-draft-resume.util (n99-3.4)', () => {
  it.each(BOOKING_DRAFT_RESUME_CONTEXT_SCENARIOS)(
    'readBookingDraftResumeContext $id',
    ({
      input,
      expectResume,
      expectStep,
      expectSkipDiscovery,
      expectCollapseSchedule,
    }) => {
      const context = readBookingDraftResumeContext(input);
      expect(context.isResume).toBe(expectResume);
      expect(context.abandonedStep).toBe(expectStep);
      expect(context.skipSlotDiscovery).toBe(expectSkipDiscovery);
      expect(context.collapseScheduleUi).toBe(expectCollapseSchedule);
    },
  );

  it.each(BOOKING_DRAFT_REDIRECT_SCENARIOS)(
    'shouldRedirectToAbandonedBooking $id',
    ({ pathname, draft, stale, expectRedirect }) => {
      expect(shouldRedirectToAbandonedBooking({ pathname, draft, stale })).toBe(expectRedirect);
    },
  );

  it.each(BOOKING_DRAFT_RESUME_COPY_SCENARIOS)(
    'buildBookingDraftResumeCopy $id',
    ({ step, expectIncludes }) => {
      expect(buildBookingDraftResumeCopy(step, 'en').toLowerCase()).toContain(expectIncludes);
    },
  );

  it('resolveAbandonedBookingRedirectPath adds resume flag', () => {
    expect(
      resolveAbandonedBookingRedirectPath({
        slug: 'salon-a',
        serviceId: 'svc-1',
        slot: '2026-06-10T09:00:00.000Z',
        updatedAt: '2026-06-08T12:00:00.000Z',
      }),
    ).toContain('resume=1');
  });

  it('shouldDeferNavigationForAbandonedBooking ignores stale drafts', () => {
    expect(
      shouldDeferNavigationForAbandonedBooking(
        {
          slug: 'salon-a',
          serviceId: 'svc-1',
          date: '2026-06-10',
          updatedAt: '2026-05-01T12:00:00.000Z',
        },
        new Date('2026-06-08T12:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('resolveBookingDraftResumeAnalyticsProps tags open resume', () => {
    expect(
      resolveBookingDraftResumeAnalyticsProps({
        draft: {
          slug: 'salon-a',
          serviceId: 'svc-1',
          slot: '2026-06-10T09:00:00.000Z',
          updatedAt: '2026-06-08T12:00:00.000Z',
        },
        resumedOnOpen: true,
      }),
    ).toEqual({
      serviceId: 'svc-1',
      abandonedStep: 'confirm',
      firstRunRedirect: 'abandonment_resume',
    });
  });
});
