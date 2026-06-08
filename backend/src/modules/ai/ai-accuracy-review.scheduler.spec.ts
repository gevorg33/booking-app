import { AiAccuracyReviewScheduler } from './ai-accuracy-review.scheduler.js';

describe('AiAccuracyReviewScheduler (acc-6.1)', () => {
  it('runs weekly review and harvest', async () => {
    const reviewService = {
      publishWeeklyReviewsForAllBusinesses: jest.fn(async () => 2),
    };
    const harvestService = {
      harvestAllBusinesses: jest.fn(async () => 5),
    };
    const aliasSuggestionService = {
      harvestAllBusinesses: jest.fn(async () => 3),
    };
    const scheduler = new AiAccuracyReviewScheduler(
      reviewService as any,
      harvestService as any,
      aliasSuggestionService as any,
    );
    await scheduler.runWeeklyAccuracyReview();
    expect(reviewService.publishWeeklyReviewsForAllBusinesses).toHaveBeenCalled();
    expect(harvestService.harvestAllBusinesses).toHaveBeenCalledWith(7);
    expect(aliasSuggestionService.harvestAllBusinesses).toHaveBeenCalledWith(30);
  });
});
