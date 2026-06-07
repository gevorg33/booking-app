import {
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import {
  CLINIC_LIS_INBOUND_DELIVERY_ID_HEADER,
  CLINIC_LIS_INBOUND_WEBHOOK_SIGNATURE_HEADER,
} from '../../common/utils/clinic-lis.types.js';
import { ClinicLabSyncInboundQueueService } from './clinic-lab-sync-inbound-queue.service.js';

@Controller('businesses/:businessId/clinic-lab-sync/inbound')
export class ClinicLabSyncInboundWebhookController {
  constructor(
    private readonly inboundQueueService: ClinicLabSyncInboundQueueService,
  ) {}

  @Post()
  @HttpCode(202)
  async receive(
    @Param('businessId') businessId: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers(CLINIC_LIS_INBOUND_WEBHOOK_SIGNATURE_HEADER) signature: string,
    @Headers(CLINIC_LIS_INBOUND_DELIVERY_ID_HEADER)
    deliveryId: string | undefined,
    @Headers('content-type') contentType: string | undefined,
    @Query('source') sourceOverride?: string,
    @Query('integrationVendorCode') integrationVendorCode?: string,
    @Query('labInfoId') labInfoId?: string,
  ) {
    const rawBody = req.rawBody;
    return this.inboundQueueService.enqueueInboundMessage({
      businessId,
      rawBody: rawBody?.toString('utf8') ?? '',
      rawBodyBuffer: rawBody ?? Buffer.from(''),
      signature,
      contentType: contentType ?? 'application/octet-stream',
      idempotencyKey: deliveryId,
      sourceOverride,
      integrationVendorCode,
      labInfoId,
    });
  }
}
