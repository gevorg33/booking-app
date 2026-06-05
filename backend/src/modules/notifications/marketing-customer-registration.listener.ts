import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service.js';
import {
  CUSTOMER_REGISTERED_EVENT,
  type CustomerRegisteredEventPayload,
} from './customer-registration.types.js';

@Injectable()
export class MarketingCustomerRegistrationListener {
  private readonly logger = new Logger(
    MarketingCustomerRegistrationListener.name,
  );
  private notificationsService!: NotificationsService;

  constructor(notificationsService: NotificationsService) {
    this.notificationsService = notificationsService;
  }

  @OnEvent(CUSTOMER_REGISTERED_EVENT, { async: true })
  async handleCustomerRegistered(payload: CustomerRegisteredEventPayload) {
    try {
      await this.notificationsService.sendMarketingNewCustomerRegistration(
        payload.businessId,
        payload.customerId,
        payload.source,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Marketing registration email failed for customer ${payload.customerId}: ${message}`,
      );
    }
  }
}
