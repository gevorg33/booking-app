import { AiEvalHarvestScheduler } from './ai-eval-harvest.scheduler.js';

describe('AiEvalHarvestScheduler (acc-2.1)', () => {
  it('runs weekly harvest across active businesses', async () => {
    const harvestService = {
      harvestAllBusinesses: jest.fn(async () => 3),
    };
    const scheduler = new AiEvalHarvestScheduler(harvestService as any);

    await scheduler.harvestProductionPrompts();

    expect(harvestService.harvestAllBusinesses).toHaveBeenCalledWith(7);
  });
});
