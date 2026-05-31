import { MarketingAutomationScheduler } from './marketing-automation.scheduler.js';
import { MarketingAutomationService } from './marketing-automation.service.js';

describe('MarketingAutomationScheduler', () => {
  const marketingAutomationService = { processAllBusinesses: jest.fn() };
  const scheduler = new MarketingAutomationScheduler(
    marketingAutomationService as unknown as MarketingAutomationService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs daily re-engagement job and logs when messages sent', async () => {
    marketingAutomationService.processAllBusinesses.mockResolvedValue(3);
    const logSpy = jest.spyOn((scheduler as any).logger, 'log').mockImplementation();

    await scheduler.handleReEngagement();

    expect(marketingAutomationService.processAllBusinesses).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Sent 3 re-engagement message(s)');
  });

  it('skips log line when no messages sent', async () => {
    marketingAutomationService.processAllBusinesses.mockResolvedValue(0);
    const logSpy = jest.spyOn((scheduler as any).logger, 'log').mockImplementation();

    await scheduler.handleReEngagement();

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('swallows job errors without throwing', async () => {
    marketingAutomationService.processAllBusinesses.mockRejectedValue(new Error('db offline'));
    const errorSpy = jest.spyOn((scheduler as any).logger, 'error').mockImplementation();

    await expect(scheduler.handleReEngagement()).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('swallows non-Error job failures without throwing', async () => {
    marketingAutomationService.processAllBusinesses.mockRejectedValue('db offline');
    const errorSpy = jest.spyOn((scheduler as any).logger, 'error').mockImplementation();

    await expect(scheduler.handleReEngagement()).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith('Marketing automation job failed', 'db offline');
  });
});
