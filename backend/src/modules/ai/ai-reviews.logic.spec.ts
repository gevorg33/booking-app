import {
  handleListReviewsLogic,
  handleSubmitReviewLogic,
  type ReviewsLogicDeps,
} from './ai-reviews.logic.js';

function buildDeps(
  overrides: Partial<ReviewsLogicDeps> = {},
): ReviewsLogicDeps {
  return {
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', name: 'Test Salon' })),
    } as any,
    employeeRepo: {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(async () => [{ id: 'emp-1', name: 'Maria' }]),
      })),
    } as any,
    reviewsService: {
      list: jest.fn(async () => [
        {
          id: 'rev-1',
          rating: 5,
          comment: 'Great cut',
          createdAt: new Date('2026-06-01T12:00:00Z'),
          employee: { name: 'Maria' },
          customerName: 'Anna',
          customer: { name: 'Anna' },
        },
      ]),
      summary: jest.fn(async () => [
        { employeeId: 'emp-1', reviewCount: 3, avgRating: 4.7 },
      ]),
      submitPublic: jest.fn(async () => ({
        id: 'rev-2',
        rating: 5,
      })),
    },
    ...overrides,
  };
}

describe('ai-reviews.logic (parity-2.1)', () => {
  it('lists reviews inbox for the business', async () => {
    const deps = buildDeps();
    const result = await handleListReviewsLogic(deps, 'biz-1', {});
    expect(result.success).toBe(true);
    expect(result.action).toBe('list_reviews');
    expect((result.details as any).reviewCount).toBe(3);
    expect((result.details as any).recentReviews).toHaveLength(1);
  });

  it('filters reviews by resolved employee', async () => {
    const deps = buildDeps();
    const result = await handleListReviewsLogic(deps, 'biz-1', {
      employeeName: 'Maria',
    });
    expect(result.success).toBe(true);
    expect((result.details as any).employeeId).toBe('emp-1');
  });

  it('returns business not found', async () => {
    const deps = buildDeps({
      businessRepo: { findOne: jest.fn(async () => null) } as any,
    });
    const result = await handleListReviewsLogic(deps, 'missing', {});
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Business not found/);
  });

  it('clarifies missing booking link for submit_review', async () => {
    const deps = buildDeps();
    const result = await handleSubmitReviewLogic(deps, 'biz-1', 'salon', {
      rating: 5,
    });
    expect(result.success).toBe(false);
    expect((result.details as any).clarify).toBe(true);
  });

  it('clarifies missing rating for submit_review', async () => {
    const deps = buildDeps();
    const result = await handleSubmitReviewLogic(deps, 'biz-1', 'salon', {
      bookingId: 'b1',
      token: 'tok',
    });
    expect(result.success).toBe(false);
    expect((result.details as any).missing).toContain('rating');
  });

  it('submits a public review', async () => {
    const deps = buildDeps();
    const result = await handleSubmitReviewLogic(deps, 'biz-1', 'salon', {
      bookingId: 'b1',
      token: 'tok',
      rating: 5,
      comment: 'Loved it',
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('submit_review');
    expect(deps.reviewsService.submitPublic).toHaveBeenCalled();
  });
});
