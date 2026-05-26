import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

type StripeClient = InstanceType<typeof Stripe>;

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
}
