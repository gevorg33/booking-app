import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiReviewsService } from './ai-reviews.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { REVIEWS_SCENARIOS } from './ai-reviews.fixtures.js';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ReviewsService } from '../reviews/reviews.service.js';

describe('parity-2.1 reviews AI scenarios', () => {
  const reviewsService = {
    list: jest.fn(async () => [
      {
        id: 'rev-1',
        rating: 4,
        comment: 'Nice service',
        createdAt: new Date('2026-06-02T10:00:00Z'),
        employee: { name: 'Maria' },
        customerName: 'Anna',
        customer: { name: 'Anna' },
      },
    ]),
    summary: jest.fn(async () => [
      { employeeId: 'emp-1', reviewCount: 2, avgRating: 4.5 },
    ]),
    submitPublic: jest.fn(async () => ({ id: 'rev-2', rating: 5 })),
  };

  let reviews: AiReviewsService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiReviewsService,
        AiIntentRescueService,
        { provide: ReviewsService, useValue: reviewsService },
        {
          provide: getRepositoryToken(Business),
          useValue: {
            findOne: jest.fn(async () => ({ id: 'biz-1', name: 'Test Salon' })),
          },
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn(async () => [{ id: 'emp-1', name: 'Maria' }]),
            })),
          },
        },
      ],
    }).compile();

    reviews = module.get(AiReviewsService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('rescue routing', () => {
    it.each(REVIEWS_SCENARIOS.filter((row) => row.surface === 'dashboard'))(
      'rescues dashboard scenario $id',
      ({ prompt, expectedAction }) => {
        const result = rescue.rescue({ prompt, action: 'unknown', params: {} });
        expect(result?.action).toBe(expectedAction);
        expect(result?.rescued).toBe(true);
      },
    );
  });

  describe('handlers', () => {
    it('lists dashboard reviews inbox', async () => {
      const result = await reviews.handleListReviews('biz-1', {});
      expect(result.success).toBe(true);
      expect(result.action).toBe('list_reviews');
      expect(reviewsService.list).toHaveBeenCalledWith('biz-1', undefined);
    });

    it('submits public review when link context present', async () => {
      const result = await reviews.handleSubmitReview('biz-1', 'salon', {
        bookingId: 'b1',
        token: 'tok',
        rating: 5,
      });
      expect(result.success).toBe(true);
      expect(reviewsService.submitPublic).toHaveBeenCalled();
    });
  });
});
