import {
  handleSubmitProviderReviewLogic,
  type SubmitProviderReviewLogicDeps,
} from './ai-submit-provider-review.logic.js';

const employees = [
  { id: 'emp-1', name: 'Anna', businessId: 'biz-1', isActive: true },
  { id: 'emp-2', name: 'James', businessId: 'biz-1', isActive: true },
] as any[];

function buildDeps(
  overrides: Partial<SubmitProviderReviewLogicDeps> = {},
): SubmitProviderReviewLogicDeps {
  return {
    employeeRepo: {
      find: jest.fn(async () => employees),
    } as any,
    reviewsService: {
      submitProviderPortalReview: jest.fn(async () => ({
        id: 'rev-1',
        rating: 5,
        comment: null,
        customerName: 'Sam',
        createdAt: '2026-06-01T10:00:00.000Z',
      })),
    },
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'salon' })),
    } as any,
    ...overrides,
  } as SubmitProviderReviewLogicDeps;
}

describe('handleSubmitProviderReviewLogic', () => {
  it('submits a review by provider name', async () => {
    const deps = buildDeps();
    const result = await handleSubmitProviderReviewLogic(deps, 'biz-1', {
      slug: 'salon',
      providerName: 'Anna',
      rating: 5,
      sessionCustomerId: 'cust-1',
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('submit_provider_review');
    expect(result.summary).toContain('Anna');
    expect(
      deps.reviewsService.submitProviderPortalReview,
    ).toHaveBeenCalledWith(
      'salon',
      'emp-1',
      { rating: 5, comment: undefined, idToken: undefined },
      'cust-1',
    );
  });

  it('submits a review by employeeId directly', async () => {
    const deps = buildDeps();
    const result = await handleSubmitProviderReviewLogic(deps, 'biz-1', {
      slug: 'salon',
      employeeId: 'emp-2',
      rating: 4,
      idToken: 'google-token',
    });
    expect(result.success).toBe(true);
    expect(
      deps.reviewsService.submitProviderPortalReview,
    ).toHaveBeenCalledWith(
      'salon',
      'emp-2',
      { rating: 4, comment: undefined, idToken: 'google-token' },
      undefined,
    );
  });

  it('requires a provider name or id', async () => {
    const result = await handleSubmitProviderReviewLogic(buildDeps(), 'biz-1', {
      slug: 'salon',
      rating: 5,
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('requires a valid rating', async () => {
    const result = await handleSubmitProviderReviewLogic(buildDeps(), 'biz-1', {
      slug: 'salon',
      providerName: 'Anna',
    });
    expect(result.success).toBe(false);
    expect(result.details?.missing).toEqual(['rating']);
  });

  it('surfaces a sign-in-required error with clarify', async () => {
    const result = await handleSubmitProviderReviewLogic(
      buildDeps({
        reviewsService: {
          submitProviderPortalReview: jest.fn(async () => {
            throw new Error('Sign in with Google to submit a review');
          }),
        },
      }),
      'biz-1',
      { slug: 'salon', providerName: 'Anna', rating: 5 },
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toEqual(['idToken']);
  });
});
