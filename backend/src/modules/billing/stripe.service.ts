import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

type StripeClient = InstanceType<typeof Stripe>;

type ConnectCheckoutExtras = {
  payment_intent_data?: {
    transfer_data?: { destination: string; amount?: number };
    application_fee_amount?: number;
    metadata?: Record<string, string>;
  };
};

type ConnectRequestOptions = { stripeAccount?: string };

@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  private stripe: StripeClient | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not set — billing disabled');
      return;
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-04-22.dahlia',
    });
    this.logger.log('Stripe client initialized');
  }

  get client(): StripeClient {
    if (!this.stripe) {
      throw new Error(
        'Stripe is not configured. Set STRIPE_SECRET_KEY in environment.',
      );
    }
    return this.stripe;
  }

  get isConfigured(): boolean {
    return this.stripe !== null;
  }

  get webhookSecret(): string | undefined {
    return this.config.get<string>('STRIPE_WEBHOOK_SECRET');
  }

  get frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /** e2e-bug.18 — consumer-app web origin for Stripe success/cancel redirects. */
  get consumerAppUrl(): string {
    return this.config.get<string>('CONSUMER_APP_URL')?.trim() || '';
  }

  /** Default country fallback when tenant country is unknown. */
  get connectDefaultCountry(): string {
    const raw = this.config
      .get<string>('STRIPE_CONNECT_DEFAULT_COUNTRY')
      ?.trim()
      .toUpperCase();
    return raw && /^[A-Z]{2}$/.test(raw) ? raw : 'AE';
  }

  get connectClientId(): string | undefined {
    const raw = this.config.get<string>('STRIPE_CONNECT_CLIENT_ID')?.trim();
    return raw || undefined;
  }

  get connectOAuthRedirectUri(): string {
    const explicit = this.config
      .get<string>('STRIPE_CONNECT_OAUTH_REDIRECT_URI')
      ?.trim();
    return (
      explicit || `${this.frontendUrl}/dashboard/billing?stripe_connect=oauth`
    );
  }

  isOAuthConfigured(): boolean {
    return Boolean(this.connectClientId);
  }

  /** Platform-wide default when tenant has no stored charge model. Direct = tenant receives booking payments. */
  get defaultConnectChargeModel(): 'direct' | 'destination' {
    const explicit = this.config
      .get<string>('STRIPE_CONNECT_CHARGE_MODEL')
      ?.trim()
      .toLowerCase();
    if (explicit === 'direct' || explicit === 'destination') return explicit;
    return 'direct';
  }

  /** Optional platform fee on destination charges (0–100). Tenant receives the remainder via transfer_data.amount. */
  get connectPlatformFeePercent(): number {
    const raw = this.config.get<string>('STRIPE_CONNECT_PLATFORM_FEE_PERCENT');
    const parsed = raw ? Number.parseFloat(raw) : 0;
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.min(parsed, 100);
  }

  /**
   * Destination charge on the platform account — same as PaymentIntent.create with transfer_data.
   * Checkout wraps this in payment_intent_data when mode is payment.
   */
  buildDestinationChargePaymentIntentData(
    connectAccountId: string,
    amountCents: number,
  ): NonNullable<ConnectCheckoutExtras['payment_intent_data']> {
    const transfer: { destination: string; amount?: number } = {
      destination: connectAccountId,
    };
    const feePercent = this.connectPlatformFeePercent;
    if (feePercent > 0 && amountCents > 0) {
      const platformFeeCents = Math.round((amountCents * feePercent) / 100);
      transfer.amount = Math.max(amountCents - platformFeeCents, 0);
    }
    return { transfer_data: transfer };
  }

  usesDestinationCharges(settings?: Record<string, unknown>): boolean {
    const integrations = settings?.integrations as
      | Record<string, unknown>
      | undefined;
    const stripe = integrations?.stripe as
      | { connectChargeModel?: string; connectMode?: string }
      | undefined;
    // OAuth = Standard account: always direct charges regardless of what's stored in DB
    if (stripe?.connectMode === 'oauth') return false;
    if (stripe?.connectChargeModel === 'destination') return true;
    if (stripe?.connectChargeModel === 'direct') return false;
    return this.defaultConnectChargeModel === 'destination';
  }

  /** Request options for Stripe API calls scoped to a connected account. */
  connectRequestOptions(
    connectAccountId: string,
    settings?: Record<string, unknown>,
  ): ConnectRequestOptions {
    if (this.usesDestinationCharges(settings)) return {};
    return { stripeAccount: connectAccountId };
  }

  /**
   * Build application_fee_amount for direct charges on Standard connected accounts.
   * The fee is collected on the platform account; the tenant receives the remainder.
   */
  buildDirectChargeApplicationFee(amountCents: number): number {
    const feePercent = this.connectPlatformFeePercent;
    if (feePercent <= 0 || amountCents <= 0) return 0;
    return Math.round((amountCents * feePercent) / 100);
  }

  /** Extra Checkout Session fields for Connect. */
  connectCheckoutSessionParams(
    connectAccountId: string,
    settings?: Record<string, unknown>,
    amountCents?: number,
  ): ConnectCheckoutExtras {
    if (this.usesDestinationCharges(settings)) {
      // Destination charge: platform account charges, transfers to tenant via transfer_data
      if (amountCents && amountCents > 0) {
        return {
          payment_intent_data: this.buildDestinationChargePaymentIntentData(
            connectAccountId,
            amountCents,
          ),
        };
      }
      return {
        payment_intent_data: {
          transfer_data: { destination: connectAccountId },
        },
      };
    }

    // Direct charge: charge on tenant's account, platform fee via application_fee_amount
    if (amountCents && amountCents > 0) {
      const applicationFeeAmount =
        this.buildDirectChargeApplicationFee(amountCents);
      if (applicationFeeAmount > 0) {
        return {
          payment_intent_data: { application_fee_amount: applicationFeeAmount },
        };
      }
    }
    return {};
  }

  connectCheckoutSessionCreate(
    connectAccountId: string,
    sessionParams: Record<string, unknown>,
    settings?: Record<string, unknown>,
    amountCents?: number,
    paymentIntentMetadata?: Record<string, string>,
  ): [Record<string, unknown>, ConnectRequestOptions] {
    const connectExtras = this.connectCheckoutSessionParams(
      connectAccountId,
      settings,
      amountCents,
    );
    const sessionPaymentIntent = sessionParams.payment_intent_data as
      | ConnectCheckoutExtras['payment_intent_data']
      | undefined;
    const connectPaymentIntent = connectExtras.payment_intent_data;
    const mergedPaymentIntent = {
      ...connectPaymentIntent,
      ...sessionPaymentIntent,
      metadata: {
        ...(connectPaymentIntent?.metadata ?? {}),
        ...(sessionPaymentIntent?.metadata ?? {}),
        ...(paymentIntentMetadata ?? {}),
      },
    };

    return [
      {
        ...connectExtras,
        ...sessionParams,
        ...(Object.keys(mergedPaymentIntent).length > 0
          ? { payment_intent_data: mergedPaymentIntent }
          : {}),
      },
      this.connectRequestOptions(connectAccountId, settings),
    ];
  }
}
