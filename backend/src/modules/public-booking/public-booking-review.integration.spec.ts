import { PublicBookingService } from './public-booking.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('PublicBookingService customer reviews (adopt-6.3)', () => {
  const business = {
    id: 'biz-1',
    slug: 'demo-salon',
    name: 'Demo Salon',
    isActive: true,
    subscriptionPlanId: 'starter',
    subscriptionStatus: 'active',
    settings: {},
  };

  const booking = {
    id: 'bk-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    employeeId: 'emp-1',
    serviceId: 'svc-1',
    status: BookingStatus.COMPLETED,
    metadata: {},
    customer: { id: 'cust-1', name: 'Alex' },
  };

  const businessService = {
    findBySlug: jest.fn().mockResolvedValue(business),
  };

  const reviewsService = {
    ensureReviewToken: jest.fn().mockResolvedValue('review-token'),
    getPublicContext: jest.fn().mockResolvedValue({
      businessName: 'Demo Salon',
      employeeName: 'Anna',
      serviceName: 'Haircut',
      customerName: 'Alex',
      appointmentDate: '2026-05-01T10:00:00.000Z',
      alreadySubmitted: false,
    }),
    submitPublic: jest.fn().mockResolvedValue({ id: 'rev-1', rating: 5 }),
    hasSubmittedReviewForBooking: jest.fn().mockResolvedValue(false),
  };

  const bookingRepo = {
    findOne: jest.fn().mockResolvedValue(booking),
  };

  const service = new PublicBookingService(
    businessService as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    reviewsService as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { get: jest.fn() } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    bookingRepo as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.findOne.mockResolvedValue(booking);
    reviewsService.hasSubmittedReviewForBooking.mockResolvedValue(false);
  });

  it('returns review session for a completed booking', async () => {
    await expect(
      service.getCustomerReviewSession('demo-salon', 'cust-1', 'bk-1'),
    ).resolves.toEqual(
      expect.objectContaining({
        bookingId: 'bk-1',
        token: 'review-token',
        serviceName: 'Haircut',
        alreadySubmitted: false,
      }),
    );
    expect(reviewsService.ensureReviewToken).toHaveBeenCalledWith('bk-1');
  });

  it('submits tenant review for signed-in customer', async () => {
    await expect(
      service.submitCustomerReview('demo-salon', 'cust-1', 'bk-1', {
        rating: 5,
        comment: 'Great cut',
      }),
    ).resolves.toEqual({ id: 'rev-1', rating: 5 });
    expect(reviewsService.submitPublic).toHaveBeenCalledWith(
      'demo-salon',
      expect.objectContaining({
        bookingId: 'bk-1',
        token: 'review-token',
        rating: 5,
        comment: 'Great cut',
      }),
    );
  });

  it('rejects review session when booking is not completed', async () => {
    bookingRepo.findOne.mockResolvedValueOnce({
      ...booking,
      status: BookingStatus.CONFIRMED,
    });
    await expect(
      service.getCustomerReviewSession('demo-salon', 'cust-1', 'bk-1'),
    ).rejects.toThrow('after your visit is completed');
  });
});
