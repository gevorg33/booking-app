import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ClinicLabSyncInboundWorkerService } from './clinic-lab-sync-inbound-worker.service.js';

@Injectable()
export class ClinicLabSyncInboundWorkerScheduler {
  private readonly logger = new Logger(
    ClinicLabSyncInboundWorkerScheduler.name,
  );

  constructor(
    private readonly inboundWorkerService: ClinicLabSyncInboundWorkerService,
  ) {}

  /** Every minute — process queued inbound HL7/FHIR/vendor LIS messages. */
  @Cron('0 * * * * *')
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
