import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity.js';
import { StripeService } from './stripe.service.js';
import { StripeIntegrationService } from './stripe-integration.service.js';
import { PlanEntitlementsModule } from './plan-entitlements.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Business]), PlanEntitlementsModule],
  providers: [StripeService, StripeIntegrationService],
  exports: [StripeService, StripeIntegrationService],
})
export class StripeIntegrationModule {}
