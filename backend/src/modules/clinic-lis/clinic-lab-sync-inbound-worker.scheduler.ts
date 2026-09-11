import { Injectable, Logger } from '@nestjs/common';
import { SchedulerLockService } from '../../common/scheduler-lock/scheduler-lock.service.js';
import { Cron } from '@nestjs/schedule';
import { ClinicLabSyncInboundWorkerService } from './clinic-lab-sync-inbound-worker.service.js';

@Injectable()
export class ClinicLabSyncInboundWorkerScheduler {
  private readonly logger = new Logger(
    ClinicLabSyncInboundWorkerScheduler.name,
  );

  constructor(
    private readonly inboundWorkerService: ClinicLabSyncInboundWorkerService,

    private readonly schedulerLock: SchedulerLockService,
  ) {}

  /** Every minute — process queued inbound HL7/FHIR/vendor LIS messages. */
  @Cron('0 * * * * *')
  async processQueuedInboundMessagesScheduled(): Promise<void> {
    // e2e-bug.497 — the cron entry point; `processQueuedInboundMessages` stays callable directly
    // (and is what the specs drive) so the lock wraps scheduling, not the work.
    await this.schedulerLock.runExclusively(
      'clinic-lab-sync-inbound-worker.processQueuedInboundMessages',
      () => this.processQueuedInboundMessages(),
    );
  }

  async processQueuedInboundMessages(): Promise<void> {
    try {
      const processed = await this.inboundWorkerService.processPendingBatch();
      if (processed > 0) {
        this.logger.log(`Processed ${processed} inbound clinic LIS message(s)`);
      }
    } catch (error) {
      this.logger.error(
        'Clinic LIS inbound worker failed',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
