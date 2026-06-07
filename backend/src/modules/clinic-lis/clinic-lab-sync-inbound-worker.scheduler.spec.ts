import { ClinicLabSyncInboundWorkerScheduler } from './clinic-lab-sync-inbound-worker.scheduler.js';

describe('ClinicLabSyncInboundWorkerScheduler', () => {
  const workerService = {
    processPendingBatch: jest.fn(async () => 2),
  };

  const scheduler = new ClinicLabSyncInboundWorkerScheduler(
    workerService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes queued inbound messages on cron tick', async () => {
    await scheduler.processQueuedInboundMessages();
    expect(workerService.processPendingBatch).toHaveBeenCalled();
  });

  it('swallows worker errors without throwing', async () => {
    workerService.processPendingBatch.mockRejectedValueOnce(
      new Error('db down'),
    );
    await expect(
      scheduler.processQueuedInboundMessages(),
    ).resolves.toBeUndefined();
  });
});
