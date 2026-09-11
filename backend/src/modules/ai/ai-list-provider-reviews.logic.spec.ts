import {
  handleListProviderReviewsLogic,
  type ListProviderReviewsLogicDeps,
} from './ai-list-provider-reviews.logic.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

function buildDeps(
  overrides: Partial<ListProviderReviewsLogicDeps> = {},
): ListProviderReviewsLogicDeps {
  const employees = [
    { id: 'emp-1', name: 'Anna Smith', isActive: true },
    { id: 'emp-2', name: 'James Lee', isActive: true },
  ];

  return {
    employeeRepo: {
      find: jest.fn(async () => employees),
    } as any,
    serviceRepo: {} as any,
    reviewsService: {
      listPublicProviderReviews: jest.fn(async () => ({
        employeeId: 'emp-1',
        employeeName: 'Anna Smith',
        employeeRole: 'Stylist',
        avatarUrl: null,
        averageRating: 4.7,
        reviewCount: 12,
        page: 1,
        limit: 15,
        totalPages: 1,
        items: [],
      })),
    } as any,
    businessRepo: {
      findOne: jest.fn(async () =>
        makeBusiness({ id: 'biz-1', slug: 'salon' }),
      ),
    } as any,
    ...overrides,
  };
}

describe('ai-list-provider-reviews.logic', () => {
  let deps: ListProviderReviewsLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('lists reviews for a named provider', async () => {
    const result = await handleListProviderReviewsLogic(deps, 'biz-1', {
      slug: 'salon',
      providerName: 'Anna',
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('list_provider_reviews');
    expect(result.summary).toContain('12 review(s)');
    expect(result.summary).toContain('4.7/5');
    expect(deps.reviewsService.listPublicProviderReviews).toHaveBeenCalledWith(
      'salon',
      'emp-1',
      1,
    );
  });

  it('lists reviews directly via employeeId', async () => {
    const result = await handleListProviderReviewsLogic(deps, 'biz-1', {
      slug: 'salon',
      employeeId: 'emp-1',
    });

    expect(result.success).toBe(true);
    expect(deps.employeeRepo.find).not.toHaveBeenCalled();
  });

  it('clarifies when no provider is named', async () => {
    const result = await handleListProviderReviewsLogic(deps, 'biz-1', {
      slug: 'salon',
    });

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toEqual(['providerName']);
  });

  it('fails when the provider cannot be resolved', async () => {
    const result = await handleListProviderReviewsLogic(deps, 'biz-1', {
      slug: 'salon',
      providerName: 'Nobody',
    });

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Nobody');
    expect(result.details?.availableProviders).toEqual([
      'Anna Smith',
      'James Lee',
    ]);
  });

  it('fails gracefully when business slug cannot be resolved', async () => {
    const result = await handleListProviderReviewsLogic(
      buildDeps({
        businessRepo: { findOne: jest.fn(async () => null) } as any,
      }),
      'biz-1',
      { providerName: 'Anna' },
    );

    expect(result.success).toBe(false);
    expect(result.summary).toBe('Business not found.');
  });

  it('resolves slug from businessId when params.slug is omitted (e2e-bug.82)', async () => {
    const result = await handleListProviderReviewsLogic(deps, 'biz-1', {
      providerName: 'Anna',
    });

    expect(result.success).toBe(true);
    expect(deps.reviewsService.listPublicProviderReviews).toHaveBeenCalledWith(
      'salon',
      'emp-1',
      1,
    );
  });

  it('handles review lookup failures', async () => {
    (
      deps.reviewsService.listPublicProviderReviews as jest.Mock
    ).mockRejectedValueOnce(new Error('Provider not found'));

    const result = await handleListProviderReviewsLogic(deps, 'biz-1', {
      slug: 'salon',
      employeeId: 'emp-1',
    });

    expect(result.success).toBe(false);
    expect(result.summary).toBe('Provider not found');
    expect(result.details?.reason).toBe('not_found');
  });
});
