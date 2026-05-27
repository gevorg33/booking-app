import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { BookingModule } from '../booking/booking.module.js';
import { BillingService } from './billing.service.js';
import { StripeService } from './stripe.service.js';
import {
  BillingController,
  BillingPlansController,
  BillingWebhookController,
} from './billing.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business]),
    BusinessModule,
    forwardRef(() => BookingModule),
  ],
  controllers: [BillingPlansController, BillingController, BillingWebhookController],
  providers: [BillingService, StripeService],
  exports: [BillingService, StripeService],
})
export class BillingModule {}
