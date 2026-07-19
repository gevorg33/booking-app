import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SubscriptionPlan,
  CustomerSubscription,
  SubscriptionUsage,
} from './entities/subscription.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { ServiceSubscriptionsService } from './service-subscriptions.service.js';
import { SubscriptionRefundService } from './subscription-refund.service.js';
import { ServiceSubscriptionsController } from './service-subscriptions.controller.js';
import { BusinessModule } from '../business/business.module.js';
import { PlanEntitlementsModule } from '../billing/plan-entitlements.module.js';
import { StripeIntegrationModule } from '../billing/stripe-integration.module.js';
import { CatalogAnnouncementModule } from '../catalog-announcement/catalog-announcement.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      CustomerSubscription,
      SubscriptionUsage,
      Service,
      Customer,
      Business,
    ]),
    BusinessModule,
    PlanEntitlementsModule,
    StripeIntegrationModule,
    CatalogAnnouncementModule,
  ],
  controllers: [ServiceSubscriptionsController],
  providers: [ServiceSubscriptionsService, SubscriptionRefundService],
  exports: [ServiceSubscriptionsService, SubscriptionRefundService],
})
export class ServiceSubscriptionsModule {}
