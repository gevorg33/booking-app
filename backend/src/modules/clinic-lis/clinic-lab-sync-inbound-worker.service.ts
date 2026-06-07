import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { adaptInboundClinicLabSyncObservationRequest } from '../../common/utils/clinic-lab-sync-observation.adapter.util.js';
import { parseInboundClinicLabSyncPayload } from '../../common/utils/clinic-lab-sync-inbound.parser.util.js';
import {
  CLINIC_LIS_INBOUND_ENQUEUED_EVENT,
  CLINIC_LIS_INBOUND_WORKER_BATCH_SIZE,
} from './clinic-lab-sync-inbound.constants.js';
import { ClinicLabSyncObservationService } from './clinic-lab-sync-observation.service.js';
import { ClinicLabSyncInboundMessage } from './entities/clinic-lab-sync-inbound-message.entity.js';

@Injectable()
export class ClinicLabSyncInboundWorkerService {
  private readonly logger = new Logger(ClinicLabSyncInboundWorkerService.name);

  constructor(
    @InjectRepository(ClinicLabSyncInboundMessage)
    private readonly messageRepo: Repository<ClinicLabSyncInboundMessage>,
    private readonly observationService: ClinicLabSyncObservationService,
  ) {}

  @OnEvent(CLINIC_LIS_INBOUND_ENQUEUED_EVENT, { async: true })
  async onInboundEnqueued(): Promise<void> {
    await this.processPendingBatch();
  }

  async processPendingBatch(
    limit = CLINIC_LIS_INBOUND_WORKER_BATCH_SIZE,
  ): Promise<number> {
    const pending = await this.messageRepo.find({
      where: { status: 'Pending' },
      order: { receivedAt: 'ASC' },
      take: limit,
    });

    let processed = 0;
    for (const message of pending) {
      const didProcess = await this.processMessage(message.id);
      if (didProcess) processed += 1;
    }
    return processed;
  }

  async processMessage(messageId: string): Promise<boolean> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
    });
    if (!message || message.status !== 'Pending') return false;

    message.status = 'Processing';
    await this.messageRepo.save(message);

    try {
      const payload = parseInboundClinicLabSyncPayload({
        source: message.source,
        rawPayload: message.rawPayload,
        integrationVendorCode: message.integrationVendorCode,
        labInfoId: message.labInfoId,
      });
      const adapted = adaptInboundClinicLabSyncObservationRequest(payload);
      const savedRequest =
        await this.observationService.ingestAdaptedObservationRequest(
          message.businessId,
          adapted,
        );

      message.status = 'Completed';
      message.observationRequestId = savedRequest.id;
      message.processedAt = new Date();
      message.errorMessage = null;
      await this.messageRepo.save(message);
      return true;
    } catch (error) {
      message.status = 'Failed';
      message.processedAt = new Date();
      message.errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to process inbound LIS message';
      await this.messageRepo.save(message);
      this.logger.warn(
        `Inbound LIS message ${message.id} failed: ${message.errorMessage}`,
      );
      return true;
    }
  }
}
