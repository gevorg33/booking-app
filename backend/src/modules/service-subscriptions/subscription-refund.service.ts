import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { CustomerSubscription } from './entities/subscription.entity.js';
import { StripeService } from '../billing/stripe.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';

export type SubscriptionRefundStatus =
  | 'refunded'
  | 'already_refunded'
  | 'skipped'
  | 'failed';

@Injectable()
export class SubscriptionRefundService {
  private readonly logger = new Logger(SubscriptionRefundService.name);

  constructor(
    @InjectRepository(CustomerSubscription)
    private subscriptionRepo: Repository<CustomerSubscription>,
    private stripeService: StripeService,
    private stripeIntegrationService: StripeIntegrationService,
  ) {}

  async refundSubscriptionPayment(
    business: Business,
    subscription: CustomerSubscription,
  ): Promise<SubscriptionRefundStatus> {
    const metadata = (subscription.metadata ?? {}) as Record<string, any>;
    if (metadata.stripeRefundId) return 'already_refunded';

    const paymentIntentId = metadata.stripePaymentIntentId as
      | string
      | undefined;
    if (!paymentIntentId || !this.stripeService.isConfigured) return 'skipped';

    try {
      const connectAccountId =
        (metadata.stripeConnectAccountId as string | undefined) ??
        this.stripeIntegrationService.resolveConnectAccountId(
          business.settings,
        );
      const opts = connectAccountId
        ? this.stripeService.connectRequestOptions(
            connectAccountId,
            business.settings,
          )
        : undefined;

      const refund = await this.stripeService.client.refunds.create(
        { payment_intent: paymentIntentId },
        opts,
      );

      subscription.metadata = { ...metadata, stripeRefundId: refund.id };
      await this.subscriptionRepo.save(subscription);
      return 'refunded';
    } catch (err) {
      this.logger.warn(
        `Subscription refund failed for ${subscription.id}: ${err instanceof Error ? err.message : err}`,
      );
      return 'failed';
    }
  }
}
