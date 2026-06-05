import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ZendeskIntegrationService } from './zendesk-integration.service.js';

@Injectable()
export class ZendeskCustomerSyncListener {
  private readonly logger = new Logger(ZendeskCustomerSyncListener.name);

  constructor(private readonly zendesk: ZendeskIntegrationService) {}

  @OnEvent('customer.upserted', { async: true })
  async handleCustomerUpsert(payload: {
    businessId: string;
    customerId: string;
  }) {
    try {
      await this.zendesk.syncCustomerIfEnabled(
        payload.businessId,
        payload.customerId,
      );
    } catch (error: any) {
      this.logger.warn(
        `Zendesk customer sync failed for ${payload.customerId}: ${error?.message ?? error}`,
      );
    }
  }
}
