import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { StripeService } from './stripe.service.js';
import { UpdateStripeIntegrationDto } from './dto/update-stripe-integration.dto.js';
import {
  getBusinessStripeIntegration,
  isValidConnectAccountId,
  StripeIntegrationPublicView,
} from './stripe-integration.types.js';

@Injectable()
export class StripeIntegrationService {
  private readonly logger = new Logger(StripeIntegrationService.name);

  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private stripeService: StripeService,
  ) {}

  isConnectReady(settings?: Record<string, unknown>): boolean {
    const integration = getBusinessStripeIntegration(settings);
    return Boolean(integration.connectAccountId);
  }

  resolveConnectAccountId(settings?: Record<string, unknown>): string | null {
    return getBusinessStripeIntegration(settings).connectAccountId ?? null;
  }

  async getPublicSettings(businessId: string): Promise<StripeIntegrationPublicView> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const integration = getBusinessStripeIntegration(business.settings);
    if (!integration.connectAccountId) {
      return {
        configured: false,
        chargesEnabled: false,
        detailsSubmitted: false,
      };
    }

    if (!this.stripeService.isConfigured) {
      return {
        configured: false,
        connectAccountId: integration.connectAccountId,
        chargesEnabled: false,
        detailsSubmitted: false,
      };
    }

    try {
      const account = await this.stripeService.client.accounts.retrieve(
        integration.connectAccountId,
      );
      return {
        configured: Boolean(account.charges_enabled),
        connectAccountId: integration.connectAccountId,
        chargesEnabled: Boolean(account.charges_enabled),
        detailsSubmitted: Boolean(account.details_submitted),
        displayName:
          account.business_profile?.name ||
          (account as { settings?: { dashboard?: { display_name?: string } } }).settings?.dashboard
            ?.display_name,
      };
    } catch (err) {
      this.logger.warn(`Failed to retrieve Stripe account ${integration.connectAccountId}`);
      return {
        configured: false,
        connectAccountId: integration.connectAccountId,
        chargesEnabled: false,
        detailsSubmitted: false,
      };
    }
  }

  async updateSettings(
    businessId: string,
    dto: UpdateStripeIntegrationDto,
  ): Promise<StripeIntegrationPublicView> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const settings = { ...(business.settings || {}) };
    const integrations = { ...(settings.integrations as Record<string, unknown>) || {} };

    if (dto.disconnect) {
      delete integrations.stripe;
      settings.integrations = Object.keys(integrations).length ? integrations : undefined;
      business.settings = settings;
      await this.businessRepo.save(business);
      return this.getPublicSettings(businessId);
    }

    const connectAccountId = dto.connectAccountId?.trim();
    if (!connectAccountId) {
      throw new BadRequestException('Stripe Connect account ID is required');
    }
    if (!isValidConnectAccountId(connectAccountId)) {
      throw new BadRequestException('Invalid Stripe account ID — must start with acct_');
    }
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured on the platform');
    }

    const account = await this.stripeService.client.accounts.retrieve(connectAccountId);
    if (!account.charges_enabled) {
      throw new BadRequestException(
        'This Stripe account cannot accept charges yet. Complete Stripe onboarding first.',
      );
    }

    integrations.stripe = { connectAccountId };
    settings.integrations = integrations;
    business.settings = settings;
    await this.businessRepo.save(business);

    return this.getPublicSettings(businessId);
  }

  async assertCanAcceptOnlinePayments(businessId: string): Promise<string> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = this.resolveConnectAccountId(business.settings);
    if (!connectAccountId) {
      throw new BadRequestException(
        'Connect your Stripe account in Dashboard → Billing before accepting online payments',
      );
    }
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Online payments are not configured on the platform');
    }

    return connectAccountId;
  }
}
