import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { EventType } from '../../events/event-types.js';

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
});
