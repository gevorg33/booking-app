import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CLINIC_LIS_INBOUND_DELIVERY_ID_HEADER,
  CLINIC_LIS_INBOUND_WEBHOOK_SIGNATURE_HEADER,
} from '../../common/utils/clinic-lis.types.js';
import {
  readClinicLisInboundWebhookSecret,
  resolveClinicLabSyncInboundSource,
  verifyClinicLisInboundWebhookSignature,
} from '../../common/utils/clinic-lab-sync-inbound-webhook.util.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { BusinessService } from '../business/business.service.js';
import { CLINIC_LIS_INBOUND_ENQUEUED_EVENT } from './clinic-lab-sync-inbound.constants.js';
import { ClinicLabSyncInboundMessage } from './entities/clinic-lab-sync-inbound-message.entity.js';

export interface EnqueueClinicLabSyncInboundMessageInput {
  businessId: string;
  rawBody: string;
  rawBodyBuffer: Buffer;
  signature: string | undefined;
  contentType: string;
  idempotencyKey?: string | null;
  sourceOverride?: string | null;
  integrationVendorCode?: string | null;
  labInfoId?: string | null;
}

@Injectable()
export class ClinicLabSyncInboundQueueService {
  constructor(
    @InjectRepository(ClinicLabSyncInboundMessage)
    private readonly messageRepo: Repository<ClinicLabSyncInboundMessage>,
    private readonly businessService: BusinessService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async enqueueInboundMessage(input: EnqueueClinicLabSyncInboundMessageInput) {
    if (!input.rawBodyBuffer.length) {
      throw new BadRequestException('Missing request body');
    }

    const business = await this.businessService.findOne(input.businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );

    const secret = readClinicLisInboundWebhookSecret(
      business.settings as Record<string, unknown> | undefined,
    );
    if (!secret) {
      throw new ForbiddenException(
        'Clinic LIS inbound webhook is not configured for this business',
      );
    }
    if (
      !verifyClinicLisInboundWebhookSignature(
        secret,
        input.rawBodyBuffer,
        input.signature,
      )
    ) {
      throw new ForbiddenException(
        'Invalid clinic LIS inbound webhook signature',
      );
    }

    let source;
    try {
      source = resolveClinicLabSyncInboundSource({
        contentType: input.contentType,
        sourceOverride: input.sourceOverride,
        rawPayload: input.rawBody,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Unable to determine inbound message source',
      );
    }

    const idempotencyKey = input.idempotencyKey?.trim() || null;
    if (idempotencyKey) {
      const existing = await this.messageRepo.findOne({
        where: { businessId: input.businessId, idempotencyKey },
      });
      if (existing) {
        return {
          data: {
            id: existing.id,
            status: existing.status,
            duplicate: true,
          },
        };
      }
    }

    const saved = await this.messageRepo.save(
      this.messageRepo.create({
        businessId: input.businessId,
        source,
        contentType: input.contentType,
        integrationVendorCode: input.integrationVendorCode?.trim() || null,
        labInfoId: input.labInfoId?.trim() || null,
        idempotencyKey,
        rawPayload: input.rawBody,
        status: 'Pending',
        receivedAt: new Date(),
      }),
    );

    this.eventEmitter.emit(CLINIC_LIS_INBOUND_ENQUEUED_EVENT, {
      businessId: input.businessId,
      messageId: saved.id,
    });

    return {
      data: {
        id: saved.id,
        status: saved.status,
        duplicate: false,
      },
    };
  }

  static inboundHeadersHelp() {
    return {
      signatureHeader: CLINIC_LIS_INBOUND_WEBHOOK_SIGNATURE_HEADER,
      deliveryIdHeader: CLINIC_LIS_INBOUND_DELIVERY_ID_HEADER,
    };
  }
}
