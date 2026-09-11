import { handleLeaveVisitReviewLogic } from './ai-leave-visit-review.logic.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

describe('ai-leave-visit-review.logic (ai-cmd-customer-4.12.1)', () => {
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
      findOne: jest.fn(async () =>
        makeBusiness({ id: 'biz-1', slug: 'glow-salon' }),
      ),
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

  it('requires sign-in', async () => {
    const result = await handleLeaveVisitReviewLogic(
      deps() as any,
      'biz-1',
      {},
      'Rate my last visit',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Sign in/i);
  });

  it('opens review screen when no rating provided', async () => {
    const result = await handleLeaveVisitReviewLogic(
      deps() as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Rate my last visit',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('leave_visit_review');
    expect(result.summary).toMatch(/Opening the review screen/i);
    expect(result.details.navigate).toEqual({
      path: 'account',
      query: { reviewBookingId: 'book-1' },
    });
  });

  it('submits review when rating is provided', async () => {
    const localDeps = deps();
    const result = await handleLeaveVisitReviewLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Give 5 stars for my last appointment',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/5-star review/i);
    expect(
      localDeps.publicBookingService.submitCustomerReview,
    ).toHaveBeenCalled();
  });

  it('clarifies when multiple visits match with specific service', async () => {
    const localDeps = deps();
    localDeps.publicCustomerAuthService.listBookings = jest.fn(async () => ({
      bookings: [
        booking,
        {
          ...booking,
          id: 'book-2',
          startTime: '2030-06-02T10:00:00.000Z',
          endTime: '2030-06-02T11:00:00.000Z',
        },
      ],
    }));
    const result = await handleLeaveVisitReviewLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Rate my haircut visit',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Multiple completed visits/);
  });
});
