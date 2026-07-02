import { handleExplainPostVisitReviewPromptLogic } from './ai-explain-post-visit-review-prompt.logic.js';

describe('ai-explain-post-visit-review-prompt.logic (ai-cmd-customer-4.12.2)', () => {
  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        slug: 'glow-salon',
      })),
    },
    publicCustomerAuthService: {
      listBookings: jest.fn(async () => ({
        bookings: [
          {
            id: 'book-1',
            serviceName: 'Haircut',
            canReview: true,
          },
        ],
      })),
    },
  });

  it('explains why the popup appears', async () => {
    const result = await handleExplainPostVisitReviewPromptLogic(
      deps() as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Why am I seeing a review popup?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_post_visit_review_prompt');
    expect(result.summary).toMatch(/completed visit/i);
    expect(result.details.pendingReviewBookingId).toBe('book-1');
  });

  it('explains skip behavior without sign-in', async () => {
    const result = await handleExplainPostVisitReviewPromptLogic(
      deps() as any,
      'biz-1',
      {},
      'Can I skip the rating?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/Not now/i);
  });

  it('fails when prompt is not recognized', async () => {
    const result = await handleExplainPostVisitReviewPromptLogic(
      deps() as any,
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/post-visit review popup/i);
  });

  it('fails when business is missing', async () => {
    const localDeps = deps();
    localDeps.businessRepo.findOne = jest.fn(async () => null);
    const result = await handleExplainPostVisitReviewPromptLogic(
      localDeps as any,
      'biz-1',
      {},
      'Why am I seeing a review popup?',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Business not found/i);
  });
});
