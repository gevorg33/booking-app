import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { BookingModule } from '../booking/booking.module.js';
import { BillingService } from './billing.service.js';
import { StripeIntegrationModule } from './stripe-integration.module.js';
import {
  BillingController,
  BillingPlansController,
  BillingWebhookController,
} from './billing.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business]),
    BusinessModule,
    StripeIntegrationModule,
    forwardRef(() => BookingModule),
  ],
  controllers: [BillingPlansController, BillingController, BillingWebhookController],
  providers: [BillingService],
  exports: [BillingService, StripeIntegrationModule],
})
export class BillingModule {}
