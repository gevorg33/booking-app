import { Injectable } from '@nestjs/common';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import type { CommandResult } from './command-completion.types.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import {
  dispatchConsumerAdoptionIntent,
  type ConsumerAdoptionLogicDeps,
} from './ai-consumer-adoption.logic.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';

@Injectable()
export class AiConsumerAdoptionService {
  private readonly deps: ConsumerAdoptionLogicDeps;

  constructor(
    publicBookingService: PublicBookingService,
    publicCustomerAuthService: PublicCustomerAuthService,
    pushNotifications: AiPushNotificationsService,
  ) {
    this.deps = {
      publicBookingService,
      publicCustomerAuthService,
      pushNotifications,
    };
  }

  rescueConsumerAdoptionIntent(prompt: string, action: string) {
    return rescueConsumerAdoptionIntent(prompt, action);
  }

  handleIntent(
    businessId: string,
    action: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<CommandResult | null> {
    return dispatchConsumerAdoptionIntent(
      this.deps,
      businessId,
      action,
      params,
      prompt,
    );
  }
}
