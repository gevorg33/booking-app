import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity.js';
import { StripeService } from './stripe.service.js';
import { StripeIntegrationService } from './stripe-integration.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Business])],
  providers: [StripeService, StripeIntegrationService],
  exports: [StripeService, StripeIntegrationService],
})
export class StripeIntegrationModule {}
