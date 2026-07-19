import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { PackagePurchase } from './entities/service-package.entity.js';
import { StripeService } from '../billing/stripe.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';

export type PackageRefundStatus =
  | 'refunded'
  | 'already_refunded'
  | 'skipped'
  | 'failed';

@Injectable()
export class PackageRefundService {
  private readonly logger = new Logger(PackageRefundService.name);

  constructor(
    @InjectRepository(PackagePurchase)
    private purchaseRepo: Repository<PackagePurchase>,
    private stripeService: StripeService,
    private stripeIntegrationService: StripeIntegrationService,
  ) {}

  async refundPackagePayment(
    business: Business,
    purchase: PackagePurchase,
  ): Promise<PackageRefundStatus> {
    const metadata = (purchase.metadata ?? {}) as Record<string, any>;
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

      purchase.metadata = { ...metadata, stripeRefundId: refund.id };
      await this.purchaseRepo.save(purchase);
      return 'refunded';
    } catch (err) {
      this.logger.warn(
        `Package purchase refund failed for ${purchase.id}: ${err instanceof Error ? err.message : err}`,
      );
      return 'failed';
    }
  }
}
