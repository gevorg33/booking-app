import {
  handleSubmitReviewWithTokenLogic,
  type SubmitReviewWithTokenLogicDeps,
} from './ai-submit-review-with-token.logic.js';

function buildDeps(
  overrides: Partial<SubmitReviewWithTokenLogicDeps> = {},
): SubmitReviewWithTokenLogicDeps {
  return {
    reviewsService: {
      getPublicContext: jest.fn(async () => ({
        businessName: 'Salon',
        employeeName: 'Anna',
        serviceName: 'Haircut',
        customerName: 'Guest',
        appointmentDate: '2026-06-01T10:00:00.000Z',
        alreadySubmitted: false,
      })),
      submitPublic: jest.fn(async () => ({
        id: 'rev-1',
        rating: 5,
        comment: null,
        customerName: null,
        createdAt: '2026-06-01T10:00:00.000Z',
      })),
    },
    ...overrides,
  } as SubmitReviewWithTokenLogicDeps;
}

describe('handleSubmitReviewWithTokenLogic', () => {
  it('submits a guest review with rating', async () => {
    const deps = buildDeps();
    const result = await handleSubmitReviewWithTokenLogic(deps, 'biz-1', {
      slug: 'salon',
      bookingId: 'book-1',
      token: 'tok-1',
      rating: 5,
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('submit_review_with_token');
    expect(deps.reviewsService.submitPublic).toHaveBeenCalledWith('salon', {
      bookingId: 'book-1',
      token: 'tok-1',
      rating: 5,
      comment: undefined,
      customerName: undefined,
    });
  });

  it('requires bookingId and token', async () => {
    const result = await handleSubmitReviewWithTokenLogic(buildDeps(), 'biz-1', {
      slug: 'salon',
      rating: 5,
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('shows context and asks for a rating when missing', async () => {
    const deps = buildDeps();
    const result = await handleSubmitReviewWithTokenLogic(deps, 'biz-1', {
      slug: 'salon',
      bookingId: 'book-1',
      token: 'tok-1',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.summary).toContain('Haircut');
  });

  it('reports when a review was already submitted', async () => {
    const deps = buildDeps({
      reviewsService: {
        getPublicContext: jest.fn(async () => ({
          businessName: 'Salon',
          employeeName: 'Anna',
          serviceName: 'Haircut',
          customerName: 'Guest',
          appointmentDate: '2026-06-01T10:00:00.000Z',
          alreadySubmitted: true,
        })),
        submitPublic: jest.fn(),
      },
    });
    const result = await handleSubmitReviewWithTokenLogic(deps, 'biz-1', {
      slug: 'salon',
      bookingId: 'book-1',
      token: 'tok-1',
    });
    expect(result.success).toBe(true);
    expect(result.details?.alreadySubmitted).toBe(true);
  });

  it('surfaces an invalid token error', async () => {
    const result = await handleSubmitReviewWithTokenLogic(
      buildDeps({
        reviewsService: {
          getPublicContext: jest.fn(async () => {
            throw new Error('Invalid or expired review link');
          }),
          submitPublic: jest.fn(),
        },
      }),
      'biz-1',
      { slug: 'salon', bookingId: 'book-1', token: 'bad-tok' },
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Invalid');
  });
});
