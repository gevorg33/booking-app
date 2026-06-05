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
import { StartStripeConnectDto } from './dto/start-stripe-connect.dto.js';
import {
  getBusinessStripeIntegration,
  isValidConnectAccountId,
  StripeIntegrationPublicView,
} from './stripe-integration.types.js';
import { PlanEntitlementsService } from './plan-entitlements.service.js';

@Injectable()
export class StripeIntegrationService {
  private readonly logger = new Logger(StripeIntegrationService.name);

  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private stripeService: StripeService,
    private planEntitlements: PlanEntitlementsService,
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

  private async persistConnectSettings(
    business: Business,
    patch: {
      connectAccountId?: string;
      connectCountry?: string;
      connectMode?: 'oauth' | 'express' | 'manual';
      connectChargeModel?: 'direct' | 'destination';
    },
  ) {
    const settings = { ...(business.settings || {}) };
    const integrations = {
      ...((settings.integrations as Record<string, unknown>) || {}),
    };
    const current = {
      ...((integrations.stripe as Record<string, unknown>) || {}),
    };
    if (patch.connectAccountId !== undefined)
      current.connectAccountId = patch.connectAccountId;
    if (patch.connectCountry !== undefined)
      current.connectCountry = patch.connectCountry;
    if (patch.connectMode !== undefined)
      current.connectMode = patch.connectMode;
    if (patch.connectChargeModel !== undefined) {
      current.connectChargeModel = patch.connectChargeModel;
    }
    integrations.stripe = current;
    settings.integrations = integrations;
    business.settings = settings;
    await this.businessRepo.save(business);
  }

  private async saveTenantConnectCountry(business: Business, country: string) {
    const settings = { ...(business.settings || {}) };
    settings.stripeConnectCountry = country.toUpperCase();
    business.settings = settings;
    await this.businessRepo.save(business);
  }

  private resolveConnectCountry(business: Business, override?: string): string {
    if (override && /^[A-Za-z]{2}$/.test(override.trim())) {
      return override.trim().toUpperCase();
    }
    return resolveStripeConnectCountry(
      business,
      this.stripeService.connectDefaultCountry,
    );
  }

  private connectAccountCapabilities(
    settings?: Record<string, unknown>,
  ):
    | { transfers: { requested: true } }
    | { card_payments: { requested: true }; transfers: { requested: true } } {
    if (this.stripeService.usesDestinationCharges(settings)) {
      return { transfers: { requested: true } };
    }
    return {
      card_payments: { requested: true },
      transfers: { requested: true },
    };
  }

  private isConnectAccountReady(
    account: {
      charges_enabled?: boolean;
      capabilities?: { transfers?: string };
    },
    settings?: Record<string, unknown>,
  ): boolean {
    if (this.stripeService.usesDestinationCharges(settings)) {
      return account.capabilities?.transfers === 'active';
    }
    return Boolean(account.charges_enabled);
  }

  /** Preferred onboarding: OAuth when configured (tenant's own Stripe account, any supported country). */
  async startConnect(
    businessId: string,
    dto: StartStripeConnectDto = {},
  ): Promise<{ url: string }> {
    await this.planEntitlements.assertFeature(businessId, 'stripeConnect');
    const mode =
      dto.mode ??
      (this.stripeService.isOAuthConfigured() ? 'oauth' : 'express');
    if (mode === 'oauth') {
      return this.createConnectOAuthLink(businessId);
    }
    return this.createConnectOnboardingLink(businessId, dto.country);
  }

