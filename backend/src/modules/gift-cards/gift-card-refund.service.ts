import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { GiftCard } from './entities/gift-card.entity.js';
import type { GiftCardRefundStatus } from './gift-card-order.types.js';
import { StripeService } from '../billing/stripe.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';

@Injectable()
export class GiftCardRefundService {
  private readonly logger = new Logger(GiftCardRefundService.name);

  constructor(
    @InjectRepository(GiftCard) private giftCardRepo: Repository<GiftCard>,
    private stripeService: StripeService,
    private stripeIntegrationService: StripeIntegrationService,
  ) {}

  async refundPurchase(
    business: Business,
    card: GiftCard,
  ): Promise<GiftCardRefundStatus> {
    if (card.stripeRefundId) return 'already_refunded';
    if (!card.stripeSessionId || !this.stripeService.isConfigured)
      return 'skipped';

    try {
      const connectAccountId =
        this.stripeIntegrationService.resolveConnectAccountId(
          business.settings,
        );
      const opts = connectAccountId
        ? this.stripeService.connectRequestOptions(
            connectAccountId,
            business.settings,
          )
        : undefined;

      const session =
        await this.stripeService.client.checkout.sessions.retrieve(
          card.stripeSessionId,
          {},
          opts,
        );
      const paymentIntent =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;
      if (!paymentIntent) return 'skipped';

      const refund = await this.stripeService.client.refunds.create(
        { payment_intent: paymentIntent },
        opts,
      );

      card.stripeRefundId = refund.id;
      await this.giftCardRepo.save(card);
      return 'refunded';
    } catch (err) {
      this.logger.warn(
        `Gift card refund failed for ${card.id}: ${err instanceof Error ? err.message : err}`,
      );
      return 'failed';
    }
  }
}
