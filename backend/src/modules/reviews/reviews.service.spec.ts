import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { EventType } from '../../events/event-types.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('ReviewsService', () => {
  const reviewRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const employeeRepo = { findOne: jest.fn() };
  const bookingRepo = { findOne: jest.fn(), save: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const customerRepo = { findOne: jest.fn() };
  const firebase = { isReady: false };
  const eventStore = { publish: jest.fn() };

  const service = new ReviewsService(
    reviewRepo as any,
    employeeRepo as any,
    bookingRepo as any,
    businessRepo as any,
    customerRepo as any,
    firebase as any,
    eventStore as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    reviewRepo.create.mockImplementation((v) => v);
    reviewRepo.save.mockImplementation(async (v) => ({ id: 'rev-1', ...v }));
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      businessId: 'biz-1',
    });
  });

  it('creates review and publishes review.received event', async () => {
    const review = await service.create('biz-1', {
      employeeId: 'emp-1',
      rating: 5,
      comment: 'Great',
      customerName: 'Jane',
      bookingId: 'book-1',
    });

    expect(review.id).toBe('rev-1');
    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: EventType.REVIEW_RECEIVED,
        aggregateId: 'rev-1',
        businessId: 'biz-1',
        payload: expect.objectContaining({ rating: 5, comment: 'Great' }),
      }),
    );
  });

  it('rejects invalid rating', async () => {
    await expect(
      service.create('biz-1', { employeeId: 'emp-1', rating: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing employee', async () => {
    employeeRepo.findOne.mockResolvedValue(null);
    await expect(
      service.create('biz-1', { employeeId: 'emp-1', rating: 4 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('api-bug.3 — listPublicProviderReviews rejects non-UUID employeeId with 400', async () => {
    await expect(
      service.listPublicProviderReviews('salon', 'nonexistent-emp-id'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.listPublicProviderReviews('salon', 'nonexistent-emp-id'),
    ).rejects.toThrow('employeeId must be a valid UUID');
    expect(employeeRepo.findOne).not.toHaveBeenCalled();
    expect(businessRepo.findOne).not.toHaveBeenCalled();
  });

  it('api-bug.3 — submitProviderPortalReview rejects non-UUID employeeId with 400', async () => {
    await expect(
      service.submitProviderPortalReview(
        'salon',
        'nonexistent-emp-id',
        { rating: 5 },
        'cust-1',
      ),
    ).rejects.toThrow('employeeId must be a valid UUID');
    expect(employeeRepo.findOne).not.toHaveBeenCalled();
  });

  it('rejects duplicate booking review', async () => {
    reviewRepo.findOne.mockResolvedValue({ id: 'existing' });
    await expect(
      service.create('biz-1', {
        employeeId: 'emp-1',
        rating: 4,
        bookingId: 'book-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  describe('e2e-bug.118 — review token before completion status', () => {
    beforeEach(() => {
      businessRepo.findOne.mockResolvedValue({ id: 'biz-1', slug: 'salon' });
    });

    const bookingId = '11111111-1111-4111-8111-111111111111';

    it('e2e-bug.117 — non-UUID bookingId is a clean 400 before DB lookup', async () => {
      await expect(
        service.getPublicContext('salon', 'not-a-uuid', 'any-token'),
      ).rejects.toThrow('bookingId must be a UUID');
      expect(bookingRepo.findOne).not.toHaveBeenCalled();
    });

    it('wrong token on a non-completed booking returns generic invalid-link (not status)', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: bookingId,
        businessId: 'biz-1',
        status: BookingStatus.CONFIRMED,
        metadata: { reviewToken: 'real-token' },
        business: { name: 'Salon' },
        employee: { name: 'Alex' },
        service: { name: 'Cut' },
        customer: { name: 'Pat' },
        startTime: new Date(),
      });

      await expect(
        service.getPublicContext('salon', bookingId, 'wrong-token'),
      ).rejects.toThrow('Invalid or expired review link');
    });

    it('valid token on a non-completed booking may reveal status after auth', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: bookingId,
        businessId: 'biz-1',
        status: BookingStatus.CONFIRMED,
        metadata: { reviewToken: 'real-token' },
        business: { name: 'Salon' },
        employee: { name: 'Alex' },
        service: { name: 'Cut' },
        customer: { name: 'Pat' },
        startTime: new Date(),
      });

      await expect(
        service.getPublicContext('salon', bookingId, 'real-token'),
      ).rejects.toThrow(
        'Reviews are available after your appointment is completed',
      );
    });

    it('valid token on a completed booking returns context', async () => {
      const startTime = new Date('2026-07-01T10:00:00.000Z');
      const endTime = new Date('2026-07-01T11:00:00.000Z');
      bookingRepo.findOne.mockResolvedValue({
        id: bookingId,
        businessId: 'biz-1',
        status: BookingStatus.COMPLETED,
        metadata: { reviewToken: 'real-token' },
        business: { name: 'Salon' },
        employee: { name: 'Alex' },
        service: { name: 'Cut' },
        customer: { name: 'Pat' },
        startTime,
        endTime,
      });
      reviewRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getPublicContext('salon', bookingId, 'real-token'),
      ).resolves.toMatchObject({
        businessName: 'Salon',
        employeeName: 'Alex',
        alreadySubmitted: false,
        appointmentDate: startTime.toISOString(),
        // e2e-bug.59 — end must differ from start for real-duration display
        appointmentEndDate: endTime.toISOString(),
      });
    });
  });
});
