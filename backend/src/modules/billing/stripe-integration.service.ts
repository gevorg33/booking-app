import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { resolveStripeConnectCountry } from './stripe-connect-country.util.js';
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

  private connectCallbackUrls() {
    const base = `${this.stripeService.frontendUrl}/dashboard/billing`;
    return {
      returnUrl: `${base}?stripe_connect=return`,
      refreshUrl: `${base}?stripe_connect=refresh`,
    };
  }

  private resolveConnectCountry(business: Business): string {
    return resolveStripeConnectCountry(business, this.stripeService.connectDefaultCountry);
  }

  private async persistConnectSettings(
    business: Business,
    patch: { connectAccountId?: string; connectCountry?: string },
  ) {
    const settings = { ...(business.settings || {}) };
    const integrations = { ...(settings.integrations as Record<string, unknown>) || {} };
    const current = { ...((integrations.stripe as Record<string, unknown>) || {}) };
    if (patch.connectAccountId !== undefined) current.connectAccountId = patch.connectAccountId;
    if (patch.connectCountry !== undefined) current.connectCountry = patch.connectCountry;
    integrations.stripe = current;
    settings.integrations = integrations;
    business.settings = settings;
    await this.businessRepo.save(business);
  }

  private connectAccountCapabilities():
    | { transfers: { requested: true } }
    | { card_payments: { requested: true }; transfers: { requested: true } } {
    if (this.stripeService.usesDestinationCharges()) {
      return { transfers: { requested: true } };
    }
    return {
      card_payments: { requested: true },
      transfers: { requested: true },
    };
  }

  private isConnectAccountReady(account: {
    charges_enabled?: boolean;
    capabilities?: { transfers?: string };
  }): boolean {
    if (this.stripeService.usesDestinationCharges()) {
      return account.capabilities?.transfers === 'active';
    }
    return Boolean(account.charges_enabled);
  }

  /** Platform-managed Express account — appears under Stripe Connect → Connected accounts. */
  async createConnectOnboardingLink(businessId: string): Promise<{ url: string }> {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured on the platform');
    }

    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const country = this.resolveConnectCountry(business);
    const stripe = this.stripeService.client;
    let connectAccountId = this.resolveConnectAccountId(business.settings);

    if (!connectAccountId) {
      let account;
      try {
        account = await stripe.accounts.create({
          type: 'express',
          country,
          email: business.email || undefined,
          capabilities: this.connectAccountCapabilities(),
          metadata: { businessId: business.id, businessSlug: business.slug },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (/cannot be created by platforms in/i.test(message)) {
          throw new BadRequestException(
            `Stripe does not allow ${country} connected accounts on this platform. ` +
              `Set STRIPE_CONNECT_DEFAULT_COUNTRY to a supported value (e.g. AE) and try again.`,
          );
        }
        if (/card_payments capability is not supported/i.test(message)) {
          throw new BadRequestException(
            'Stripe UAE Connect does not support card_payments on connected accounts. ' +
              'Ensure STRIPE_CONNECT_CHARGE_MODEL=destination is set and try again. ' +
              'If the issue persists, contact Stripe to enable Express Connect for your UAE platform.',
          );
        }
        throw err;
      }
      connectAccountId = account.id;
      await this.persistConnectSettings(business, {
        connectAccountId: account.id,
        connectCountry: country,
      });
    }

    if (!connectAccountId) {
      throw new BadRequestException('Failed to create Stripe connected account');
    }

    const { returnUrl, refreshUrl } = this.connectCallbackUrls();
    const link = await stripe.accountLinks.create({
      account: connectAccountId,
      type: 'account_onboarding',
      return_url: returnUrl,
      refresh_url: refreshUrl,
    });

    if (!link.url) {
      throw new BadRequestException('Failed to create Stripe onboarding link');
    }

    return { url: link.url };
  }

  async syncConnectAccount(businessId: string): Promise<StripeIntegrationPublicView> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = this.resolveConnectAccountId(business.settings);
    if (!connectAccountId) {
      throw new BadRequestException('No Stripe account linked for this business');
    }

    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured on the platform');
    }

    try {
      await this.stripeService.client.accounts.retrieve(connectAccountId);
    } catch (err) {
      this.logger.warn(`Stripe sync failed for ${connectAccountId}`);
      throw new BadRequestException('Could not verify Stripe account. Try connecting again.');
    }

    return this.getPublicSettings(businessId);
  }

  async createConnectLoginLink(businessId: string): Promise<{ url: string }> {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured on the platform');
    }

    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = this.resolveConnectAccountId(business.settings);
    if (!connectAccountId) {
      throw new BadRequestException('Connect Stripe before opening the dashboard');
    }

    const link = await this.stripeService.client.accounts.createLoginLink(connectAccountId);
    if (!link.url) {
      throw new BadRequestException('Failed to create Stripe dashboard link');
    }

    return { url: link.url };
  }

  async getPublicSettings(businessId: string): Promise<StripeIntegrationPublicView> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const integration = getBusinessStripeIntegration(business.settings);
    const connectCountry = this.resolveConnectCountry(business);

    if (!integration.connectAccountId) {
      return {
        configured: false,
        connectCountry,
        chargesEnabled: false,
        detailsSubmitted: false,
      };
    }

    if (!this.stripeService.isConfigured) {
      return {
        configured: false,
        connectAccountId: integration.connectAccountId,
        connectCountry: integration.connectCountry ?? connectCountry,
        chargesEnabled: false,
        detailsSubmitted: false,
      };
    }

    try {
      const account = await this.stripeService.client.accounts.retrieve(
        integration.connectAccountId,
      );
      return {
        configured: this.isConnectAccountReady(account),
        connectAccountId: integration.connectAccountId,
        connectCountry: integration.connectCountry ?? account.country?.toUpperCase(),
        accountType: account.type ?? undefined,
        chargesEnabled: this.isConnectAccountReady(account),
        detailsSubmitted: Boolean(account.details_submitted),
        displayName:
          account.business_profile?.name ||
          account.email ||
          (account as { settings?: { dashboard?: { display_name?: string } } }).settings?.dashboard
            ?.display_name,
      };
    } catch (err) {
      this.logger.warn(`Failed to retrieve Stripe account ${integration.connectAccountId}`);
      return {
        configured: false,
        connectAccountId: integration.connectAccountId,
        connectCountry: integration.connectCountry,
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

    let account;
    try {
      account = await this.stripeService.client.accounts.retrieve(connectAccountId);
    } catch {
      throw new BadRequestException(
        'Could not find that connected account. Copy the ID from Stripe → Connect → Connected accounts.',
      );
    }

    await this.persistConnectSettings(business, {
      connectAccountId,
      connectCountry: account.country?.toUpperCase(),
    });

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

    const account = await this.stripeService.client.accounts.retrieve(connectAccountId);
    if (!this.isConnectAccountReady(account)) {
      throw new BadRequestException(
        'Stripe onboarding is incomplete. Click Continue setup in Billing to add your business address and bank details.',
      );
    }

    return connectAccountId;
  }
}
