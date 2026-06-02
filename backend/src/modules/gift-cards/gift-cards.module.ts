import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftCard } from './entities/gift-card.entity.js';
import { GiftCardServiceCredit } from './entities/gift-card-service-credit.entity.js';
import { GiftCardRedemption } from './entities/gift-card-redemption.entity.js';
import { GiftCardExpirationAudit } from './entities/gift-card-expiration-audit.entity.js';
import { GiftCardChangeRequest } from './entities/gift-card-change-request.entity.js';
import { GiftCardsService } from './gift-cards.service.js';
import { GiftCardPurchaseService } from './gift-card-purchase.service.js';
import { GiftCardFulfillmentService } from './gift-card-fulfillment.service.js';
import { GiftCardDeliveryService } from './gift-card-delivery.service.js';
import { GiftCardOrderService } from './gift-card-order.service.js';
import { GiftCardRefundService } from './gift-card-refund.service.js';
import { GiftCardsController, GiftCardProviderController } from './gift-cards.controller.js';
import { GiftCardPublicController } from './gift-card-public.controller.js';
import { BusinessModule } from '../business/business.module.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { PublicBookingModule } from '../public-booking/public-booking.module.js';
import { BookingModule } from '../booking/booking.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ZendeskModule } from '../integrations/zendesk/zendesk.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { ServicePackagesModule } from '../service-packages/service-packages.module.js';
import { ServiceSubscriptionsModule } from '../service-subscriptions/service-subscriptions.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { GiftCardClaimService } from './gift-card-claim.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GiftCard,
      GiftCardServiceCredit,
      GiftCardRedemption,
      GiftCardExpirationAudit,
      GiftCardChangeRequest,
      Business,
      Service,
      Employee,
    ]),
    BusinessModule,
    CustomerModule,
    NotificationsModule,
    ZendeskModule,
    ServicePackagesModule,
    ServiceSubscriptionsModule,
    forwardRef(() => BillingModule),
    forwardRef(() => PublicBookingModule),
    forwardRef(() => BookingModule),
  ],
  controllers: [GiftCardsController, GiftCardProviderController, GiftCardPublicController],
  providers: [
    GiftCardsService,
    GiftCardPurchaseService,
    GiftCardFulfillmentService,
    GiftCardDeliveryService,
    GiftCardOrderService,
    GiftCardRefundService,
    GiftCardClaimService,
  ],
  exports: [
    GiftCardsService,
    GiftCardPurchaseService,
    GiftCardFulfillmentService,
    GiftCardDeliveryService,
    GiftCardOrderService,
    GiftCardRefundService,
    GiftCardClaimService,
  ],
})
export class GiftCardsModule {}
