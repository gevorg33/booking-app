import type { Business } from '../business/entities/business.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { handleCancelPackageVisitSelfLogic } from './ai-cancel-package-visit-self.logic.js';
import {
  CANCEL_PACKAGE_VISIT_SELF_PROMPTS,
  CANCEL_PACKAGE_VISIT_SELF_RESCUE_SCENARIOS,
} from './ai-cancel-package-visit-self.fixtures.js';
import { rescueCancelPackageVisitSelfIntent } from './ai-cancel-package-visit-self.util.js';
import type { CancelPackageVisitSelfLogicDeps } from './ai-cancel-package-visit-self.logic.js';

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

function buildDeps(overrides: Partial<CancelPackageVisitSelfLogicDeps> = {}) {
  return {
    businessRepo: {
      findOne: jest.fn().mockResolvedValue(business),
    },
    publicCustomerAuthService: {
      listBookings: jest.fn().mockResolvedValue({ bookings: [packageBooking] }),
    },
    publicCustomerBookingService: {
      cancelPackageVisit: jest
        .fn()
        .mockResolvedValue({ bookings: [packageBooking] }),
    },
    ...overrides,
  } satisfies CancelPackageVisitSelfLogicDeps;
}

describe('ai-cancel-package-visit-self.logic (ai-cmd-customer-4.15.2)', () => {
  it.each(
    CANCEL_PACKAGE_VISIT_SELF_PROMPTS.slice(0, 4).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles cancel_package_visit_self for $0', async (_id, prompt) => {
    const result = await handleCancelPackageVisitSelfLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('cancel_package_visit_self');
    expect(result.details?.navigate?.path).toBe('/account');
  });

  it('requires sign-in', async () => {
    const result = await handleCancelPackageVisitSelfLogic(
      buildDeps(),
      'biz-1',
      {},
      'Cancel my package visit',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Sign in');
  });

  it('clarifies when no package visit matches', async () => {
    const result = await handleCancelPackageVisitSelfLogic(
      buildDeps({
        publicCustomerAuthService: {
          listBookings: jest.fn().mockResolvedValue({ bookings: [] }),
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Cancel my package visit',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('clarifies when multiple package visits match', async () => {
    const result = await handleCancelPackageVisitSelfLogic(
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
      'Cancel my package visit',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('several upcoming package visits');
  });

  it('cancels by visit index', async () => {
    const cancelPackageVisit = jest
      .fn()
      .mockResolvedValue({ bookings: [packageBooking] });
    await handleCancelPackageVisitSelfLogic(
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
        publicCustomerBookingService: { cancelPackageVisit },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1', visitIndex: 2 },
      'Cancel visit 2 of my package',
    );
    expect(cancelPackageVisit).toHaveBeenCalledWith(
      'salon',
      'cust-1',
      'book-pkg-2',
    );
  });

  const futurePackageBooking = {
    ...packageBooking,
    startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
  };

  it('mentions the refund when the package purchase was refunded', async () => {
    const result = await handleCancelPackageVisitSelfLogic(
      buildDeps({
        publicCustomerAuthService: {
          listBookings: jest
            .fn()
            .mockResolvedValue({ bookings: [futurePackageBooking] }),
        },
        publicCustomerBookingService: {
          cancelPackageVisit: jest.fn().mockResolvedValue({
            bookings: [futurePackageBooking],
            refundStatus: 'refunded',
          }),
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Cancel my package visit',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('refunded');
    expect(result.details?.refundStatus).toBe('refunded');
  });

  it('mentions the manual follow-up when the automatic refund fails', async () => {
    const result = await handleCancelPackageVisitSelfLogic(
      buildDeps({
        publicCustomerAuthService: {
          listBookings: jest
            .fn()
            .mockResolvedValue({ bookings: [futurePackageBooking] }),
        },
        publicCustomerBookingService: {
          cancelPackageVisit: jest.fn().mockResolvedValue({
            bookings: [futurePackageBooking],
            refundStatus: 'failed',
          }),
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Cancel my package visit',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain("didn't go through");
  });

  it('handles missing business and API errors', async () => {
    expect(
      (
        await handleCancelPackageVisitSelfLogic(
          buildDeps({
            businessRepo: { findOne: jest.fn().mockResolvedValue(null) },
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1' },
          'Cancel my package visit',
        )
      ).summary,
    ).toContain('Business not found');

    const cancelPackageVisit = jest
      .fn()
      .mockRejectedValue(new Error('policy blocked'));
    expect(
      (
        await handleCancelPackageVisitSelfLogic(
          buildDeps({
            publicCustomerBookingService: { cancelPackageVisit },
          }),
          'biz-1',
          { sessionCustomerId: 'cust-1', bookingId: 'book-pkg-1' },
          'Cancel my package visit',
        )
      ).success,
    ).toBe(false);
  });

  it('clarifies on unrecognized prompt text', async () => {
    const result = await handleCancelPackageVisitSelfLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it.each(CANCEL_PACKAGE_VISIT_SELF_RESCUE_SCENARIOS)(
    'rescue fixture $id maps to cancel_package_visit_self',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueCancelPackageVisitSelfIntent(prompt, misclassifiedAction)?.action,
      ).toBe('cancel_package_visit_self');
    },
  );
});
