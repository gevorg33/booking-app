import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

type StripeClient = InstanceType<typeof Stripe>;

type ConnectCheckoutExtras = {
  payment_intent_data?: {
    transfer_data?: { destination: string };
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
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in environment.');
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

  /** Default country for new Express connected accounts (e.g. AE). */
  get connectDefaultCountry(): string {
    const raw = this.config.get<string>('STRIPE_CONNECT_DEFAULT_COUNTRY')?.trim().toUpperCase();
    return raw && /^[A-Z]{2}$/.test(raw) ? raw : 'AE';
  }

  /**
   * UAE Connect platforms must use destination charges — connected accounts receive
   * transfers only; the platform processes card payments. See Stripe Connect docs.
   */
  get connectChargeModel(): 'direct' | 'destination' {
    const explicit = this.config.get<string>('STRIPE_CONNECT_CHARGE_MODEL')?.trim().toLowerCase();
    if (explicit === 'direct' || explicit === 'destination') return explicit;
    if (this.connectDefaultCountry === 'AE') return 'destination';
    return 'direct';
  }

  usesDestinationCharges(): boolean {
    return this.connectChargeModel === 'destination';
  }

  /** Request options for Stripe API calls scoped to a connected account. */
  connectRequestOptions(connectAccountId: string): ConnectRequestOptions {
    if (this.usesDestinationCharges()) return {};
    return { stripeAccount: connectAccountId };
  }

  /** Extra Checkout Session fields for Connect (destination charges on platform account). */
  connectCheckoutSessionParams(connectAccountId: string): ConnectCheckoutExtras {
    if (!this.usesDestinationCharges()) return {};
    return {
      payment_intent_data: {
        transfer_data: { destination: connectAccountId },
      },
    };
  }

  connectCheckoutSessionCreate(
    connectAccountId: string,
    sessionParams: Record<string, unknown>,
  ): [Record<string, unknown>, ConnectRequestOptions] {
    return [
      { ...this.connectCheckoutSessionParams(connectAccountId), ...sessionParams },
      this.connectRequestOptions(connectAccountId),
    ];
  }
}