  async createConnectOAuthLink(businessId: string): Promise<{ url: string }> {
    const clientId = this.stripeService.connectClientId;
    if (!clientId) {
      throw new BadRequestException(
        'Stripe Connect OAuth is not configured (STRIPE_CONNECT_CLIENT_ID). ' +
          'Use Express onboarding or paste an account ID manually.',
      );
    }

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const redirectUri = this.stripeService.connectOAuthRedirectUri;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: 'read_write',
      redirect_uri: redirectUri,
      state: businessId,
    });

    return {
      url: `https://connect.stripe.com/oauth/authorize?${params.toString()}`,
    };
  }

  async completeConnectOAuth(
    businessId: string,
    code: string,
  ): Promise<StripeIntegrationPublicView> {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured on the platform');
    }
    if (!this.stripeService.connectClientId) {
      throw new BadRequestException('Stripe Connect OAuth is not configured');
    }

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const stripe = this.stripeService.client;
    let token;
    try {
      token = await stripe.oauth.token({
        grant_type: 'authorization_code',
        code,
      });
    } catch {
      throw new BadRequestException(
        'Could not connect Stripe account. Try again from Billing.',
      );
    }

    const connectAccountId = token.stripe_user_id;
    if (!connectAccountId) {
      throw new BadRequestException(
        'Stripe did not return a connected account ID',
      );
    }

    const account = await stripe.accounts.retrieve(connectAccountId);
    const tenantCountry = account.country?.toUpperCase();
    // Standard (OAuth) accounts: always use direct charges — the charge is processed directly
    // on the tenant's own Stripe account, so no cross-border platform→tenant transfer occurs.
    // Destination charges would fail for tenants in countries different from the platform's region.
    const connectChargeModel = 'direct';

    await this.persistConnectSettings(business, {
      connectAccountId,
      connectCountry: tenantCountry,
      connectMode: 'oauth',
      connectChargeModel,
    });

    return this.getPublicSettings(businessId);
  }

  /** Platform-managed Express account — appears under Stripe Connect → Connected accounts. */
  async createConnectOnboardingLink(
    businessId: string,
    countryOverride?: string,
  ): Promise<{ url: string }> {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured on the platform');
    }

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const country = this.resolveConnectCountry(business, countryOverride);
    if (countryOverride) {
      await this.saveTenantConnectCountry(business, country);
    }

    const stripe = this.stripeService.client;
    let connectAccountId = this.resolveConnectAccountId(business.settings);

    const expressChargeModel =
      country === this.stripeService.connectDefaultCountry && country === 'AE'
        ? 'destination'
        : 'direct';

    if (!connectAccountId) {
      let account;
      const draftSettings = {
        ...(business.settings || {}),
        integrations: {
          ...((business.settings?.integrations as Record<string, unknown>) ||
            {}),
          stripe: {
            connectChargeModel: expressChargeModel,
          },
        },
      };
      try {
        account = await stripe.accounts.create({
          type: 'standard',
          country,
          email: business.email || undefined,
          capabilities: this.connectAccountCapabilities(draftSettings),
          metadata: { businessId: business.id, businessSlug: business.slug },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (/cannot be created by platforms in/i.test(message)) {
          throw new BadRequestException(
            `Stripe does not allow creating ${country} Express accounts from your platform region. ` +
              `Use "Connect your Stripe account" (OAuth) so the tenant links their own Stripe account in ${country}, ` +
              `or contact Stripe to enable cross-border Express onboarding.`,
          );
        }
        if (/card_payments capability is not supported/i.test(message)) {
          throw new BadRequestException(
            `Stripe does not support card_payments for Express accounts in ${country} on this platform. ` +
              'Try OAuth so the tenant connects their own Stripe account, or contact Stripe support.',
          );
        }
        throw err;
      }
      connectAccountId = account.id;
      await this.persistConnectSettings(business, {
        connectAccountId: account.id,
        connectCountry: country,
        connectMode: 'express',
        connectChargeModel: expressChargeModel,
      });
    }

    if (!connectAccountId) {
      throw new BadRequestException(
        'Failed to create Stripe connected account',
      );
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

  async syncConnectAccount(
    businessId: string,
  ): Promise<StripeIntegrationPublicView> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = this.resolveConnectAccountId(business.settings);
    if (!connectAccountId) {
      throw new BadRequestException(
        'No Stripe account linked for this business',
      );
    }

    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured on the platform');
    }

    try {
      const account =
        await this.stripeService.client.accounts.retrieve(connectAccountId);
      const integration = getBusinessStripeIntegration(business.settings);

      // Correct the charge model in DB if it was stored incorrectly (e.g. oauth accounts must be direct)
      const correctChargeModel: 'direct' | 'destination' =
        integration.connectMode === 'oauth' || account.type === 'standard'
          ? 'direct'
          : (integration.connectChargeModel ?? 'direct');
      if (correctChargeModel !== integration.connectChargeModel) {
        await this.persistConnectSettings(business, {
          connectChargeModel: correctChargeModel,
        });
      }
    } catch {
      this.logger.warn(`Stripe sync failed for ${connectAccountId}`);
      throw new BadRequestException(
        'Could not verify Stripe account. Try connecting again.',
      );
    }

    return this.getPublicSettings(businessId);
  }

  async createConnectLoginLink(businessId: string): Promise<{ url: string }> {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured on the platform');
    }

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = this.resolveConnectAccountId(business.settings);
    if (!connectAccountId) {
      throw new BadRequestException(
        'Connect Stripe before opening the dashboard',
      );
    }

    const account =
      await this.stripeService.client.accounts.retrieve(connectAccountId);

    // Standard accounts manage their own dashboard — no login link needed
    if (account.type === 'standard') {
      return { url: `https://dashboard.stripe.com/${connectAccountId}` };
    }

    // Express accounts use a platform-generated login link
    const link =
      await this.stripeService.client.accounts.createLoginLink(
        connectAccountId,
      );
    if (!link.url) {
      throw new BadRequestException('Failed to create Stripe dashboard link');
    }

    return { url: link.url };
  }

  async getPublicSettings(
    businessId: string,
  ): Promise<StripeIntegrationPublicView> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const integration = getBusinessStripeIntegration(business.settings);
    const connectCountry = this.resolveConnectCountry(business);

    if (!integration.connectAccountId) {
      return {
        configured: false,
        connectCountry,
        oauthAvailable: this.stripeService.isOAuthConfigured(),
        chargesEnabled: false,
        detailsSubmitted: false,
      };
    }

    if (!this.stripeService.isConfigured) {
      return {
        configured: false,
        connectAccountId: integration.connectAccountId,
        connectCountry: integration.connectCountry ?? connectCountry,
        connectMode: integration.connectMode,
        connectChargeModel: integration.connectChargeModel,
        oauthAvailable: this.stripeService.isOAuthConfigured(),
        chargesEnabled: false,
        detailsSubmitted: false,
      };
    }

    try {
      const account = await this.stripeService.client.accounts.retrieve(
        integration.connectAccountId,
      );
      const ready = this.isConnectAccountReady(account, business.settings);
      return {
        configured: ready,
        connectAccountId: integration.connectAccountId,
        connectCountry:
          integration.connectCountry ?? account.country?.toUpperCase(),
        connectMode: integration.connectMode,
        connectChargeModel: integration.connectChargeModel,
        accountType: account.type ?? undefined,
        oauthAvailable: this.stripeService.isOAuthConfigured(),
        chargesEnabled: ready,
        detailsSubmitted: Boolean(account.details_submitted),
        displayName:
          account.business_profile?.name ||
          account.email ||
          (account as { settings?: { dashboard?: { display_name?: string } } })
            .settings?.dashboard?.display_name,
      };
    } catch {
      this.logger.warn(
        `Failed to retrieve Stripe account ${integration.connectAccountId}`,
      );
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
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const settings = { ...(business.settings || {}) };
    const integrations = {
      ...((settings.integrations as Record<string, unknown>) || {}),
    };

    if (dto.disconnect) {
      delete integrations.stripe;
      settings.integrations = Object.keys(integrations).length
        ? integrations
        : undefined;
      business.settings = settings;
      await this.businessRepo.save(business);
      return this.getPublicSettings(businessId);
    }

    await this.planEntitlements.assertFeature(businessId, 'stripeConnect');

    const connectAccountId = dto.connectAccountId?.trim();
    if (!connectAccountId) {
      throw new BadRequestException('Stripe Connect account ID is required');
    }
    if (!isValidConnectAccountId(connectAccountId)) {
      throw new BadRequestException(
        'Invalid Stripe account ID — must start with acct_',
      );
    }
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured on the platform');
    }

    let account;
    try {
      account =
        await this.stripeService.client.accounts.retrieve(connectAccountId);
    } catch {
      throw new BadRequestException(
        'Could not find that connected account. Copy the ID from Stripe → Connect → Connected accounts.',
      );
    }

    await this.persistConnectSettings(business, {
      connectAccountId,
      connectCountry: account.country?.toUpperCase(),
      connectMode: 'manual',
      // Standard accounts use direct charges; Express accounts in the same country use destination.
      connectChargeModel:
        account.type === 'standard' ? 'direct' : 'destination',
    });

    return this.getPublicSettings(businessId);
  }

  async assertCanAcceptOnlinePayments(businessId: string): Promise<string> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = this.resolveConnectAccountId(business.settings);
    if (!connectAccountId) {
      throw new BadRequestException(
        'Connect your Stripe account in Dashboard → Billing before accepting online payments',
      );
    }
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException(
        'Online payments are not configured on the platform',
      );
    }

    const account =
      await this.stripeService.client.accounts.retrieve(connectAccountId);
    if (!this.isConnectAccountReady(account, business.settings)) {
      throw new BadRequestException(
        'Stripe onboarding is incomplete. Click Continue setup in Billing to add your business address and bank details.',
      );
    }

    return connectAccountId;
  }
}
