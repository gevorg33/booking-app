import type { Business } from '../business/entities/business.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { handleReschedulePackageVisitSelfLogic } from './ai-reschedule-package-visit-self.logic.js';
import {
  RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS,
  RESCHEDULE_PACKAGE_VISIT_SELF_RESCUE_SCENARIOS,
} from './ai-reschedule-package-visit-self.fixtures.js';
import { rescueReschedulePackageVisitSelfIntent } from './ai-reschedule-package-visit-self.util.js';
import type { ReschedulePackageVisitSelfLogicDeps } from './ai-reschedule-package-visit-self.logic.js';

const business = {
  id: 'biz-1',
  slug: 'salon',
} as Business;

const packageBooking = {
  id: 'book-pkg-1',
  startTime: '2026-07-10T10:00:00.000Z',
  status: BookingStatus.CONFIRMED,
  packagePurchaseId: 'purchase-1',
  packageName: 'Spa Day',
  serviceName: 'Massage',
  employeeName: 'Maria',
};

function buildDeps(
  overrides: Partial<ReschedulePackageVisitSelfLogicDeps> = {},
) {
  return {
    businessRepo: {
      findOne: jest.fn().mockResolvedValue(business),
    },
    publicCustomerAuthService: {
      listBookings: jest.fn().mockResolvedValue({ bookings: [packageBooking] }),
    },
    publicCustomerBookingService: {
      reschedulePackageVisit: jest.fn().mockResolvedValue({
        bookings: [packageBooking],
        previousStartTime: packageBooking.startTime,
      }),
    },
    ...overrides,
  } satisfies ReschedulePackageVisitSelfLogicDeps;
}

describe('ai-reschedule-package-visit-self.logic (ai-cmd-customer-4.15.3)', () => {
  it.each(
    RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS.slice(0, 4).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles reschedule_package_visit_self for $0', async (_id, prompt) => {
    const result = await handleReschedulePackageVisitSelfLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('reschedule_package_visit_self');
    expect(result.details?.navigate?.path).toBe('/account');
  });

  it('requires sign-in', async () => {
    const result = await handleReschedulePackageVisitSelfLogic(
      buildDeps(),
      'biz-1',
      {},
      'Reschedule my package visit',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Sign in');
  });

  it('clarifies when no package visit matches', async () => {
    const result = await handleReschedulePackageVisitSelfLogic(
      buildDeps({
        publicCustomerAuthService: {
          listBookings: jest.fn().mockResolvedValue({ bookings: [] }),
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Reschedule my package visit',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('clarifies when multiple package visits match', async () => {
    const result = await handleReschedulePackageVisitSelfLogic(
      buildDeps({
        publicCustomerAuthService: {
          listBookings: jest.fn().mockResolvedValue({
            bookings: [
              packageBooking,
              {
                ...packageBooking,
                id: 'book-pkg-2',
                startTime: '2026-07-17T10:00:00.000Z',
              },
            ],
          }),
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Reschedule my package visit',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('several upcoming package visits');
  });

  it('navigates to slot picker when lines are missing', async () => {
    const result = await handleReschedulePackageVisitSelfLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1', bookingId: 'book-pkg-1' },
      'Move my spa day to next week',
    );
    expect(result.success).toBe(true);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.navigate?.query).toEqual(
      expect.objectContaining({ reschedulePackage: 'book-pkg-1' }),
    );
  });

  it('reschedules by visit index when lines are provided', async () => {
    const reschedulePackageVisit = jest.fn().mockResolvedValue({
      bookings: [packageBooking],
      previousStartTime: packageBooking.startTime,
    });
    await handleReschedulePackageVisitSelfLogic(
      buildDeps({
        publicCustomerAuthService: {
          listBookings: jest.fn().mockResolvedValue({
            bookings: [
              packageBooking,
              {
                ...packageBooking,
                id: 'book-pkg-2',
                startTime: '2026-07-17T10:00:00.000Z',
              },
            ],
          }),
        },
        publicCustomerBookingService: { reschedulePackageVisit },
      }),
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        visitIndex: 2,
        lines: [
          {
            bookingId: 'book-pkg-2',
            startTime: '2026-07-20T10:00:00.000Z',
          },
        ],
      },
      'Reschedule visit 2 of my package',
    );
    expect(reschedulePackageVisit).toHaveBeenCalledWith(
      'salon',
      'cust-1',
      'book-pkg-2',
      {
        lines: [
          {
            bookingId: 'book-pkg-2',
            startTime: '2026-07-20T10:00:00.000Z',
          },
        ],
      },
    );
  });

  it('handles missing business and API errors', async () => {
    expect(
      (
        await handleReschedulePackageVisitSelfLogic(
          buildDeps({
            businessRepo: { findOne: jest.fn().mockResolvedValue(null) },
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
          'Reschedule my package visit',
        )
      ).summary,
    ).toContain('Business not found');

    const reschedulePackageVisit = jest
      .fn()
      .mockRejectedValue(new Error('policy blocked'));
    expect(
      (
        await handleReschedulePackageVisitSelfLogic(
          buildDeps({
            publicCustomerBookingService: { reschedulePackageVisit },
          }),
          'biz-1',
          {
            sessionCustomerId: 'cust-1',
            bookingId: 'book-pkg-1',
            lines: [
              {
                bookingId: 'book-pkg-1',
                startTime: '2026-07-20T10:00:00.000Z',
              },
            ],
          },
          'Reschedule my package visit',
        )
      ).success,
    ).toBe(false);
  });

  it('clarifies on unrecognized prompt text', async () => {
    const result = await handleReschedulePackageVisitSelfLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it.each(RESCHEDULE_PACKAGE_VISIT_SELF_RESCUE_SCENARIOS)(
    'rescue fixture $id maps to reschedule_package_visit_self',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueReschedulePackageVisitSelfIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('reschedule_package_visit_self');
    },
  );
});
